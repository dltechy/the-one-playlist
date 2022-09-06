import { compareMediaIds, MediaId } from '../types/mediaId';
import { MediaInfoList } from '../types/mediaInfoList';
import { MediaService } from '../types/mediaService';
import { PlaylistInfo } from '../types/playlistInfo';

export enum PlayerActionType {
  Play = 'PLAY',
  Pause = 'PAUSE',
  TogglePlay = 'TOGGLE_PLAY',

  EndMedia = 'END_MEDIA',

  ShuffleOn = 'SHUFFLE_ON',
  ShuffleOff = 'SHUFFLE_OFF',
  ToggleShuffle = 'TOGGLE_SHUFFLE',

  RepeatOn = 'REPEAT_ON',
  RepeatOff = 'REPEAT_OFF',
  ToggleRepeat = 'TOGGLE_REPEAT',

  SetDuration = 'SET_DURATION',
  Seek = 'SEEK',

  SetVolume = 'SET_VOLUME',

  MuteOn = 'MUTE_ON',
  MuteOff = 'MUTE_OFF',
  ToggleMute = 'TOGGLE_MUTE',

  UpdatePlaylistInfoList = 'UPDATE_PLAYLIST_INFO_LIST',
  UpdateMediaIds = 'UPDATE_MEDIA_IDS',

  PlayPrevious = 'PLAY_PREVIOUS',
  PlayNext = 'PLAY_NEXT',
  PlayMediaAt = 'PLAY_MEDIA_AT',

  OpenPlaylistManager = 'OPEN_PLAYLIST_MANAGER',
  ClosePlaylistManager = 'CLOSE_PLAYLIST_MANAGER',

  OpenSpotifyKeyManager = 'OPEN_SPOTIFY_KEY_MANAGER',
  CloseSpotifyKeyManager = 'CLOSE_SPOTIFY_KEY_MANAGER',
}

export interface PlayerAction {
  type: PlayerActionType;
  payload?: Partial<PlayerState>;
}

export interface PlayerState {
  isPlaying: boolean;

  isShuffleOn: boolean;
  isRepeatOn: boolean;

  duration: number;
  progress: number;
  isSeeking: boolean;

  volume: number;
  isMuted: boolean;
  isSettingVolume: boolean;

  playlistInfoList: PlaylistInfo[];
  mediaIds: MediaId[];
  mediaInfoList: MediaInfoList;
  mediaIndex: number;

  isPlaylistManagerOpen: boolean;

  isSpotifyKeyManagerOpen: boolean;
}

const shufflePlaylist = (
  state: PlayerState,
  props: {
    keepCurrentMedia: boolean;
  },
): PlayerState => {
  const newState = { ...state };

  const newMediaIds = state.playlistInfoList
    .map((playlist) =>
      playlist.mediaIds.map((id) => ({
        service: playlist.service,
        id,
      })),
    )
    .flat();

  if (state.isShuffleOn) {
    let currentIndex = newMediaIds.length;
    while (currentIndex > 0) {
      const randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      [newMediaIds[randomIndex], newMediaIds[currentIndex]] = [
        newMediaIds[currentIndex],
        newMediaIds[randomIndex],
      ];
    }

    if (props.keepCurrentMedia) {
      const mediaId = state.mediaIds[state.mediaIndex];
      if (mediaId != null) {
        const oldMediaIndex = newMediaIds.findIndex((id) =>
          compareMediaIds(id, mediaId),
        );
        const newMediaIndex = 0;

        [newMediaIds[oldMediaIndex], newMediaIds[newMediaIndex]] = [
          newMediaIds[newMediaIndex],
          newMediaIds[oldMediaIndex],
        ];

        newState.mediaIndex = newMediaIndex;
      }
    }
  } else if (props.keepCurrentMedia) {
    const mediaId = state.mediaIds[state.mediaIndex];
    if (mediaId != null) {
      const newMediaIndex = newMediaIds.findIndex((id) =>
        compareMediaIds(id, mediaId),
      );

      newState.mediaIndex = newMediaIndex;
    }
  }

  newState.mediaIds = newMediaIds;

  return newState;
};

const getPreviousIndex = (state: PlayerState): number => {
  return (state.mediaIndex + state.mediaIds.length - 1) % state.mediaIds.length;
};

const getNextIndex = (state: PlayerState): number => {
  return (state.mediaIndex + 1) % state.mediaIds.length;
};

