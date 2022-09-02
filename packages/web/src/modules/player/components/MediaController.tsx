import {
  Pause,
  PlayArrow,
  Repeat,
  RepeatOn,
  Shuffle,
  ShuffleOn,
  SkipNext,
  SkipPrevious,
  VolumeDown,
  VolumeOff,
  VolumeUp,
} from '@mui/icons-material';
import {
  Box,
  Checkbox,
  Grid,
  IconButton,
  Slider,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useRouter } from 'next/router';
import {
  FC,
  SyntheticEvent,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  getDurationString,
  getProgressString,
} from '@app/helpers/player/playerTime.helper';
import { theme } from '@app/styles/theme';

import { PlayerContext, PlayerContextType } from '../contexts/player.context';
import { PlayerActionType } from '../reducers/player.reducer';

export const MediaController: FC = () => {
  // Properties

  const PLAYER_MAX_WIDTH = 1280;

  const router = useRouter();
  const prevIsRouterReady = useRef(false);

  const lg = useMediaQuery(theme.breakpoints.up('lg'));
  const sm = useMediaQuery(theme.breakpoints.up('sm'));

  const {
    playerState: {
      isPlaying,

      isShuffleOn,
      isRepeatOn,

      duration,
      progress,
      isSeeking,

      volume,
      isMuted,
      isSettingVolume,
    },
    playerDispatch,
  } = useContext(PlayerContext) as PlayerContextType;

  const [isMouseOverSeekSlider, setIsMouseOverSeekSlider] = useState(false);
  const [isMouseOverVolumeSlider, setIsMouseOverVolumeSlider] = useState(false);

  // Effects

  // Set shuffle & repeat state from query
  useEffect(() => {
    if (!prevIsRouterReady.current && router.isReady) {
      const { query } = router;

      if (query.shuffle === 'false') {
        playerDispatch({ type: PlayerActionType.ShuffleOff });
      }

      if (query.repeat === 'false') {
        playerDispatch({ type: PlayerActionType.RepeatOff });
      }

      prevIsRouterReady.current = router.isReady;
    }
  }, [router, playerDispatch]);

  // Handlers

  const handleToggleShuffleClick = (): void => {
    const { shuffle, ...query } = router.query;
    if (isShuffleOn) {
      query.shuffle = 'false';
    }

    router.replace({ query });

    playerDispatch({ type: PlayerActionType.ToggleShuffle });
  };

  const handleToggleRepeatClick = (): void => {
    const { repeat, ...query } = router.query;
    if (isRepeatOn) {
      query.repeat = 'false';
    }

    router.replace({ query });

    playerDispatch({ type: PlayerActionType.ToggleRepeat });
  };

  const handleSeek = (
    event: Event,
    value: number | number[],
    activeThumb: number,
  ): void => {
    const newProgress = Array.isArray(value) ? value[activeThumb] : value;

    playerDispatch({
      type: PlayerActionType.Seek,
      payload: {
        progress: newProgress,
        isSeeking: true,
      },
    });
  };

  const handleSeekCommitted = (
    event: Event | SyntheticEvent,
    value: number | number[],
  ): void => {
    const newProgress = Array.isArray(value) ? value[0] : value;

    playerDispatch({
      type: PlayerActionType.Seek,
      payload: {
        progress: newProgress,
        isSeeking: false,
      },
    });
  };

  const handleVolumeChange = (
    event: Event,
    value: number | number[],
    activeThumb: number,
  ): void => {
    const newVolume = Array.isArray(value) ? value[activeThumb] : value;

    playerDispatch({
      type: PlayerActionType.SetVolume,
      payload: {
        volume: newVolume,
        isSettingVolume: true,
      },
    });
  };

  const handleVolumeChangeCommitted = (
    event: Event | SyntheticEvent,
    value: number | number[],
  ): void => {
    const newVolume = Array.isArray(value) ? value[0] : value;

    playerDispatch({
      type: PlayerActionType.SetVolume,
      payload: {
        volume: newVolume,
        isSettingVolume: false,
      },
    });
  };

  // Element

  const renderVolumeIcon = (): JSX.Element => {
    if (isMuted || volume === 0) {
      return <VolumeOff />;
    }
    if (volume <= 50) {
      return <VolumeDown />;
    }

    return <VolumeUp />;
  };

  return (
    <Grid
      container
      width="100%"
      maxWidth={PLAYER_MAX_WIDTH}
      paddingX={2}
      lineHeight={0}
      alignItems="center"
    >
      <Grid item xs={12}>
        <Box display="flex" height={12} alignItems="center">
          <Slider
            aria-label="Seek media"
            min={0}
            max={duration}
            value={progress}
            valueLabelDisplay={
              isMouseOverSeekSlider || isSeeking ? 'on' : 'off'
            }
            valueLabelFormat={(value: number): string =>
              getProgressString({ duration, progress: value })
            }
            components={
              isMouseOverSeekSlider || isSeeking
                ? {}
                : {
                    Thumb: 'div',
                  }
            }
            onMouseEnter={(): void => setIsMouseOverSeekSlider(true)}
            onMouseLeave={(): void => setIsMouseOverSeekSlider(false)}
            onChange={handleSeek}
            onChangeCommitted={handleSeekCommitted}
          />
        </Box>
      </Grid>

      <Grid item xs={4}>
        <Typography
          variant={sm ? 'h6' : 'body1'}
          component="span"
          color="#cdcdcd"
          whiteSpace="pre"
          textTransform="none"
          textOverflow="ellipsis"
          overflow="hidden"
        >
          {`${getProgressString({
            duration,
            progress,
          })}${lg ? `/ ${getDurationString({ duration })}` : ''}`}
        </Typography>
      </Grid>

      <Grid item xs={4}>
        <Stack
          direction="row"
          spacing={sm ? 2 : 1}
          justifyContent="center"
          alignItems="center"
        >
          <Box height="fit-content">
            <Checkbox
              aria-label="Toggle shuffle"
              icon={<Shuffle fontSize={sm ? 'medium' : 'small'} />}
              checkedIcon={<ShuffleOn fontSize={sm ? 'medium' : 'small'} />}
              checked={isShuffleOn}
              onChange={handleToggleShuffleClick}
            />
          </Box>

          <IconButton
            aria-label="Play previous media"
            onClick={(): void =>
              playerDispatch({ type: PlayerActionType.PlayPrevious })
            }
          >
            <SkipPrevious fontSize={sm ? 'large' : 'medium'} />
          </IconButton>
          <IconButton
            aria-label="Toggle play/pause"
            onClick={(): void =>
              playerDispatch({ type: PlayerActionType.TogglePlay })
            }
          >
            {isPlaying ? (
              <Pause fontSize={sm ? 'large' : 'medium'} />
            ) : (
              <PlayArrow fontSize={sm ? 'large' : 'medium'} />
            )}
          </IconButton>
          <IconButton
            aria-label="Play next media"
            onClick={(): void =>
              playerDispatch({ type: PlayerActionType.PlayNext })
            }
          >
            <SkipNext fontSize={sm ? 'large' : 'medium'} />
          </IconButton>

          <Box height="fit-content">
            <Checkbox
              aria-label="Toggle repeat"
              icon={<Repeat fontSize={sm ? 'medium' : 'small'} />}
              checkedIcon={<RepeatOn fontSize={sm ? 'medium' : 'small'} />}
              checked={isRepeatOn}
              onChange={handleToggleRepeatClick}
            />
          </Box>
        </Stack>
      </Grid>

      <Grid item xs={4}>
        {lg ? (
          <Stack
            direction="row"
            spacing={1}
            justifyContent="end"
            alignItems="center"
          >
            <IconButton
              aria-label="Toggle volume mute"
              onClick={(): void =>
                playerDispatch({ type: PlayerActionType.ToggleMute })
              }
            >
              {renderVolumeIcon()}
            </IconButton>
            <Box width={96}>
              <Slider
                aria-label="Volume"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                valueLabelDisplay={
                  isMouseOverVolumeSlider || isSettingVolume ? 'on' : 'off'
                }
                components={
                  isMouseOverVolumeSlider || isSettingVolume
                    ? {}
                    : {
                        Thumb: 'div',
                      }
                }
                onMouseEnter={(): void => setIsMouseOverVolumeSlider(true)}
                onMouseLeave={(): void => setIsMouseOverVolumeSlider(false)}
                onChange={handleVolumeChange}
                onChangeCommitted={handleVolumeChangeCommitted}
              />
            </Box>
          </Stack>
        ) : (
          <Box display="flex" justifyContent="end">
            <Typography
              variant={sm ? 'h6' : 'body1'}
              component="span"
              color="#cdcdcd"
              whiteSpace="pre"
              textTransform="none"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              {getDurationString({ duration })}
            </Typography>
          </Box>
        )}
      </Grid>
    </Grid>
  );
};
