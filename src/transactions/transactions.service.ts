import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TransferDto } from './dto/transfer.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/accounts/entities/account.entity';
import { Transaction } from './entities/transaction.entity';
import Decimal from 'decimal.js';
import { TransactionManagerService } from 'src/shared/transaction-manager.service';

@Injectable()
export class TransactionsService {
  constructor(
    private dataSource: DataSource,
    private transactionManagerService: TransactionManagerService,
    @InjectRepository(Transaction) private readonly transactionRepo: Repository<Transaction>,
  ) {}


  async create(accountNumber: number, dto: TransferDto) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    if (dto.type === 'transfer') {
      const userAccount = await queryRunner.manager.findOne(Account, {
        where: { accountNumber },
      });

      if (!userAccount) throw new NotFoundException('Source account not found');

      const userBalance = new Decimal(userAccount.balance);
      const transferAmount = new Decimal(dto.amount);

      if (userBalance.lessThan(transferAmount)) {
        throw new ConflictException('Balance not enough');
      }

      const targetAccount = await queryRunner.manager.findOne(Account, {
        where: { accountNumber: dto.targetAccountNumber },
      });

      if (!targetAccount) throw new NotFoundException('Target account not found');

      const targetBalance = new Decimal(targetAccount.balance);

      // Update balances
      userAccount.balance = userBalance.minus(transferAmount).toFixed(2);
      targetAccount.balance = targetBalance.plus(transferAmount).toFixed(2);

      // Save both accounts in transaction
      await queryRunner.manager.save(userAccount);
      await queryRunner.manager.save(targetAccount);

      // Save transaction record
      await queryRunner.manager.save(Transaction, {
        type: 'transfer',
        amount: transferAmount.toFixed(2),
        account: userAccount,
        targetAccountId: String(targetAccount.id),
      });

      await queryRunner.commitTransaction();
      return { message: 'Transferred successfully' };
    }
    // here if I want to add the other types
    throw new BadRequestException('Unsupported transaction type');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Transaction failed:', error);
    throw new ConflictException(`Transaction failed: ${error.message}`);
  } finally {
    await queryRunner.release();
  }
}
  async transfer(accountNumber: number, dto: TransferDto) {
    return await this.transactionManagerService.transfer(accountNumber, dto);
  }
  async findAll(page: number, limit: number) {
    const [items, total] = await this.transactionRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    })
    return {
      items,
      total,
      page,
      limit,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }

  update(id: number, updateTransactionDto: UpdateTransactionDto) {
    return `This action updates a #${id} transaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }
}
