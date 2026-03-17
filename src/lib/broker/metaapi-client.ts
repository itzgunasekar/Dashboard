/**
 * AETHER - MetaApi MT5 Broker Connector
 *
 * Handles all interactions with MetaApi Cloud:
 * - Connecting user MT5 accounts
 * - Managing CopyFactory strategies (bot → users)
 * - Real-time trade synchronization
 * - Account balance/equity monitoring
 */

interface MetaApiConfig {
  token: string;
  domain?: string;
}

interface MT5ConnectionParams {
  login: string;
  password: string;
  serverName: string;
  platform: 'mt5';
}

interface AccountInfo {
  id: string;
  login: string;
  server: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  currency: string;
  connected: boolean;
}

interface CopyFactoryStrategy {
  id: string;
  name: string;
  accountId: string;
  maxTradeRisk?: number;
}

class MetaApiClient {
  private token: string;
  private baseUrl: string;
  private copyFactoryUrl: string;

  constructor(config?: MetaApiConfig) {
    this.token = config?.token || process.env.METAAPI_TOKEN || '';
    const domain = config?.domain || process.env.METAAPI_DOMAIN || 'agiliumtrade.agiliumtrade.ai';
    this.baseUrl = `https://mt-provisioning-api-v1.${domain}`;
    this.copyFactoryUrl = `https://copyfactory-api-v1.${domain}`;
  }

  private async request(url: string, options: RequestInit = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'auth-token': this.token,
        ...options.headers,
      },
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`MetaApi Error ${res.status}: ${error}`);
    }
    return res.status === 204 ? null : res.json();
  }

  // ============================================
  // ACCOUNT MANAGEMENT
  // ============================================

  /** Connect a user's MT5 account to MetaApi cloud */
  async connectAccount(params: MT5ConnectionParams, role: 'PROVIDER' | 'SUBSCRIBER' = 'SUBSCRIBER'): Promise<string> {
    const copyFactoryRoles = role === 'PROVIDER'
      ? ['PROVIDER']
      : ['SUBSCRIBER'];

    const account = await this.request(`${this.baseUrl}/users/current/accounts`, {
      method: 'POST',
      body: JSON.stringify({
        login: params.login,
        password: params.password,
        name: `AETHER-${params.login}`,
        server: params.serverName,
        platform: params.platform,
        application: 'CopyFactory',
        copyFactoryRoles,
        type: 'cloud',
        magic: 0, // allow all magic numbers
      }),
    });

    // Wait for deployment
    await this.waitForDeployment(account.id);
    return account.id;
  }

  /** Wait for MetaApi account to be deployed and connected */
  private async waitForDeployment(accountId: string, maxWaitMs = 60000): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      const account = await this.request(`${this.baseUrl}/users/current/accounts/${accountId}`);
      if (account.connectionStatus === 'CONNECTED' && account.state === 'DEPLOYED') return;
      await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error('Account deployment timed out');
  }

  /** Get account connection details */
  async getAccountInfo(accountId: string): Promise<AccountInfo> {
    const rpcUrl = `https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai`;
    const info = await this.request(`${rpcUrl}/users/current/accounts/${accountId}/account-information`);
    return {
      id: accountId,
      login: info.login,
      server: info.server,
      balance: info.balance,
      equity: info.equity,
      margin: info.margin,
      freeMargin: info.freeMargin,
      leverage: info.leverage,
      currency: info.currency,
      connected: true,
    };
  }

  /** Disconnect and remove account */
  async removeAccount(accountId: string): Promise<void> {
    await this.request(`${this.baseUrl}/users/current/accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // COPYFACTORY - BOT STRATEGY MANAGEMENT
  // ============================================

  /** Create a new CopyFactory strategy (master bot) */
  async createStrategy(params: {
    name: string;
    accountId: string; // provider account
    description?: string;
    maxTradeRisk?: number;
  }): Promise<string> {
    const result = await this.request(`${this.copyFactoryUrl}/users/current/configuration/strategies`, {
      method: 'POST',
      body: JSON.stringify({
        name: params.name,
        description: params.description || '',
        accountId: params.accountId,
        maxTradeRisk: params.maxTradeRisk || 0.1,
        timeSettings: {
          lifetimeInHours: 0, // never expire
          openingIntervalInMinutes: 1,
        },
      }),
    });
    return result.id;
  }

  /** Subscribe a user account to a strategy (start copying) */
  async subscribeToStrategy(params: {
    subscriberAccountId: string;
    strategyId: string;
    lotMultiplier?: number;
    maxRiskPercent?: number;
  }): Promise<void> {
    await this.request(
      `${this.copyFactoryUrl}/users/current/configuration/subscribers/${params.subscriberAccountId}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          name: `AETHER-subscriber-${params.subscriberAccountId}`,
          subscriptions: [
            {
              strategyId: params.strategyId,
              multiplier: params.lotMultiplier || 1,
              skipPendingOrders: false,
              closeOnly: '',
              maxTradeRisk: params.maxRiskPercent ? params.maxRiskPercent / 100 : 0.02,
            },
          ],
        }),
      }
    );
  }

  /** Unsubscribe user from strategy (stop copying) */
  async unsubscribeFromStrategy(subscriberAccountId: string): Promise<void> {
    await this.request(
      `${this.copyFactoryUrl}/users/current/configuration/subscribers/${subscriberAccountId}`,
      { method: 'DELETE' }
    );
  }

  /** Get trade history for a subscriber */
  async getSubscriberTrades(subscriberAccountId: string, from: Date, to: Date) {
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
      subscriberId: subscriberAccountId,
    });
    return this.request(`${this.copyFactoryUrl}/users/current/history?${params}`);
  }

  /** Get all strategies */
  async getStrategies(): Promise<CopyFactoryStrategy[]> {
    return this.request(`${this.copyFactoryUrl}/users/current/configuration/strategies`);
  }

  // ============================================
  // TRADE EXECUTION (for manual trades if needed)
  // ============================================

  /** Place a trade on an account */
  async placeTrade(accountId: string, trade: {
    symbol: string;
    actionType: 'ORDER_TYPE_BUY' | 'ORDER_TYPE_SELL';
    volume: number;
    stopLoss?: number;
    takeProfit?: number;
    comment?: string;
  }) {
    const rpcUrl = `https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai`;
    return this.request(`${rpcUrl}/users/current/accounts/${accountId}/trade`, {
      method: 'POST',
      body: JSON.stringify(trade),
    });
  }

  /** Close a position */
  async closePosition(accountId: string, positionId: string) {
    const rpcUrl = `https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai`;
    return this.request(`${rpcUrl}/users/current/accounts/${accountId}/trade`, {
      method: 'POST',
      body: JSON.stringify({
        actionType: 'POSITION_CLOSE_ID',
        positionId,
      }),
    });
  }
}

// Singleton
export const metaApiClient = new MetaApiClient();
export default MetaApiClient;
