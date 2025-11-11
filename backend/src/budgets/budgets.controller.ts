import { Controller, Get, Query } from '@nestjs/common';
import { BudgetsService } from './budgets.service';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly svc: BudgetsService) {}
  @Get()
  list(@Query('userId') userId: string) { return this.svc.list(userId); }
}
