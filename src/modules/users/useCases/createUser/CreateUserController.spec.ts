import request from "supertest";
import { Connection, createConnection } from "typeorm";

import { app } from "../../../../app";

let connection: Connection;

describe.skip('Create User Controller', () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it('should be able to authenticate', async () => {
    const response = await request(app).post('/api/v1/users').send({
      name: 'User Test',
      email: 'user-test@finapi.com.br',
      password: '123456',
    });

    console.log(JSON.stringify(response))
    expect(response.status).toBe(201);
  });
});
