import { Module } from '@nestjs/common';
import { SharedService } from './shared.service';
import { SharedController } from './shared.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from 'src/accounts/entities/account.entity';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { TransactionManagerService } from './transaction-manager.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Transaction]),
  ],
  controllers: [SharedController],
  providers: [SharedService, TransactionManagerService],
  exports: [TransactionManagerService]
})
export class SharedModule {}
