import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ConnectionsService } from './connections.service';

@Controller('connections')
export class ConnectionsController {
  constructor(private readonly svc: ConnectionsService) {}

  @Post('link/start')
  start(@Body() body: { userId: string }) {
    return this.svc.startLink(body.userId);
  }

  @Post('link/exchange')
  exchange(@Body() body: { userId: string; publicToken: string }) {
    return this.svc.exchangePublicToken(body.userId, body.publicToken);
  }

  @Get()
  list(@Query('userId') userId: string) {
    return this.svc['prisma'].connection.findMany({ where: { userId } });
  }
}
