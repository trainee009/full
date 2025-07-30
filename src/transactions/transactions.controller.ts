import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, UseInterceptors } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransferDto } from './dto/transfer.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PaginationDto } from './dto/pagination.dto';
import { PaginationInterceptor } from 'src/interceptors/pagination.interceptor';
import { TransactionsInterceptor } from 'src/interceptors/transactions.interceptor';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransactionsInterceptor)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}
  
  @Post('transfer/:id')
  transfer(@Param('id') accountId: number, @Body() dto: TransferDto) {
    return this.transactionsService.transfer(accountId, dto);
  }

  @UseInterceptors(PaginationInterceptor)
  @Get()
  findAll(@Query() dto: PaginationDto) {
    console.log(dto) 
    return this.transactionsService.findAll(dto.page ?? 1, dto.limit ?? 10);
  }

  @Get('last-transactions')
  async lastTransactions() {
    return await this.transactionsService.lastTransactions();
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    return this.transactionsService.update(+id, updateTransactionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(+id);
  }
}
