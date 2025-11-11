import { PrismaService } from '../common/prisma.service';
export declare class RulesService {
    private prisma;
    constructor(prisma: PrismaService);
    applyRulesToDescription(desc: string): {
        categoryId?: string;
        noteAppend?: string;
    };
}
