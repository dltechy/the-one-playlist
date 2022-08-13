import { MediaInfoList } from '@app/types/media-info-list';

import {
  SAMPLE_AUTHORS,
  SAMPLE_THUMBNAIL_URL,
  SAMPLE_TITLE,
  SAMPLE_VIDEO_ID,
} from '../constants/youtube.constants';

function createVideoId(id: number): string[] {
  return [`${SAMPLE_VIDEO_ID}${id}`];
}

function createSample({
  id,
  thumbnail,
  duration,
}: {
  id: number;
  thumbnail: {
    width: number;
    height: number;
  };
  duration: number;
}): MediaInfoList {
  return {
    [`${SAMPLE_VIDEO_ID}${id}`]: {
      title: `${SAMPLE_TITLE}${id}`,
      authors: `${SAMPLE_AUTHORS}${id}`,
      thumbnail: {
        url: `${SAMPLE_THUMBNAIL_URL}${id}`,
        width: thumbnail.width,
        height: thumbnail.height,
      },
      duration,
    },
  };
}

function createSampleVideosResponse(videos: MediaInfoList): {
  data: GoogleAppsScript.YouTube.Schema.VideoListResponse;
} {
  return {
    data: {
      items: Object.keys(videos).map((videoId) => {
        const { title, authors, thumbnail, duration } = videos[videoId];

        const hours = Math.floor(duration / 3600000);
        const minutes = Math.floor((duration / 60000) % 60);
        const seconds = Math.floor((duration / 1000) % 60);

        const durationString = `PT${hours > 0 ? `${hours}H` : ''}${
          minutes > 0 ? `${minutes}M` : ''
        }${seconds > 0 ? `${seconds}S` : ''}`;

        return {
          id: videoId,
          snippet: {
            title,
            channelTitle: authors,
            thumbnails: {
              default: {
                url: thumbnail.url,
                width: thumbnail.width,
                height: thumbnail.height,
              },
            },
          },
          contentDetails: {
            duration: durationString,
          },
        };
      }),
    },
  };
}

function createSamples({
  id,
  thumbnail,
  duration,
}: {
  id: number;
  thumbnail: {
    width: number;
    height: number;
  };
  duration: number;
}): {
  videoIds: string[];
  videos: MediaInfoList;
  videosResponse: { data: GoogleAppsScript.YouTube.Schema.VideoListResponse };
} {
  const videoIds = createVideoId(id);
  const videos = createSample({ id, thumbnail, duration });
  const videosResponse = createSampleVideosResponse(videos);

  return {
    videoIds,
    videos,
    videosResponse,
  };
}

export const youtubeSamples = [
  createSamples({
    id: 1,
    thumbnail: {
      width: 1280,
      height: 720,
    },
    duration: 600000,
  }),
  createSamples({
    id: 2,
    thumbnail: {
      width: 1280,
      height: 720,
    },
    duration: 3661000,
  }),
  createSamples({
    id: 3,
    thumbnail: {
      width: 1280,
      height: 720,
    },
    duration: 0,
  }),
];
