import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const frontendUrl = config.get<string>('FRONTEND_URL') ?? 'http://localhost:4200';
  const corsOrigins = config.get<string>('CORS_ORIGINS');
  const originList = (corsOrigins ? corsOrigins.split(',') : [])
    .map((origin) => origin.trim())
    .filter((origin): origin is string => Boolean(origin));

  const uniqueOrigins = Array.from(new Set([...originList, frontendUrl])).filter(Boolean);

  app.enableCors({
    origin: uniqueOrigins,
    credentials: true,
  });

  // Capture raw body for webhook signature verification (controllers expect req.rawBody)
  app.use(bodyParser.json({ verify: (req: any, _res, buf) => { req.rawBody = buf; } }));
  app.use(bodyParser.urlencoded({ extended: true, verify: (req: any, _res, buf) => { req.rawBody = buf; } }));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT || 3000);
}

bootstrap();
