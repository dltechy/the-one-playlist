import { DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validate } from '@app/config/config.validation';

export function getConfigImport(): DynamicModule {
  return ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env.test',
    validate,
  });
}
