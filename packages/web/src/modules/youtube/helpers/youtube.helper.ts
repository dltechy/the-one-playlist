import AsyncLock from 'async-lock';

import { sleep } from '@app/helpers/timeout/sleep.helper';
import { MediaInfoList } from '@app/modules/player/types/mediaInfoList';
import { MediaService } from '@app/modules/player/types/mediaService';
import { PlaylistInfo } from '@app/modules/player/types/playlistInfo';
import { PlaylistType } from '@app/modules/player/types/playlistType';

import {
  getYouTubePlaylistDetails,
  getYouTubeVideoDetails,
} from '../apis/youtube.api';

const lock = new AsyncLock();

let player: YT.Player | null = null;

export const loadPlayer = async (
  elementName: string,
): Promise<YT.Player | null> => {
  return lock.acquire('loadPlayer', async (done): Promise<void> => {
    while (!window.YT?.Player) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(1000);
    }

    if (player) {
      player.destroy();

      player = null;
    }

    const host = process.env.NEXT_PUBLIC_APP_HOST;

    const _player = new window.YT.Player(elementName, {
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        playsinline: 1,
        enablejsapi: 1,
        origin: host,
      },
    });

    let cleanup: (() => void) | null = null;

    const onReadyListener = (): void => {
      player = _player;
      cleanup?.();
    };

    const onErrorListener = (): void => {
      cleanup?.();
    };

    cleanup = (): void => {
      _player?.removeEventListener('onReady', onReadyListener);
      _player?.removeEventListener('onError', onErrorListener);

      done(undefined, player);
    };

    _player.addEventListener('onReady', onReadyListener);
    _player.addEventListener('onError', onErrorListener);
  });
};

export const getBaseYouTubePlaylistInfo = (
  playlistLink: string,
): PlaylistInfo | null => {
  const linkRegex =
    /^https?:\/\/(?:[^/]*\.)*(?:(?:youtube\.com\/(?:(?:(playlist)\?.*list=)|(?:(watch)\?.*v=)))|(?:youtu\.be\/))([^&]+).*$/;

  const match = linkRegex.exec(playlistLink);
  if (match) {
    let type: PlaylistType;

    if (match[1]) {
      type = PlaylistType.Playlist;
    } else {
      type = PlaylistType.Video;
    }

    return {
      service: MediaService.YouTube,
      type,
      id: match[3].toString(),
    } as PlaylistInfo;
  }

  return null;
};

export const getYouTubePlaylistInfo = async (
  playlistInfo: PlaylistInfo,
): Promise<{
  playlistInfo?: PlaylistInfo;
  mediaInfo?: MediaInfoList[MediaService.YouTube];
}> => {
  return lock.acquire('getYouTubePlaylistInfo', async (done): Promise<void> => {
    const { service, type, id } = playlistInfo;

    switch (type) {
      case PlaylistType.Playlist: {
        done(undefined, {
          playlistInfo: await getYouTubePlaylistDetails(id),
        });
        return;
      }
      case PlaylistType.Video: {
        const { [id]: media } = await getYouTubeVideoDetails([id]);

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
