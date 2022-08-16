import { MediaInfoList } from '@app/types/media-info-list';

import {
  SAMPLE_ACCESS_TOKEN,
  SAMPLE_AUTHORS,
  SAMPLE_CODE,
  SAMPLE_DEVICE_ID,
  SAMPLE_PLAYLIST_ID,
  SAMPLE_REFRESH_TOKEN,
  SAMPLE_THUMBNAIL_URL,
  SAMPLE_TITLE,
  SAMPLE_TRACK_ID,
} from '../constants/spotify.constants';

function createSampleTokens(id: number): {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: Date;
} {
  return {
    accessToken: `${SAMPLE_ACCESS_TOKEN}${id}`,
    refreshToken: `${SAMPLE_REFRESH_TOKEN}${id}`,
    accessTokenExpiry: new Date(),
  };
}

function createSampleSpotifyTokens(id: number): {
  /* eslint-disable @typescript-eslint/naming-convention */
  access_token: string;
  refresh_token: string;
  expires_in: number;
  /* eslint-enable @typescript-eslint/naming-convention */
} {
  return {
    /* eslint-disable @typescript-eslint/naming-convention */
    access_token: `${SAMPLE_ACCESS_TOKEN}${id}`,
    refresh_token: `${SAMPLE_REFRESH_TOKEN}${id}`,
    expires_in: 600,
    /* eslint-enable @typescript-eslint/naming-convention */
  };
}

function createSampleTracks({
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
  trackIds: string[];
  tracks: MediaInfoList;
} {
  return {
    trackIds: [`${SAMPLE_TRACK_ID}${id}`],
    tracks: {
      [`${SAMPLE_TRACK_ID}${id}`]: {
        title: `${SAMPLE_TITLE}${id}`,
        authors: `${SAMPLE_AUTHORS}${id}`,
        thumbnail: {
          url: `${SAMPLE_THUMBNAIL_URL}${id}`,
          width: thumbnail.width,
          height: thumbnail.height,
        },
        duration,
      },
    },
  };
}

function createSamplePlaylistTracksResponse(tracks: MediaInfoList): {
  data: SpotifyApi.PlaylistTrackResponse;
} {
  return {
    data: {
      items: Object.keys(tracks).map((trackId) => {
        const { title, authors, thumbnail, duration } = tracks[trackId];

        return {
          /* eslint-disable @typescript-eslint/naming-convention */
          added_at: new Date().toDateString(),
          track: {
            id: trackId,
            name: title,
            artists: authors.split(', ').map((author) => ({
              name: author,
            })),
            album: {
              images: [
                {
                  url: thumbnail.url,
                  width: thumbnail.width !== 0 ? thumbnail.width : undefined,
                  height: thumbnail.height !== 0 ? thumbnail.height : undefined,
                },
              ],
            },
            duration_ms: duration,
          } as SpotifyApi.TrackObjectFull,
          /* eslint-enable @typescript-eslint/naming-convention */
        } as SpotifyApi.PlaylistTrackObject;
      }),
      next: undefined,
    } as SpotifyApi.PlaylistTrackResponse,
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
  code: string;
  tokens: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: Date;
  };
  spotifyTokens: {
    /* eslint-disable @typescript-eslint/naming-convention */
    access_token: string;
    refresh_token: string;
    expires_in: number;
    /* eslint-enable @typescript-eslint/naming-convention */
  };
  playlistId: string;
  deviceId: string;
  tracks: {
    trackIds: string[];
    tracks: MediaInfoList;
  };
  playlistTracksResponse: { data: SpotifyApi.PlaylistTrackResponse };
} {
  const code = `${SAMPLE_CODE}${id}`;
  const tokens = createSampleTokens(id);
  const spotifyTokens = createSampleSpotifyTokens(id);
  const playlistId = `${SAMPLE_PLAYLIST_ID}${id}`;
  const deviceId = `${SAMPLE_DEVICE_ID}${id}`;
  const tracks = createSampleTracks({
    id,
    thumbnail,
    duration,
  });
  const playlistTracksResponse = createSamplePlaylistTracksResponse(
    tracks.tracks,
  );

  return {
    code,
    tokens,
    spotifyTokens,
    playlistId,
    deviceId,
    tracks,
    playlistTracksResponse,
  };
}

export const spotifySamples = [
  createSamples({
    id: 1,
    thumbnail: {
      width: 1280,
      height: 720,
    },
    duration: 600,
  }),
  createSamples({
    id: 2,
    thumbnail: {
      width: 1280,
      height: 720,
    },
    duration: 3661,
  }),
  createSamples({
    id: 3,
    thumbnail: {
      width: 0,
      height: 0,
    },
    duration: 0,
  }),
];
