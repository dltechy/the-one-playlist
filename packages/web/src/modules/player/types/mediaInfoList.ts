import { MediaService } from './mediaService';

export type MediaInfoList = {
  [service in MediaService]: {
    [id: string]: {
      title: string;
      authors: string;
      thumbnail: {
        url: string;
        width: number;
        height: number;
      };
      duration: number;
    };
  };
};

export const createEmptyMediaInfoList = (): MediaInfoList => ({
  [MediaService.None]: {},
  [MediaService.YouTube]: {},
  [MediaService.Spotify]: {},
});
