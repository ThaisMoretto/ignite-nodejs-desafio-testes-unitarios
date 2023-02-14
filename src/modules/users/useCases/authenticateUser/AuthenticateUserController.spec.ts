import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { hash } from "bcryptjs";
import { v4 as uuid } from "uuid";

import { app } from "../../../../app";

let connection: Connection;

describe('Authenticate User Controller', () => {
  beforeAll(async () => {
    connection = await createConnection();

    await connection.dropDatabase();
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
    await connection.close();
  });

  it('should be able to authenticate', async () => {
    const loginResponse = await request(app).post('/api/v1/sessions').send({
      email: 'admin@rentx.com.br',
      password: 'admin',
    });

    expect(loginResponse.body).toHaveProperty('token');
  });

  it('should be able to authenticate with invalid password', async () => {
    const loginResponse = await request(app).post('/api/v1/sessions').send({
      email: 'admin@rentx.com.br',
      password: 'admin1',
    });

    expect(loginResponse.status).toBe(401);
    expect(loginResponse.body.message).toEqual('Incorrect email or password');
    expect(loginResponse.body.token).toBe(undefined);
  });

  it('should not be able to authenticate a non-existing user', async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "anotheruser@email.com",
      password: "anotherUserPassword",
    });

    expect(responseToken.status).toBe(401);
    expect(responseToken.body.message).toEqual("Incorrect email or password");
    expect(responseToken.body.token).toBe(undefined);
  });
});
