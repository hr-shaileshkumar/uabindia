import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const duration = new Trend('duration');
const successCounter = new Counter('success');
const activeUsers = new Gauge('active_users');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },    // Ramp-up to 10 users
    { duration: '5m', target: 50 },    // Ramp-up to 50 users
    { duration: '10m', target: 100 },  // Ramp-up to 100 users
    { duration: '5m', target: 50 },    // Ramp-down to 50 users
    { duration: '2m', target: 0 },     // Ramp-down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'errors': ['rate<0.1'],
    'http_req_failed': ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const API_KEY = __ENV.API_KEY || 'test-key';

let authToken = '';

export function setup() {
  // Login to get auth token
  const loginPayload = {
    email: 'admin@uabindia.in',
    password: 'Admin@123',
  };

  const loginResponse = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginResponse.status === 200) {
    return { token: loginResponse.json('token'), accessToken: loginResponse.json('accessToken') };
  } else {
    console.error('Login failed');
    return { token: '', accessToken: '' };
  }
}

export default function (data) {
  authToken = data.accessToken;
  activeUsers.add(1);

  group('API Health Checks', () => {
    healthCheck();
  });

  group('Privacy API Tests', () => {
    testPrivacyExport();
    testPrivacyPolicy();
  });

  group('Multi-Tenancy Tests', () => {
    testDataIsolation();
  });

  group('Rate Limiting Tests', () => {
    testRateLimiting();
  });

  sleep(1);
  activeUsers.add(-1);
}

function healthCheck() {
  const health = http.get(`${BASE_URL}/health`, {
    tags: { name: 'HealthCheck' },
  });

  check(health, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  }) || errorRate.add(1);

  duration.add(health.timings.duration, { endpoint: 'health' });
}

function testPrivacyExport() {
  const exportPayload = JSON.stringify({
    userId: 'test-user-id',
  });

  const exportResponse = http.post(
    `${BASE_URL}/api/v1/privacy/export-user-data`,
    exportPayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      tags: { name: 'PrivacyExport' },
    }
  );

  const success = check(exportResponse, {
    'export response status 200 or 404': (r) => r.status === 200 || r.status === 404,
    'export response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  if (success) successCounter.add(1);
  else errorRate.add(1);

  duration.add(exportResponse.timings.duration, { endpoint: 'privacy/export' });
}

function testPrivacyPolicy() {
  const policyResponse = http.get(`${BASE_URL}/api/v1/privacy/policy`, {
    tags: { name: 'PrivacyPolicy' },
  });

  check(policyResponse, {
    'policy response status is 200': (r) => r.status === 200,
    'policy response contains userRights': (r) => r.json('userRights') !== null,
    'policy response time < 100ms': (r) => r.timings.duration < 100,
  }) || errorRate.add(1);

  duration.add(policyResponse.timings.duration, { endpoint: 'privacy/policy' });
}

function testDataIsolation() {
  const companiesResponse = http.get(`${BASE_URL}/api/v1/companies`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
    tags: { name: 'GetCompanies' },
  });

  check(companiesResponse, {
    'companies response status is 200': (r) => r.status === 200,
    'companies response contains data': (r) => r.body.length > 0,
  }) || errorRate.add(1);

  duration.add(companiesResponse.timings.duration, { endpoint: 'companies' });
}

function testRateLimiting() {
  // Send multiple requests rapidly to test rate limiting
  const requests = [];
  
  for (let i = 0; i < 10; i++) {
    requests.push({
      method: 'GET',
      url: `${BASE_URL}/api/v1/companies`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
  }

  const responses = http.batch(requests);
  
  responses.forEach((response) => {
    check(response, {
      'rate limit response status is not 429': (r) => r.status !== 429,
      'rate limit response time < 1000ms': (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);
  });
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const { indent = '', enableColors = false } = options || {};
  const color = (str, colorCode) => (enableColors ? `\x1b[${colorCode}m${str}\x1b[0m` : str);

  let summary = `\n${color('=== LOAD TEST SUMMARY ===', '1;36')}\n\n`;

  Object.keys(data.metrics).forEach((metric) => {
    const values = data.metrics[metric].values;
    const samples = data.metrics[metric].samples;
    
    summary += `${indent}${metric}:\n`;
    summary += `${indent}  Samples: ${samples}\n`;
    Object.keys(values).forEach((key) => {
      summary += `${indent}  ${key}: ${values[key]}\n`;
    });
  });

  summary += `\n${color('=== END SUMMARY ===', '1;36')}\n`;
  return summary;
}
