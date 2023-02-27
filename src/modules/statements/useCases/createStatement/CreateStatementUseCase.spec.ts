import { User } from "../../../users/entities/User";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";
import { CreateStatementUseCase } from "./CreateStatementUseCase";

let usersRepositoryInMemory: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let statementRepositoryInMemory: InMemoryStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

const defaultUser: ICreateUserDTO = {
  email: "new-user@test.com",
  name: "Test",
  password: "user@123",
}

const createUser = async (user = defaultUser): Promise<User> => {
  return await createUserUseCase.execute({
    email: user.email,
    name: user.name,
    password: user.password,
  });
}

describe('Create Statement Use Case', () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
    statementRepositoryInMemory = new InMemoryStatementsRepository();
    createStatementUseCase = new CreateStatementUseCase(usersRepositoryInMemory, statementRepositoryInMemory);
  });

  it('should be able to create a statement of type DEPOSIT for an existent user', async () => {
    const user = await createUser();

    const statementOperation = await createStatementUseCase.execute({
      user_id: user.id as string,
      amount: 1000.96,
      description: 'Test of type DEPOSIT',
      type: OperationType.DEPOSIT,
    });

    expect(statementOperation).toHaveProperty('id');
    expect(statementOperation.type).toBe('deposit');
  });

  it('should be able to create a statement of type WITHDRAW for an existent user', async () => {
    const user = await createUser();

    await createStatementUseCase.execute({
      user_id: user.id as string,
      amount: 1000,
      description: 'Test of type DEPOSIT',
      type: OperationType.DEPOSIT,
    });

    const statementOperation = await createStatementUseCase.execute({
      user_id: user.id as string,
      amount: 500,
      description: 'Test of type WITHDRAW',
      type: OperationType.WITHDRAW,
    });

    expect(statementOperation).toHaveProperty('id');
    expect(statementOperation.type).toBe('withdraw');
  });

  it('should not be able to create a statement of type WITHDRAW if the user does not have enough balance', async () => {
    const user = await createUser();

    expect(async () => {
      await createStatementUseCase.execute({
        user_id: user.id as string,
        amount: 500,
        description: 'Test of type WITHDRAW',
        type: OperationType.WITHDRAW,
      });
    }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds);
  });

  it('should not be able to create a statement for a non-existent user', () => {
    expect(async () => {
      await createUser();

      await createStatementUseCase.execute({
        user_id: 'other user.id',
        amount: 1000.96,
        description: 'Descriprion test',
        type: OperationType.WITHDRAW,
      });
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
  });
});
