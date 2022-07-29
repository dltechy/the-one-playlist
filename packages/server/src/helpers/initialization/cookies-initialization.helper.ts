import { INestApplication } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

export function initializeCookies(app: INestApplication): void {
  app.use(cookieParser());
}
