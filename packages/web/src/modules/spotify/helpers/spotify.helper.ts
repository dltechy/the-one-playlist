import { AxiosError } from 'axios';
import cookie from 'cookie';

import { sleep } from '@app/helpers/timeout/sleep.helper';
import { MediaId } from '@app/modules/player/types/mediaId';
import { MediaInfoList } from '@app/modules/player/types/mediaInfoList';
import { MediaService } from '@app/modules/player/types/mediaService';
import { PlaylistInfo } from '@app/modules/player/types/playlistInfo';
import { PlaylistType } from '@app/modules/player/types/playlistType';

import {
  getSpotifyAlbumDetails,
  getSpotifyPlaylistDetails,
  getSpotifyTrackDetails,
  playSpotifyTrack,
  spotifyToken,
} from '../apis/spotify.api';

let player: Spotify.Player | null;
let deviceId: string | null;

let isConnected = false;

export const connect = async (): Promise<void> => {
  if (deviceId != null) {
    if (!isConnected) {
      isConnected = (await player?.connect()) ?? false;
    }

    if (isConnected) {
      await player?.activateElement();
    }
  }
};

export const disconnect = (): void => {
  if (deviceId != null) {
    if (isConnected) {
      player?.disconnect();

      isConnected = false;
    }
  }
};

export const getPlayer = async (): Promise<Spotify.Player | null> => {
  await connect();

  return isConnected ? player : null;
};

export const loadPlayer = async (): Promise<void> => {
  while (!window.Spotify?.Player) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(1000);
  }

  if (player) {
    player.disconnect();
    deviceId = null;
    isConnected = false;
  }

  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? '';

  player = new window.Spotify.Player({
    name: appName,
    getOAuthToken: (cb): void => {
      let cookies = cookie.parse(document.cookie);
      let accessToken = cookies.spotifyAccessToken;

      if (!accessToken) {
        spotifyToken();

        cookies = cookie.parse(document.cookie);
        accessToken = cookies.spotifyAccessToken;
      }

      cb(accessToken);
    },
  });

  // eslint-disable-next-line camelcase
  player?.addListener('ready', ({ device_id }): void => {
    // eslint-disable-next-line camelcase
    deviceId = `${device_id}`;

    isConnected = true;
  });

  player?.addListener('not_ready', (): void => {
    isConnected = false;
  });

  await player?.connect();
};

export const playTrack = async ({
  mediaId,
  retryCount = 0,
}: {
  mediaId: MediaId;
  retryCount?: number;
}): Promise<void> => {
  const maxRetryCount = parseInt(
    process.env.NEXT_PUBLIC_API_MAX_RETRY_COUNT ?? '5',
    10,
  );
  if (retryCount >= maxRetryCount) {
    return;
  }

  if (deviceId != null) {
    await connect();

    if (isConnected && player) {
      try {
        await playSpotifyTrack({
          deviceId,
          trackId: mediaId.id,
        });
      } catch (e) {
        if (e instanceof AxiosError && e.response) {
          if (
            e.response.data.error.status === 404 &&
            e.response.data.error.message === 'Device not found'
          ) {
            await sleep(100);
            await loadPlayer();

            let loadRetryCount = 0;
            while (deviceId == null) {
              // eslint-disable-next-line no-await-in-loop
              await sleep(1000);

              loadRetryCount += 1;
              if (loadRetryCount >= maxRetryCount) {
                break;
              }
            }

            if (deviceId != null) {
              await playSpotifyTrack({
                deviceId,
                trackId: mediaId.id,
                retryCount: retryCount + 1,
              });
            }
            return;
          }
        }

        throw e;
      }
    }
  }
};

export const getBaseSpotifyPlaylistInfo = (
  playlistLink: string,
): PlaylistInfo | null => {
  const linkRegex =
    /^https?:\/\/(?:[^/]*\.)*spotify\.com\/(playlist|album|track)\/([^/?]+).*$/;

  const match = linkRegex.exec(playlistLink);
  if (match) {
    let type: PlaylistType;

    switch (match[1]) {
      case 'playlist': {
        type = PlaylistType.Playlist;
        break;
      }
      case 'album': {
        type = PlaylistType.Album;
        break;
      }
      default: {
        type = PlaylistType.Track;
        break;
      }
    }

    return {
      service: MediaService.Spotify,
      type,
      id: match[2].toString(),
    } as PlaylistInfo;
  }

  return null;
};

export const getSpotifyPlaylistInfo = async (
  playlistInfo: PlaylistInfo,
): Promise<{
  playlistInfo?: PlaylistInfo;
  mediaInfo?: MediaInfoList[MediaService.Spotify];
}> => {
  const { service, type, id } = playlistInfo;

  switch (type) {
    case PlaylistType.Playlist: {
      return {
        playlistInfo: await getSpotifyPlaylistDetails(id),
      };
    }
    case PlaylistType.Album: {
      return {
        playlistInfo: await getSpotifyAlbumDetails(id),
      };
    }
    case PlaylistType.Track: {
      const { [id]: media } = await getSpotifyTrackDetails([id]);

      if (media) {
        return {
          playlistInfo: {
            service,
            type,
            id,
            title: media.title,
            thumbnail: media.thumbnail,
            itemCount: 1,
            mediaIds: [id],
          },
          mediaInfo: {
            [id]: media,
          },
        };
      }

      return {};
    }
    default: {
      return {};
    }
  }
};
