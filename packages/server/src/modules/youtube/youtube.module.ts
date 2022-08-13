import { Module } from '@nestjs/common';
import axios from 'axios';

import { axiosSymbol } from '@app/helpers/imports/imports.helper';

import { YouTubeController } from './youtube.controller';
import { YouTubeService } from './youtube.service';

@Module({
  controllers: [YouTubeController],
  providers: [
    YouTubeService,
    {
      provide: axiosSymbol,
      useValue: axios,
    },
  ],
})
export class YouTubeModule {}
