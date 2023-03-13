import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { hash } from "bcryptjs";
import { v4 as uuid } from "uuid";

import { app } from "../../../../app";
import auth from "../../../../config/auth";

let connection: Connection;

describe("Show User Profile Controller", () => {
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

    auth.jwt.secret = password;
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to show an authenticated user profile", async () => {
    const authenticatedUser = await request(app).post("/api/v1/sessions").send({
      email: "admin@rentx.com.br",
      password: "admin",
    });

    const { token } = authenticatedUser.body;

    const response = await request(app)
      .get("/api/v1/profile")
      .send()
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name");
    expect(response.body).toHaveProperty("email");
  });

  it("should not be able to show a existent user profile if token is invalid", async () => {
    const response = await request(app).get("/api/v1/profile").send().set({
      Authorization: `Bearer any_token`,
    });

    expect(response.body).not.toHaveProperty("id");
    expect(response.body.message).toEqual("JWT invalid token!");
    expect(response.status).toBe(401);
  });

  it("should not be able to show an existent user profile if token is missing", async () => {
    const response = await request(app).get("/api/v1/profile").send();

    expect(response.body).not.toHaveProperty("id");
    expect(response.body.message).toEqual("JWT token is missing!");
    expect(response.status).toBe(401);
  });
});
