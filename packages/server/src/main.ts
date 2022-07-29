import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';
import { initializeCookies } from './helpers/initialization/cookies-initialization.helper';
import { initializeCors } from './helpers/initialization/cors-initialization.helper';
import { initializeGlobalPipes } from './helpers/initialization/global-pipes-initialization.helper';
import { initializeSwagger } from './helpers/initialization/swagger-initialization.helper';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const { port } = configService.get<AppConfig>('app');

  initializeCors(app);
  initializeCookies(app);
  initializeGlobalPipes(app);
  initializeSwagger(app);

  await app.listen(port);
}
bootstrap();
