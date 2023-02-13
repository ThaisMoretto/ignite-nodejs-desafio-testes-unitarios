import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserError } from "./CreateUserError";
import { CreateUserUseCase } from "./CreateUserUseCase";
import { ICreateUserDTO } from "./ICreateUserDTO";

let usersRepositoryInMemory: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;

describe("Create User Use Case", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
  });

  it("should be able to create a new user", async () => {
    const user: ICreateUserDTO = {
      email: "new-user@test.com",
      name: "Test",
      password: "user@123",
    };

    await createUserUseCase.execute({
      email: user.email,
      name: user.name,
      password: user.password,
    });

    const userCreated = await usersRepositoryInMemory.findByEmail(user.email);

    expect(userCreated).toHaveProperty("id");
  });

  it("should not be able to create a new user with an e-mail already exists", () => {
    expect(async () => {
      const user: ICreateUserDTO = {
        email: "new-user@test.com",
        name: "Test",
        password: "user@123",
      };

      await createUserUseCase.execute({
        email: user.email,
        name: user.name,
        password: user.password,
      });

      await createUserUseCase.execute({
        email: user.email,
        name: user.name,
        password: user.password,
      });
    }).rejects.toBeInstanceOf(CreateUserError);
  });
});
