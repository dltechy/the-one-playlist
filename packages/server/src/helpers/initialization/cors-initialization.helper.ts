import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppConfig } from '@app/config/app.config';

export function initializeCors(app: INestApplication): void {
  const configService = app.get(ConfigService);

  const { corsOrigin } = configService.get<AppConfig>('app');

  if (corsOrigin) {
    app.enableCors({
      origin: corsOrigin,
      credentials: true,
    });
  }
}
