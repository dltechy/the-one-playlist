import { Box, Stack, useMediaQuery } from '@mui/material';
import { FC, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { getSpacingPx } from '@app/helpers/theme/spacing.helper';
import { Spotify } from '@app/modules/spotify/components/Spotify';
import { YouTube } from '@app/modules/youtube/components/YouTube';
import { theme } from '@app/styles/theme';

import { MediaController } from '../components/MediaController';
import { Playlist } from '../components/Playlist';
import { PlaylistManager } from '../components/PlaylistManager';
import { ServicePlaceholder } from '../components/ServicePlaceholder';
import { PlayerContext, PlayerContextType } from '../contexts/player.context';
import { playerReducer } from '../reducers/player.reducer';
import { createEmptyMediaInfoList } from '../types/mediaInfoList';
import { MediaService } from '../types/mediaService';

export const Player: FC = () => {
  // Properties

  const PLAYER_MAX_WIDTH = 1280;
  const PLAYER_MAX_HEIGHT = 720;

  const PLAYLIST_WIDTH = 400;

  const DEFAULT_MARGIN = 4;

  const lg = useMediaQuery(theme.breakpoints.up('lg'));
  const md = useMediaQuery(theme.breakpoints.up('md'));
  const sm = useMediaQuery(theme.breakpoints.up('sm'));

  const playerRef = useRef<HTMLElement>(null);
  const [playerWidth, setPlayerWidth] = useState(PLAYER_MAX_WIDTH);
  const [playerHeight, setPlayerHeight] = useState(PLAYER_MAX_HEIGHT);

  const mediaControllerRef = useRef<HTMLElement>(null);

  const [playerState, playerDispatch] = useReducer(playerReducer, {
    isPlaying: false,

    isShuffleOn: true,
    isRepeatOn: true,

    duration: 0,
    progress: 0,
    isSeeking: false,

    volume: 100,
    isMuted: false,
    isSettingVolume: false,

    playlistInfoList: [],
    mediaIds: [],
    mediaInfoList: createEmptyMediaInfoList(),
    mediaIndex: 0,

    isPlaylistManagerOpen: true,
  });

  const contextState = useMemo<PlayerContextType>(
    () => ({ playerState, playerDispatch }),
    [playerState],
  );

  const { mediaIds, mediaIndex } = playerState;

  // General methods

  const updatePlayerSize = (): void => {
    const playerElement = playerRef.current;
    if (playerElement) {
      const { parentElement } = playerElement;
      if (parentElement) {
        const playerStyle = getComputedStyle(playerElement);
        const parentStyle = getComputedStyle(parentElement);

        const playerMarginY =
          parseFloat(playerStyle.marginTop) +
          parseFloat(playerStyle.marginBottom);

        const parentPaddingX =
          parseFloat(parentStyle.paddingLeft) +
          parseFloat(parentStyle.paddingRight);
        const parentPaddingY =
          parseFloat(parentStyle.paddingTop) +
          parseFloat(parentStyle.paddingBottom);

        const parentWidth = parentElement.clientWidth - parentPaddingX;
        let parentHeight =
          parentElement.clientHeight - playerMarginY - parentPaddingY;

        if (parentElement.children) {
          for (let i = 0; i < parentElement.children.length; i += 1) {
            const childElement = parentElement.children[i] as HTMLElement;
            if (childElement !== playerRef.current) {
              const childStyle = getComputedStyle(childElement);

              const childMarginY =
                parseFloat(childStyle.marginTop) +
                parseFloat(childStyle.marginBottom);

              parentHeight -= childElement.offsetHeight + childMarginY;
            }
          }
        }

        let newPlayerWidth: number;
        let newPlayerHeight: number;

        if (
          parentWidth < PLAYER_MAX_WIDTH &&
          parentHeight < PLAYER_MAX_HEIGHT
        ) {
          newPlayerWidth =
            (parentHeight * PLAYER_MAX_WIDTH) / PLAYER_MAX_HEIGHT;
          if (newPlayerWidth <= parentWidth) {
            newPlayerHeight = parentHeight;
          } else {
            newPlayerWidth = parentWidth;
            newPlayerHeight =
              (parentWidth * PLAYER_MAX_HEIGHT) / PLAYER_MAX_WIDTH;
          }
        } else if (parentWidth < PLAYER_MAX_WIDTH) {
          newPlayerWidth = parentWidth;
          newPlayerHeight =
            (parentWidth * PLAYER_MAX_HEIGHT) / PLAYER_MAX_WIDTH;
        } else if (parentHeight < PLAYER_MAX_HEIGHT) {
          newPlayerWidth =
            (parentHeight * PLAYER_MAX_WIDTH) / PLAYER_MAX_HEIGHT;
          newPlayerHeight = parentHeight;
        } else {
          newPlayerWidth = PLAYER_MAX_WIDTH;
          newPlayerHeight = PLAYER_MAX_HEIGHT;
        }

        setPlayerWidth(newPlayerWidth);
        setPlayerHeight(newPlayerHeight);
      }
    }
  };

  // Effects

  // Update player size on window resize
  useEffect(() => {
    const updatePlayerSizeTimeout = (): void => {
      setTimeout(updatePlayerSize, 100);
    };

    updatePlayerSizeTimeout();

    window.addEventListener('resize', updatePlayerSizeTimeout);
    window.addEventListener('orientationchange', updatePlayerSizeTimeout);

    return () => {
      window.removeEventListener('resize', updatePlayerSizeTimeout);
      window.removeEventListener('orientationchange', updatePlayerSizeTimeout);
    };
  }, []);

  // Element

  const renderServices = (): JSX.Element => {
    const mediaId = mediaIds[mediaIndex];
    const mediaService = mediaId?.service ?? MediaService.None;

    return (
      <>
        <Box
          display={mediaService === MediaService.None ? 'block' : 'none'}
          width="100%"
          height="100%"
        >
          <ServicePlaceholder />
        </Box>

        <Box
          display={mediaService === MediaService.YouTube ? 'block' : 'none'}
          width="100%"
          height="100%"
        >
          <YouTube />
        </Box>

        <Box
          display={mediaService === MediaService.Spotify ? 'block' : 'none'}
          width="100%"
          height="100%"
        >
          <Spotify />
        </Box>
      </>
    );
  };

  return (
    <PlayerContext.Provider value={contextState}>
      <Stack
        position="absolute"
        spacing={md ? 2 : 1}
        margin={lg ? DEFAULT_MARGIN : 0}
        alignItems="center"
        sx={{
          inset: `0 ${
            sm
              ? PLAYLIST_WIDTH * (lg ? 1 : 0.75) + getSpacingPx(DEFAULT_MARGIN)
              : 0
          }px 0 0`,
        }}
      >
        <Box ref={playerRef} width={playerWidth} height={playerHeight}>
          {renderServices()}
        </Box>

        <Box
          ref={mediaControllerRef}
          position="relative"
          width="100%"
          maxWidth={PLAYER_MAX_WIDTH}
        >
          <MediaController />
        </Box>
      </Stack>

      <Box
        position="absolute"
        width={sm ? PLAYLIST_WIDTH * (lg ? 1 : 0.75) : '100%'}
        margin={lg ? DEFAULT_MARGIN : 0}
        sx={{
          inset: `${
            sm
              ? 0
              : playerHeight +
                (mediaControllerRef.current?.offsetHeight ?? 0) +
                getSpacingPx(2)
          }px 0 0 ${sm ? 'auto' : 0}`,
        }}
      >
        <Playlist />
      </Box>

      <PlaylistManager />
    </PlayerContext.Provider>
  );
};
