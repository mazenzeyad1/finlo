import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
declare const JwtStrategy_base: new (...args: any[]) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: JwtPayload): Promise<{
        userId: string;
        sessionId: string;
    }>;
}
export {};
