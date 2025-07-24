import { PartialType } from '@nestjs/mapped-types';
import { TransferDto } from './transfer.dto';

export class UpdateTransactionDto extends PartialType(TransferDto) {}
