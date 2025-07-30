import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { TransferDto } from './dto/transfer.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/accounts/entities/account.entity';
import { Transaction } from './entities/transaction.entity';
import Decimal from 'decimal.js';
import { REQUEST } from '@nestjs/core';
import { RedisClientType } from 'redis';

@Injectable({ scope: Scope.REQUEST })
export class TransactionsService {
  constructor(
    @Inject(REQUEST) private readonly request: any,
    @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
    @InjectRepository(Transaction) private readonly transactionRepo: Repository<Transaction>,
  ) {}

  async transfer(accountNumber: number, dto: TransferDto) {
    const queryRunner = this.request.queryRunner;
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

    userAccount.balance = userBalance.minus(transferAmount).toFixed(2);
    targetAccount.balance = targetBalance.plus(transferAmount).toFixed(2);

    await queryRunner.manager.save(userAccount);
    await queryRunner.manager.save(targetAccount);

    await queryRunner.manager.save(Transaction, {
      type: 'transfer',
      amount: transferAmount.toFixed(2),
      account: userAccount,
      targetAccountId: String(targetAccount.id),
    });

    const totalTransactions = await queryRunner.manager.count(Transaction);

    const totalPages = Math.ceil(totalTransactions / 5);

    const lastTransactions = await queryRunner.manager.find(Transaction, {
      skip: (totalPages - 1) * 5,
      take: 5,
      order: { createdAt: 'ASC' }
    })

    await this.redisClient.set('last_transactions', JSON.stringify(lastTransactions));

    return { message: 'Transferred successfully' };
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

  async lastTransactions() {
    const cached = await this.redisClient.get('last_transactions');
    
    if (cached) {
      const lastTransactions = JSON.parse(cached);
      console.log('from cache')
      return lastTransactions;
    }

    const totalTransactions = await this.transactionRepo.count();

    const totalPages = Math.ceil(totalTransactions / 5);

    const lastTransactions = await this.transactionRepo.find({
      skip: (totalPages - 1) * 5,
      take: 5,
      order: { createdAt: 'ASC' }
    })
    return lastTransactions;
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
