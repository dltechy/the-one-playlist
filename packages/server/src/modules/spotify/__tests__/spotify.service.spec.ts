import { HttpException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';

import { SpotifyConfig } from '@app/config/spotify.config';
import { createRethrowUnknownErrorAsyncTest } from '@app/helpers/__tests__/errors/error-tests.helper';
import { getConfigImport } from '@app/helpers/__tests__/imports/config-imports.helper';
import { axiosMock } from '@app/helpers/__tests__/mocks/axios.mocks';
import { reqMock, resMock } from '@app/helpers/__tests__/mocks/express.mocks';
import { qsMock } from '@app/helpers/__tests__/mocks/qs.mocks';
import { axiosSamples } from '@app/helpers/__tests__/samples/axios.samples';
import { axiosSymbol, qsSymbol } from '@app/helpers/imports/imports.helper';

import { SpotifyService } from '../spotify.service';
import { spotifySamples } from './samples/spotify.samples';

describe('SpotifyService', () => {
  // Properties & methods

  let service: SpotifyService;

  let configService: ConfigService;

  const [spotifySample1, spotifySample2, spotifySample3] = spotifySamples;

  const initializeModule = async (): Promise<TestingModule> => {
    const module = await Test.createTestingModule({
      imports: [getConfigImport()],
      providers: [
        SpotifyService,
        {
          provide: axiosSymbol,
          useValue: axiosMock,
        },
        {
          provide: qsSymbol,
          useValue: qsMock,
        },
      ],
    }).compile();

    service = module.get(SpotifyService);

    configService = module.get(ConfigService);

    return module;
  };

  // Before/after methods

  beforeAll(async () => {
    await initializeModule();
  });

  afterEach(() => {
    jest.resetAllMocks();
    reqMock.cookies = {};
  });

  // Tests

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setKeys', () => {
    it('should set client ID cookie', async () => {
      service.setKeys({
        clientId: spotifySample1.clientId,
        clientSecret: spotifySample1.clientSecret,
        res: resMock as {} as Response,
      });

      expect(resMock.cookie).toHaveBeenNthCalledWith(
        1,
        'spotifyClientId',
        spotifySample1.clientId,
      );
    });

    it('should set client secret cookie', async () => {
      service.setKeys({
        clientId: spotifySample1.clientId,
        clientSecret: spotifySample1.clientSecret,
        res: resMock as {} as Response,
      });

      expect(resMock.cookie).toHaveBeenNthCalledWith(
        2,
        'spotifyClientSecret',
        spotifySample1.clientSecret,
      );
    });

    it('should remove client ID cookie if user sent empty values', async () => {
      service.setKeys({
        clientId: '',
        clientSecret: '',
        res: resMock as {} as Response,
      });

      expect(resMock.clearCookie).toHaveBeenCalledWith('spotifyClientId');
    });

    it('should remove client secret cookie if user sent empty values', async () => {
      service.setKeys({
        clientId: '',
        clientSecret: '',
        res: resMock as {} as Response,
      });

      expect(resMock.clearCookie).toHaveBeenCalledWith('spotifyClientSecret');
    });
  });

  describe('login', () => {
    beforeEach(() => {
      reqMock.cookies = {};
    });

    it('should use default client ID if custom does not exist', () => {
      const authQueryParameters = service.login({
        req: reqMock as {} as Request,
      });

      const { clientId } = configService.get<SpotifyConfig>('spotify');

      expect(authQueryParameters).toMatch(new RegExp(`client_id=${clientId}`));
    });

    it('should use custom client ID if it exists', () => {
      reqMock.cookies = {
        spotifyClientId: spotifySample1.clientId,
        spotifyClientSecret: spotifySample1.clientSecret,
      };

      const authQueryParameters = service.login({
        req: reqMock as {} as Request,
      });

      expect(authQueryParameters).toMatch(
        new RegExp(`client_id=${spotifySample1.clientId}`),
      );
    });

    it('should include response_type in output', () => {
      const authQueryParameters = service.login({
        req: reqMock as {} as Request,
      });

      expect(authQueryParameters).toMatch(/(^|[^&]*)response_type=code(&|$)/);
    });

    it('should include client_id in output', () => {
      const authQueryParameters = service.login({
        req: reqMock as {} as Request,
      });

      expect(authQueryParameters).toMatch(/(^|[^&]*)client_id=[^&]+(&|$)/);
    });

    it('should include scope in output', () => {
      const authQueryParameters = service.login({
        req: reqMock as {} as Request,
      });

      expect(authQueryParameters).toMatch(/(^|[^&]*)scope=[^&]+(&|$)/);
    });

    it('should include redirect_uri in output', () => {
      const authQueryParameters = service.login({
        req: reqMock as {} as Request,
      });

      expect(authQueryParameters).toMatch(/(^|[^&]*)redirect_uri=[^&]+(&|$)/);
    });

    it('should include state in output', () => {
      const authQueryParameters = service.login({
        req: reqMock as {} as Request,
      });

      expect(authQueryParameters).toMatch(/(^|[^&]*)state=[^&]+(&|$)/);
    });
  });

  describe('loginCallback', () => {
    beforeEach(() => {
      reqMock.cookies = {};
      qsMock.stringify.mockReturnValue('');
    });

    it('should use default client ID and secret if custom does not exist', () => {
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample1.spotifyTokens,
      });

      service.loginCallback({
        code: spotifySample1.code,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      const { clientId, clientSecret } =
        configService.get<SpotifyConfig>('spotify');

      expect(axiosMock.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Authorization: `Basic ${Buffer.from(
              `${clientId}:${clientSecret}`,
            ).toString('base64')}`,
          }),
        }),
      );
    });

    it('should use custom client ID and secret if it exists', () => {
      reqMock.cookies = {
        spotifyClientId: spotifySample1.clientId,
        spotifyClientSecret: spotifySample1.clientSecret,
      };
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample1.spotifyTokens,
      });

      service.loginCallback({
        code: spotifySample1.code,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(axiosMock.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Authorization: `Basic ${Buffer.from(
              `${spotifySample1.clientId}:${spotifySample1.clientSecret}`,
            ).toString('base64')}`,
          }),
        }),
      );
    });

    it('should set access token cookie with expiry', async () => {
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample1.spotifyTokens,
      });

      await service.loginCallback({
        code: spotifySample1.code,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(resMock.cookie).toHaveBeenNthCalledWith(
        1,
        'spotifyAccessToken',
        spotifySample1.tokens.accessToken,
        { expires: expect.any(Date) },
      );
    });

    it('should set refresh token cookie', async () => {
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample1.spotifyTokens,
      });

      await service.loginCallback({
        code: spotifySample1.code,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(resMock.cookie).toHaveBeenNthCalledWith(
        2,
        'spotifyRefreshToken',
        spotifySample1.tokens.refreshToken,
      );
    });

    it('should return tokens if spotify request succeeded', async () => {
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample1.spotifyTokens,
      });

      const output = await service.loginCallback({
        code: spotifySample1.code,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(output).toEqual({
        ...spotifySample1.tokens,
        accessTokenExpiry: expect.any(Date),
      });
    });

    it('should throw error if spotify request failed', async () => {
      axiosMock.post.mockResolvedValue(axiosSamples.errorResponse);

      await expect(
        service.loginCallback({
          code: spotifySample1.code,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
      ).rejects.toBeInstanceOf(HttpException);
    });

    it('should return axios error', async () => {
      axiosMock.post.mockRejectedValue(axiosSamples.error);

      await expect(
        service.loginCallback({
          code: spotifySample1.code,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
      ).rejects.toBeInstanceOf(HttpException);
    });

    it('should remove access token cookie if spotify request returned unauthorized error', async () => {
      axiosMock.post.mockResolvedValue(axiosSamples.unauthorizedResponse);

      try {
        await service.loginCallback({
          code: spotifySample1.code,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        });
      } catch {
        // Do nothing
      }

      expect(resMock.clearCookie).toHaveBeenCalledWith('spotifyAccessToken');
    });

    it('should remove refresh token cookie if spotify request returned unauthorized error', async () => {
      axiosMock.post.mockResolvedValue(axiosSamples.unauthorizedResponse);

      try {
        await service.loginCallback({
          code: spotifySample1.code,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        });
      } catch {
        // Do nothing
      }

      expect(resMock.clearCookie).toHaveBeenCalledWith('spotifyRefreshToken');
    });

    it('should remove access token cookie if spotify request threw unauthorized error', async () => {
      axiosMock.post.mockRejectedValue(axiosSamples.unauthorizedError);

      try {
        await service.loginCallback({
          code: spotifySample1.code,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        });
      } catch {
        // Do nothing
      }

      expect(resMock.clearCookie).toHaveBeenCalledWith('spotifyAccessToken');
    });

    it('should remove refresh token cookie if spotify request threw unauthorized error', async () => {
      axiosMock.post.mockRejectedValue(axiosSamples.unauthorizedError);

      try {
        await service.loginCallback({
          code: spotifySample1.code,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        });
      } catch {
        // Do nothing
      }

      expect(resMock.clearCookie).toHaveBeenCalledWith('spotifyRefreshToken');
    });

    createRethrowUnknownErrorAsyncTest({
      mockedObjectGetter: () => axiosMock,
      mockedMethod: 'post',
      testedPromiseGetter: () =>
        service.loginCallback({
          code: spotifySample1.code,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
    });
  });

  describe('token', () => {
    beforeEach(() => {
      reqMock.cookies = {};
      qsMock.stringify.mockReturnValue('');
    });

    it('should use default client ID and secret if custom does not exist', async () => {
      reqMock.cookies = {
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample2.spotifyTokens,
      });

      await service.token({
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      const { clientId, clientSecret } =
        configService.get<SpotifyConfig>('spotify');

      expect(axiosMock.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Authorization: `Basic ${Buffer.from(
              `${clientId}:${clientSecret}`,
            ).toString('base64')}`,
          }),
        }),
      );
    });

    it('should use custom client ID and secret if it exists', async () => {
      reqMock.cookies = {
        spotifyClientId: spotifySample1.clientId,
        spotifyClientSecret: spotifySample1.clientSecret,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample2.spotifyTokens,
      });

      await service.token({
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(axiosMock.post).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Authorization: `Basic ${Buffer.from(
              `${spotifySample1.clientId}:${spotifySample1.clientSecret}`,
            ).toString('base64')}`,
          }),
        }),
      );
    });

    it('should set access token cookie with expiry', async () => {
      reqMock.cookies = {
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample2.spotifyTokens,
      });

      await service.token({
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(resMock.cookie).toHaveBeenNthCalledWith(
        1,
        'spotifyAccessToken',
        spotifySample2.tokens.accessToken,
        {
          expires: expect.any(Date),
        },
      );
    });

    it('should set refresh token cookie', async () => {
      reqMock.cookies = {
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample2.spotifyTokens,
      });

      await service.token({
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(resMock.cookie).toHaveBeenNthCalledWith(
        2,
        'spotifyRefreshToken',
        spotifySample2.tokens.refreshToken,
      );
    });

    it('should return tokens if spotify request succeeded', async () => {
      reqMock.cookies = {
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample2.spotifyTokens,
      });

      const output = await service.token({
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(output).toEqual({
        ...spotifySample2.tokens,
        accessTokenExpiry: expect.any(Date),
      });
    });

    it('should return current refresh token if spotify response did not include a new one', async () => {
      reqMock.cookies = {
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: {
          ...spotifySample2.spotifyTokens,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          refresh_token: undefined,
        },
      });

      const output = await service.token({
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(output).toEqual({
        ...spotifySample2.tokens,
        refreshToken: spotifySample1.tokens.refreshToken,
        accessTokenExpiry: expect.any(Date),
      });
    });

    it('should fail if refresh token does not exist', async () => {
      await expect(
        service.token({
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw error if spotify request failed', async () => {
      axiosMock.post.mockResolvedValue(axiosSamples.errorResponse);

      await expect(
        service.token({
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
      ).rejects.toBeInstanceOf(HttpException);
    });

    it('should return axios error', async () => {
      axiosMock.post.mockRejectedValue(axiosSamples.error);

      await expect(
        service.token({
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
      ).rejects.toBeInstanceOf(HttpException);
    });

    it('should remove access token cookie if refresh token does not exist', async () => {
      try {
        await service.token({
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        });
      } catch {
        // Do nothing
      }

      expect(resMock.clearCookie).toHaveBeenCalledWith('spotifyAccessToken');
    });

    it('should remove refresh token cookie if refresh token does not exist', async () => {
      try {
        await service.token({
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        });
      } catch {
        // Do nothing
      }

      expect(resMock.clearCookie).toHaveBeenCalledWith('spotifyRefreshToken');
    });

    it('should remove access token cookie if spotify request returned unauthorized error', async () => {
      reqMock.cookies = {
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue(axiosSamples.unauthorizedResponse);

      try {
        await service.token({
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        });
      } catch {
        // Do nothing
      }

      expect(resMock.clearCookie).toHaveBeenCalledWith('spotifyAccessToken');
    });

    it('should remove refresh token cookie if spotify request returned unauthorized error', async () => {
      reqMock.cookies = {
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue(axiosSamples.unauthorizedResponse);

      try {
        await service.token({
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        });
      } catch {
        // Do nothing
      }

      expect(resMock.clearCookie).toHaveBeenCalledWith('spotifyRefreshToken');
    });

    it('should remove access token cookie if spotify request threw unauthorized error', async () => {
      reqMock.cookies = {
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockRejectedValue(axiosSamples.unauthorizedError);

      try {
        await service.token({
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        });
      } catch {
        // Do nothing
      }

      expect(resMock.clearCookie).toHaveBeenCalledWith('spotifyAccessToken');
    });

    it('should remove refresh token cookie if spotify request threw unauthorized error', async () => {
      reqMock.cookies = {
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockRejectedValue(axiosSamples.unauthorizedError);

      try {
        await service.token({
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        });
      } catch {
        // Do nothing
      }

      expect(resMock.clearCookie).toHaveBeenCalledWith('spotifyRefreshToken');
    });

    createRethrowUnknownErrorAsyncTest({
      beforeEach: () => {
        reqMock.cookies = {
          spotifyRefreshToken: spotifySample1.tokens.refreshToken,
        };
      },
      mockedObjectGetter: () => axiosMock,
      mockedMethod: 'post',
      testedPromiseGetter: () =>
        service.token({
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
    });
  });
  describe('token', () => {
    beforeEach(() => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
    });

    it('should remove access token cookie', async () => {
      await service.logout({
        res: resMock as {} as Response,
      });

      expect(resMock.clearCookie).toHaveBeenCalledWith('spotifyAccessToken');
    });

    it('should remove refresh token cookie', async () => {
      await service.logout({
        res: resMock as {} as Response,
      });

      expect(resMock.clearCookie).toHaveBeenCalledWith('spotifyRefreshToken');
    });
  });

  describe('getPlaylist', () => {
    it('should return playlist', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.get.mockResolvedValue(spotifySample1.playlistResponse);

      const playlist = await service.getPlaylist({
        playlistId: spotifySample1.playlistId,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(playlist).toEqual(spotifySample1.playlist);
    });

    it('should return playlist whose thumbnail has size of 0', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample3.tokens.accessToken,
        spotifyRefreshToken: spotifySample3.tokens.refreshToken,
      };
      axiosMock.get.mockResolvedValue(spotifySample3.playlistResponse);

      const playlist = await service.getPlaylist({
        playlistId: spotifySample3.playlistId,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(playlist).toEqual(spotifySample3.playlist);
    });

    it('should refresh tokens if access token is missing', async () => {
      reqMock.cookies = {
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample2.spotifyTokens,
      });
      axiosMock.get.mockResolvedValue(spotifySample1.playlistResponse);

      await service.getPlaylist({
        playlistId: spotifySample1.playlistId,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(axiosMock.get).toHaveBeenCalledWith(expect.any(String), {
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Authorization: `Bearer ${spotifySample2.tokens.accessToken}`,
        },
      });
    });

    it('should not refresh tokens if access token exists', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample2.spotifyTokens,
      });
      axiosMock.get.mockResolvedValue(spotifySample1.playlistResponse);

      await service.getPlaylist({
        playlistId: spotifySample1.playlistId,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(axiosMock.get).toHaveBeenCalledWith(expect.any(String), {
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Authorization: `Bearer ${spotifySample1.tokens.accessToken}`,
        },
      });
    });

    it('should throw error if cannot refresh token', async () => {
      await expect(
        service.getPlaylist({
          playlistId: spotifySample1.playlistId,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should return axios error', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.get.mockRejectedValue(axiosSamples.error);

      await expect(
        service.getPlaylist({
          playlistId: spotifySample1.playlistId,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
      ).rejects.toBeInstanceOf(HttpException);
    });

    createRethrowUnknownErrorAsyncTest({
      beforeEach: () => {
        reqMock.cookies = {
          spotifyAccessToken: spotifySample1.tokens.accessToken,
          spotifyRefreshToken: spotifySample1.tokens.refreshToken,
        };
      },
      mockedObjectGetter: () => axiosMock,
      mockedMethod: 'get',
      testedPromiseGetter: () =>
        service.getPlaylist({
          playlistId: spotifySample1.playlistId,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
    });
  });

  describe('getAlbum', () => {
    it('should return album', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.get.mockResolvedValue(spotifySample1.albumResponse);

      const album = await service.getAlbum({
        albumId: spotifySample1.albumId,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(album).toEqual(spotifySample1.album);
    });

    it('should return album whose thumbnail has size of 0', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample3.tokens.accessToken,
        spotifyRefreshToken: spotifySample3.tokens.refreshToken,
      };
      axiosMock.get.mockResolvedValue(spotifySample3.albumResponse);

      const album = await service.getAlbum({
        albumId: spotifySample3.albumId,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(album).toEqual(spotifySample3.album);
    });

    it('should refresh tokens if access token is missing', async () => {
      reqMock.cookies = {
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample2.spotifyTokens,
      });
      axiosMock.get.mockResolvedValue(spotifySample1.albumResponse);

      await service.getAlbum({
        albumId: spotifySample1.albumId,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(axiosMock.get).toHaveBeenCalledWith(expect.any(String), {
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Authorization: `Bearer ${spotifySample2.tokens.accessToken}`,
        },
      });
    });

    it('should not refresh tokens if access token exists', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample2.spotifyTokens,
      });
      axiosMock.get.mockResolvedValue(spotifySample1.albumResponse);

      await service.getAlbum({
        albumId: spotifySample1.albumId,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(axiosMock.get).toHaveBeenCalledWith(expect.any(String), {
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Authorization: `Bearer ${spotifySample1.tokens.accessToken}`,
        },
      });
    });

    it('should throw error if cannot refresh token', async () => {
      await expect(
        service.getAlbum({
          albumId: spotifySample1.albumId,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should return axios error', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.get.mockRejectedValue(axiosSamples.error);

      await expect(
        service.getAlbum({
          albumId: spotifySample1.albumId,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
      ).rejects.toBeInstanceOf(HttpException);
    });

    createRethrowUnknownErrorAsyncTest({
      beforeEach: () => {
        reqMock.cookies = {
          spotifyAccessToken: spotifySample1.tokens.accessToken,
          spotifyRefreshToken: spotifySample1.tokens.refreshToken,
        };
      },
      mockedObjectGetter: () => axiosMock,
      mockedMethod: 'get',
      testedPromiseGetter: () =>
        service.getAlbum({
          albumId: spotifySample1.albumId,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
    });
  });

  describe('getPlaylistTracks', () => {
    it('should return tracks', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.get.mockResolvedValue({
        data: {
          items: [
            ...spotifySample1.playlistTracksResponse.data.items,
            ...spotifySample2.playlistTracksResponse.data.items,
            ...spotifySample3.playlistTracksResponse.data.items,
          ],
        },
      });

      const tracks = await service.getPlaylistTracks({
        playlistId: spotifySample1.playlistId,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(tracks).toEqual({
        trackIds: [
          ...spotifySample1.tracks.trackIds,
          ...spotifySample2.tracks.trackIds,
          ...spotifySample3.tracks.trackIds,
        ],
        tracks: {
          ...spotifySample1.tracks.tracks,
          ...spotifySample2.tracks.tracks,
          ...spotifySample3.tracks.tracks,
        },
      });
    });

    it('should retrieve next group of tracks', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.get.mockResolvedValueOnce({
        data: {
          items: [
            ...spotifySample1.playlistTracksResponse.data.items,
            ...spotifySample2.playlistTracksResponse.data.items,
            ...spotifySample3.playlistTracksResponse.data.items,
          ],
          next: 'sampleNextUrl?sampleQuery',
        },
      });
      axiosMock.get.mockResolvedValue({
        data: {
          items: [
            ...spotifySample1.playlistTracksResponse.data.items,
            ...spotifySample2.playlistTracksResponse.data.items,
            ...spotifySample3.playlistTracksResponse.data.items,
          ],
        },
      });

      await service.getPlaylistTracks({
        playlistId: spotifySample1.playlistId,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(axiosMock.get).toHaveBeenCalledTimes(2);
    });

    it('should refresh tokens if access token is missing', async () => {
      reqMock.cookies = {
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample2.spotifyTokens,
      });
      axiosMock.get.mockResolvedValue(spotifySample1.playlistTracksResponse);

      await service.getPlaylistTracks({
        playlistId: spotifySample1.playlistId,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(axiosMock.get).toHaveBeenCalledWith(expect.any(String), {
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Authorization: `Bearer ${spotifySample2.tokens.accessToken}`,
        },
      });
    });

    it('should not refresh tokens if access token exists', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample2.spotifyTokens,
      });
      axiosMock.get.mockResolvedValue(spotifySample1.playlistTracksResponse);

      await service.getPlaylistTracks({
        playlistId: spotifySample1.playlistId,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(axiosMock.get).toHaveBeenCalledWith(expect.any(String), {
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Authorization: `Bearer ${spotifySample1.tokens.accessToken}`,
        },
      });
    });

    it('should throw error if cannot refresh token', async () => {
      await expect(
        service.getPlaylistTracks({
          playlistId: spotifySample1.playlistId,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should return axios error', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.get.mockRejectedValue(axiosSamples.error);

      await expect(
        service.getPlaylistTracks({
          playlistId: spotifySample1.playlistId,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
      ).rejects.toBeInstanceOf(HttpException);
    });

    createRethrowUnknownErrorAsyncTest({
      beforeEach: () => {
        reqMock.cookies = {
          spotifyAccessToken: spotifySample1.tokens.accessToken,
          spotifyRefreshToken: spotifySample1.tokens.refreshToken,
        };
      },
      mockedObjectGetter: () => axiosMock,
      mockedMethod: 'get',
      testedPromiseGetter: () =>
        service.getPlaylistTracks({
          playlistId: spotifySample1.playlistId,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
    });
  });

  describe('getAlbumTracks', () => {
    it('should return tracks', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.get.mockResolvedValue({
        data: {
          items: [
            ...spotifySample1.albumTracksResponse.data.items,
            ...spotifySample2.albumTracksResponse.data.items,
            ...spotifySample3.albumTracksResponse.data.items,
          ],
        },
      });

      const tracks = await service.getAlbumTracks({
        albumId: spotifySample1.albumId,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(tracks).toEqual({
        trackIds: [
          ...spotifySample1.albumTracks.trackIds,
          ...spotifySample2.albumTracks.trackIds,
          ...spotifySample3.albumTracks.trackIds,
        ],
        tracks: {
          ...spotifySample1.albumTracks.tracks,
          ...spotifySample2.albumTracks.tracks,
          ...spotifySample3.albumTracks.tracks,
        },
      });
    });

    it('should retrieve next group of tracks', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.get.mockResolvedValueOnce({
        data: {
          items: [
            ...spotifySample1.albumTracksResponse.data.items,
            ...spotifySample2.albumTracksResponse.data.items,
            ...spotifySample3.albumTracksResponse.data.items,
          ],
          next: 'sampleNextUrl?sampleQuery',
        },
      });
      axiosMock.get.mockResolvedValue({
        data: {
          items: [
            ...spotifySample1.albumTracksResponse.data.items,
            ...spotifySample2.albumTracksResponse.data.items,
            ...spotifySample3.albumTracksResponse.data.items,
          ],
        },
      });

      await service.getAlbumTracks({
        albumId: spotifySample1.albumId,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(axiosMock.get).toHaveBeenCalledTimes(2);
    });

    it('should sort tracks by disc and track numbers', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.get.mockResolvedValue({
        data: {
          items: [
            /* eslint-disable @typescript-eslint/naming-convention */
            {
              ...spotifySample1.albumTracksResponse.data.items[0],
              disc_number: 2,
              track_number: 1,
            },
            {
              ...spotifySample2.albumTracksResponse.data.items[0],
              disc_number: 1,
              track_number: 2,
            },
            {
              ...spotifySample3.albumTracksResponse.data.items[0],
              disc_number: 1,
              track_number: 1,
            },
            /* eslint-enable @typescript-eslint/naming-convention */
          ],
        },
      });

      const tracks = await service.getAlbumTracks({
        albumId: spotifySample1.albumId,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(tracks).toEqual({
        trackIds: [
          ...spotifySample3.albumTracks.trackIds,
          ...spotifySample2.albumTracks.trackIds,
          ...spotifySample1.albumTracks.trackIds,
        ],
        tracks: {
          ...spotifySample3.albumTracks.tracks,
          ...spotifySample2.albumTracks.tracks,
          ...spotifySample1.albumTracks.tracks,
        },
      });
    });

    it('should refresh tokens if access token is missing', async () => {
      reqMock.cookies = {
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample2.spotifyTokens,
      });
      axiosMock.get.mockResolvedValue(spotifySample1.albumTracksResponse);

      await service.getAlbumTracks({
        albumId: spotifySample1.albumId,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(axiosMock.get).toHaveBeenCalledWith(expect.any(String), {
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Authorization: `Bearer ${spotifySample2.tokens.accessToken}`,
        },
      });
    });

    it('should not refresh tokens if access token exists', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample2.spotifyTokens,
      });
      axiosMock.get.mockResolvedValue(spotifySample1.albumTracksResponse);

      await service.getAlbumTracks({
        albumId: spotifySample1.albumId,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(axiosMock.get).toHaveBeenCalledWith(expect.any(String), {
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Authorization: `Bearer ${spotifySample1.tokens.accessToken}`,
        },
      });
    });

    it('should throw error if cannot refresh token', async () => {
      await expect(
        service.getAlbumTracks({
          albumId: spotifySample1.albumId,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should return axios error', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.get.mockRejectedValue(axiosSamples.error);

      await expect(
        service.getAlbumTracks({
          albumId: spotifySample1.albumId,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
      ).rejects.toBeInstanceOf(HttpException);
    });

    createRethrowUnknownErrorAsyncTest({
      beforeEach: () => {
        reqMock.cookies = {
          spotifyAccessToken: spotifySample1.tokens.accessToken,
          spotifyRefreshToken: spotifySample1.tokens.refreshToken,
        };
      },
      mockedObjectGetter: () => axiosMock,
      mockedMethod: 'get',
      testedPromiseGetter: () =>
        service.getAlbumTracks({
          albumId: spotifySample1.albumId,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
    });
  });

  describe('getTracks', () => {
    it('should return tracks', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.get.mockResolvedValue({
        data: {
          tracks: [
            ...spotifySample1.tracksResponse.data.tracks,
            ...spotifySample2.tracksResponse.data.tracks,
            ...spotifySample3.tracksResponse.data.tracks,
          ],
        },
      });

      const tracks = await service.getTracks({
        trackIds: spotifySample1.tracks.trackIds,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(tracks).toEqual({
        ...spotifySample1.tracks.tracks,
        ...spotifySample2.tracks.tracks,
        ...spotifySample3.tracks.tracks,
      });
    });

    it('should refresh tokens if access token is missing', async () => {
      reqMock.cookies = {
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample2.spotifyTokens,
      });
      axiosMock.get.mockResolvedValue(spotifySample1.tracksResponse);

      await service.getTracks({
        trackIds: spotifySample1.tracks.trackIds,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(axiosMock.get).toHaveBeenCalledWith(expect.any(String), {
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Authorization: `Bearer ${spotifySample2.tokens.accessToken}`,
        },
      });
    });

    it('should not refresh tokens if access token exists', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample2.spotifyTokens,
      });
      axiosMock.get.mockResolvedValue(spotifySample1.tracksResponse);

      await service.getTracks({
        trackIds: spotifySample1.tracks.trackIds,
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(axiosMock.get).toHaveBeenCalledWith(expect.any(String), {
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Authorization: `Bearer ${spotifySample1.tokens.accessToken}`,
        },
      });
    });

    it('should throw error if cannot refresh token', async () => {
      await expect(
        service.getTracks({
          trackIds: spotifySample1.tracks.trackIds,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should return axios error', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.get.mockRejectedValue(axiosSamples.error);

      await expect(
        service.getTracks({
          trackIds: spotifySample1.tracks.trackIds,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
      ).rejects.toBeInstanceOf(HttpException);
    });

    createRethrowUnknownErrorAsyncTest({
      beforeEach: () => {
        reqMock.cookies = {
          spotifyAccessToken: spotifySample1.tokens.accessToken,
          spotifyRefreshToken: spotifySample1.tokens.refreshToken,
        };
      },
      mockedObjectGetter: () => axiosMock,
      mockedMethod: 'get',
      testedPromiseGetter: () =>
        service.getTracks({
          trackIds: spotifySample1.tracks.trackIds,
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
    });
  });

  describe('playTrack', () => {
    it('should play track', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };

      await service.playTrack({
        deviceId: spotifySample1.deviceId,
        trackId: spotifySample1.tracks.trackIds[0],
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(axiosMock.put).toHaveBeenCalled();
    });

    it('should refresh tokens if access token is missing', async () => {
      reqMock.cookies = {
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample2.spotifyTokens,
      });

      await service.playTrack({
        deviceId: spotifySample1.deviceId,
        trackId: spotifySample1.tracks.trackIds[0],
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(axiosMock.put).toHaveBeenCalledWith(
        expect.any(String),
        expect.anything(),
        {
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Authorization: `Bearer ${spotifySample2.tokens.accessToken}`,
          },
        },
      );
    });

    it('should not refresh tokens if access token exists', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.post.mockResolvedValue({
        status: 200,
        data: spotifySample2.spotifyTokens,
      });

      await service.playTrack({
        deviceId: spotifySample1.deviceId,
        trackId: spotifySample1.tracks.trackIds[0],
        req: reqMock as {} as Request,
        res: resMock as {} as Response,
      });

      expect(axiosMock.put).toHaveBeenCalledWith(
        expect.any(String),
        expect.anything(),
        {
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Authorization: `Bearer ${spotifySample1.tokens.accessToken}`,
          },
        },
      );
    });

    it('should throw error if cannot refresh token', async () => {
      await expect(
        service.playTrack({
          deviceId: spotifySample1.deviceId,
          trackId: spotifySample1.tracks.trackIds[0],
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should return axios error', async () => {
      reqMock.cookies = {
        spotifyAccessToken: spotifySample1.tokens.accessToken,
        spotifyRefreshToken: spotifySample1.tokens.refreshToken,
      };
      axiosMock.put.mockRejectedValue(axiosSamples.error);

      await expect(
        service.playTrack({
          deviceId: spotifySample1.deviceId,
          trackId: spotifySample1.tracks.trackIds[0],
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
      ).rejects.toBeInstanceOf(HttpException);
    });

    createRethrowUnknownErrorAsyncTest({
      beforeEach: () => {
        reqMock.cookies = {
          spotifyAccessToken: spotifySample1.tokens.accessToken,
          spotifyRefreshToken: spotifySample1.tokens.refreshToken,
        };
      },
      mockedObjectGetter: () => axiosMock,
      mockedMethod: 'put',
      testedPromiseGetter: () =>
        service.playTrack({
          deviceId: spotifySample1.deviceId,
          trackId: spotifySample1.tracks.trackIds[0],
          req: reqMock as {} as Request,
          res: resMock as {} as Response,
        }),
    });
  });
});
