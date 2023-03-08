import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { hash } from "bcryptjs";
import { v4 as uuid } from "uuid";

import { app } from "../../../../app";
import auth from "../../../../config/auth";

let connection: Connection;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

const sutDataBase = async () => {
  await connection.dropDatabase();
  await connection.runMigrations();

  const id = uuid();
  const password = await hash("admin", 8);

  await connection.query(
    `INSERT INTO USERS(id, name, email, password, created_at)
    values('${id}', 'admin', 'admin@rentx.com.br', '${password}', 'now()')
    `
  );

  auth.jwt.secret = password;
};

const authenticateUser = async () => {
  const authenticatedUser = await request(app).post("/api/v1/sessions").send({
    email: "admin@rentx.com.br",
    password: "admin",
  });

  return authenticatedUser.body.token;
};

const statementOperation = async (
  token: string,
  operationType: OperationType = OperationType.DEPOSIT,
  amount: number = 100
) => {
  const responseStatement = await request(app)
    .post(`/api/v1/statements/${operationType}`)
    .send({
      amount: amount,
      description: `${operationType} - ${amount}`,
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

  return responseStatement.body.id;
};

describe("Get Statement Operation Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await sutDataBase();
  });

  afterAll(async () => {
    await connection.close();
  });

  it("should be able to get statement operation of an authenticated user", async () => {
    const token = await authenticateUser();

    const statementId = await statementOperation(token);

    const response = await request(app)
      .get(`/api/v1/statements/${statementId}`)
      .send()
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body.amount).toEqual("100.00");
    expect(response.body.type).toEqual(OperationType.DEPOSIT);
    expect(response.body.description).toEqual("deposit - 100");
  });

  it("should not be able to get statement operation if token is invalid", async () => {
    const token = await authenticateUser();

    const statementId = await statementOperation(token);

    const response = await request(app)
      .get(`/api/v1/statements/${statementId}`)
      .send()
      .set({
        Authorization: `Bearer any_token`,
      });

    expect(response.body).not.toHaveProperty("id");
    expect(response.body.message).toEqual("JWT invalid token!");
    expect(response.status).toBe(401);
  });

  it("should not be able to get statement operation if token is missing", async () => {
    const token = await authenticateUser();

    const statementId = await statementOperation(token);

    const response = await request(app)
      .get(`/api/v1/statements/${statementId}`)
      .send()
      .set({});

    expect(response.body).not.toHaveProperty("id");
    expect(response.body.message).toEqual("JWT token is missing!");
    expect(response.status).toBe(401);
  });
});
