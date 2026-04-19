import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const storageRoot = join(process.cwd(), 'storage');
  const vehiculesStorage = join(storageRoot, 'vehicules');
  const agencesStorage = join(storageRoot, 'agences');

  if (!existsSync(storageRoot)) {
    mkdirSync(storageRoot, { recursive: true });
  }

  if (!existsSync(vehiculesStorage)) {
    mkdirSync(vehiculesStorage, { recursive: true });
  }

  if (!existsSync(agencesStorage)) {
    mkdirSync(agencesStorage, { recursive: true });
  }

  app.useStaticAssets(storageRoot, {
    prefix: '/storage/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();