interface TrackingEvent {
  eventName: string;
  properties?: Record<string, any>;
}

const isAnalyticsConfigured = !!(
  import.meta.env.VITE_POSTHOG_KEY ||
  import.meta.env.VITE_GA_MEASUREMENT_ID
);

// Basic configuration check and initialization
if (isAnalyticsConfigured) {
  // If posthog or google analytics scripts are included in index.html,
  // we would initialize them here.
  console.log('Production Analytics initialized.');
} else {
  console.log('Analytics running in mock/development mode.');
}

export const analyticsService = {
  track(event: TrackingEvent) {
    const { eventName, properties } = event;
    
    // In development or if unconfigured, we track to console in a styled block
    if (!isAnalyticsConfigured) {
      console.log(
        `%c[Analytics Event]%c ${eventName}`,
        'color: #8b5cf6; font-weight: bold; background: rgba(139, 92, 246, 0.1); padding: 2px 6px; border-radius: 4px;',
        'color: #e2e8f0;',
        properties || ''
      );
      
      // Store local analytics history for visual dashboard reporting
      const historyKey = 'platform_analytics_history';
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      history.push({
        eventName,
        properties,
        timestamp: Date.now(),
      });
      // Limit to last 100 entries
      if (history.length > 100) history.shift();
      localStorage.setItem(historyKey, JSON.stringify(history));
      return;
    }

    // Google Analytics Integration
    const gtag = (window as any).gtag;
    if (gtag) {
      gtag('event', eventName, properties);
    }

    // PostHog Integration
    const posthog = (window as any).posthog;
    if (posthog) {
      posthog.capture(eventName, properties);
    }
  },

  trackWalletConnection(address: string, walletName: 'Freighter' | 'Albedo') {
    this.track({
      eventName: 'wallet_connected',
      properties: { address, wallet: walletName },
    });
  },

  trackLoanCreation(loanId: string, borrower: string, amount: number, interest: number, duration: number) {
    this.track({
      eventName: 'loan_created',
      properties: { loanId, borrower, amount, interest, duration },
    });
  },

  trackLoanFunding(loanId: string, lender: string, amount: number) {
    this.track({
      eventName: 'loan_funded',
      properties: { loanId, lender, amount },
    });
  },

  trackLoanClaim(loanId: string, borrower: string) {
    this.track({
      eventName: 'loan_claimed',
      properties: { loanId, borrower },
    });
  },

  trackLoanRepayment(loanId: string, borrower: string, amount: number, isFullyRepaid: boolean) {
    this.track({
      eventName: 'loan_repaid',
      properties: { loanId, borrower, amount, isFullyRepaid },
    });
  },

  trackError(errorType: string, message: string, context?: any) {
    this.track({
      eventName: 'app_error',
      properties: { errorType, message, context },
    });
  },

  getAnalyticsHistory(): any[] {
    return JSON.parse(localStorage.getItem('platform_analytics_history') || '[]');
  }
};
