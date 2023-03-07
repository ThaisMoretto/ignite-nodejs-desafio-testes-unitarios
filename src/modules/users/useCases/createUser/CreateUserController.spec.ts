import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { app } from "../../../../app";

let connection: Connection;

describe("Create User Controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to create an user", async () => {
    const response = await request(app).post("/api/v1/users").send({
      name: "User Test",
      email: "user-test@finapi.com.br",
      password: "123456",
    });

    expect(response.status).toBe(201);
  });

  it("should not be able to create an existent user", async () => {
    await request(app).post("/api/v1/users").send({
      name: "User Test",
      email: "user-test@finapi.com.br",
      password: "123456",
    });

    const response = await request(app).post("/api/v1/users").send({
      name: "Existent User - With the same email",
      email: "user-test@finapi.com.br",
      password: "123456",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual("User already exists");
  });
});
