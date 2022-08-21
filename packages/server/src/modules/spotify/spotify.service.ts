import {
  HttpException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { Request, Response } from 'express';

import { AppConfig } from '@app/config/app.config';
import { SpotifyConfig } from '@app/config/spotify.config';
import {
  axiosSymbol,
  AxiosType,
  qsSymbol,
  QsType,
} from '@app/helpers/imports/imports.helper';
import { MediaInfoList } from '@app/types/media-info-list';
import { PlaylistInfo } from '@app/types/playlist-info';

@Injectable()
export class SpotifyService {
  private loginRedirectUri: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(axiosSymbol) private readonly axios: AxiosType,
    @Inject(qsSymbol) private readonly qs: QsType,
  ) {
    const { baseUrl } = this.configService.get<AppConfig>('app');

    this.loginRedirectUri = `${baseUrl}/spotify/auth/login-callback`;
  }

  private generateRandomString(length: number): string {
    let text = '';
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i += 1) {
      text = `${text}${possible.charAt(
        Math.floor(Math.random() * possible.length),
      )}`;
    }

    return text;
  }

  public login(): string {
    const { clientId } = this.configService.get<SpotifyConfig>('spotify');

    const scope = [
      'streaming',
      'user-read-email',
      'user-read-private',
      'playlist-read-private',
    ].join(' ');
    const state = this.generateRandomString(16);

    /* eslint-disable @typescript-eslint/naming-convention */
    const authQueryParameters = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope,
      redirect_uri: this.loginRedirectUri,
      state,
    });
    /* eslint-enable @typescript-eslint/naming-convention */

    return authQueryParameters.toString();
  }

  public async loginCallback({
    code,
    res,
  }: {
    code: string;
    res: Response;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: Date;
  }> {
    const { clientId, clientSecret } =
      this.configService.get<SpotifyConfig>('spotify');

    const url = 'https://accounts.spotify.com/api/token';

    /* eslint-disable @typescript-eslint/naming-convention */
    const payload = this.qs.stringify({
      code,
      redirect_uri: this.loginRedirectUri,
      grant_type: 'authorization_code',
    });

    const headers = {
      Authorization: `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`,
      ).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    try {
      const now = new Date().getTime();

      const axiosRes = await this.axios.post(url, payload, { headers });

      if (axiosRes.status === 200) {
        const {
          data: {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: expiresIn,
          },
        } = axiosRes;

        const accessTokenExpiry = new Date(now + expiresIn * 1000);

        res.cookie('spotifyAccessToken', accessToken, {
          expires: accessTokenExpiry,
        });

        res.cookie('spotifyRefreshToken', refreshToken);

        return {
          accessToken,
          refreshToken,
          accessTokenExpiry,
        };
      }
      if (axiosRes.status === 401) {
        res.clearCookie('spotifyAccessToken');
        res.clearCookie('spotifyRefreshToken');
      }

      throw new HttpException(axiosRes.data, axiosRes.status);
    } catch (e) {
      if (e instanceof AxiosError && e.response) {
        if (e.response.status === 401) {
          res.clearCookie('spotifyAccessToken');
          res.clearCookie('spotifyRefreshToken');
        }

        throw new HttpException(e.response.data, e.response.status);
      }

      throw e;
    }
  }

  public async token({ req, res }: { req: Request; res: Response }): Promise<{
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: Date;
  }> {
    const refreshToken = req.cookies.spotifyRefreshToken as string;

    if (!refreshToken) {
      res.clearCookie('spotifyAccessToken');
      res.clearCookie('spotifyRefreshToken');

      throw new UnauthorizedException('Invalid/missing refresh token');
    }

    const { clientId, clientSecret } =
      this.configService.get<SpotifyConfig>('spotify');

    const url = 'https://accounts.spotify.com/api/token';

    /* eslint-disable @typescript-eslint/naming-convention */
    const payload = this.qs.stringify({
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const headers = {
      Authorization: `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`,
      ).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    try {
      const now = new Date().getTime();

      const axiosRes = await this.axios.post(url, payload, { headers });

      if (axiosRes.status === 200) {
        const {
          data: {
            access_token: accessToken,
            refresh_token: newRefreshToken,
            expires_in: expiresIn,
          },
        } = axiosRes;

        const accessTokenExpiry = new Date(now + expiresIn * 1000);

        res.cookie('spotifyAccessToken', accessToken, {
          expires: accessTokenExpiry,
        });

        if (newRefreshToken) {
          res.cookie('spotifyRefreshToken', newRefreshToken);
        }

        return {
          accessToken,
          refreshToken: newRefreshToken ?? refreshToken,
          accessTokenExpiry,
        };
      }
      if (axiosRes.status === 401) {
        res.clearCookie('spotifyAccessToken');
        res.clearCookie('spotifyRefreshToken');
      }

      throw new HttpException(axiosRes.data, axiosRes.status);
    } catch (e) {
      if (e instanceof AxiosError && e.response) {
        if (e.response.status === 401) {
          res.clearCookie('spotifyAccessToken');
          res.clearCookie('spotifyRefreshToken');
        }

        throw new HttpException(e.response.data, e.response.status);
      }

      throw e;
    }
  }

  public async logout({ res }: { res: Response }): Promise<void> {
    res.clearCookie('spotifyAccessToken');
    res.clearCookie('spotifyRefreshToken');
  }

  public async getPlaylist({
    playlistId,
    req,
    res,
  }: {
    playlistId: string;
    req: Request;
    res: Response;
  }): Promise<PlaylistInfo> {
    let accessToken = req.cookies.spotifyAccessToken;

    if (!accessToken) {
      ({ accessToken } = await this.token({ req, res }));
    }

    const url = `https://api.spotify.com/v1/playlists/${playlistId}`;

    const fields = encodeURIComponent(`name,images,tracks.total`);

    const query = `fields=${fields}`;

    try {
      const { data }: { data: SpotifyApi.SinglePlaylistResponse } =
        await this.axios.get(`${url}?${query}`, {
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Authorization: `Bearer ${accessToken}`,
          },
        });

      const thumbnail = data.images[0];

      const playlist: PlaylistInfo = {
        id: playlistId,
        title: data.name,
        thumbnail: {
          url: thumbnail.url,
          width: thumbnail.width ?? 0,
          height: thumbnail.height ?? 0,
        },
        itemCount: data.tracks.total,
      };

      return playlist;
    } catch (e) {
      if (e instanceof AxiosError && e.response) {
        throw new HttpException(e.response.data, e.response.status);
      }

      throw e;
    }
  }

  public async getPlaylistTracks({
    playlistId,
    req,
    res,
  }: {
    playlistId: string;
    req: Request;
    res: Response;
  }): Promise<{
    trackIds: string[];
    tracks: MediaInfoList;
  }> {
    let accessToken = req.cookies.spotifyAccessToken as string;

    if (!accessToken) {
      ({ accessToken } = await this.token({ req, res }));
    }

    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

    const trackFields = [
      'id',
      'name',
      'artists.name',
      'album.images',
      'duration_ms',
    ].join(',');

    const fields = encodeURIComponent(
      `items(added_at,track(${trackFields})),next`,
    );

    let query = `fields=${fields}&limit=50`;

    const rawData: {
      items: SpotifyApi.PlaylistTrackObject[];
      next: string;
    } = {
      items: [],
      next: '',
    };

    const trackIds: string[] = [];
    const tracks: MediaInfoList = {};

    try {
      while (query) {
        const { data }: { data: SpotifyApi.PlaylistTrackResponse } =
          // eslint-disable-next-line no-await-in-loop
          await this.axios.get(`${url}?${query}`, {
            headers: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              Authorization: `Bearer ${accessToken}`,
            },
          });

        rawData.items = [...rawData.items, ...data.items];

        if (data.next) {
          [, query] = data.next.split('?');
        } else {
          query = null;
        }
      }

      rawData.items
        .sort(
          (item1, item2) =>
            new Date(item1.added_at).getTime() -
            new Date(item2.added_at).getTime(),
        )
        .forEach(
          ({
            /* eslint-disable camelcase */
            track: {
              id,
              name: title,
              artists,
              album: { images },
              duration_ms: durationMs,
            },
            /* eslint-enable camelcase */
          }) => {
            const thumbnail = images[0];

            trackIds.push(id);
            tracks[id] = {
              title,
              authors: artists.map(({ name }) => name).join(', '),
              thumbnail: {
                url: thumbnail.url,
                width: thumbnail.width ?? 0,
                height: thumbnail.height ?? 0,
              },
              duration: durationMs,
            };
          },
        );

      return {
        trackIds,
        tracks,
      };
    } catch (e) {
      if (e instanceof AxiosError && e.response) {
        throw new HttpException(e.response.data, e.response.status);
      }

      throw e;
    }
  }

  public async playTrack({
    deviceId,
    trackId,
    req,
    res,
  }: {
    deviceId: string;
    trackId: string;
    req: Request;
    res: Response;
  }): Promise<void> {
    let accessToken = req.cookies.spotifyAccessToken as string;

    if (!accessToken) {
      ({ accessToken } = await this.token({ req, res }));
    }

    const url = 'https://api.spotify.com/v1/me/player/play';

    const query = `device_id=${deviceId}`;
    const payload = {
      uris: [`spotify:track:${trackId}`],
    };

    try {
      await this.axios.put(`${url}?${query}`, payload, {
        headers: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (e) {
      if (e instanceof AxiosError && e.response) {
        throw new HttpException(e.response.data, e.response.status);
      }

      throw e;
    }
  }
}
