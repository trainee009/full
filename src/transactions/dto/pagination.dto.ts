import { Type } from "class-transformer";
import { IsNumber, IsOptional, Max, Min, MinLength } from "class-validator";

export class PaginationDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    page: number = 1;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(10)
    limit: number = 10;
}