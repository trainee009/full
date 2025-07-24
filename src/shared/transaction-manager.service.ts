import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import Decimal from "decimal.js";
import { Account } from "src/accounts/entities/account.entity";
import { TransferDto } from "src/transactions/dto/transfer.dto";
import { Transaction } from "src/transactions/entities/transaction.entity";
import { DataSource } from "typeorm";

@Injectable()
export class TransactionManagerService {
    constructor(private dataSource: DataSource) {}

    async transfer(accountNumber: number, dto: TransferDto) {
        const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
        
            try {
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
        
              await queryRunner.commitTransaction();
              return { message: 'Transferred successfully' };
            } catch (error) {
              await queryRunner.rollbackTransaction();
              console.error('Transaction failed:', error);
              throw new ConflictException(`Transaction failed: ${error.message}`);
            } finally {
              await queryRunner.release();
            }
    }
}