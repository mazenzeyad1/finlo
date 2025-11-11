import { Body, Controller, Headers, Param, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ProviderRegistry } from '../providers/registry';

@Controller('webhooks')
export class WebhooksController {
  constructor(private providers: ProviderRegistry) {}

  @Post('provider/:name')
  handle(@Param('name') name: 'plaid'|'flinks', @Headers('x-signature') sig: string, @Req() req: any, @Body() _body: any) {
    const ok = this.providers.byProvider(name).verifyWebhook(sig, req.rawBody);
    if (!ok) throw new UnauthorizedException();
    // TODO: enqueue sync job using info from payload
    return { received: true };
  }
}
