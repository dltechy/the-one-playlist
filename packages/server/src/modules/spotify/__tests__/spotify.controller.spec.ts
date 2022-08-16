import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';

import { AppConfig } from '@app/config/app.config';
import { getConfigImport } from '@app/helpers/__tests__/imports/config-imports.helper';
import { reqMock, resMock } from '@app/helpers/__tests__/mocks/express.mocks';

import { SpotifyController } from '../spotify.controller';
import { SpotifyService } from '../spotify.service';
import { spotifyServiceMock } from './mocks/spotify.mocks';
import { spotifySamples } from './samples/spotify.samples';

describe('SpotifyController', () => {
  // Properties & methods

  let controller: SpotifyController;

  let configService: ConfigService;

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

    controller = module.get(SpotifyController);

    configService = module.get(ConfigService);

    return module;
  };

  // Before/after methods

  beforeAll(async () => {
    await initializeModule();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // Tests

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should redirect to spotify login page', () => {
      spotifyServiceMock.login.mockReturnValue('');

      controller.login(resMock as {} as Response);

      expect(resMock.redirect).toHaveBeenCalled();
    });
  });

  describe('loginCallback', () => {
    it('should redirect to login complete page', async () => {
      const { webBaseUrl } = configService.get<AppConfig>('app');

      spotifyServiceMock.loginCallback.mockResolvedValue(spotifySample1.tokens);

      await controller.loginCallback(
        { code: spotifySample1.code },
        resMock as {} as Response,
      );

      expect(resMock.redirect).toHaveBeenCalledWith(`${webBaseUrl}/close`);
    });
  });

  describe('token', () => {
    it('should call "token" service method', async () => {
      await controller.token(
        reqMock as {} as Request,
        resMock as {} as Response,
      );

      expect(spotifyServiceMock.token).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should call "logout" service method', async () => {
      await controller.logout(resMock as {} as Response);

      expect(spotifyServiceMock.logout).toHaveBeenCalled();
    });
  });

  describe('getPlaylistTracks', () => {
    it('should return tracks', async () => {
      spotifyServiceMock.getPlaylistTracks.mockResolvedValue(
        spotifySample1.tracks,
      );

      const tracks = await controller.getPlaylistTracks(
        {
          id: spotifySample1.playlistId,
        },
        reqMock as {} as Request,
        resMock as {} as Response,
      );

      expect(tracks).toEqual(spotifySample1.tracks);
    });
  });

  describe('playTrack', () => {
    it('should play track', async () => {
      await controller.playTrack(
        { id: spotifySample1.tracks.trackIds[0] },
        { deviceId: spotifySample1.deviceId },
        reqMock as {} as Request,
        resMock as {} as Response,
      );

      expect(spotifyServiceMock.playTrack).toHaveBeenCalled();
    });
  });
});
