const request = require('supertest');
const app = require('../src/app');
const { initDatabase } = require('../src/config/database');

describe('Tasks API', () => {
  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.DB_NAME = 'test_devops_crud_db';
    
    await initDatabase();
  });

  describe('GET /api/tasks', () => {
    test('should return empty array initially', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBeTruthy();
    });
  });

  describe('POST /api/tasks', () => {
    test('should create a new task', async () => {
      const newTask = {
        title: 'Test Task',
        description: 'Test Description'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(newTask)
        .expect(201);

      expect(response.body.title).toBe(newTask.title);
      expect(response.body.description).toBe(newTask.description);
      expect(response.body.completed).toBe(false);
    });

    test('should return error for missing title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ description: 'Test Description' })
        .expect(400);

      expect(response.body.error).toBe('Title is required');
    });
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });
});
