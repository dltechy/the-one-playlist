import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { HttpMethod } from '@app/constants/http-request.constants';
import { getConfigImport } from '@app/helpers/__tests__/imports/config-imports.helper';
import { createBodyValidationTests } from '@app/helpers/__tests__/validation/body-validation.helper';
import { createParamsValidationTests } from '@app/helpers/__tests__/validation/params-validation.helper';
import { createQueryValidationTests } from '@app/helpers/__tests__/validation/query-validation.helper';
import { initializeCookies } from '@app/helpers/initialization/cookies-initialization.helper';
import { initializeGlobalPipes } from '@app/helpers/initialization/global-pipes-initialization.helper';

import { SpotifyController } from '../spotify.controller';
import { SpotifyService } from '../spotify.service';
import { spotifyServiceMock } from './mocks/spotify.mocks';
import { spotifySamples } from './samples/spotify.samples';

describe('SpotifyController (validation)', () => {
  // Properties & methods

  let app: INestApplication;

  const [spotifySample1] = spotifySamples;

  const initializeModule = async (): Promise<TestingModule> => {
    const module = await Test.createTestingModule({
      imports: [getConfigImport()],
      controllers: [SpotifyController],
      providers: [
        {
          provide: SpotifyService,
          useValue: spotifyServiceMock,
        },
      ],
    }).compile();

    return module;
  };

  const initializeApp = async (module: TestingModule): Promise<void> => {
    app = module.createNestApplication(undefined, {
      logger: false,
    });

    initializeCookies(app);
    initializeGlobalPipes(app);

    await app.init();
  };

  // Before/after methods

  beforeAll(async () => {
    const module = await initializeModule();
    await initializeApp(module);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // Tests

  describe('setKeys', () => {
    const requiredBody = {
      clientId: spotifySample1.clientId,
      clientSecret: spotifySample1.clientSecret,
    };

    createBodyValidationTests({
      appGetter: () => app,
      requiredBody,
      httpMethod: HttpMethod.Post,
      path: '/spotify/auth/keys/set',
      expectedSuccessStatusCode: 200,
      propertyTestValues: [
        {
          property: 'clientId',
          successValues: ['string', ''],
          failValues: [],
        },
        {
          property: 'clientSecret',
          successValues: ['string', ''],
          failValues: [],
        },
      ],
    });
  });

  describe('loginCallback', () => {
    const requiredQuery = {};

    createQueryValidationTests({
      appGetter: () => app,
      requiredQuery,
      httpMethod: HttpMethod.Get,
      path: '/spotify/auth/login-callback',
      expectedSuccessStatusCode: 302,
      propertyTestValues: [
        {
          property: 'code',
          successValues: ['string'],
          failValues: [''],
        },
      ],
    });
  });

  describe('getPlaylist', () => {
    const requiredParams = {
      id: spotifySample1.playlistId,
    };

    createParamsValidationTests({
      appGetter: () => app,
      requiredParams,
      httpMethod: HttpMethod.Get,
      path: '/spotify/playlists/:id',
      expectedSuccessStatusCode: 200,
      propertyTestValues: [
        {
          property: 'id',
          successValues: ['string'],
          failValues: [],
        },
      ],
    });
  });

  describe('getAlbum', () => {
    const requiredParams = {
      id: spotifySample1.albumId,
    };

    createParamsValidationTests({
      appGetter: () => app,
      requiredParams,
      httpMethod: HttpMethod.Get,
      path: '/spotify/albums/:id',
      expectedSuccessStatusCode: 200,
      propertyTestValues: [
        {
          property: 'id',
          successValues: ['string'],
          failValues: [],
        },
      ],
    });
  });

  describe('getPlaylistTracks', () => {
    const requiredParams = {
      id: spotifySample1.playlistId,
    };

    createParamsValidationTests({
      appGetter: () => app,
      beforeEach: () => {
        spotifyServiceMock.getPlaylistTracks.mockResolvedValue(
          spotifySample1.tracks,
        );
      },
      requiredParams,
      httpMethod: HttpMethod.Get,
      path: '/spotify/playlists/:id/tracks',
      expectedSuccessStatusCode: 200,
      propertyTestValues: [
        {
          property: 'id',
          successValues: ['string'],
          failValues: [],
        },
      ],
    });
  });

  describe('getAlbumTracks', () => {
    const requiredParams = {
      id: spotifySample1.albumId,
    };

    createParamsValidationTests({
      appGetter: () => app,
      beforeEach: () => {
        spotifyServiceMock.getAlbumTracks.mockResolvedValue(
          spotifySample1.tracks,
        );
      },
      requiredParams,
      httpMethod: HttpMethod.Get,
      path: '/spotify/albums/:id/tracks',
      expectedSuccessStatusCode: 200,
      propertyTestValues: [
        {
          property: 'id',
          successValues: ['string'],
          failValues: [],
        },
      ],
    });
  });

  describe('getTracks', () => {
    createQueryValidationTests({
      appGetter: () => app,
      httpMethod: HttpMethod.Get,
      path: '/spotify/tracks',
      expectedSuccessStatusCode: 200,
      propertyTestValues: [
        {
          property: 'trackIds',
          successValues: ['string', ['string'], ['string1', 'string2']],
          failValues: ['', [''], ['string1', '']],
        },
      ],
    });
  });

  describe('playTrack', () => {
    const requiredParams = {
      id: spotifySample1.tracks.trackIds[0],
    };
    const requiredBody = {
      deviceId: spotifySample1.deviceId,
    };

    createParamsValidationTests({
      appGetter: () => app,
      requiredParams,
      requiredBody,
      httpMethod: HttpMethod.Post,
      path: '/spotify/tracks/:id/play',
      expectedSuccessStatusCode: 200,
      propertyTestValues: [
        {
          property: 'id',
          successValues: ['string'],
          failValues: [],
        },
      ],
    });

    createBodyValidationTests({
      appGetter: () => app,
      requiredBody,
      httpMethod: HttpMethod.Post,
      path: `/spotify/tracks/${spotifySample1.tracks.trackIds[0]}/play`,
      expectedSuccessStatusCode: 200,
      propertyTestValues: [
        {
          property: 'deviceId',
          successValues: ['string'],
          failValues: [''],
        },
      ],
    });
  });
});
