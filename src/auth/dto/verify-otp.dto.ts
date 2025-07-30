import { IsEmail, IsNumber, MaxLength, MinLength } from "class-validator";

export class VerifyOTPDto {
    @IsEmail()
    email: string;

    @IsNumber()
    otp: number;
}