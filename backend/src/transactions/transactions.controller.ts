import { Controller, Get, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { QueryTransactionsDto } from './dto/query-transactions.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly svc: TransactionsService) {}
  @Get()
  search(@Query('userId') userId: string, @Query() q: QueryTransactionsDto) {
    return this.svc.search(userId, q);
  }
}
