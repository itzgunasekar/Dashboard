/**
 * AETHER Bot Manager
 *
 * Architecture: Each user gets their OWN CopyFactory subscription.
 * The master bot runs on ONE provider account. When a user clicks
 * "Start Bot", their MT5 account subscribes to the master strategy
 * via CopyFactory. CopyFactory handles:
 *   - Per-user lot sizing (via multiplier)
 *   - Per-user risk limits (via maxTradeRisk)
 *   - Per-user stop/start independently
 *
 * This means 1 master bot can safely serve 1000+ users because
 * CopyFactory handles the trade distribution in the cloud.
 *
 * Commission model:
 *   - Platform takes X% of user's closed-trade profit
 *   - If commission not paid, bot is disabled for that user
 *   - Admin can manually enable/disable any user's bot
 */

import prisma from '@/lib/prisma';
import { metaApiClient } from '@/lib/broker/metaapi-client';

interface StartBotParams {
  userId: string;
  brokerAccountId: string;
  strategyId: string;
  lotMultiplier?: number;
  maxRiskPercent?: number;
}

interface BotPnlSummary {
  totalPnl: number;
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  commissionOwed: number;
}

export class BotManager {

  /**
   * Start bot for a user:
   * 1. Verify subscription is active
   * 2. Verify broker account is connected
   * 3. Subscribe to CopyFactory strategy
   * 4. Create/update BotInstance record
   */
  async startBot(params: StartBotParams): Promise<{ success: boolean; message: string }> {
    const { userId, brokerAccountId, strategyId, lotMultiplier, maxRiskPercent } = params;

    // 1. Check user subscription
    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    if (!subscription || subscription.status !== 'ACTIVE') {
      return { success: false, message: 'Active subscription required to start bot' };
    }

    // 2. Check broker account
    const brokerAccount = await prisma.brokerAccount.findUnique({
      where: { id: brokerAccountId },
    });
    if (!brokerAccount || brokerAccount.status !== 'CONNECTED') {
      return { success: false, message: 'Broker account must be connected first' };
    }
    if (!brokerAccount.metaApiAccountId) {
      return { success: false, message: 'MetaApi account not provisioned' };
    }

    // 3. Check if bot was disabled by admin
    const existing = await prisma.botInstance.findUnique({
      where: { brokerAccountId },
    });
    if (existing?.disabledByAdmin) {
      return { success: false, message: 'Bot has been disabled by admin. Please contact support.' };
    }

    // 4. Get strategy
    const strategy = await prisma.botStrategy.findUnique({ where: { id: strategyId } });
    if (!strategy || !strategy.isActive) {
      return { success: false, message: 'Strategy not available' };
    }

    // 5. Subscribe via CopyFactory
    try {
      await metaApiClient.subscribeToStrategy({
        subscriberAccountId: brokerAccount.metaApiAccountId,
        strategyId: strategy.metaApiStrategyId!,
        lotMultiplier: lotMultiplier || this.calculateLotMultiplier(brokerAccount.balance, strategy.defaultLotSize),
        maxRiskPercent: maxRiskPercent || 2,
      });
    } catch (error: any) {
      return { success: false, message: `Failed to start bot: ${error.message}` };
    }

    // 6. Upsert bot instance
    await prisma.botInstance.upsert({
      where: { brokerAccountId },
      create: {
        userId,
        brokerAccountId,
        strategyId,
        metaApiSubscriberId: brokerAccount.metaApiAccountId,
        status: 'RUNNING',
        lotMultiplier: lotMultiplier || 1,
        maxRiskPercent: maxRiskPercent || 2,
        commissionRate: this.getCommissionRate(subscription.plan),
        startedAt: new Date(),
      },
      update: {
        status: 'RUNNING',
        lotMultiplier: lotMultiplier || 1,
        maxRiskPercent: maxRiskPercent || 2,
        startedAt: new Date(),
        stoppedAt: null,
        disabledByAdmin: false,
        disableReason: null,
      },
    });

    // Log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'BOT_STARTED',
        resource: 'BotInstance',
        resourceId: brokerAccountId,
        details: { strategyId, lotMultiplier },
      },
    });

    return { success: true, message: 'Bot started successfully' };
  }

  /** Stop bot for a user */
  async stopBot(userId: string, brokerAccountId: string): Promise<{ success: boolean; message: string }> {
    const instance = await prisma.botInstance.findUnique({
      where: { brokerAccountId },
      include: { brokerAccount: true },
    });

    if (!instance || instance.userId !== userId) {
      return { success: false, message: 'Bot instance not found' };
    }

    // Unsubscribe from CopyFactory
    if (instance.metaApiSubscriberId) {
      try {
        await metaApiClient.unsubscribeFromStrategy(instance.metaApiSubscriberId);
      } catch (error: any) {
        console.error('CopyFactory unsubscribe error:', error);
      }
    }

    await prisma.botInstance.update({
      where: { brokerAccountId },
      data: { status: 'STOPPED', stoppedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'BOT_STOPPED',
        resource: 'BotInstance',
        resourceId: brokerAccountId,
      },
    });

    return { success: true, message: 'Bot stopped' };
  }

  /** Admin: disable a user's bot (e.g. unpaid commission) */
  async adminDisableBot(brokerAccountId: string, reason: string): Promise<void> {
    const instance = await prisma.botInstance.findUnique({
      where: { brokerAccountId },
    });
    if (!instance) return;

    // Unsubscribe from CopyFactory
    if (instance.metaApiSubscriberId) {
      try {
        await metaApiClient.unsubscribeFromStrategy(instance.metaApiSubscriberId);
      } catch (e) { /* log */ }
    }

    await prisma.botInstance.update({
      where: { brokerAccountId },
      data: {
        status: 'DISABLED_BY_ADMIN',
        disabledByAdmin: true,
        disableReason: reason,
        stoppedAt: new Date(),
      },
    });
  }

  /** Admin: re-enable a user's bot */
  async adminEnableBot(brokerAccountId: string): Promise<void> {
    await prisma.botInstance.update({
      where: { brokerAccountId },
      data: {
        disabledByAdmin: false,
        disableReason: null,
        status: 'STOPPED', // user must manually restart
      },
    });
  }

  /** Calculate P&L summary and commission owed */
  async calculateCommission(botInstanceId: string): Promise<BotPnlSummary> {
    const trades = await prisma.trade.findMany({
      where: { botInstanceId, status: 'CLOSED' },
    });

    const instance = await prisma.botInstance.findUnique({
      where: { id: botInstanceId },
    });

    let totalPnl = 0;
    let winTrades = 0;
    let lossTrades = 0;

    for (const trade of trades) {
      const pnl = trade.pnlUsd || trade.pnl || 0;
      totalPnl += pnl;
      if (pnl > 0) winTrades++;
      else if (pnl < 0) lossTrades++;
    }

    const commissionRate = instance?.commissionRate || 20;
    const commissionOwed = totalPnl > 0 ? totalPnl * (commissionRate / 100) : 0;

    return {
      totalPnl,
      totalTrades: trades.length,
      winTrades,
      lossTrades,
      commissionOwed,
    };
  }

  /** Auto-disable bots where commission is overdue */
  async checkCommissionCompliance(): Promise<void> {
    const runningBots = await prisma.botInstance.findMany({
      where: { status: 'RUNNING' },
      include: { user: true },
    });

    for (const bot of runningBots) {
      const summary = await this.calculateCommission(bot.id);
      if (summary.commissionOwed > 50) { // threshold: $50 unpaid
        await this.adminDisableBot(bot.brokerAccountId, 'Unpaid commission exceeds $50');
        // Notify user
        await prisma.notification.create({
          data: {
            userId: bot.userId,
            type: 'COMMISSION',
            title: 'Bot Disabled - Commission Due',
            message: `Your bot has been paused. Outstanding commission: $${summary.commissionOwed.toFixed(2)}. Please settle to re-enable.`,
          },
        });
      }
    }
  }

  /** Calculate lot multiplier based on account balance */
  private calculateLotMultiplier(balance: number, baseLotSize: number): number {
    // Scale lots relative to a $10,000 base account
    const baseBalance = 10000;
    return Math.max(0.01, Math.round((balance / baseBalance) * 100) / 100);
  }

  /** Get commission rate based on plan */
  private getCommissionRate(plan: string): number {
    switch (plan) {
      case 'STARTER': return 25;   // 25% of profit
      case 'PRO': return 20;       // 20% of profit
      case 'ENTERPRISE': return 15; // 15% of profit
      default: return 30;
    }
  }
}

export const botManager = new BotManager();
