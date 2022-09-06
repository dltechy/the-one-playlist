import { MediaInfoList } from '@app/types/media-info-list';
import { PlaylistInfo } from '@app/types/playlist-info';

import {
  SAMPLE_ACCESS_TOKEN,
  SAMPLE_ALBUM_ID,
  SAMPLE_ALBUM_THUMBNAIL_URL,
  SAMPLE_ALBUM_TITLE,
  SAMPLE_CODE,
  SAMPLE_CUSTOM_CLIENT_ID,
  SAMPLE_CUSTOM_CLIENT_SECRET,
  SAMPLE_DEVICE_ID,
  SAMPLE_PLAYLIST_ID,
  SAMPLE_PLAYLIST_THUMBNAIL_URL,
  SAMPLE_PLAYLIST_TITLE,
  SAMPLE_REFRESH_TOKEN,
  SAMPLE_TRACK_AUTHORS,
  SAMPLE_TRACK_ID,
  SAMPLE_TRACK_THUMBNAIL_URL,
  SAMPLE_TRACK_TITLE,
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

function createSampleAlbum({
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
    id: `${SAMPLE_ALBUM_ID}${id}`,
    title: `${SAMPLE_ALBUM_TITLE}${id}`,
    thumbnail: {
      url: `${SAMPLE_ALBUM_THUMBNAIL_URL}${id}`,
      width: thumbnail.width,
      height: thumbnail.height,
    },
    itemCount,
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
        title: `${SAMPLE_TRACK_TITLE}${id}`,
        authors: `${SAMPLE_TRACK_AUTHORS}${id}`,
        thumbnail: {
          url: `${SAMPLE_TRACK_THUMBNAIL_URL}${id}`,
          width: thumbnail.width,
          height: thumbnail.height,
        },
        duration,
      },
    },
  };
}

function createSampleAlbumTracks(_tracks: MediaInfoList): {
  trackIds: string[];
  tracks: MediaInfoList;
} {
  const trackIds: string[] = [];
  const tracks: MediaInfoList = {};

  Object.keys(_tracks).forEach((id) => {
    trackIds.push(id);
    tracks[id] = {
      ..._tracks[id],
      thumbnail: {
        url: '',
        width: 0,
        height: 0,
      },
    };
  });

  return {
    trackIds,
    tracks,
  };
}

function createSamplePlaylistResponse(playlist: PlaylistInfo): {
  data: SpotifyApi.SinglePlaylistResponse;
} {
  const { title, thumbnail, itemCount } = playlist;

  return {
    data: {
      name: title,
      images: [
        {
          url: thumbnail.url,
          width: thumbnail.width !== 0 ? thumbnail.width : undefined,
          height: thumbnail.height !== 0 ? thumbnail.height : undefined,
        },
      ],
      tracks: {
        total: itemCount,
      } as SpotifyApi.PagingObject<SpotifyApi.PlaylistTrackObject>,
    } as SpotifyApi.SinglePlaylistResponse,
  };
}

