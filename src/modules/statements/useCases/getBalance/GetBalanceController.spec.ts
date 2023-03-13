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

describe("Get Balance Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await sutDataBase();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to get balance of an authenticated user", async () => {
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
      .get("/api/v1/statements/balance")
      .send()
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(200);
    expect(response.body.statement[0]).toHaveProperty("id");
    expect(response.body.statement[0].amount).toEqual(100);
    expect(response.body.statement[0].type).toEqual(OperationType.DEPOSIT);
    expect(response.body.statement[0].description).toEqual(
      "Depósito de R$100,00"
    );
    expect(response.body.balance).toEqual(100);
  });

  it("should not be able to get balance if token is invalid", async () => {
    const response = await request(app)
      .get("/api/v1/statements/balance")
      .send()
      .set({
        Authorization: `Bearer any_token`,
      });

    expect(response.body).not.toHaveProperty("id");
    expect(response.body.message).toEqual("JWT invalid token!");
    expect(response.status).toBe(401);
  });

  it("should not be able to get balance if token is missing", async () => {
    const response = await request(app)
      .get("/api/v1/statements/balance")
      .send()
      .set({});

    expect(response.body).not.toHaveProperty("id");
    expect(response.body.message).toEqual("JWT token is missing!");
    expect(response.status).toBe(401);
  });
});
