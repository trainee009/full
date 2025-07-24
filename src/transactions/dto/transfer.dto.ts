import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class TransferDto {
    @IsEnum(['deposit', 'withdraw', 'transfer'])
    @IsNotEmpty()
    type: 'deposit' | 'withdraw' | 'transfer';

    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    amount: number;

    @IsOptional()
    @IsNumber()
    targetAccountNumber?: number;

    @IsOptional()
    @IsString()
    status?: string;
}
