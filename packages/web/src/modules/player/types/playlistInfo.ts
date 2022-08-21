import { MediaService } from './mediaService';

export type PlaylistInfo = {
  service: MediaService;
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
