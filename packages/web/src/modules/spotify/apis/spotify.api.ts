import axios, { AxiosError } from 'axios';
import cookie from 'cookie';

import { sleep } from '@app/helpers/timeout/sleep.helper';
import { MediaInfoList } from '@app/modules/player/types/mediaInfoList';
import { MediaService } from '@app/modules/player/types/mediaService';
import { PlaylistInfo } from '@app/modules/player/types/playlistInfo';

export const spotifyLogin = async (): Promise<void> => {
  const url = `${process.env.NEXT_PUBLIC_APP_SERVER_BASE_URL}/spotify/auth/login`;

  window.open(url, '_blank');
};

export const spotifyToken = async (): Promise<void> => {
  const url = `${process.env.NEXT_PUBLIC_APP_SERVER_BASE_URL}/spotify/auth/token`;

  const cookies = cookie.parse(document.cookie);
  const refreshToken = cookies.spotifyRefreshToken;

  if (refreshToken) {
    await axios.post(url, undefined, {
      withCredentials: true,
    });
  }
};

export const spotifyLogout = async (): Promise<void> => {
  const url = `${process.env.NEXT_PUBLIC_APP_SERVER_BASE_URL}/spotify/auth/logout`;

  await axios.post(url, undefined, {
    withCredentials: true,
  });
};

export const getSpotifyPlaylistDetails = async (
  playlistId: string,
): Promise<PlaylistInfo> => {
  const url = `${process.env.NEXT_PUBLIC_APP_SERVER_BASE_URL}/spotify/playlists/${playlistId}`;

  const {
    data: playlist,
  }: { data: Omit<PlaylistInfo, 'service' | 'mediaIds'> } = await axios.get(
    url,
    {
      withCredentials: true,
    },
  );

  return {
    ...playlist,
    service: MediaService.Spotify,
    mediaIds: [],
  };
};

export const getSpotifyPlaylistTrackDetails = async (
  playlistId: string,
): Promise<{
  trackIds: string[];
  tracks: MediaInfoList[MediaService.Spotify];
}> => {
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

    return {
      trackIds,
      tracks,
    };
  }
  return {
    trackIds: [],
    tracks: {},
  };
};

export const playSpotifyTrack = async ({
  deviceId,
  trackId,
  retryCount = 0,
}: {
  deviceId: string;
  trackId: string;
  retryCount?: number;
}): Promise<void> => {
  const maxRetryCount = parseInt(
    process.env.NEXT_PUBLIC_API_MAX_RETRY_COUNT ?? '5',
    10,
  );
  if (retryCount >= maxRetryCount) {
    return;
  }

  const cookies = cookie.parse(document.cookie);
  const refreshToken = cookies.spotifyRefreshToken;

  if (refreshToken) {
    try {
      const url = `${process.env.NEXT_PUBLIC_APP_SERVER_BASE_URL}/spotify/tracks/${trackId}/play`;

      await axios.post(
        url,
        {
          deviceId,
        },
        {
          withCredentials: true,
        },
      );
    } catch (e) {
      if (e instanceof AxiosError && e.response) {
        if (e.response.status === 502) {
          await sleep(100);
          await playSpotifyTrack({
            deviceId,
            trackId,
            retryCount: retryCount + 1,
          });
          return;
        }
      }

      throw e;
    }
  }
};
