import { MediaService } from './mediaService';

export interface MediaId {
  service: MediaService;
  id: string;
}

export const createEmptyMediaId = (): MediaId => ({
  service: MediaService.None,
  id: '',
});

export const compareMediaIds = (
  mediaId1: MediaId,
  mediaId2: MediaId,
): boolean => {
  if (mediaId1.service === mediaId2.service && mediaId1.id === mediaId2.id) {
    return true;
  }
  return false;
};
