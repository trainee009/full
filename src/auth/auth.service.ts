import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from 'src/users/users.service';

import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) {}


    async register(dto: RegisterDto, res: Response) {
        const existing = await this.usersService.ensureEmailNotTaken(dto.email);

        if (!existing) throw new ConflictException('Email already in use');

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const newUser = await this.usersService.create({
            ...dto,
            password: hashedPassword,
        })

        if (!newUser) throw new ConflictException('Error in register');
        
        return this.login(dto, res);
    }

    async login(dto: LoginDto, res: Response) {
        const user = await this.usersService.findByEmail(dto.email);

        if (!user) throw new UnauthorizedException('Invalid credentials');

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);

        if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

        const payload = { sub: user.id, email: user.email };

        const token = this.jwtService.sign(payload);

        res.cookie('access_token', token, {
            httpOnly: true,
            secure: false, // true in production
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000,
        })

        res.cookie('refresh_token', token, {
            httpOnly: true,
            secure: false, // true in production
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return { message: 'Logged in successfully' };
    }

    async logout(res: any) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        
        return { message: 'Logged out successfully' };
    }

    async refresh(req: any, res: any) {
        const refreshToken = req.cookies['refresh_token'];

        if (!refreshToken) throw new UnauthorizedException('Refresh token missing');

        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: process.env.JWT_SECRET || 'test',
            })

            const newAccessToken = this.jwtService.sign(
                { sub: payload.sub, email: payload.email },
                { expiresIn: '1h' },
            )

            res.cookie('access_token', newAccessToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 60 * 60 * 1000,
            })

            return { message: 'Token refreshed' }
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token')
        }
    }
}
