#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, String,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RequestStatus {
    Pending = 0,
    Paid = 1,
    Cancelled = 2,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentRequest {
    pub id: u64,
    pub creator: Address,
    pub recipient: Address,
    pub amount: i128,
    pub description: String,
    pub status: RequestStatus,
    pub created_at: u64,
    pub paid_at: Option<u64>,
    pub token: Address,
}

#[contracttype]
pub enum DataKey {
    RequestCount,
    Request(u64),
}

#[contract]
pub struct ChainPayContract;

#[contractimpl]
impl ChainPayContract {
    pub fn create_request(
        env: Env,
        creator: Address,
        recipient: Address,
        token: Address,
        amount: i128,
        description: String,
    ) -> u64 {
        creator.require_auth();

        if amount <= 0 {
            panic!("Amount must be greater than zero");
        }

        let mut count: u64 = env.storage().instance().get(&DataKey::RequestCount).unwrap_or(0);
        count += 1;
        env.storage().instance().set(&DataKey::RequestCount, &count);

        let request = PaymentRequest {
            id: count,
            creator: creator.clone(),
            recipient: recipient.clone(),
            amount,
            description: description.clone(),
            status: RequestStatus::Pending,
            created_at: env.ledger().timestamp(),
            paid_at: None,
            token: token.clone(),
        };

        env.storage().persistent().set(&DataKey::Request(count), &request);

        // Emit event
        env.events().publish(
            (symbol_short!("req_crea"), count),
            (creator, recipient, amount),
        );

        count
    }

    pub fn pay_request(env: Env, payer: Address, request_id: u64) {
        payer.require_auth();

        let mut request = Self::get_request(env.clone(), request_id)
            .unwrap_or_else(|| panic!("Payment request not found"));

        if !matches!(request.status, RequestStatus::Pending) {
            panic!("Request is not pending");
        }

        // Execute payment using token client
        let client = token::Client::new(&env, &request.token);
        client.transfer(&payer, &request.recipient, &request.amount);

        // Update status
        request.status = RequestStatus::Paid;
        request.paid_at = Some(env.ledger().timestamp());

        env.storage().persistent().set(&DataKey::Request(request_id), &request);

        // Emit event
        env.events().publish(
            (symbol_short!("req_paid"), request_id),
            (payer, request.recipient, request.amount),
        );
    }

    pub fn cancel_request(env: Env, caller: Address, request_id: u64) {
        caller.require_auth();

        let mut request = Self::get_request(env.clone(), request_id)
            .unwrap_or_else(|| panic!("Payment request not found"));

        if !matches!(request.status, RequestStatus::Pending) {
            panic!("Request is not pending");
        }

        if caller != request.creator {
            panic!("Unauthorized: Only the request creator can cancel");
        }

        request.status = RequestStatus::Cancelled;

        env.storage().persistent().set(&DataKey::Request(request_id), &request);

        // Emit event
        env.events().publish(
            (symbol_short!("req_canc"), request_id),
            caller,
        );
    }

    pub fn get_request(env: Env, request_id: u64) -> Option<PaymentRequest> {
        env.storage().persistent().get(&DataKey::Request(request_id))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, token, Address, Env, String};

    #[test]
    fn test_payment_request_lifecycle() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(ChainPayContract, ());
        let client = ChainPayContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let recipient = Address::generate(&env);
        let payer = Address::generate(&env);

        let token_admin = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract_v2(token_admin.clone());
        let token_address = token_id.address();
        let token_client = token::StellarAssetClient::new(&env, &token_address);
        let token_client_as_token = token::Client::new(&env, &token_address);

        let amount = 100i128;
        token_client.mint(&payer, &amount);
        assert_eq!(token_client_as_token.balance(&payer), amount);

        let description = String::from_str(&env, "Dinner split");
        let request_id = client.create_request(
            &creator,
            &recipient,
            &token_address,
            &amount,
            &description,
        );

        assert_eq!(request_id, 1);
        let request = client.get_request(&request_id).unwrap();
        assert_eq!(request.amount, amount);
        assert_eq!(request.creator, creator);
        assert_eq!(request.recipient, recipient);
        assert_eq!(request.status, RequestStatus::Pending);

        client.pay_request(&payer, &request_id);
        let request = client.get_request(&request_id).unwrap();
        assert_eq!(request.status, RequestStatus::Paid);
        assert_eq!(token_client_as_token.balance(&payer), 0);
        assert_eq!(token_client_as_token.balance(&recipient), amount);
    }

    #[test]
    #[should_panic(expected = "Request is not pending")]
    fn test_pay_twice_fails() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(ChainPayContract, ());
        let client = ChainPayContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let recipient = Address::generate(&env);
        let payer = Address::generate(&env);

        let token_admin = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract_v2(token_admin.clone());
        let token_address = token_id.address();
        let token_client = token::StellarAssetClient::new(&env, &token_address);

        let amount = 100i128;
        token_client.mint(&payer, &(amount * 2));

        let description = String::from_str(&env, "Test payment");
        let request_id = client.create_request(&creator, &recipient, &token_address, &amount, &description);

        client.pay_request(&payer, &request_id);
        client.pay_request(&payer, &request_id);
    }

    #[test]
    fn test_cancel_request() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(ChainPayContract, ());
        let client = ChainPayContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let recipient = Address::generate(&env);
        let token_address = Address::generate(&env);
        let amount = 100i128;
        let description = String::from_str(&env, "Test cancel");

        let request_id = client.create_request(&creator, &recipient, &token_address, &amount, &description);
        client.cancel_request(&creator, &request_id);

        let request = client.get_request(&request_id).unwrap();
        assert_eq!(request.status, RequestStatus::Cancelled);
    }

    #[test]
    #[should_panic(expected = "Unauthorized: Only the request creator can cancel")]
    fn test_unauthorized_cancel_fails() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(ChainPayContract, ());
        let client = ChainPayContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let recipient = Address::generate(&env);
        let other = Address::generate(&env);
        let token_address = Address::generate(&env);
        let amount = 100i128;
        let description = String::from_str(&env, "Test unauthorized cancel");

        let request_id = client.create_request(&creator, &recipient, &token_address, &amount, &description);
        client.cancel_request(&other, &request_id);
    }

    #[test]
    #[should_panic(expected = "Request is not pending")]
    fn test_cancel_paid_fails() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(ChainPayContract, ());
        let client = ChainPayContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let recipient = Address::generate(&env);
        let payer = Address::generate(&env);

        let token_admin = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract_v2(token_admin.clone());
        let token_address = token_id.address();
        let token_client = token::StellarAssetClient::new(&env, &token_address);

        let amount = 100i128;
        token_client.mint(&payer, &amount);

        let description = String::from_str(&env, "Test");
        let request_id = client.create_request(&creator, &recipient, &token_address, &amount, &description);

        client.pay_request(&payer, &request_id);
        client.cancel_request(&creator, &request_id);
    }
}
