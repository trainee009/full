import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from 'src/users/users.service';

import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { MoreThan, Repository } from 'typeorm';
import { Session } from 'src/sessions/entity/session.entity';
import { InjectRepository } from '@nestjs/typeorm';


import * as nodeMailer from 'nodemailer'
import { VerifyOTPDto } from './dto/verify-otp.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        @InjectRepository(Session) private sessionRepo: Repository<Session>,
    ) {}

    private parseDevice(userAgent?: string): string {
        if (!userAgent) return 'Unknown';
        if (userAgent.includes('Mobile')) return 'Mobile';
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Mac')) return 'Mac';
        return 'Desktop';
    }


    async register(dto: RegisterDto, res: Response, req: Request) {
        const existing = await this.usersService.ensureEmailNotTaken(dto.email);

        if (!existing) throw new ConflictException('Email already in use');

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const newUser = await this.usersService.create({
            ...dto,
            password: hashedPassword,
        })

        if (!newUser) throw new ConflictException('Error in register');
        
        return this.login(dto, res, req);
    }

    async login(dto: LoginDto, res: Response, req: Request) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

        const sessions = await this.sessionRepo.find({
            where: { user: { id: user.id }, revoked: false },
            order: { loggedInAt: 'DESC' },
        });

        if (sessions.length >= 5) {
            await this.sessionRepo.update(sessions[0].id, {
                revoked: true,
            });
            console.log(sessions[0], 'revoked')
        }

        const payload = { sub: user.id };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

        // Create refresh token
        const rawRefreshToken = crypto.randomUUID();

        const refreshTokenHash = await bcrypt.hash(rawRefreshToken, 10);

        const session = this.sessionRepo.create({
            user,
            refreshTokenHash,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            device: this.parseDevice(req.headers['user-agent']),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            loggedInAt: new Date(),
            lastUsedAt: new Date(),
            revoked: false,
        });

        await this.sessionRepo.save(session);

        // ✅ Set access token cookie
        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        // ✅ Set refresh token cookie with session ID
        res.cookie('refresh_token', `${session.id}.${rawRefreshToken}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        return { message: 'Logged in successfully' };
        }


    async logout(req: Request, res: Response) {
        const token = req.cookies['refresh_token'];

        if (token) {
            const [sessionId] = token.split('.');
            if (sessionId) {
                await this.sessionRepo.update(sessionId, { revoked: true });
            }
        }

        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        
        return { message: 'Logged out successfully' };
    }

    async refresh(req: Request, res: Response) {
        const token = req.cookies['refresh_token'];
        if (!token) throw new UnauthorizedException('Refresh token missing');

        const [sessionId, rawToken] = token.split('.');
        // console.log(sessionId)
        // console.log(rawToken)
        if (!sessionId || !rawToken) {
            throw new UnauthorizedException('Malformed refresh token');
        }

        // Fetch session from DB
        const session = await this.sessionRepo.findOne({
            where: {
            id: sessionId,
            revoked: false,
            expiresAt: MoreThan(new Date()),

            },
            relations: ['user'],
        });

        if (!session || !(await bcrypt.compare(rawToken, session.refreshTokenHash))) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Generate new tokens
        const newAccessToken = this.jwtService.sign(
            { sub: session.user.id },
            { expiresIn: '15m' },
        );

        const newRawRefreshToken = crypto.randomUUID();
        const newRefreshTokenHash = await bcrypt.hash(newRawRefreshToken, 10);

        // Rotate the refresh token in the DB
        session.refreshTokenHash = newRefreshTokenHash;
        session.lastUsedAt = new Date();
        session.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await this.sessionRepo.save(session);

        // Set new cookies
        res.cookie('access_token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie('refresh_token', `${session.id}.${newRawRefreshToken}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        return { message: 'Token refreshed' };
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email);

        if (!user) throw new NotFoundException('User not found');

        const otp = Math.floor(100000 + Math.random() * 900000);

        // Setting the otp here
        await this.usersService.setOTP(user.id, otp);

        const transporter = nodeMailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });


        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP code',
            html: `Your verification code is: <b>${otp}</b>`
        })

        return { message: 'Your OTP sent to your email' };
    }

    async verifyOTP(dto: VerifyOTPDto) {
        const user = await this.usersService.findByEmail(dto.email);
        
        if (!user) throw new NotFoundException('User not found');

        if (user.otp !== dto.otp) throw new Error('OTP is not correct');

        user.changePassword = true;

        await this.usersService.setChangePassword(user.email);
        
        return { message: 'OTP verified' };
    }

    async changePassword(dto: ChangePasswordDto) {
        const user = await this.usersService.findByEmail(dto.email);

        if (!user) throw new NotFoundException('User not found');

        if (user.changePassword === false) throw new Error('Cannot change the password');

        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

        return await this.usersService.changePassword(user, hashedPassword);
    }
}
