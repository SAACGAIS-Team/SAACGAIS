import request from 'supertest';

jest.mock('./middleware/authenticate.js', () => {
  return (req, res, next) => {
    req.user = {
      sub: 'test-user-123',
      roles: ['Admin', 'Healthcare-Provider'],
    };
    next();
  };
});

jest.mock('./db.js', () => ({
  default: {
    rpc: jest.fn(() => Promise.resolve({ data: [], error: null })),
  },
}));

jest.mock('./services/cognitoService.js', () => ({
  listGroups: jest.fn(() => Promise.resolve([
    { GroupName: 'Admin', Description: 'Administrator role', CreationDate: new Date('2024-01-01'), LastModifiedDate: new Date('2024-01-01') },
    { GroupName: 'User', Description: 'Standard user role', CreationDate: new Date('2024-01-01'), LastModifiedDate: new Date('2024-01-01') },
    { GroupName: 'Healthcare-Provider', Description: 'Provider role', CreationDate: new Date('2024-01-01'), LastModifiedDate: new Date('2024-01-01') },
  ])),
  getUserGroups: jest.fn(() => Promise.resolve(['User'])),
  setUserGroups: jest.fn(() => Promise.resolve()),
  getUserById: jest.fn(() => Promise.resolve({
    sub: 'test-user-123',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: null,
    birthdate: null,
  })),
  updateUserAttributes: jest.fn(() => Promise.resolve()),
  verifyPassword: jest.fn(() => Promise.resolve()),
  setUserPassword: jest.fn(() => Promise.resolve()),
  sendCommand: jest.fn(() => Promise.resolve({})),
}));

jest.mock('./services/supabaseService.js', () => ({
  getProviderSelection: jest.fn(() => Promise.resolve(null)),
  deleteProviderSelection: jest.fn(() => Promise.resolve()),
  insertProviderSelection: jest.fn(() => Promise.resolve({})),
  getProviderPatients: jest.fn(() => Promise.resolve([])),
  getFileUploads: jest.fn(() => Promise.resolve([])),
  insertFileUpload: jest.fn(() => Promise.resolve()),
  getTextUploads: jest.fn(() => Promise.resolve([])),
  insertTextUpload: jest.fn(() => Promise.resolve()),
}));

jest.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn(() => Promise.resolve({
        getTextContent: jest.fn(() => Promise.resolve({
          items: [{ str: 'mock pdf text' }],
        })),
      })),
    }),
  })),
}));

import app from './index.js';

describe('Test routes', () => {
  let agent;
  let csrfToken;

  beforeAll(async () => {
    agent = request.agent(app);
    const res = await agent.get('/api/auth/csrf-token');
    const cookies = res.headers['set-cookie'];

    if (cookies) {
      agent.jar.setCookie(cookies[0], 'http://localhost:3001');
    }

    csrfToken = res.body.csrfToken;
  });

  test('Basic test to ensure Jest is working', () => {
    expect(true).toBe(true);
  });

  test('GET /api/user-roles should return roles', async () => {
    const res = await request(app).get('/api/user-roles');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('roles');
    expect(Array.isArray(res.body.roles)).toBe(true);
    expect(res.body.roles.length).toBeGreaterThan(0);
  });

  test('GET /api/user-roles/:userId should return user roles', async () => {
    const res = await request(app).get('/api/user-roles/test-user-123');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('roles');
    expect(Array.isArray(res.body.roles)).toBe(true);
  });

  test('POST /api/user-roles should change user roles', async () => {
    const res = await agent
      .post('/api/user-roles')
      .send({
        targetUserId: 'user-456',
        newRoles: ['Administrator', 'Healthcare-Provider'], // was 'Admin'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
  });

  test('POST /api/user-roles should return 400 for missing parameters', async () => {
    const res = await agent
      .post('/api/user-roles')
      .send({
        adminUserId: 'admin-123',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});