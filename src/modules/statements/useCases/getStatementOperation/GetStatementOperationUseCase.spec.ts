import { User } from "../../../users/entities/User";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";
import { GetStatementOperationError } from "./GetStatementOperationError";

let usersRepositoryInMemory: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let statementRepositoryInMemory: InMemoryStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;
let getStatementOperationUseCase: GetStatementOperationUseCase;

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

describe('Get Statement Operation Use Case', () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
    statementRepositoryInMemory = new InMemoryStatementsRepository();
    createStatementUseCase = new CreateStatementUseCase(usersRepositoryInMemory, statementRepositoryInMemory);
    getStatementOperationUseCase = new GetStatementOperationUseCase(usersRepositoryInMemory, statementRepositoryInMemory);
  });

  it('should to be able get a statement operation of an existent user', async () => {
    const user = await createUser();

    const statementOperationDeposit = await createStatementUseCase.execute({
      user_id: user.id as string,
      amount: 1000.96,
      description: 'Test of type DEPOSIT',
      type: OperationType.DEPOSIT,
    });
    const statementOperationWithDraw = await createStatementUseCase.execute({
      user_id: user.id as string,
      amount: 250.92,
      description: 'Test of type WITHDRAW',
      type: OperationType.WITHDRAW,
    });

    const statementOperation = await getStatementOperationUseCase.execute({ user_id: user.id as string, statement_id: statementOperationDeposit.id as string });

    expect(statementOperation.id).toBe(statementOperationDeposit.id);
    expect(statementOperation.id).not.toBe(statementOperationWithDraw.id);
  });

  it('should not be able to get statement operation of a non-existent user', () => {
    expect(async () => {
      await getStatementOperationUseCase.execute({ user_id: 'non-existent user_id', statement_id: 'any statement_id' });
    }).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound);
  });

  it('should not be able to get a non-existent statement operation', () => {
    expect(async () => {
      const user = await createUser();

      await getStatementOperationUseCase.execute({ user_id: user.id as string, statement_id: 'non-existent statement_id' });
    }).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound);
  });
});
