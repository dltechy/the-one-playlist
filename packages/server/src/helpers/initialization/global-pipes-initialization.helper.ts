import { INestApplication, ValidationPipe } from '@nestjs/common';

export function initializeGlobalPipes(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
}
