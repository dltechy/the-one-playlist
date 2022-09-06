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

  describe('setKeys', () => {
    it('should call the "setKeys" service method', () => {
      controller.setKeys(
        {
          clientId: spotifySample1.clientId,
          clientSecret: spotifySample1.clientSecret,
        },
        resMock as {} as Response,
      );

      expect(spotifyServiceMock.setKeys).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should redirect to spotify login page', () => {
      spotifyServiceMock.login.mockReturnValue('');

      controller.login(reqMock as {} as Request, resMock as {} as Response);

      expect(resMock.redirect).toHaveBeenCalled();
    });
  });

  describe('loginCallback', () => {
    it('should redirect to login complete page', async () => {
      const { webBaseUrl } = configService.get<AppConfig>('app');

      spotifyServiceMock.loginCallback.mockResolvedValue(spotifySample1.tokens);

      await controller.loginCallback(
        { code: spotifySample1.code },
        reqMock as {} as Request,
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

  describe('getPlaylist', () => {
    it('should return playlist', async () => {
      spotifyServiceMock.getPlaylist.mockResolvedValue(spotifySample1.playlist);

      const playlist = await controller.getPlaylist(
        {
          id: spotifySample1.playlistId,
        },
        reqMock as {} as Request,
        resMock as {} as Response,
      );

      expect(playlist).toEqual(spotifySample1.playlist);
    });
  });

  describe('getAlbum', () => {
    it('should return album', async () => {
      spotifyServiceMock.getAlbum.mockResolvedValue(spotifySample1.album);

      const album = await controller.getAlbum(
        {
          id: spotifySample1.albumId,
        },
        reqMock as {} as Request,
        resMock as {} as Response,
      );

      expect(album).toEqual(spotifySample1.album);
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

  describe('getAlbumTracks', () => {
    it('should return tracks', async () => {
      spotifyServiceMock.getAlbumTracks.mockResolvedValue(
        spotifySample1.tracks,
      );

      const tracks = await controller.getAlbumTracks(
        {
          id: spotifySample1.albumId,
        },
        reqMock as {} as Request,
        resMock as {} as Response,
      );

      expect(tracks).toEqual(spotifySample1.tracks);
    });
  });

  describe('getTracks', () => {
    it('should return tracks', async () => {
      spotifyServiceMock.getTracks.mockResolvedValue(
        spotifySample1.tracks.tracks,
      );

      const tracks = await controller.getTracks(
        {
          trackIds: spotifySample1.tracks.trackIds,
        },
        reqMock as {} as Request,
        resMock as {} as Response,
      );

      expect(tracks).toEqual(spotifySample1.tracks.tracks);
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
