import AsyncLock from 'async-lock';
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

const lock = new AsyncLock();

let player: Spotify.Player | null = null;
let deviceId: string | null = null;

const readyListener: Spotify.PlaybackInstanceListener = ({
  // eslint-disable-next-line camelcase
  device_id,
}): void => {
  // eslint-disable-next-line camelcase
  deviceId = `${device_id}`;
};

const notReadyListener: Spotify.PlaybackInstanceListener = (): void => {
  deviceId = null;
};

export const loadPlayer = async (): Promise<void> => {
  return lock.acquire('loadPlayer', async (done): Promise<void> => {
    while (!window.Spotify?.Player) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(1000);
    }

    if (player) {
      player?.removeListener('ready', readyListener);
      player?.removeListener('not_ready', notReadyListener);

      player.disconnect();

      deviceId = null;
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

    player?.addListener('ready', readyListener);
    player?.addListener('not_ready', notReadyListener);

    const doneListener: Spotify.PlaybackInstanceListener = (): void => {
      player?.removeListener('ready', doneListener);
      player?.removeListener('not_ready', doneListener);

      done();
    };

    player?.addListener('ready', doneListener);
    player?.addListener('not_ready', doneListener);

    await player?.connect();
  });
};

export const connect = async (): Promise<void> => {
  return lock.acquire('connect', async (done): Promise<void> => {
    if (deviceId == null) {
      await loadPlayer();
    }

    done();
  });
};

export const disconnect = (): void => {
  if (deviceId != null) {
    player?.disconnect();

    deviceId = null;
  }
};

export const getPlayer = async (): Promise<Spotify.Player | null> => {
  return lock.acquire('getPlayer', async (done): Promise<void> => {
    await connect();

    done(undefined, deviceId != null ? player : null);
  });
};

export const playTrack = async ({
  mediaId,
}: {
  mediaId: MediaId;
}): Promise<void> => {
  return lock.acquire('playTrack', async (done): Promise<void> => {
    await connect();
    if (player && deviceId != null) {
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

            disconnect();
            await connect();

            if (deviceId != null) {
              await playSpotifyTrack({
                deviceId,
                trackId: mediaId.id,
              });
            }

            done();
            return;
          }
        }

        done(e as Error);
      }
    }

    done();
  });
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
  return lock.acquire('getSpotifyPlaylistInfo', async (done): Promise<void> => {
    const { service, type, id } = playlistInfo;

    switch (type) {
      case PlaylistType.Playlist: {
        done(undefined, {
          playlistInfo: await getSpotifyPlaylistDetails(id),
        });
        return;
      }
      case PlaylistType.Album: {
        done(undefined, {
          playlistInfo: await getSpotifyAlbumDetails(id),
        });
        return;
      }
      case PlaylistType.Track: {
        const { [id]: media } = await getSpotifyTrackDetails([id]);

        if (media) {
          done(undefined, {
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
          });
          return;
        }

        done(undefined, {});
        return;
      }
      default: {
        done(undefined, {});
      }
    }
  });
};
