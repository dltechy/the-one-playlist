import AsyncLock from 'async-lock';
import axios, { AxiosError } from 'axios';
import cookie from 'cookie';

import { sleep } from '@app/helpers/timeout/sleep.helper';
import { MediaInfoList } from '@app/modules/player/types/mediaInfoList';
import { MediaService } from '@app/modules/player/types/mediaService';
import { PlaylistInfo } from '@app/modules/player/types/playlistInfo';
import { PlaylistType } from '@app/modules/player/types/playlistType';

const lock = new AsyncLock();

export const spotifySetKeys = async (): Promise<void> => {
  return lock.acquire('spotifySetKeys', async (done): Promise<void> => {
    const url = `${process.env.NEXT_PUBLIC_APP_SERVER_BASE_URL}/spotify/auth/keys/set`;

    const clientId = localStorage.getItem('spotifyClientId') ?? '';
    const clientSecret = localStorage.getItem('spotifyClientSecret') ?? '';

    await axios.post(
      url,
      {
        clientId,
        clientSecret,
      },
      {
        withCredentials: true,
      },
    );

    done();
  });
};

export const spotifyLogin = async (): Promise<void> => {
  return lock.acquire('spotifyLogin', async (done): Promise<void> => {
    const url = `${process.env.NEXT_PUBLIC_APP_SERVER_BASE_URL}/spotify/auth/login`;

    await spotifySetKeys();

    window.open(url, '_blank');

    done();
  });
};

export const spotifyToken = async (): Promise<void> => {
  return lock.acquire('spotifyToken', async (done): Promise<void> => {
    const url = `${process.env.NEXT_PUBLIC_APP_SERVER_BASE_URL}/spotify/auth/token`;

    const cookies = cookie.parse(document.cookie);
    const refreshToken = cookies.spotifyRefreshToken;

    if (refreshToken) {
      await spotifySetKeys();

      await axios.post(url, undefined, {
        withCredentials: true,
      });
    }

    done();
  });
};

export const spotifyLogout = async (): Promise<void> => {
  return lock.acquire('spotifyLogout', async (done): Promise<void> => {
    const url = `${process.env.NEXT_PUBLIC_APP_SERVER_BASE_URL}/spotify/auth/logout`;

    await axios.post(url, undefined, {
      withCredentials: true,
    });

    done();
  });
};

export const getSpotifyPlaylistDetails = async (
  playlistId: string,
): Promise<PlaylistInfo> => {
  return lock.acquire(
    'getSpotifyPlaylistDetails',
    async (done): Promise<void> => {
      const url = `${process.env.NEXT_PUBLIC_APP_SERVER_BASE_URL}/spotify/playlists/${playlistId}`;

      const {
        data: playlist,
      }: { data: Omit<PlaylistInfo, 'service' | 'mediaIds'> } = await axios.get(
        url,
        {
          withCredentials: true,
        },
      );

      done(undefined, {
        ...playlist,
        service: MediaService.Spotify,
        type: PlaylistType.Playlist,
        mediaIds: [],
      });
    },
  );
};

export const getSpotifyAlbumDetails = async (
  albumId: string,
): Promise<PlaylistInfo> => {
  return lock.acquire('getSpotifyAlbumDetails', async (done): Promise<void> => {
    const url = `${process.env.NEXT_PUBLIC_APP_SERVER_BASE_URL}/spotify/albums/${albumId}`;

    const {
      data: playlist,
    }: { data: Omit<PlaylistInfo, 'service' | 'mediaIds'> } = await axios.get(
      url,
      {
        withCredentials: true,
      },
    );

    done(undefined, {
      ...playlist,
      service: MediaService.Spotify,
      type: PlaylistType.Album,
      mediaIds: [],
    });
  });
};

