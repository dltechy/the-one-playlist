import { plainToClass } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

import { AppConfig } from './app.config';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  public NODE_ENV: Environment;

  @IsInt()
  public PORT: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public APP_NAME?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public APP_CORS_ORIGIN?: string;

  @IsString()
  @IsNotEmpty()
  public APP_BASE_URL: string;
}

export function validate(config: Record<string, unknown>): {
  app: AppConfig;
} {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig);

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return {
    app: {
      nodeEnv: validatedConfig.NODE_ENV,
      port: validatedConfig.PORT,
      name: validatedConfig.APP_NAME,
      corsOrigin: validatedConfig.APP_CORS_ORIGIN,
      baseUrl: validatedConfig.APP_BASE_URL,
    },
  };
}
