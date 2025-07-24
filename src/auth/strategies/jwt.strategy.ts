import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req) => {
                    let token = null;
                    if (req && req.cookies) {
                        token = req.cookies['access_token'];
                    }
                    return token;
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