export const getSpotifyPlaylistTrackDetails = async (
  playlistId: string,
): Promise<{
  trackIds: string[];
  tracks: MediaInfoList[MediaService.Spotify];
}> => {
  return lock.acquire(
    'getSpotifyPlaylistTrackDetails',
    async (done): Promise<void> => {
      const cookies = cookie.parse(document.cookie);
      const refreshToken = cookies.spotifyRefreshToken;

      if (refreshToken) {
        const url = `${process.env.NEXT_PUBLIC_APP_SERVER_BASE_URL}/spotify/playlists/${playlistId}/tracks`;

        const {
          data: { trackIds, tracks },
        }: {
          data: {
            trackIds: string[];
            tracks: MediaInfoList[MediaService.Spotify];
          };
        } = await axios.get(url, {
          withCredentials: true,
        });

        done(undefined, {
          trackIds,
          tracks,
        });
        return;
      }
      done(undefined, {
        trackIds: [],
        tracks: {},
      });
    },
  );
};

export const getSpotifyAlbumTrackDetails = async (
  albumId: string,
): Promise<{
  trackIds: string[];
  tracks: MediaInfoList[MediaService.Spotify];
}> => {
  return lock.acquire(
    'getSpotifyAlbumTrackDetails',
    async (done): Promise<void> => {
      const cookies = cookie.parse(document.cookie);
      const refreshToken = cookies.spotifyRefreshToken;

      if (refreshToken) {
        const url = `${process.env.NEXT_PUBLIC_APP_SERVER_BASE_URL}/spotify/albums/${albumId}/tracks`;

        const {
          data: { trackIds, tracks },
        }: {
          data: {
            trackIds: string[];
            tracks: MediaInfoList[MediaService.Spotify];
          };
        } = await axios.get(url, {
          withCredentials: true,
        });

        done(undefined, {
          trackIds,
          tracks,
        });
        return;
      }
      done(undefined, {
        trackIds: [],
        tracks: {},
      });
    },
  );
};

export const getSpotifyTrackDetails = async (
  trackIds: string[],
): Promise<MediaInfoList[MediaService.Spotify]> => {
  return lock.acquire('getSpotifyTrackDetails', async (done): Promise<void> => {
    const cookies = cookie.parse(document.cookie);
    const refreshToken = cookies.spotifyRefreshToken;

    if (refreshToken) {
      const url = `${process.env.NEXT_PUBLIC_APP_SERVER_BASE_URL}/spotify/tracks`;

      const query = trackIds.map((id) => `trackIds=${id}`).join('&');

      const {
        data: tracks,
      }: {
        data: MediaInfoList[MediaService.Spotify];
      } = await axios.get(`${url}?${query}`, {
        withCredentials: true,
      });

      done(undefined, tracks);
      return;
    }
    done(undefined, {});
  });
};

export const playSpotifyTrack = async ({
  deviceId,
  trackId,
}: {
  deviceId: string;
  trackId: string;
}): Promise<void> => {
  return lock.acquire('playSpotifyTrack', async (done): Promise<void> => {
    const cookies = cookie.parse(document.cookie);
    const refreshToken = cookies.spotifyRefreshToken;

    if (refreshToken) {
      const url = `${process.env.NEXT_PUBLIC_APP_SERVER_BASE_URL}/spotify/tracks/${trackId}/play`;

      const maxRetryCount = parseInt(
        process.env.NEXT_PUBLIC_API_MAX_RETRY_COUNT ?? '5',
        10,
      );

      let retryCount = 0;
      while (retryCount < maxRetryCount) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await axios.post(
            url,
            {
              deviceId,
            },
            {
              withCredentials: true,
            },
          );

          done();
          return;
        } catch (e) {
          let isValidError = false;

          if (e instanceof AxiosError && e.response) {
            if (e.response.status === 502) {
              // eslint-disable-next-line no-await-in-loop
              await sleep(100);

              isValidError = true;
            }
          }

          if (!isValidError) {
            done(e as Error);
            return;
          }
        }

        retryCount += 1;
      }
    }

    done();
  });
};
