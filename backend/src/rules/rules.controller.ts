import { Controller, Get } from '@nestjs/common';
import { RulesService } from './rules.service';

@Controller('rules')
export class RulesController {
  constructor(private readonly svc: RulesService) {}
  @Get('ping')
  ping() { return { ok: true }; }
}
