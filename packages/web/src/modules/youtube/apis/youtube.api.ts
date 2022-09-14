import AsyncLock from 'async-lock';
import axios from 'axios';

import { MediaInfoList } from '@app/modules/player/types/mediaInfoList';
import { MediaService } from '@app/modules/player/types/mediaService';
import { PlaylistInfo } from '@app/modules/player/types/playlistInfo';
import { PlaylistType } from '@app/modules/player/types/playlistType';

const lock = new AsyncLock();

export const getYouTubePlaylistDetails = async (
  playlistId: string,
): Promise<PlaylistInfo> => {
  return lock.acquire(
    'getYouTubePlaylistDetails',
    async (done): Promise<void> => {
      const url = `${process.env.NEXT_PUBLIC_APP_SERVER_BASE_URL}/youtube/playlists/${playlistId}`;

      const {
        data: playlist,
      }: { data: Omit<PlaylistInfo, 'service' | 'mediaIds'> } = await axios.get(
        url,
      );

      done(undefined, {
        ...playlist,
        service: MediaService.YouTube,
        type: PlaylistType.Playlist,
        mediaIds: [],
      });
    },
  );
};

export const getYouTubeVideoDetails = async (
  videoIds: string[],
): Promise<MediaInfoList[MediaService.YouTube]> => {
  return lock.acquire('getYouTubeVideoDetails', async (done): Promise<void> => {
    const url = `${process.env.NEXT_PUBLIC_APP_SERVER_BASE_URL}/youtube/videos`;

    const query = videoIds.map((id) => `videoIds=${id}`).join('&');

    const { data: videos }: { data: MediaInfoList[MediaService.YouTube] } =
      await axios.get(`${url}?${query}`);

    done(undefined, videos);
  });
};
