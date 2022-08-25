import { MediaService } from './mediaService';
import { PlaylistType } from './playlistType';

export type PlaylistInfo = {
  service: MediaService;
  type: PlaylistType;
  id: string;
  title: string;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
  itemCount: number;
  mediaIds: string[];
};

export const comparePlaylistInfo = (
  playlistInfo1: PlaylistInfo,
  playlistInfo2: PlaylistInfo,
): boolean => {
  return (
    playlistInfo1.service === playlistInfo2.service &&
    playlistInfo1.type === playlistInfo2.type &&
    playlistInfo1.id === playlistInfo2.id
  );
};
