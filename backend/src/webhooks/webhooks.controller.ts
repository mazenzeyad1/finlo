import { Body, Controller, Headers, Post, Req, UnauthorizedException } from '@nestjs/common';
import { FlinksAdapter } from '../providers/flinks/flinks.adapter';

@Controller('webhooks')
export class WebhooksController {
  constructor(private flinks: FlinksAdapter) {}

  @Post('provider/flinks')
  handle(@Headers('x-signature') sig: string, @Req() req: any, @Body() _body: any) {
    const ok = this.flinks.verifyWebhook(sig, req.rawBody);
    if (!ok) throw new UnauthorizedException();
    return { received: true };
  }
}
