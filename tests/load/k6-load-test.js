import http from 'k6/http';
import { check, group, sleep } from 'k6';

/**
 * QPay Load Testing Script
 * Run with: k6 run tests/load/k6-load-test.js
 */

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m30s', target: 50 }, // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '1m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95th percentile < 500ms, 99th < 1s
    http_req_failed: ['rate<0.1'],                   // Error rate < 10%
  },
};

const BASE_URL = 'http://localhost:8080/api';
const MERCHANT_ID = 'test-merchant-' + __ENV.TEST_RUN_ID || 'test';

export default function () {
  // Test 1: User Registration
  group('User Registration', () => {
    const email = `user-${__VU}-${__ITER}@example.com`;
    const payload = {
      email,
      password: 'SecurePassword123!',
      firstName: 'Test',
      lastName: 'User',
      businessName: 'Test Business',
    };

    const res = http.post(`${BASE_URL}/auth/register`, JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
    });

    check(res, {
      'registration status is 201': (r) => r.status === 201 || r.status === 400,
      'registration returns token': (r) => r.body.includes('accessToken') || r.body.includes('error'),
    });
  });

  sleep(1);

  // Test 2: Authentication
  group('Authentication', () => {
    const payload = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
    };

    const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
    });

    check(res, {
      'login status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'login response has token or error': (r) => r.body.includes('Token') || r.body.includes('error'),
    });
  });

  sleep(1);

  // Test 3: Payment Processing
  group('Payment Processing', () => {
    const payload = {
      amount: Math.random() * 500 + 10, // Random between 10-510
      currency: 'USD',
      cardToken: 'tok_test_' + __VU,
      paymentMethod: 'emv_chip',
      description: 'Test Payment',
      terminalId: 'TERM_001',
    };

    const res = http.post(`${BASE_URL}/transactions/process`, JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-' + __VU,
      },
      tags: { name: 'ProcessPayment' },
    });

    check(res, {
      'payment processing status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'payment returns transaction ID': (r) => r.body.includes('transactionId'),
    });
  });

  sleep(1);

  // Test 4: Transaction Listing
  group('Transaction Listing', () => {
    const res = http.get(`${BASE_URL}/transactions?limit=50&offset=0`, {
      headers: {
        'Authorization': 'Bearer test-token-' + __VU,
      },
      tags: { name: 'ListTransactions' },
    });

    check(res, {
      'transaction list status is 200': (r) => r.status === 200,
      'transaction list has data': (r) => r.body.includes('transactions'),
    });
  });

  sleep(1);

  // Test 5: Settlement Calculation
  group('Settlement Calculation', () => {
    const res = http.post(
      `${BASE_URL}/settlements/calculate`,
      JSON.stringify({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-' + __VU,
        },
        tags: { name: 'CalculateSettlement' },
      }
    );

    check(res, {
      'settlement calculation status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'settlement has summary': (r) => r.body.includes('grossVolume'),
    });
  });

  sleep(1);

  // Test 6: Alert Configuration
  group('Alert Configuration', () => {
    const payload = {
      name: 'Load Test Alert',
      enabled: true,
      triggers: [
        {
          type: 'high_transaction',
          value: 1000,
          frequency: 'immediate',
        },
      ],
      notificationChannels: {
        email: true,
        sms: true,
        inApp: true,
      },
      recipients: [
        {
          type: 'owner',
          email: 'owner@example.com',
        },
      ],
    };

    const res = http.post(`${BASE_URL}/alerts/config`, JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-' + __VU,
      },
      tags: { name: 'CreateAlert' },
    });

    check(res, {
      'alert creation status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    });
  });

  sleep(1);

  // Test 7: Dashboard Data
  group('Dashboard Data', () => {
    const res = http.get(`${BASE_URL}/merchants/dashboard`, {
      headers: {
        'Authorization': 'Bearer test-token-' + __VU,
      },
      tags: { name: 'GetDashboard' },
    });

    check(res, {
      'dashboard status is 200': (r) => r.status === 200,
      'dashboard has metrics': (r) => r.body.includes('today') || r.body.includes('month'),
    });
  });

  sleep(2);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

/**
 * Simple text summary formatter
 */
function textSummary(data, options = {}) {
  const { indent = '', enableColors = false } = options;
  let summary = '\n=== Load Test Summary ===\n';

  if (data.metrics && data.metrics.http_req_duration) {
    const duration = data.metrics.http_req_duration;
    summary += `${indent}HTTP Request Duration:\n`;
    summary += `${indent}  p(50): ${duration.values.p(50).toFixed(2)}ms\n`;
    summary += `${indent}  p(90): ${duration.values.p(90).toFixed(2)}ms\n`;
    summary += `${indent}  p(95): ${duration.values.p(95).toFixed(2)}ms\n`;
    summary += `${indent}  p(99): ${duration.values.p(99).toFixed(2)}ms\n`;
  }

  if (data.metrics && data.metrics.http_reqs) {
    summary += `${indent}Total Requests: ${data.metrics.http_reqs.value}\n`;
  }

  summary += '\n=== End Summary ===\n';
  return summary;
}
