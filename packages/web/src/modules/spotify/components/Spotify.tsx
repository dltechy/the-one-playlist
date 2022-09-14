import { Box, Stack, Typography, useMediaQuery } from '@mui/material';
import {
  FC,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { sleep } from '@app/helpers/timeout/sleep.helper';
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
import { theme } from '@app/styles/theme';

import { getPlayer, loadPlayer, playTrack } from '../helpers/spotify.helper';

export const Spotify: FC = () => {
  // Properties

  const INVALID_MEDIA_TEXT = 'Unknown';

  const md = useMediaQuery(theme.breakpoints.up('md'));

  const [loadedTrackId, setLoadedTrackId] = useState('');

  const [playerStateTick, setPlayerStateTick] = useState(false);

  const {
    playerState: {
      isPlaying,

      isRepeatOn,

      duration,
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
    paused: !isPlaying,
    position: progress,
    volume,
  });
  const prevPlayerStateTick = useRef(!playerStateTick);

  // General methods

  const updatePlayerState = useCallback(async (): Promise<void> => {
    const mediaId = mediaIds[mediaIndex];

    let isActiveService = false;

    if (
      mediaId?.service === MediaService.Spotify &&
      mediaId?.id === loadedTrackId
    ) {
      isActiveService = true;
    }

    const player = await getPlayer();
    const playerState = await player?.getCurrentState();

    if (player && playerState) {
      const { paused, duration: _duration, position } = playerState;

      if (paused !== prevPlayerState.current.paused) {
        if (isActiveService) {
          if (isPlaying === paused) {
            if (paused) {
              if (position === 0 && prevPlayerState.current.position !== 0) {
                if (isRepeatOn && mediaIds.length === 1) {
                  await player?.resume();
                } else {
                  playerDispatch({ type: PlayerActionType.EndMedia });
                }
              } else {
                playerDispatch({ type: PlayerActionType.Pause });
              }
            } else {
              playerDispatch({ type: PlayerActionType.Play });
            }
          }
        } else if (!paused) {
          await player?.pause();
          await player?.seek(0);
        }

        prevPlayerState.current.paused = paused;
      } else if (position >= _duration) {
        await player?.pause();
        await player?.seek(0);
      }

      if (_duration !== duration && isActiveService) {
        playerDispatch({
          type: PlayerActionType.SetDuration,
          payload: {
            duration: _duration,
          },
        });
      }

      if (position !== prevPlayerState.current.position) {
        if (!isSeeking && isActiveService) {
          playerDispatch({
            type: PlayerActionType.Seek,
            payload: {
              progress: position,
            },
          });
        }

        prevPlayerState.current.position = position;
      }

      const _volume = await player.getVolume();
      if (_volume !== prevPlayerState.current.volume) {
        if (!isSettingVolume && isActiveService) {
          if (_volume > 0) {
            playerDispatch({
              type: PlayerActionType.SetVolume,
              payload: {
                volume: Math.floor(_volume * 100),
              },
            });
          } else {
            playerDispatch({ type: PlayerActionType.MuteOn });
          }
        }

        prevPlayerState.current.volume = _volume;
      }
    }
  }, [
    loadedTrackId,
    isPlaying,
    isRepeatOn,
    isSeeking,
    duration,
    isSettingVolume,
    mediaIds,
    mediaIndex,
    playerDispatch,
  ]);

  // Effects

  // Initialization
  useEffect(() => {
    loadPlayer().catch();
  }, []);

  // Track player state
  useEffect(() => {
    if (playerStateTick !== prevPlayerStateTick.current) {
      const stateUpdateInterval = parseInt(
        process.env.NEXT_PUBLIC_PLAYER_STATE_UPDATE_INTERVAL ?? '500',
        10,
      );

      updatePlayerState()
        .catch()
        .finally(() => {
          setTimeout(
            () => setPlayerStateTick((prev) => !prev),
            stateUpdateInterval,
          );
        });

      prevPlayerStateTick.current = playerStateTick;
    }
  }, [playerStateTick, updatePlayerState]);

  // Update play state
  useEffect(() => {
    if (isPlaying !== prevIsPlaying.current) {
      const mediaId = mediaIds[mediaIndex];
      if (mediaId?.service === MediaService.Spotify) {
        const updatePlayState = async (): Promise<void> => {
          let player = await getPlayer();
          if (isPlaying && player != null) {
            if (mediaId.id === loadedTrackId) {
              player?.resume();
            } else {
              const _progress = progress;

              await playTrack({ mediaId });
              player = await getPlayer();

              const waitForLoad = async (): Promise<void> => {
                const playerState = await player?.getCurrentState();
                if (playerState && !playerState.loading) {
                  await player?.seek(_progress);

                  setLoadedTrackId(mediaId.id);
                } else {
                  await sleep(100);
                  await waitForLoad();
                }
              };
              await waitForLoad();
            }
          } else {
            player?.pause();
          }
        };
        updatePlayState().catch();
      }

      prevIsPlaying.current = isPlaying;
    }
  }, [loadedTrackId, isPlaying, progress, mediaIds, mediaIndex]);

  // Update seek
  useEffect(() => {
    if (isSeeking !== prevIsSeeking.current) {
      const mediaId = mediaIds[mediaIndex];
      if (mediaId?.service === MediaService.Spotify) {
        const updateSeek = async (): Promise<void> => {
          const player = await getPlayer();
          await player?.seek(progress);
        };
        updateSeek().catch();
      }

      prevIsSeeking.current = isSeeking;
    }
  }, [progress, isSeeking, mediaIds, mediaIndex]);

  // Update volume
  // NOTE: always update even if media is not Spotify
  useEffect(() => {
    if (isSettingVolume) {
      const updateVolume = async (): Promise<void> => {
        const player = await getPlayer();
        await player?.setVolume(volume);
      };
      updateVolume().catch();
    }
  }, [volume, isSettingVolume]);

  // Update mute
  // NOTE: always update even if media is not Spotify
  useEffect(() => {
    const updateMute = async (): Promise<void> => {
      const player = await getPlayer();

      if (isMuted) {
        await player?.setVolume(0);
      } else {
        await player?.setVolume(volume / 100);
      }
    };
    updateMute().catch();
  }, [volume, isMuted]);

  // Update loaded video
  useEffect(() => {
    const updateLoadedVideo = async (): Promise<void> => {
      let player = await getPlayer();

      const mediaId = mediaIds[mediaIndex];
      if (mediaId?.service === MediaService.Spotify) {
        if (
          prevMediaId.current == null ||
          !compareMediaIds(mediaId, prevMediaId.current)
        ) {
          const mediaInfo = mediaInfoList[mediaId.service][mediaId.id];

          playerDispatch({
            type: PlayerActionType.SetDuration,
            payload: {
              duration: mediaInfo?.duration ?? 0,
            },
          });

          playerDispatch({
            type: PlayerActionType.Seek,
            payload: {
              progress: 0,
            },
          });

          if (isPlaying) {
            await playTrack({ mediaId });
            player = await getPlayer();

            const waitForLoad = async (): Promise<void> => {
              const playerState = await player?.getCurrentState();
              if (playerState && !playerState.loading) {
                setLoadedTrackId(mediaId.id);
              } else {
                await sleep(100);
                await waitForLoad();
              }
            };
            await waitForLoad();
          } else {
            await player?.pause();
            await player?.seek(0);
          }
        }
      } else {
        await player?.pause();
        await player?.seek(0);
      }

      prevMediaId.current = mediaId;
    };
    updateLoadedVideo().catch();
  }, [isPlaying, mediaIds, mediaInfoList, mediaIndex, playerDispatch]);

  // Element

  const mediaId = mediaIds[mediaIndex];
  if (mediaId?.service === MediaService.Spotify) {
    const mediaInfo = mediaInfoList[mediaId.service][mediaId.id];

    return (
      <Stack spacing={1} textAlign="center" width="100%" height="100%">
        <Box
          component="img"
          src={mediaInfo?.thumbnail.url ?? ''}
          alt="Track thumbnail"
          width="fit-content"
          maxWidth="100%"
          height="100%"
          marginX="auto"
          overflow="hidden"
          sx={{
            objectFit: 'contain',
            cursor: 'pointer',
          }}
          onClick={(): void =>
            playerDispatch({ type: PlayerActionType.TogglePlay })
          }
        />

        <Typography
          variant={md ? 'h5' : 'body1'}
          component="span"
          lineHeight={1}
          whiteSpace="pre"
          textTransform="none"
          textOverflow="ellipsis"
        >
          {mediaInfo?.title ?? INVALID_MEDIA_TEXT}
        </Typography>
        <Typography
          variant={md ? 'h6' : 'body2'}
          component="span"
          lineHeight={1}
          color="text.secondary"
          whiteSpace="pre"
          textTransform="none"
          textOverflow="ellipsis"
        >
          {mediaInfo?.authors ?? INVALID_MEDIA_TEXT}
        </Typography>
      </Stack>
    );
  }
  return null;
};
