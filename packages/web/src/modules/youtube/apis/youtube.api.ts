import axios from 'axios';

import { MediaInfoList } from '@app/modules/player/types/mediaInfoList';
import { MediaService } from '@app/modules/player/types/mediaService';

export const getYouTubeVideoDetails = async (
  videoIds: string[],
): Promise<MediaInfoList[MediaService.YouTube]> => {
  const url = `${process.env.NEXT_PUBLIC_APP_SERVER_BASE_URL}/youtube/videos`;

  const query = videoIds.map((id) => `videoIds=${id}`).join('&');

  const { data: videos }: { data: MediaInfoList[MediaService.YouTube] } =
    await axios.get(`${url}?${query}`);

  return videos;
};