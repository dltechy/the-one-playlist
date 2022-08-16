import { Module } from '@nestjs/common';
import axios from 'axios';
import * as qs from 'qs';

import { axiosSymbol, qsSymbol } from '@app/helpers/imports/imports.helper';

import { SpotifyController } from './spotify.controller';
import { SpotifyService } from './spotify.service';

@Module({
  controllers: [SpotifyController],
  providers: [
    SpotifyService,
    {
      provide: axiosSymbol,
      useValue: axios,
    },
    {
      provide: qsSymbol,
      useValue: qs,
    },
  ],
})
export class SpotifyModule {}
