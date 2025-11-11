import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ConnectionsService } from './connections.service';

@Controller('connections')
export class ConnectionsController {
  constructor(private readonly svc: ConnectionsService) {}

  @Post('link/start')
  start(@Body() body: { userId: string; provider: 'plaid' | 'flinks' }) {
    return this.svc.startLink(body.userId, body.provider);
  }

  @Post('link/exchange')
  exchange(@Body() body: { userId: string; provider: 'plaid' | 'flinks'; publicToken: string }) {
    return this.svc.exchangePublicToken(body.userId, body.provider, body.publicToken);
  }

  @Get()
  list(@Query('userId') userId: string) {
    // Minimal list for scaffold
    return this.svc['prisma'].connection.findMany({ where: { userId } });
  }
}
