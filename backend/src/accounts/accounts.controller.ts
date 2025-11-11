import { Controller, Get, Query } from '@nestjs/common';
import { AccountsService } from './accounts.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly svc: AccountsService) {}
  @Get()
  list(@Query('userId') userId: string) {
    return this.svc.list(userId);
  }
}
