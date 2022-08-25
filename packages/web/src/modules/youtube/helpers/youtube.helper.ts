import { sleep } from '@app/helpers/timeout/sleep.helper';
import { MediaInfoList } from '@app/modules/player/types/mediaInfoList';
import { MediaService } from '@app/modules/player/types/mediaService';
import { PlaylistInfo } from '@app/modules/player/types/playlistInfo';
import { PlaylistType } from '@app/modules/player/types/playlistType';

import {
  getYouTubePlaylistDetails,
  getYouTubeVideoDetails,
} from '../apis/youtube.api';

let player: YT.Player;

export const loadPlayer = async (elementName: string): Promise<YT.Player> => {
  while (!window.YT?.Player) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(1000);
  }

  if (player) {
    player.destroy();
  }

  const host = process.env.NEXT_PUBLIC_APP_HOST;

  player = await new Promise<YT.Player>((resolve) => {
    const _player = new window.YT.Player(elementName, {
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        playsinline: 1,
        enablejsapi: 1,
        origin: host,
      },
      events: {
        onReady: (): void => {
          resolve(_player);
        },
      },
    });
  });

  return player;
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
  const { service, type, id } = playlistInfo;

  switch (type) {
    case PlaylistType.Playlist: {
      return {
        playlistInfo: await getYouTubePlaylistDetails(id),
      };
    }
    case PlaylistType.Video: {
      const { [id]: media } = await getYouTubeVideoDetails([id]);

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
