import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { getConfigImport } from '@app/helpers/__tests__/imports/config-imports.helper';
import { initializeCookies } from '@app/helpers/initialization/cookies-initialization.helper';

import { SpotifyController } from '../spotify.controller';
import { SpotifyService } from '../spotify.service';
import { spotifyServiceMock } from './mocks/spotify.mocks';
import { spotifySamples } from './samples/spotify.samples';

describe('SpotifyController (routes)', () => {
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

  it('should connect to "GET /spotify/auth/login"', async () => {
    spotifyServiceMock.login.mockReturnValue('');

    await request(app.getHttpServer()).get('/spotify/auth/login');

    expect(spotifyServiceMock.login).toHaveBeenCalled();
  });

  it('should connect to "GET /spotify/auth/login-callback"', async () => {
    await request(app.getHttpServer()).get('/spotify/auth/login-callback');

    expect(spotifyServiceMock.loginCallback).toHaveBeenCalled();
  });

  it('should connect to "POST /spotify/auth/token"', async () => {
    await request(app.getHttpServer()).post('/spotify/auth/token');

    expect(spotifyServiceMock.token).toHaveBeenCalled();
  });

  it('should connect to "POST /spotify/auth/logout"', async () => {
    await request(app.getHttpServer()).post('/spotify/auth/logout');

    expect(spotifyServiceMock.logout).toHaveBeenCalled();
  });

  it('should connect to "GET /spotify/playlists/:id"', async () => {
    await request(app.getHttpServer()).get(
      `/spotify/playlists/${spotifySample1.playlistId}`,
    );

    expect(spotifyServiceMock.getPlaylist).toHaveBeenCalled();
  });

  it('should connect to "GET /spotify/playlists/:id/tracks"', async () => {
    spotifyServiceMock.getPlaylistTracks.mockResolvedValue(
      spotifySample1.tracks,
    );

    await request(app.getHttpServer()).get(
      `/spotify/playlists/${spotifySample1.playlistId}/tracks`,
    );

    expect(spotifyServiceMock.getPlaylistTracks).toHaveBeenCalled();
  });

  it('should connect to "POST /spotify/tracks/:id/play"', async () => {
    await request(app.getHttpServer())
      .post(`/spotify/tracks/${spotifySample1.tracks.trackIds[0]}/play`)
      .send({
        deviceId: spotifySample1.deviceId,
      });

    expect(spotifyServiceMock.playTrack).toHaveBeenCalled();
  });
});
