import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { GetBalanceUseCase } from "./GetBalanceUseCase";
import { GetBalanceError } from "./GetBalanceError";

let usersRepositoryInMemory: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let statementRepositoryInMemory: InMemoryStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;
let getBalanceUseCase: GetBalanceUseCase;

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

describe('Get Balance Use Case', () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
    statementRepositoryInMemory = new InMemoryStatementsRepository();
    createStatementUseCase = new CreateStatementUseCase(usersRepositoryInMemory, statementRepositoryInMemory);
    getBalanceUseCase = new GetBalanceUseCase(statementRepositoryInMemory, usersRepositoryInMemory);
  });

  it('should to be able get balance of an existent user with statement', async () => {
    const user: ICreateUserDTO = {
      email: "new-user@test.com",
      name: "Test",
      password: "user@123",
    };
    const createdUser = await createUserUseCase.execute({
      email: user.email,
      name: user.name,
      password: user.password,
    });

    const statementOperationDeposit = await createStatementUseCase.execute({
      user_id: createdUser.id as string,
      amount: 1000.96,
      description: 'Test of type DEPOSIT',
      type: OperationType.DEPOSIT,
    });
    const statementOperationWithDraw = await createStatementUseCase.execute({
      user_id: createdUser.id as string,
      amount: 250.92,
      description: 'Test of type WITHDRAW',
      type: OperationType.WITHDRAW,
    });

    const { statement, balance } = await getBalanceUseCase.execute({ user_id: createdUser.id as string });

    expect(balance).toBe(statementOperationDeposit.amount - statementOperationWithDraw.amount);
    expect(statement.length).toBe(2);
  });

  it('should not be able to get balance of a non-existent user', () => {
    expect(async () => {
      await getBalanceUseCase.execute({ user_id: 'non-existent user_id' });
    }).rejects.toBeInstanceOf(GetBalanceError);
  });
});
