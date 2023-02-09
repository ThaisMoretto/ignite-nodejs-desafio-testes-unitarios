import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { hash } from "bcryptjs";
import { v4 as uuid } from "uuid";

import { app } from "../../../../app";

let connection: Connection;

describe('Authenticate User Controller', () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id = uuid();
    const password = await hash("admin", 8);

    await connection.query(
      `INSERT INTO USERS(id, name, email, password, created_at)
      values('${id}', 'admin', 'admin@rentx.com.br', '${password}', 'now()')
      `
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it('should be able to authenticate', async () => {
    const loginResponse = await request(app).post('/api/v1/sessions').send({
      email: 'admin@rentx.com.br',
      password: 'admin'
    });

    expect(loginResponse.body).toHaveProperty('token');
  });

  it('should be able to authenticate with invalid password', async () => {
    const loginResponse = await request(app).post('/api/v1/sessions').send({
      email: 'admin@rentx.com.br',
      password: 'admin1'
    });

    expect(loginResponse.status).toBe(401);
    expect(loginResponse.body).toHaveProperty('message');
    expect(loginResponse.body.message).toEqual('Incorrect email or password');
  });
});
