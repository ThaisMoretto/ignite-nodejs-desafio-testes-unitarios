import auth from "../../../../config/auth";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";

let authenticateUserUseCase: AuthenticateUserUseCase;
let usersRepositoryInMemory: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;

describe("Authenticate User Use Case", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(
      usersRepositoryInMemory
    );
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
  });

  it("should be able to authenticate an user", async () => {
    const user: ICreateUserDTO = {
      name: "Test",
      email: "test@test.com",
      password: "123456",
    };

    await createUserUseCase.execute(user);

    auth.jwt.secret = user.password;

    const result = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password,
    });

    expect(result).toHaveProperty("token");
  });

  it("should not be able to authenticate a non-existing user", async () => {
    expect(async () => {
      await authenticateUserUseCase.execute({
        email: "non-existing-user@test.com",
        password: "123456",
      });
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });

  it("should not be able to authenticate with incorrect password", async () => {
    expect(async () => {
      const user: ICreateUserDTO = {
        name: "Test incorrect password",
        email: "incorrect-password@test.com",
        password: "abcde",
      };

      await createUserUseCase.execute(user);

      await authenticateUserUseCase.execute({
        email: "incorrect-password@test.com",
        password: "incorrect-password",
      });
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });

  it("should not be able to authenticate with incorrect e-mail", async () => {
    expect(async () => {
      const user: ICreateUserDTO = {
        name: "Test incorrect e-mail",
        email: "correct-email@test.com",
        password: "abcde",
      };

      await createUserUseCase.execute(user);

      await authenticateUserUseCase.execute({
        email: "incorrect-email@test.com",
        password: "abcde",
      });
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });
});
