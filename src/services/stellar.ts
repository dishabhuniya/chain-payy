import {
  rpc,
  Contract,
  Address,
  TransactionBuilder,
  Operation,
  TimeoutInfinite,
  xdr,
  Horizon,
  Account,
} from '@stellar/stellar-sdk';
import { NETWORK_CONFIG, TOKEN_ASSETS } from '../config/network';
import { analyticsService } from './analytics';

export interface OnChainPaymentRequest {
  id: number;
  creator: string;
  recipient: string;
  amount: string;
  description: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt: number;
  paidAt: number | null;
  tokenAddress: string;
}

export interface ContractEvent {
  id: string;
  type: 'created' | 'paid' | 'cancelled';
  requestId: number;
  message: string;
  timestamp: number;
}

export const stellarService = {
  // Check if a Stellar account exists on Horizon
  async checkAccountExists(address: string, network: 'testnet' | 'futurenet' = 'testnet'): Promise<boolean> {
    const config = NETWORK_CONFIG.networks[network];
    try {
      const response = await fetch(`${config.horizonUrl}/accounts/${address}`);
      return response.ok;
    } catch {
      return false;
    }
  },

  // Fund account using Friendbot on Testnet
  async fundWithFriendbot(address: string, network: 'testnet' | 'futurenet' = 'testnet'): Promise<boolean> {
    const config = NETWORK_CONFIG.networks[network];
    try {
      const response = await fetch(`${config.friendbotUrl}?addr=${encodeURIComponent(address)}`);
      return response.ok;
    } catch (e: any) {
      analyticsService.trackError('friendbot_funding_failed', e.message);
      return false;
    }
  },

  // Build Transaction for creating a payment request
  async buildCreateRequestTx(
    creator: string,
    recipient: string,
    amount: number,
    description: string,
    tokenSymbol: string,
    network: 'testnet' | 'futurenet' = 'testnet'
  ): Promise<string> {
    const config = NETWORK_CONFIG.networks[network];
    const server = new rpc.Server(config.sorobanRpcUrl);
    
    const asset = TOKEN_ASSETS.find((a) => a.code === tokenSymbol) || TOKEN_ASSETS[0];
    const horizon = new Horizon.Server(config.horizonUrl);
    const accountResponse = await horizon.loadAccount(creator);
    
    const contract = new Contract(config.contractId);
    
    // Convert amount to BigInt decimals
    const rawAmount = BigInt(Math.floor(amount * Math.pow(10, asset.decimals)));

    // Create Operation
    const operation = contract.call(
      'create_request',
      new Address(creator).toScVal(),
      new Address(recipient).toScVal(),
      new Address(asset.contractId).toScVal(),
      xdr.ScVal.scvI128(xdr.Int128Parts.fromBigInt(rawAmount)),
      xdr.ScVal.scvString(description)
    );

    const tx = new TransactionBuilder(accountResponse, {
      fee: '100',
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(TimeoutInfinite)
      .build();

    const preparedTx = await server.prepareTransaction(tx);
    return preparedTx.toXDR();
  },

  // Build transaction to pay a request
  async buildPayRequestTx(
    payer: string,
    requestId: number,
    network: 'testnet' | 'futurenet' = 'testnet'
  ): Promise<string> {
    const config = NETWORK_CONFIG.networks[network];
    const server = new rpc.Server(config.sorobanRpcUrl);

    const horizon = new Horizon.Server(config.horizonUrl);
    const accountResponse = await horizon.loadAccount(payer);

    const contract = new Contract(config.contractId);
    const operation = contract.call(
      'pay_request',
      new Address(payer).toScVal(),
      xdr.ScVal.scvU64(xdr.Uint64Parts.fromBigInt(BigInt(requestId)))
    );

    const tx = new TransactionBuilder(accountResponse, {
      fee: '100',
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(TimeoutInfinite)
      .build();

    const preparedTx = await server.prepareTransaction(tx);
    return preparedTx.toXDR();
  },

  // Build transaction to cancel a pending request
  async buildCancelRequestTx(
    caller: string,
    requestId: number,
    network: 'testnet' | 'futurenet' = 'testnet'
  ): Promise<string> {
    const config = NETWORK_CONFIG.networks[network];
    const server = new rpc.Server(config.sorobanRpcUrl);

    const horizon = new Horizon.Server(config.horizonUrl);
    const accountResponse = await horizon.loadAccount(caller);

    const contract = new Contract(config.contractId);
    const operation = contract.call(
      'cancel_request',
      new Address(caller).toScVal(),
      xdr.ScVal.scvU64(xdr.Uint64Parts.fromBigInt(BigInt(requestId)))
    );

    const tx = new TransactionBuilder(accountResponse, {
      fee: '100',
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(TimeoutInfinite)
      .build();

    const preparedTx = await server.prepareTransaction(tx);
    return preparedTx.toXDR();
  },

  // Submit transaction to Soroban network and poll for success
  async submitAndPollTx(
    signedXdr: string,
    network: 'testnet' | 'futurenet' = 'testnet'
  ): Promise<rpc.Api.GetTransactionResponse> {
    const config = NETWORK_CONFIG.networks[network];
    const server = new rpc.Server(config.sorobanRpcUrl);

    const tx = TransactionBuilder.fromXDR(signedXdr, config.networkPassphrase) as Horizon.Transaction;
    const submitResponse = await server.sendTransaction(tx);

    if (submitResponse.status === 'ERROR') {
      throw new Error(`Transaction submission error: ${JSON.stringify(submitResponse.errorResultXdr)}`);
    }

    // Poll for the status
    let attempts = 0;
    while (attempts < 20) {
      const txResponse = await server.getTransaction(submitResponse.hash);
      if (txResponse.status === 'SUCCESS') {
        return txResponse;
      }
      if (txResponse.status === 'FAILED') {
        throw new Error(`Transaction execution failed: ${JSON.stringify(txResponse.resultXdr)}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
      attempts++;
    }

    throw new Error('RPC Timeout: Transaction submission timed out.');
  },

  // Fetch all payment requests from the contract
  async fetchAllRequests(network: 'testnet' | 'futurenet' = 'testnet'): Promise<OnChainPaymentRequest[]> {
    const config = NETWORK_CONFIG.networks[network];
    const connectedType = localStorage.getItem('connected_wallet_type');
    
    if (connectedType === 'Mock' || !config.contractId) {
      return this.getMockRequests();
    }

    try {
      const server = new rpc.Server(config.sorobanRpcUrl);
      const contract = new Contract(config.contractId);
      const dummyAccount = new Account('GD3L47JCA33EX374JCA7PGLDE7S2T37ZYIYWNG7NIJ6S7JNDHGTMFAJW', '-1');
      
      const requests: OnChainPaymentRequest[] = [];
      let id = 1;

      // Iteratively fetch requests until we get null (indicating end of requests)
      // Cap at 100 for safety
      while (id <= 100) {
        const tx = new TransactionBuilder(dummyAccount, {
          fee: '100',
          networkPassphrase: config.networkPassphrase,
        })
          .addOperation(contract.call('get_request', xdr.ScVal.scvU64(xdr.Uint64Parts.fromBigInt(BigInt(id)))))
          .setTimeout(TimeoutInfinite)
          .build();

        const simResponse = await server.simulateTransaction(tx);
        if (rpc.Api.isSimulationSuccess(simResponse)) {
          const retval = simResponse.result?.retval;
          if (retval && retval.switch().value !== xdr.ScValType.scvVoid().value) {
            // Check if return type is not Void (Option::None)
            const parsed = this.parseScValRequest(retval);
            if (parsed) {
              requests.push(parsed);
              id++;
              continue;
            }
          }
        }
        break; // Stop at first null/None or simulation error
      }

      return requests;
    } catch (e) {
      console.warn('On-chain fetch failed, falling back to mock ledger simulator:', e);
      return this.getMockRequests();
    }
  },

  async fetchRequestById(id: number, network: 'testnet' | 'futurenet' = 'testnet'): Promise<OnChainPaymentRequest | null> {
    const config = NETWORK_CONFIG.networks[network];
    const connectedType = localStorage.getItem('connected_wallet_type');

    if (connectedType === 'Mock' || !config.contractId) {
      const mock = this.getMockRequests().find((r) => r.id === id);
      return mock || null;
    }

    try {
      const server = new rpc.Server(config.sorobanRpcUrl);
      const contract = new Contract(config.contractId);
      const dummyAccount = new Account('GD3L47JCA33EX374JCA7PGLDE7S2T37ZYIYWNG7NIJ6S7JNDHGTMFAJW', '-1');

      const tx = new TransactionBuilder(dummyAccount, {
        fee: '100',
        networkPassphrase: config.networkPassphrase,
      })
        .addOperation(contract.call('get_request', xdr.ScVal.scvU64(xdr.Uint64Parts.fromBigInt(BigInt(id)))))
        .setTimeout(TimeoutInfinite)
        .build();

      const simResponse = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationSuccess(simResponse)) {
        const retval = simResponse.result?.retval;
        if (retval && retval.switch().value !== xdr.ScValType.scvVoid().value) {
          return this.parseScValRequest(retval);
        }
      }
      return null;
    } catch (e) {
      console.warn(`On-chain fetch of request #${id} failed:`, e);
      const mock = this.getMockRequests().find((r) => r.id === id);
      return mock || null;
    }
  },

  parseScValRequest(scvalVal: xdr.ScVal): OnChainPaymentRequest | null {
    // If it's a map (struct)
    const mapVal = scvalVal.map();
    if (!mapVal) return null;
    
    const obj: Record<string, any> = {};
    mapVal.forEach((entry) => {
      const key = entry.key().sym()?.toString();
      const value = entry.val();
      if (key) {
        obj[key] = value;
      }
    });

    const rawAmount = obj.amount ? this.parseScValI128(obj.amount) : 0n;
    const tokenAddress = obj.token?.address()?.toString() || '';
    const asset = TOKEN_ASSETS.find(a => a.contractId === tokenAddress) || TOKEN_ASSETS[0];

    return {
      id: Number(obj.id?.u64()?.low || 0),
      creator: obj.creator?.address()?.toString() || '',
      recipient: obj.recipient?.address()?.toString() || '',
      amount: (Number(rawAmount) / Math.pow(10, asset.decimals)).toString(),
      description: obj.description?.str()?.toString() || '',
      status: this.parseRequestStatus(obj.status),
      createdAt: Number(obj.created_at?.u64()?.low || 0) * 1000,
      paidAt: obj.paid_at && obj.paid_at.switch().value !== xdr.ScValType.scvVoid().value ? Number(obj.paid_at.u64()?.low || 0) * 1000 : null,
      tokenAddress,
    };
  },

  parseScValI128(val: xdr.ScVal): bigint {
    const parts = val.i128();
    if (!parts) return 0n;
    const hi = BigInt(parts.hi().low) << 64n;
    const lo = BigInt(parts.lo().low);
    return hi | lo;
  },

  parseRequestStatus(val: xdr.ScVal): OnChainPaymentRequest['status'] {
    const sym = val.sym()?.toString();
    if (sym === 'Pending' || sym === 'PENDING') return 'PENDING';
    if (sym === 'Paid' || sym === 'PAID') return 'PAID';
    if (sym === 'Cancelled' || sym === 'CANCELLED') return 'CANCELLED';

    const vec = val.vec();
    if (vec && vec.length > 0) {
      const variant = vec[0].sym()?.toString();
      if (variant === 'Pending' || variant === 'PENDING') return 'PENDING';
      if (variant === 'Paid' || variant === 'PAID') return 'PAID';
      if (variant === 'Cancelled' || variant === 'CANCELLED') return 'CANCELLED';
    }

    const index = val.u32();
    if (index === 0) return 'PENDING';
    if (index === 1) return 'PAID';
    if (index === 2) return 'CANCELLED';
    
    return 'PENDING';
  },

  async fetchContractEvents(network: 'testnet' | 'futurenet' = 'testnet'): Promise<ContractEvent[]> {
    const config = NETWORK_CONFIG.networks[network];
    if (!config.contractId) return this.getMockEvents();

    try {
      const server = new rpc.Server(config.sorobanRpcUrl);
      const health = await server.getLatestLedger();
      const startLedger = Math.max(1, health.sequence - 3000);

      const response = await server.getEvents({
        startLedger,
        filters: [
          {
            type: 'contract',
            contractIds: [config.contractId],
          },
        ],
        limit: 50,
      });

      const parsedEvents: ContractEvent[] = [];

      for (const event of response.events) {
        try {
          const topics = event.topic;
          const topic0 = topics[0]?.sym()?.toString();
          const requestId = Number(topics[1]?.u64()?.low || 0);

          if (topic0 === 'req_crea') {
            const dataVal = event.value;
            const vec = dataVal.vec();
            if (vec && vec.length >= 3) {
              const creator = vec[0].address()?.toString() || 'Unknown';
              const rawAmount = this.parseScValI128(vec[2]);
              const amountStr = (Number(rawAmount) / 10000000).toFixed(2); // default 7 decimals
              
              parsedEvents.push({
                id: event.id,
                type: 'created',
                requestId,
                message: `🔔 New payment request #${requestId} created by ${creator.slice(0, 4)}...${creator.slice(-4)} for ${amountStr} XLM`,
                timestamp: Date.now() - (health.sequence - event.ledger) * 5000,
              });
            }
          } else if (topic0 === 'req_paid') {
            const dataVal = event.value;
            const vec = dataVal.vec();
            if (vec && vec.length >= 3) {
              const payer = vec[0].address()?.toString() || 'Unknown';
              const rawAmount = this.parseScValI128(vec[2]);
              const amountStr = (Number(rawAmount) / 10000000).toFixed(2);

              parsedEvents.push({
                id: event.id,
                type: 'paid',
                requestId,
                message: `💰 Payment request #${requestId} of ${amountStr} XLM paid by ${payer.slice(0, 4)}...${payer.slice(-4)}`,
                timestamp: Date.now() - (health.sequence - event.ledger) * 5000,
              });
            }
          } else if (topic0 === 'req_canc') {
            const dataVal = event.value;
            const caller = dataVal.address()?.toString() || 'Unknown';

            parsedEvents.push({
              id: event.id,
              type: 'cancelled',
              requestId,
              message: `❌ Payment request #${requestId} cancelled by ${caller.slice(0, 4)}...${caller.slice(-4)}`,
              timestamp: Date.now() - (health.sequence - event.ledger) * 5000,
            });
          }
        } catch (err) {
          console.warn('Error parsing single event:', err);
        }
      }

      return parsedEvents.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      console.warn('Failed to fetch events from Soroban RPC:', e);
      return this.getMockEvents();
    }
  },

  // ----------------------------------------------------
  // HIGH FIDELITY MOCK LEDGER SIMULATOR
  // ----------------------------------------------------
  getMockRequests(): OnChainPaymentRequest[] {
    const data = localStorage.getItem('mock_ledger_requests');
    if (!data) {
      const seeded: OnChainPaymentRequest[] = [
        {
          id: 1,
          creator: 'GDV56WIK33JCA7PGLDE7S2T37ZYIYWNG7NIJ6S7JNDHGTMFAJWX36QJ',
          recipient: 'GCJ7KNLQJCA7PGLDE7S2T37ZYIYWNG7NIJ6S7JNDHGTMFAJW42LKD3',
          amount: '100.00',
          description: 'Dinner split',
          status: 'PENDING',
          createdAt: Date.now() - 3600 * 1000,
          paidAt: null,
          tokenAddress: TOKEN_ASSETS[0].contractId,
        },
        {
          id: 2,
          creator: 'GD3L47JCA33EX374JCA7PGLDE7S2T37ZYIYWNG7NIJ6S7JNDHGTMFAJW',
          recipient: 'GDV56WIK33JCA7PGLDE7S2T37ZYIYWNG7NIJ6S7JNDHGTMFAJWX36QJ',
          amount: '50.00',
          description: 'Office supply split',
          status: 'PAID',
          createdAt: Date.now() - 2 * 3600 * 1000,
          paidAt: Date.now() - 1 * 3600 * 1000,
          tokenAddress: TOKEN_ASSETS[0].contractId,
        }
      ];
      localStorage.setItem('mock_ledger_requests', JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(data);
  },

  async mockCreateRequest(
    creator: string,
    recipient: string,
    amount: number,
    description: string,
    tokenSymbol: string
  ): Promise<number> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const requests = this.getMockRequests();
    const nextId = requests.length > 0 ? Math.max(...requests.map(r => r.id)) + 1 : 1;
    const asset = TOKEN_ASSETS.find(a => a.code === tokenSymbol) || TOKEN_ASSETS[0];

    const newRequest: OnChainPaymentRequest = {
      id: nextId,
      creator,
      recipient,
      amount: amount.toFixed(2),
      description,
      status: 'PENDING',
      createdAt: Date.now(),
      paidAt: null,
      tokenAddress: asset.contractId,
    };

    requests.push(newRequest);
    localStorage.setItem('mock_ledger_requests', JSON.stringify(requests));
    
    this.addMockEvent('created', nextId, `🔔 New payment request #${nextId} created by ${creator.slice(0, 4)}...${creator.slice(-4)} for ${amount.toFixed(2)} ${tokenSymbol}`);

    return nextId;
  },

  async mockPayRequest(payer: string, requestId: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const requests = this.getMockRequests();
    const index = requests.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error('Payment request not found');
    
    const request = requests[index];
    if (request.status !== 'PENDING') throw new Error('Request is not pending');

    // Deduct mock balance from payer and transfer to recipient
    const balanceKey = `mock_balance_${payer}`;
    const balance = parseFloat(localStorage.getItem(balanceKey) || '10000.00');
    const cost = parseFloat(request.amount);
    if (balance < cost) throw new Error('Insufficient balance in Mock wallet');
    
    localStorage.setItem(balanceKey, (balance - cost).toFixed(2));
    
    const recipientKey = `mock_balance_${request.recipient}`;
    const recipientBalance = parseFloat(localStorage.getItem(recipientKey) || '10000.00');
    localStorage.setItem(recipientKey, (recipientBalance + cost).toFixed(2));

    request.status = 'PAID';
    request.paidAt = Date.now();

    requests[index] = request;
    localStorage.setItem('mock_ledger_requests', JSON.stringify(requests));

    this.addMockEvent('paid', requestId, `💰 Payment request #${requestId} of ${request.amount} XLM paid by ${payer.slice(0, 4)}...${payer.slice(-4)}`);
  },

  async mockCancelRequest(caller: string, requestId: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const requests = this.getMockRequests();
    const index = requests.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error('Payment request not found');
    
    const request = requests[index];
    if (request.creator !== caller) throw new Error('Unauthorized: Only the creator can cancel');
    if (request.status !== 'PENDING') throw new Error('Cannot cancel non-pending request');

    request.status = 'CANCELLED';
    requests[index] = request;
    localStorage.setItem('mock_ledger_requests', JSON.stringify(requests));

    this.addMockEvent('cancelled', requestId, `❌ Payment request #${requestId} cancelled by ${caller.slice(0, 4)}...${caller.slice(-4)}`);
  },

  getMockEvents(): ContractEvent[] {
    const data = localStorage.getItem('mock_ledger_events');
    if (!data) {
      const seeded: ContractEvent[] = [
        {
          id: 'mock-event-1',
          type: 'created',
          requestId: 1,
          message: '🔔 New payment request #1 created by GDV5... for 100.00 XLM',
          timestamp: Date.now() - 3600 * 1000,
        },
        {
          id: 'mock-event-2',
          type: 'paid',
          requestId: 2,
          message: '💰 Payment request #2 of 50.00 XLM paid by GD3L...',
          timestamp: Date.now() - 1200 * 1000,
        }
      ];
      localStorage.setItem('mock_ledger_events', JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(data);
  },

  addMockEvent(type: 'created' | 'paid' | 'cancelled', requestId: number, message: string) {
    const events = this.getMockEvents();
    events.unshift({
      id: `mock-event-${Date.now()}-${Math.random()}`,
      type,
      requestId,
      message,
      timestamp: Date.now(),
    });
    localStorage.setItem('mock_ledger_events', JSON.stringify(events.slice(0, 100)));
  }
};
