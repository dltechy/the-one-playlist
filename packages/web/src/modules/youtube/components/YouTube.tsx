import { Box } from '@mui/material';
import {
  FC,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  PlayerContext,
  PlayerContextType,
} from '@app/modules/player/contexts/player.context';
import { PlayerActionType } from '@app/modules/player/reducers/player.reducer';
import {
  compareMediaIds,
  createEmptyMediaId,
  MediaId,
} from '@app/modules/player/types/mediaId';
import { MediaService } from '@app/modules/player/types/mediaService';

import { loadPlayer } from '../helpers/youtube.helper';

export const YouTube: FC = () => {
  // Properties

  const PLAYER_ID = 'youtube-player';

  const player = useRef<YT.Player>();

  const {
    playerState: {
      isPlaying,

      isRepeatOn,

      progress,
      isSeeking,

      volume,
      isMuted,
      isSettingVolume,

      mediaIds,
      mediaInfoList,
      mediaIndex,
    },
    playerDispatch,
  } = useContext(PlayerContext) as PlayerContextType;

  const prevIsPlaying = useRef(isPlaying);
  const prevIsSeeking = useRef(isSeeking);
  const prevMediaId = useRef<MediaId>(createEmptyMediaId());

  const prevPlayerState = useRef({
    state: -1,
    progress,
    volume,
    isMuted,
  });

  const [playerStateTick, setPlayerStateTick] = useState(false);
  const prevPlayerStateTick = useRef(!playerStateTick);

  // General methods

  const updatePlayerState = useCallback((): void => {
    if (player.current) {
      let isActiveService = false;

      const mediaId = mediaIds[mediaIndex];
      if (mediaId?.service === MediaService.YouTube) {
        isActiveService = true;
      }

      const _playerState = player.current.getPlayerState();
      if (_playerState !== prevPlayerState.current.state) {
        if (isActiveService) {
          switch (_playerState) {
            case window.YT.PlayerState.PLAYING: {
              playerDispatch({ type: PlayerActionType.Play });
              break;
            }
            case window.YT.PlayerState.UNSTARTED:
            case window.YT.PlayerState.PAUSED:
            case window.YT.PlayerState.CUED: {
              playerDispatch({ type: PlayerActionType.Pause });
              break;
            }
            case window.YT.PlayerState.ENDED: {
              if (isRepeatOn && mediaIds.length === 1) {
                player.current.seekTo(0, true);
                player.current.playVideo();
              } else {
                playerDispatch({ type: PlayerActionType.EndMedia });
              }
              break;
            }
            default: {
              break;
            }
          }
        }

        prevPlayerState.current.state = _playerState;
      }

      const _progress = player.current.getCurrentTime();
      if (_progress !== prevPlayerState.current.progress) {
        if (!isSeeking && isActiveService) {
          playerDispatch({
            type: PlayerActionType.Seek,
            payload: {
              progress: _progress * 1000,
            },
          });
        }

        prevPlayerState.current.progress = _progress;
      }

      const _volume = player.current.getVolume();
      const _isMuted = player.current.isMuted();
      if (
        _volume !== prevPlayerState.current.volume ||
        _isMuted !== prevPlayerState.current.isMuted
      ) {
        if (!isSettingVolume && isActiveService) {
          if (_isMuted) {
            playerDispatch({
              type: PlayerActionType.SetVolume,
              payload: {
                volume: _volume,
                isMuted: _isMuted,
              },
            });
          } else {
            playerDispatch({
              type: PlayerActionType.SetVolume,
              payload: {
                volume: _volume,
              },
            });
          }
        }

        prevPlayerState.current.volume = _volume;
        prevPlayerState.current.isMuted = _isMuted;
      }
    }
  }, [
    isRepeatOn,
    isSeeking,
    isSettingVolume,
    mediaIds,
    mediaIndex,
    playerDispatch,
  ]);

  // Effects

  // Initialization
  useEffect(() => {
    loadPlayer(PLAYER_ID)
      .then((_player): void => {
        player.current = _player;
      })
      .catch();

    return () => {
      player.current = undefined;
    };
  }, []);

  // Track player state
  useEffect(() => {
    if (playerStateTick !== prevPlayerStateTick.current) {
      const stateUpdateInterval = parseInt(
        process.env.NEXT_PUBLIC_PLAYER_STATE_UPDATE_INTERVAL ?? '500',
        10,
      );

      updatePlayerState();

      prevPlayerStateTick.current = playerStateTick;
      setTimeout(
        () => setPlayerStateTick((prev) => !prev),
        stateUpdateInterval,
      );
    }
  }, [playerStateTick, updatePlayerState]);

  // Update play state
  useEffect(() => {
    if (isPlaying !== prevIsPlaying.current) {
      const mediaId = mediaIds[mediaIndex];
      if (mediaId?.service === MediaService.YouTube) {
        const _playerState = player.current?.getPlayerState();
        switch (_playerState) {
          case window.YT.PlayerState.PLAYING: {
            if (!isPlaying) {
              player.current?.pauseVideo();
            }
            break;
          }
          case window.YT.PlayerState.UNSTARTED:
          case window.YT.PlayerState.PAUSED:
          case window.YT.PlayerState.CUED:
          case window.YT.PlayerState.ENDED: {
            if (isPlaying) {
              player.current?.playVideo();
            }
            break;
          }
          default: {
            if (isPlaying) {
              player.current?.playVideo();
            } else {
              player.current?.pauseVideo();
            }
            break;
          }
        }
      }

      prevIsPlaying.current = isPlaying;
    }
  }, [isPlaying, mediaIds, mediaIndex]);

  // Update seek
  useEffect(() => {
    if (isSeeking || prevIsSeeking.current) {
      const mediaId = mediaIds[mediaIndex];
      if (mediaId?.service === MediaService.YouTube) {
        player.current?.seekTo(progress / 1000, !isSeeking);
      }

      prevIsSeeking.current = isSeeking;
    }
  }, [progress, isSeeking, mediaIds, mediaIndex]);

  // Update volume
  // NOTE: always update even if media is not YouTube
  useEffect(() => {
    if (isSettingVolume) {
      player.current?.setVolume(volume);
    }
  }, [volume, isSettingVolume]);

  // Update mute
  // NOTE: always update even if media is not YouTube
  useEffect(() => {
    if (isMuted) {
      player.current?.mute();
    } else {
      player.current?.unMute();
    }
  }, [isMuted]);

  // Update loaded video
  useEffect(() => {
    const mediaId = mediaIds[mediaIndex];
    if (mediaId?.service === MediaService.YouTube) {
      if (
        prevMediaId.current == null ||
        !compareMediaIds(mediaId, prevMediaId.current)
      ) {
        if (isPlaying) {
          player.current?.loadVideoById({ videoId: mediaId.id });
        } else {
          player.current?.cueVideoById({ videoId: mediaId.id });
        }

        const mediaInfo = mediaInfoList[mediaId.service][mediaId.id];

        playerDispatch({
          type: PlayerActionType.SetDuration,
          payload: {
            duration: mediaInfo?.duration ?? 0,
          },
        });
      }
    } else {
      player.current?.stopVideo();
    }

    prevMediaId.current = mediaId;
  }, [isPlaying, mediaIds, mediaInfoList, mediaIndex, playerDispatch]);

  // Element

  return <Box id={PLAYER_ID} />;
};
