import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account) private readonly accountRepo: Repository<Account>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}


  async create(email: string) {
    const owner = await this.userRepo.findOne({
      where: { email }
    });

    if (!owner) throw new NotFoundException('User not found');

    let accountNumber = Math.floor(1000 + Math.random() * 9000) // account number will be from 4 numbers

    while (await this.accountRepo.findOne({ where: { accountNumber } })) {
      accountNumber = Math.floor(1000 + Math.random() * 9000)
    }


    const account = this.accountRepo.create({
      accountNumber,
      owner,
    })

    return await this.accountRepo.save(account);
  }
}
