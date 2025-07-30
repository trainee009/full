import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => {
                    return req?.cookies?.access_token
                }
            ]),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'test',
        })
    }

    async validate(payload: any) {
        return { userId: payload.sub, email: payload.email };
    }
}