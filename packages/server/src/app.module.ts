import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validate } from './config/config.validation';
import { SpotifyModule } from './modules/spotify/spotify.module';
import { YouTubeModule } from './modules/youtube/youtube.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),

    YouTubeModule,
    SpotifyModule,
  ],
})
export class AppModule {}
