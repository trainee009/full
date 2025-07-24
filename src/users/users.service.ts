import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}


  async create(createUserDto: CreateUserDto) {
    const user = this.userRepo.create(createUserDto);

    return await this.userRepo.save(user);
  }

  async findByEmail(email: string) {
    const user = await this.userRepo.findOne({
      where: { email, }
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }
  
  async ensureEmailNotTaken(email: string) {
    const isUser = await this.userRepo.findOne({
      where: { email, }
    })

    if (isUser) throw new ConflictException('User already in use');

    return true;
  }
  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
