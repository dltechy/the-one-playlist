import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

import { AppConfig } from '@app/config/app.config';
import { Environment } from '@app/config/config.validation';

export function initializeSwagger(app: INestApplication): void {
  const configService = app.get(ConfigService);

  const { nodeEnv, name, baseUrl } = configService.get<AppConfig>('app');

  const rootPath = path.join(__dirname, '..', '..', '..');
  const packageJson = fs.readFileSync(
    path.join(rootPath, 'package.json'),
    'utf8',
  );
  const { version } = JSON.parse(packageJson);

  if (nodeEnv === Environment.Development) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(name ?? '')
      .setVersion(version)
      .addServer(baseUrl)
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }
}