export const playerReducer = (
  state: PlayerState,
  action: PlayerAction,
): PlayerState => {
  switch (action.type) {
    case PlayerActionType.Play: {
      return { ...state, isPlaying: true };
    }
    case PlayerActionType.Pause: {
      return { ...state, isPlaying: false };
    }
    case PlayerActionType.TogglePlay: {
      return { ...state, isPlaying: !state.isPlaying };
    }

    case PlayerActionType.EndMedia: {
      if (state.mediaIndex < state.mediaIds.length - 1 || state.isRepeatOn) {
        return { ...state, mediaIndex: getNextIndex(state) };
      }

      return {
        ...state,
        isPlaying: false,
      };
    }

    case PlayerActionType.ShuffleOn: {
      return shufflePlaylist(
        { ...state, isShuffleOn: true },
        { keepCurrentMedia: true },
      );
    }
    case PlayerActionType.ShuffleOff: {
      return shufflePlaylist(
        { ...state, isShuffleOn: false },
        { keepCurrentMedia: true },
      );
    }
    case PlayerActionType.ToggleShuffle: {
      return shufflePlaylist(
        { ...state, isShuffleOn: !state.isShuffleOn },
        { keepCurrentMedia: true },
      );
    }

    case PlayerActionType.RepeatOn: {
      return { ...state, isRepeatOn: true };
    }
    case PlayerActionType.RepeatOff: {
      return { ...state, isRepeatOn: false };
    }
    case PlayerActionType.ToggleRepeat: {
      return { ...state, isRepeatOn: !state.isRepeatOn };
    }

    case PlayerActionType.SetDuration: {
      return { ...state, duration: action.payload?.duration ?? state.duration };
    }
    case PlayerActionType.Seek: {
      const progress = action.payload?.progress ?? state.progress;
      const isSeeking = action.payload?.isSeeking ?? state.isSeeking;

      return {
        ...state,
        progress,
        isSeeking,
      };
    }

    case PlayerActionType.SetVolume: {
      const volume = action.payload?.volume ?? state.volume;
      const isMuted = action.payload?.isMuted ?? volume === 0;
      const isSettingVolume =
        action.payload?.isSettingVolume ?? state.isSettingVolume;

      return {
        ...state,
        volume,
        isMuted,
        isSettingVolume,
      };
    }

    case PlayerActionType.MuteOn: {
      return { ...state, isMuted: true };
    }
    case PlayerActionType.MuteOff: {
      return { ...state, isMuted: false };
    }
    case PlayerActionType.ToggleMute: {
      return { ...state, isMuted: !state.isMuted };
    }

    case PlayerActionType.UpdatePlaylistInfoList: {
      const playlistInfoList = [...(action.payload?.playlistInfoList ?? [])];
      const mediaInfoList = {
        [MediaService.None]: {
          ...((action.payload?.mediaInfoList ?? {})[MediaService.None] ?? {}),
        },
        [MediaService.YouTube]: {
          ...((action.payload?.mediaInfoList ?? {})[MediaService.YouTube] ??
            {}),
        },
        [MediaService.Spotify]: {
          ...((action.payload?.mediaInfoList ?? {})[MediaService.Spotify] ??
            {}),
        },
      };

      return shufflePlaylist(
        {
          ...state,
          playlistInfoList,
          mediaInfoList,
        },
        { keepCurrentMedia: false },
      );
    }
    case PlayerActionType.UpdateMediaIds: {
      const mediaIds = action.payload?.mediaIds ?? state.mediaIds;
      const mediaIndexObject =
        action.payload?.mediaIndex != null
          ? { mediaIndex: action.payload.mediaIndex }
          : {};

      return {
        ...state,
        mediaIds,
        ...mediaIndexObject,
      };
    }

    case PlayerActionType.PlayPrevious: {
      return {
        ...state,
        mediaIndex: getPreviousIndex(state),
      };
    }
    case PlayerActionType.PlayNext: {
      return {
        ...state,
        mediaIndex: getNextIndex(state),
      };
    }
    case PlayerActionType.PlayMediaAt: {
      return {
        ...state,
        mediaIndex: action.payload?.mediaIndex ?? state.mediaIndex,
      };
    }

    case PlayerActionType.OpenPlaylistManager: {
      return { ...state, isPlaylistManagerOpen: true };
    }
    case PlayerActionType.ClosePlaylistManager: {
      return { ...state, isPlaylistManagerOpen: false };
    }

    case PlayerActionType.OpenSpotifyKeyManager: {
      return { ...state, isSpotifyKeyManagerOpen: true };
    }
    case PlayerActionType.CloseSpotifyKeyManager: {
      return { ...state, isSpotifyKeyManagerOpen: false };
    }

    default: {
      return state;
    }
  }
};
