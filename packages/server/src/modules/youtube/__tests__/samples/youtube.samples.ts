import { MediaInfoList } from '@app/types/media-info-list';
import { PlaylistInfo } from '@app/types/playlist-info';

import {
  SAMPLE_PLAYLIST_ID,
  SAMPLE_PLAYLIST_THUMBNAIL_URL,
  SAMPLE_PLAYLIST_TITLE,
  SAMPLE_VIDEO_AUTHORS,
  SAMPLE_VIDEO_ID,
  SAMPLE_VIDEO_THUMBNAIL_URL,
  SAMPLE_VIDEO_TITLE,
} from '../constants/youtube.constants';

function createPlaylistId(id: number): string {
  return `${SAMPLE_PLAYLIST_ID}${id}`;
}

function createSamplePlaylist({
  id,
  thumbnail,
  itemCount,
}: {
  id: number;
  thumbnail: {
    width: number;
    height: number;
  };
  itemCount: number;
}): PlaylistInfo {
  return {
    id: `${SAMPLE_PLAYLIST_ID}${id}`,
    title: `${SAMPLE_PLAYLIST_TITLE}${id}`,
    thumbnail: {
      url: `${SAMPLE_PLAYLIST_THUMBNAIL_URL}${id}`,
      width: thumbnail.width,
      height: thumbnail.height,
    },
    itemCount,
  };
}

function createVideoId(id: number): string[] {
  return [`${SAMPLE_VIDEO_ID}${id}`];
}

function createSampleVideo({
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
      title: `${SAMPLE_VIDEO_TITLE}${id}`,
      authors: `${SAMPLE_VIDEO_AUTHORS}${id}`,
      thumbnail: {
        url: `${SAMPLE_VIDEO_THUMBNAIL_URL}${id}`,
        width: thumbnail.width,
        height: thumbnail.height,
      },
      duration,
    },
  };
}

function createSamplePlaylistResponse(playlist: PlaylistInfo): {
  data: GoogleAppsScript.YouTube.Schema.PlaylistListResponse;
} {
  const { id, title, thumbnail, itemCount } = playlist;

  return {
    data: {
      items: [
        {
          id,
          snippet: {
            title,
            thumbnails: {
              default: {
                url: thumbnail.url,
                width: thumbnail.width,
                height: thumbnail.height,
              },
            },
          },
          contentDetails: {
            itemCount,
          },
        },
      ],
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
  playlistThumbnail,
  itemCount,
  videoThumbnail,
  duration,
}: {
  id: number;
  playlistThumbnail: {
    width: number;
    height: number;
  };
  itemCount: number;
  videoThumbnail: {
    width: number;
    height: number;
  };
  duration: number;
}): {
  playlistId: string;
  playlist: PlaylistInfo;
  videoIds: string[];
  videos: MediaInfoList;
  playlistResponse: {
    data: GoogleAppsScript.YouTube.Schema.PlaylistListResponse;
  };
  videosResponse: { data: GoogleAppsScript.YouTube.Schema.VideoListResponse };
} {
  const playlistId = createPlaylistId(id);
  const playlist = createSamplePlaylist({
    id,
    thumbnail: playlistThumbnail,
    itemCount,
  });
  const videoIds = createVideoId(id);
  const videos = createSampleVideo({ id, thumbnail: videoThumbnail, duration });
  const playlistResponse = createSamplePlaylistResponse(playlist);
  const videosResponse = createSampleVideosResponse(videos);

  return {
    playlistId,
    playlist,
    videoIds,
    videos,
    playlistResponse,
    videosResponse,
  };
}

export const youtubeSamples = [
  createSamples({
    id: 1,
    playlistThumbnail: {
      width: 1280,
      height: 720,
    },
    itemCount: 1,
    videoThumbnail: {
      width: 1280,
      height: 720,
    },
    duration: 600000,
  }),
  createSamples({
    id: 2,
    playlistThumbnail: {
      width: 1280,
      height: 720,
    },
    itemCount: 1,
    videoThumbnail: {
      width: 1280,
      height: 720,
    },
    duration: 3661000,
  }),
  createSamples({
    id: 3,
    playlistThumbnail: {
      width: 1280,
      height: 720,
    },
    itemCount: 1,
    videoThumbnail: {
      width: 1280,
      height: 720,
    },
    duration: 0,
  }),
];
