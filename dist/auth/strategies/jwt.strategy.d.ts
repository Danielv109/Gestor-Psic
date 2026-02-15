import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../token.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { Request } from 'express';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(req: Request, payload: JwtPayload): Promise<AuthenticatedUser>;
    private extractIp;
}
export {};
