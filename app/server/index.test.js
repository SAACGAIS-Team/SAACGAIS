import request from 'supertest';

jest.mock('./middleware/authenticate.js', () => {
  return (req, res, next) => {
    req.user = {
      sub: 'test-user-123',
      roles: ['Admin'],
    };
    next();
  };
});

// Mock Supabase BEFORE any imports that use it
jest.mock('./db.js', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => Promise.resolve({ data: [], error: null })),
      delete: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));

// Mock the Cognito configuration BEFORE importing the app
jest.mock('./config/cognito.js', () => ({
  cognito: {
    listGroups: jest.fn(() => ({
      promise: jest.fn(() => Promise.resolve({
        Groups: [
          {
            GroupName: 'Admin',
            Description: 'Administrator role',
            CreationDate: new Date('2024-01-01'),
            LastModifiedDate: new Date('2024-01-01')
          },
          {
            GroupName: 'User',
            Description: 'Standard user role',
            CreationDate: new Date('2024-01-01'),
            LastModifiedDate: new Date('2024-01-01')
          },
          {
            GroupName: 'Provider',
            Description: 'Provider role',
            CreationDate: new Date('2024-01-01'),
            LastModifiedDate: new Date('2024-01-01')
          }
        ]
      }))
    })),
    adminListGroupsForUser: jest.fn(() => ({
      promise: jest.fn(() => Promise.resolve({
        Groups: [
          { GroupName: 'User' }
        ]
      }))
    })),
    adminRemoveUserFromGroup: jest.fn(() => ({
      promise: jest.fn(() => Promise.resolve({}))
    })),
    adminAddUserToGroup: jest.fn(() => ({
      promise: jest.fn(() => Promise.resolve({}))
    }))
  },
  USER_POOL_ID: 'test-user-pool-id'
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
        adminUserId: 'admin-123',
        targetUserId: 'user-456',
        newRoles: ['Admin', 'Provider']
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
  });

  test('POST /api/user-roles should return 400 for missing parameters', async () => {
    const res = await agent
      .post('/api/user-roles')
      .send({
        adminUserId: 'admin-123'
      });
    
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});