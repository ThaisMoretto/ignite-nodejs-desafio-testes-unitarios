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

describe("Create Statement Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await sutDataBase();
  });

  afterAll(async () => {
    await connection.close();
  });

  it("should be able to create a statement of type DEPOSIT for an existent user", async () => {
    const token = await authenticateUser();

    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 100,
        description: "Depósito de R$100,00",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("user_id");
    expect(response.body.amount).toEqual(100);
    expect(response.body.description).toEqual("Depósito de R$100,00");
    expect(response.body.type).toEqual(OperationType.DEPOSIT);
  });

  it("should be able to create a statement of type WITHDRAW for an existent user", async () => {
    const token = await authenticateUser();

    await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 100,
        description: "Depósito de R$100,00",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 50,
        description: "Saque de R$50,00",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("user_id");
    expect(response.body.amount).toEqual(50);
    expect(response.body.description).toEqual("Saque de R$50,00");
    expect(response.body.type).toEqual(OperationType.WITHDRAW);
  });

  it.each`
    testCase                          | operationType
    ${"a statement of type DEPOSIT"}  | ${OperationType.DEPOSIT}
    ${"a statement of type WITHDRAW"} | ${OperationType.WITHDRAW}
  `(
    "should not be able to create ($testCase) if token is invalid",
    async ({ operationType }) => {
      const response = await request(app)
        .post(`/api/v1/statements/${operationType}`)
        .send({
          amount: 50,
          description: `${operationType} R$50,00`,
        })
        .set({
          Authorization: `Bearer any_token`,
        });

      expect(response.body).not.toHaveProperty("id");
      expect(response.body.message).toEqual("JWT invalid token!");
      expect(response.status).toBe(401);
    }
  );

  it.each`
    testCase                          | operationType
    ${"a statement of type DEPOSIT"}  | ${OperationType.DEPOSIT}
    ${"a statement of type WITHDRAW"} | ${OperationType.WITHDRAW}
  `(
    "should not be able to create ($testCase) if token is missing",
    async ({ operationType }) => {
      const response = await request(app)
        .post(`/api/v1/statements/${operationType}`)
        .send({
          amount: 50,
          description: `${operationType} R$50,00`,
        })
        .set({});

      expect(response.body).not.toHaveProperty("id");
      expect(response.body.message).toEqual("JWT token is missing!");
      expect(response.status).toBe(401);
    }
  );

  it("should not be able to create a statement of type WITHDRAW if the user does not have enough balance", async () => {
    await sutDataBase();

    const token = await authenticateUser();

    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send({
        amount: 50,
        description: "Saque de R$50,00 de uma conta que não possui saldo",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.body).not.toHaveProperty("id");
    expect(response.body.message).toEqual("Insufficient funds");
    expect(response.status).toBe(400);
  });
});
