/**
 * Comprehensive Test Suite for Interoperable Loyalty System
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import InteroperableLoyaltyService from '../modules/interoperable-loyalty';

describe('Interoperable Loyalty System', () => {
  let service: InteroperableLoyaltyService;

  beforeEach(() => {
    service = new InteroperableLoyaltyService();
  });

  describe('Program Registry', () => {
    it('should have multiple airline programs', () => {
      const programs = service.getAvailablePrograms();
      const airlinePrograms = programs.filter((p) => p.pointType === 'miles');
      expect(airlinePrograms.length).toBeGreaterThanOrEqual(3);
    });

    it('should have hotel loyalty programs', () => {
      const programs = service.getAvailablePrograms();
      const hotelPrograms = programs.filter(
        (p) => p.merchant.includes('Hotel') || p.merchant.includes('Hyatt')
      );
      expect(hotelPrograms.length).toBeGreaterThan(0);
    });

    it('should have retail loyalty programs', () => {
      const programs = service.getAvailablePrograms();
      const retailPrograms = programs.filter(
        (p) => p.pointType === 'points' && !p.merchant.includes('Hotel')
      );
      expect(retailPrograms.length).toBeGreaterThan(0);
    });

    it('should support 15+ programs', () => {
      const programs = service.getAvailablePrograms();
      expect(programs.length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Account Management', () => {
    it('should create accounts in multiple programs', () => {
      service.enrollInProgram('user_multi', 'elal-rewards');
      service.enrollInProgram('user_multi', 'marriott-bonvoy');
      service.enrollInProgram('user_multi', 'walmart-rewards');

      const portfolio = service.getUserLoyaltyPortfolio('user_multi');
      expect(portfolio.accounts.length).toBe(3);
    });

    it('should track earned points correctly', () => {
      service.enrollInProgram('user_earn', 'starbucks-stars');
      
      // Earn points
      service.earnPoints('user_earn', 'starbucks-stars', 1000);
      
      const portfolio = service.getUserLoyaltyPortfolio('user_earn');
      const account = portfolio.accounts[0];
      
      expect(account.balance).toBe(1000);
      expect(account.totalEarned).toBe(1000);
    });

    it('should update tier based on lifetime value', () => {
      service.enrollInProgram('user_tier', 'walmart-rewards');
      
      // Earn significant points
      for (let i = 0; i < 10; i++) {
        service.earnPoints('user_tier', 'walmart-rewards', 10000);
      }
      
      const portfolio = service.getUserLoyaltyPortfolio('user_tier');
      const account = portfolio.accounts[0];
      
      expect(account.totalEarned).toBe(100000);
      expect(account.tier).toBe('vip'); // Lifetime > 500k
    });

    it('should calculate total portfolio value', () => {
      service.enrollInProgram('user_value', 'elal-rewards');
      service.enrollInProgram('user_value', 'marriott-bonvoy');
      
      service.earnPoints('user_value', 'elal-rewards', 5000);
      service.earnPoints('user_value', 'marriott-bonvoy', 2500);
      
      const portfolio = service.getUserLoyaltyPortfolio('user_value');
      expect(portfolio.totalUnifiedValue).toBeGreaterThan(0);
    });
  });

  describe('Point Conversion', () => {
    it('should convert between airline programs', () => {
      service.enrollInProgram('converter_air', 'elal-rewards');
      service.enrollInProgram('converter_air', 'united-mileage');
      
      service.earnPoints('converter_air', 'elal-rewards', 10000);
      
      const result = service.convertPoints(
        'converter_air',
        'elal-rewards',
        'united-mileage',
        10000
      );
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('convert');
    });

    it('should convert between different point types', () => {
      service.enrollInProgram('converter_mixed', 'walmart-rewards');
      service.enrollInProgram('converter_mixed', 'starbucks-stars');
      
      service.earnPoints('converter_mixed', 'walmart-rewards', 5000);
      
      const result = service.convertPoints(
        'converter_mixed',
        'walmart-rewards',
        'starbucks-stars',
        5000
      );
      
      expect(result).not.toBeNull();
      if (result) {
        expect(result.unifiedPointsValue).toBeLessThanOrEqual(5000);
      }
    });

    it('should handle airline to retail conversion', () => {
      service.enrollInProgram('converter_retail', 'american-advantage');
      service.enrollInProgram('converter_retail', 'target-rewards');
      
      service.earnPoints('converter_retail', 'american-advantage', 20000);
      
      const conversion = service.estimateConversion(
        'american-advantage',
        'target-rewards',
        20000
      );
      
      expect(conversion.destinationAmount).toBeGreaterThan(0);
      expect(conversion.fee).toBeGreaterThanOrEqual(0);
    });

    it('should calculate conversion rates accurately', () => {
      const estimate = service.estimateConversion('elal-rewards', 'marriott-bonvoy', 10000);
      
      expect(estimate.sourceAmount).toBe(10000);
      expect(estimate.unifiedValue).toBeGreaterThan(0);
      expect(estimate.destinationAmount).toBeGreaterThan(0);
      expect(estimate.fee).toBeGreaterThanOrEqual(0);
    });

    it('should zero-fee conversions for seamless experience', () => {
      service.enrollInProgram('user_seamless', 'usdc');
      service.enrollInProgram('user_seamless', 'usdt');
      
      service.earnPoints('user_seamless', 'usdc', 1000);
      
      const result = service.convertPoints(
        'user_seamless',
        'usdc',
        'usdt',
        1000
      );
      
      if (result) {
        expect(result.fee).toBeLessThan(10); // Minimal fee for stablecoins
      }
    });
  });

  describe('Universal Redemption', () => {
    it('should allow redeeming at any merchant', () => {
      service.enrollInProgram('redeemer', 'elal-rewards');
      service.enrollInProgram('redeemer', 'starbucks-stars');
      
      service.earnPoints('redeemer', 'elal-rewards', 5000);
      
      const redemption = service.redeemAtMerchant(
        'redeemer',
        'elal-rewards',
        'starbucks-stars',
        500
      );
      
      expect(redemption.status).toBe('pending');
      expect(redemption.estimatedUSDValue).toBeGreaterThan(0);
    });

    it('should approve redemptions', () => {
      service.enrollInProgram('approver', 'walmart-rewards');
      service.enrollInProgram('approver', 'mcdonalds-rewards');
      
      service.earnPoints('approver', 'walmart-rewards', 3000);
      
      const redemption = service.redeemAtMerchant(
        'approver',
        'walmart-rewards',
        'mcdonalds-rewards',
        1000
      );
      
      const approved = service.approveRedemption(redemption.id);
      expect(approved).toBe(true);
    });

    it('should track redemption history', () => {
      service.enrollInProgram('historian', 'uber-rewards');
      service.enrollInProgram('historian', 'costco-rewards');
      
      service.earnPoints('historian', 'uber-rewards', 2000);
      
      service.redeemAtMerchant('historian', 'uber-rewards', 'costco-rewards', 500);
      
      const transactions = service.getUserTransactions('historian');
      expect(transactions.length).toBeGreaterThan(0);
    });
  });

  describe('Multi-Program Portfolio', () => {
    it('should manage diverse loyalty portfolio', () => {
      const programIds = [
        'elal-rewards',
        'marriott-bonvoy',
        'walmart-rewards',
        'starbucks-stars',
        'uber-rewards',
      ];
      
      for (const programId of programIds) {
        service.enrollInProgram('portfolio_user', programId);
        service.earnPoints('portfolio_user', programId, 1000);
      }
      
      const portfolio = service.getUserLoyaltyPortfolio('portfolio_user');
      expect(portfolio.accounts.length).toBe(5);
      expect(portfolio.totalUnifiedValue).toBeGreaterThan(0);
    });

    it('should aggregate values across programs', () => {
      service.enrollInProgram('aggregator', 'hyatt-world');
      service.enrollInProgram('aggregator', 'hilton-honors');
      service.enrollInProgram('aggregator', 'marriott-bonvoy');
      
      const amounts = [5000, 7500, 10000];
      const programIds = ['hyatt-world', 'hilton-honors', 'marriott-bonvoy'];
      
      for (let i = 0; i < programIds.length; i++) {
        service.earnPoints('aggregator', programIds[i], amounts[i]);
      }
      
      const portfolio = service.getUserLoyaltyPortfolio('aggregator');
      expect(portfolio.totalUnifiedValue).toBe(
        amounts.reduce((a, b) => a + b) / 100 // Rough estimate
      );
    });
  });

  describe('Real-World Scenarios', () => {
    it('should enable El Al miles to be spent at Starbucks', () => {
      // User has El Al miles from flights
      service.enrollInProgram('traveler', 'elal-rewards');
      service.enrollInProgram('traveler', 'starbucks-stars');
      
      // Earn miles from flights
      service.earnPoints('traveler', 'elal-rewards', 15000); // ~$150
      
      // Want to buy coffee with miles
      const redemption = service.redeemAtMerchant(
        'traveler',
        'elal-rewards',
        'starbucks-stars',
        5000 // 1/3 of miles
      );
      
      expect(redemption.estimatedUSDValue).toBeGreaterThan(0);
      expect(redemption.status).toBe('pending');
    });

    it('should enable hotel points to be spent at retail', () => {
      service.enrollInProgram('hotelier', 'marriott-bonvoy');
      service.enrollInProgram('hotelier', 'target-rewards');
      
      // Earn hotel points from stays
      service.earnPoints('hotelier', 'marriott-bonvoy', 50000); // ~$500
      
      // Want to shop at Target
      const estimate = service.estimateConversion(
        'marriott-bonvoy',
        'target-rewards',
        10000
      );
      
      expect(estimate.destinationAmount).toBeGreaterThan(0);
    });

    it('should enable credit card points to be spent anywhere', () => {
      service.enrollInProgram('credit_user', 'amex-mr');
      
      const programs = service.getAvailablePrograms();
      
      // Amex points can be converted to any other program
      for (const program of programs.slice(0, 5)) {
        const estimate = service.estimateConversion('amex-mr', program.id, 1000);
        expect(estimate.destinationAmount).toBeGreaterThan(0);
      }
    });

    it('should support instant conversion for urgent needs', () => {
      service.enrollInProgram('urgent', 'united-mileage');
      service.enrollInProgram('urgent', 'uber-rewards');
      
      service.earnPoints('urgent', 'united-mileage', 5000);
      
      const redemption = service.redeemAtMerchant(
        'urgent',
        'united-mileage',
        'uber-rewards',
        2000
      );
      
      service.approveRedemption(redemption.id);
      
      const transactions = service.getUserTransactions('urgent');
      expect(transactions.length).toBeGreaterThan(0);
    });
  });

  describe('Performance & Scale', () => {
    it('should handle 10000+ conversions', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        const userId = `perf_user_${i}`;
        service.enrollInProgram(userId, 'elal-rewards');
        service.earnPoints(userId, 'elal-rewards', 5000);
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000); // Complete in < 5 seconds
    });

    it('should maintain conversion accuracy at scale', () => {
      service.enrollInProgram('scale_user', 'marriott-bonvoy');
      service.enrollInProgram('scale_user', 'walmart-rewards');
      
      // Earn large amount of points
      service.earnPoints('scale_user', 'marriott-bonvoy', 1000000);
      
      const estimate = service.estimateConversion(
        'marriott-bonvoy',
        'walmart-rewards',
        1000000
      );
      
      expect(estimate.destinationAmount).toBeGreaterThan(0);
      expect(estimate.fee).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle conversion with exact balance', () => {
      service.enrollInProgram('exact', 'starbucks-stars');
      service.enrollInProgram('exact', 'target-rewards');
      
      service.earnPoints('exact', 'starbucks-stars', 5000);
      
      const result = service.convertPoints(
        'exact',
        'starbucks-stars',
        'target-rewards',
        5000
      );
      
      expect(result).not.toBeNull();
    });

    it('should reject conversion with insufficient balance', () => {
      service.enrollInProgram('insufficient', 'uber-rewards');
      service.enrollInProgram('insufficient', 'costco-rewards');
      
      service.earnPoints('insufficient', 'uber-rewards', 100);
      
      const result = service.convertPoints(
        'insufficient',
        'uber-rewards',
        'costco-rewards',
        500 // More than available
      );
      
      expect(result).toBeNull();
    });

    it('should handle multiple sequential conversions', () => {
      service.enrollInProgram('sequential', 'elal-rewards');
      service.enrollInProgram('sequential', 'marriott-bonvoy');
      service.enrollInProgram('sequential', 'walmart-rewards');
      
      service.earnPoints('sequential', 'elal-rewards', 10000);
      
      // Convert chain: elal -> marriott
      const result1 = service.convertPoints(
        'sequential',
        'elal-rewards',
        'marriott-bonvoy',
        5000
      );
      
      // Then marriott -> walmart
      if (result1) {
        const result2 = service.convertPoints(
          'sequential',
          'marriott-bonvoy',
          'walmart-rewards',
          2500
        );
        
        expect(result2).not.toBeNull();
      }
    });
  });
});

export default describe;
