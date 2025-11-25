import { Body, Controller, Get, Post, Query, Param } from '@nestjs/common';
import { ConnectionsService } from './connections.service';

@Controller('connections')
export class ConnectionsController {
  constructor(private readonly svc: ConnectionsService) {}

  @Post('link/start')
  start(@Body() body: { userId: string }) {
    return this.svc.startLink(body.userId);
  }

  @Post('link/exchange')
  exchange(@Body() body: { userId: string; loginId: string }) {
    // Temporary debug log to verify we're receiving a real LoginId from the iframe
    // eslint-disable-next-line no-console
    console.log('[ConnectionsController] exchange loginId =', body?.loginId);
    return this.svc.exchangeLoginId(body.userId, body.loginId);
  }

  @Get()
  list(@Query('userId') userId: string) {
    return this.svc['prisma'].connection.findMany({ where: { userId } });
  }

  @Post(':id/sync')
  async sync(@Param('id') connectionId: string, @Query('userId') userId: string) {
    // Verify the connection belongs to the user
    const connection = await this.svc['prisma'].connection.findFirst({
      where: { id: connectionId, userId },
    });
    if (!connection) {
      throw new Error('Connection not found');
    }
    return this.svc.syncConnection(connectionId);
  }
}
