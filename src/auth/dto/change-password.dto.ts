import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";
import { Match } from "../decorators/match.decorator";

export class ChangePasswordDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    @MaxLength(32)
    newPassword: string;

    @IsString()
    @MinLength(6)
    @MaxLength(32)
    // @Match('password', { message: 'Passwords do not match' }) // this is not working check later
    confirmPassword: string;
}