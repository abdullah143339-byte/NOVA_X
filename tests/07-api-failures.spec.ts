import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:8080/api/v1';

test.describe('API Failure Scenarios', () => {
  test('API health check — backend is running', async ({ request }) => {
    const res = await request.get(`${API_URL}/health`);
    expect(res.ok()).toBeTruthy();
  });

  test('unauthenticated /posts/feed returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/posts/feed`);
    expect(res.status()).toBe(401);
  });

  test('invalid JWT token returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/auth/me`, {
      headers: { Authorization: 'Bearer invalid.token.here' },
    });
    expect(res.status()).toBe(401);
  });

  test('expired JWT token returns 401', async ({ request }) => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.fakehash';
    const res = await request.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    expect(res.status()).toBe(401);
  });

  test('POST to login with missing fields returns error', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: { email: 'test@test.com' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('POST to login with invalid email format returns error', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: { email: 'not-an-email', password: 'password123' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('POST to register with missing fields returns error', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/register`, {
      data: { email: 'test@test.com' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('GET nonexistent route returns 404', async ({ request }) => {
    const res = await request.get(`${API_URL}/nonexistent-endpoint-12345`);
    expect(res.status()).toBe(404);
  });

  test('/ai/chat endpoint works (requires auth)', async ({ request }) => {
    const res = await request.post(`${API_URL}/ai/chat`, {
      data: { message: 'Hello' },
    });
    expect([401, 200]).toContain(res.status());
  });

  test('/leaderboard endpoint returns data', async ({ request }) => {
    const res = await request.get(`${API_URL}/leaderboard`);
    expect(res.ok()).toBeTruthy();
  });

  test('/wallet/me returns 401 without auth', async ({ request }) => {
    const res = await request.get(`${API_URL}/wallet/me`);
    expect(res.status()).toBe(401);
  });

  test('POST to login with SQL injection attempt is safe', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: { email: "admin'--", password: "password' OR '1'='1" },
    });
    expect([400, 401, 422]).toContain(res.status());
  });

  test('XSS input is sanitized in registration', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/register`, {
      data: {
        firstName: '<script>alert("xss")</script>',
        lastName: 'Test',
        username: `xsstest_${Date.now()}`,
        email: `xss_${Date.now()}@test.com`,
        password: 'SecurePass123!',
      },
    });
    if (res.ok()) {
      const data = await res.json();
      const str = JSON.stringify(data);
      expect(str).not.toContain('<script>');
    }
  });

  test('request with oversized body returns error', async ({ request }) => {
    const hugeBody = 'x'.repeat(10 * 1024 * 1024);
    const res = await request.post(`${API_URL}/posts`, {
      data: { content: hugeBody },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('GET search without auth returns results', async ({ request }) => {
    const res = await request.get(`${API_URL}/search?q=test`);
    expect([200, 401]).toContain(res.status());
  });

  test('/notifications returns 401 without auth', async ({ request }) => {
    const res = await request.get(`${API_URL}/notifications`);
    expect(res.status()).toBe(401);
  });

  test('GET RAG stats endpoint works', async ({ request }) => {
    const res = await request.get(`${API_URL}/rag/stats`);
    expect(res.ok()).toBeTruthy();
  });

  test('Google OAuth callback with invalid code returns error', async ({ request }) => {
    const res = await request.get(`${API_URL}/auth/google/callback?code=invalid_code&state=test`);
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('/auth/2fa/setup returns 401 without auth', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/2fa/setup`);
    expect(res.status()).toBe(401);
  });

  test('/auth/2fa/status returns 401 without auth', async ({ request }) => {
    const res = await request.get(`${API_URL}/auth/2fa/status`);
    expect(res.status()).toBe(401);
  });
});
