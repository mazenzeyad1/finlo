import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class RulesService {
  constructor(private prisma: PrismaService) {}

  applyRulesToDescription(_desc: string): { categoryId?: string; noteAppend?: string } {
    // TODO: compile + apply user rules
    return {};
  }
}