function createSampleAlbumResponse(album: PlaylistInfo): {
  data: SpotifyApi.SingleAlbumResponse;
} {
  const { title, thumbnail, itemCount } = album;

  return {
    data: {
      name: title,
      images: [
        {
          url: thumbnail.url,
          width: thumbnail.width !== 0 ? thumbnail.width : undefined,
          height: thumbnail.height !== 0 ? thumbnail.height : undefined,
        },
      ],
      tracks: {
        total: itemCount,
      } as SpotifyApi.PagingObject<SpotifyApi.TrackObjectSimplified>,
    } as SpotifyApi.SingleAlbumResponse,
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

function createSampleAlbumTracksResponse(tracks: MediaInfoList): {
  data: SpotifyApi.AlbumTracksResponse;
} {
  return {
    data: {
      items: Object.keys(tracks).map((trackId) => {
        const { title, authors, duration } = tracks[trackId];

        return {
          /* eslint-disable @typescript-eslint/naming-convention */
          disc_number: 1,
          track_number: 1,
          id: trackId,
          name: title,
          artists: authors.split(', ').map((author) => ({
            name: author,
          })),
          duration_ms: duration,
          /* eslint-enable @typescript-eslint/naming-convention */
        } as SpotifyApi.TrackObjectSimplified;
      }),
      next: undefined,
    } as SpotifyApi.AlbumTracksResponse,
  };
}

function createSampleTracksResponse(tracks: MediaInfoList): {
  data: SpotifyApi.MultipleTracksResponse;
} {
  return {
    data: {
      tracks: Object.keys(tracks).map((trackId) => {
        const { title, authors, thumbnail, duration } = tracks[trackId];

        return {
          /* eslint-disable @typescript-eslint/naming-convention */
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
          /* eslint-enable @typescript-eslint/naming-convention */
        } as SpotifyApi.TrackObjectFull;
      }),
    },
  };
}

function createSamples({
  id,
  playlistThumbnail,
  albumThumbnail,
  itemCount,
  trackThumbnail,
  duration,
}: {
  id: number;
  playlistThumbnail: {
    width: number;
    height: number;
  };
  albumThumbnail: {
    width: number;
    height: number;
  };
  itemCount: number;
  trackThumbnail: {
    width: number;
    height: number;
  };
  duration: number;
}): {
  code: string;
  clientId: string;
  clientSecret: string;
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
  playlist: PlaylistInfo;
  albumId: string;
  album: PlaylistInfo;
  deviceId: string;
  tracks: {
    trackIds: string[];
    tracks: MediaInfoList;
  };
  albumTracks: {
    trackIds: string[];
    tracks: MediaInfoList;
  };
  playlistResponse: { data: SpotifyApi.SinglePlaylistResponse };
  albumResponse: { data: SpotifyApi.SingleAlbumResponse };
  playlistTracksResponse: { data: SpotifyApi.PlaylistTrackResponse };
  albumTracksResponse: { data: SpotifyApi.AlbumTracksResponse };
  tracksResponse: { data: SpotifyApi.MultipleTracksResponse };
} {
  const code = `${SAMPLE_CODE}${id}`;
  const clientId = `${SAMPLE_CUSTOM_CLIENT_ID}${id}`;
  const clientSecret = `${SAMPLE_CUSTOM_CLIENT_SECRET}${id}`;
  const tokens = createSampleTokens(id);
  const spotifyTokens = createSampleSpotifyTokens(id);
  const playlistId = `${SAMPLE_PLAYLIST_ID}${id}`;
  const playlist = createSamplePlaylist({
    id,
    thumbnail: playlistThumbnail,
    itemCount,
  });
  const albumId = `${SAMPLE_ALBUM_ID}${id}`;
  const album = createSampleAlbum({
    id,
    thumbnail: albumThumbnail,
    itemCount,
  });
  const deviceId = `${SAMPLE_DEVICE_ID}${id}`;
  const tracks = createSampleTracks({
    id,
    thumbnail: trackThumbnail,
    duration,
  });
  const albumTracks = createSampleAlbumTracks(tracks.tracks);
  const playlistResponse = createSamplePlaylistResponse(playlist);
  const albumResponse = createSampleAlbumResponse(album);
  const playlistTracksResponse = createSamplePlaylistTracksResponse(
    tracks.tracks,
  );
  const albumTracksResponse = createSampleAlbumTracksResponse(tracks.tracks);
  const tracksResponse = createSampleTracksResponse(tracks.tracks);

  return {
    code,
    clientId,
    clientSecret,
    tokens,
    spotifyTokens,
    playlistId,
    playlist,
    albumId,
    album,
    deviceId,
    tracks,
    albumTracks,
    playlistResponse,
    albumResponse,
    playlistTracksResponse,
    albumTracksResponse,
    tracksResponse,
  };
}

export const spotifySamples = [
  createSamples({
    id: 1,
    playlistThumbnail: {
      width: 1280,
      height: 720,
    },
    albumThumbnail: {
      width: 1280,
      height: 720,
    },
    itemCount: 1,
    trackThumbnail: {
      width: 1280,
      height: 720,
    },
    duration: 600,
  }),
  createSamples({
    id: 2,
    playlistThumbnail: {
      width: 1280,
      height: 720,
    },
    albumThumbnail: {
      width: 1280,
      height: 720,
    },
    itemCount: 1,
    trackThumbnail: {
      width: 1280,
      height: 720,
    },
    duration: 3661,
  }),
  createSamples({
    id: 3,
    playlistThumbnail: {
      width: 0,
      height: 0,
    },
    albumThumbnail: {
      width: 0,
      height: 0,
    },
    itemCount: 1,
    trackThumbnail: {
      width: 0,
      height: 0,
    },
    duration: 0,
  }),
];
