import { User } from "../../entities/User";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { ShowUserProfileError } from "./ShowUserProfileError";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

let usersRepositoryInMemory: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let showUserProfileUseCase: ShowUserProfileUseCase;

describe("Show User Profile Use Case", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
    showUserProfileUseCase = new ShowUserProfileUseCase(
      usersRepositoryInMemory
    );
  });

  it("should be able to show the profile of an existing user through its user_id", async () => {
    const user: ICreateUserDTO = {
      email: "new-user@test.com",
      name: "Test",
      password: "user@123",
    };

    const userCreated: User = await createUserUseCase.execute({
      email: user.email,
      name: user.name,
      password: user.password,
    });

    const userProfileFound = await showUserProfileUseCase.execute(
      userCreated.id as string
    );

    expect(userCreated).toEqual(userProfileFound);
  });

  it("should not be able to show the profile of a non-existent user", () => {
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

      await showUserProfileUseCase.execute("other user_id");
    }).rejects.toBeInstanceOf(ShowUserProfileError);
  });
});
