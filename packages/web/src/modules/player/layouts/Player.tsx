import { Box, Stack } from '@mui/material';
import { FC, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { getSpacingPx } from '@app/helpers/theme/spacing.helper';
import { Spotify } from '@app/modules/spotify/components/Spotify';
import { YouTube } from '@app/modules/youtube/components/YouTube';

import { MediaController } from '../components/MediaController';
import { Playlist } from '../components/Playlist';
import { PlaylistLinkInput } from '../components/PlaylistLinkInput';
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

  const playerRef = useRef<HTMLElement>(null);
  const [playerWidth, setPlayerWidth] = useState(PLAYER_MAX_WIDTH);
  const [playerHeight, setPlayerHeight] = useState(PLAYER_MAX_HEIGHT);

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

    originalMediaIds: [],
    mediaIds: [],
    mediaInfoList: createEmptyMediaInfoList(),
    mediaIndex: 0,
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
    updatePlayerSize();

    window.addEventListener('resize', updatePlayerSize);

    return () => {
      window.removeEventListener('resize', updatePlayerSize);
    };
  }, []);

  // Element

  const renderServices = (): JSX.Element => {
    const mediaId = mediaIds[mediaIndex];
    const mediaService = mediaId?.service ?? MediaService.None;

    return (
      <>
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
        spacing={2}
        margin={DEFAULT_MARGIN}
        alignItems="center"
        sx={{
          inset: `0 ${PLAYLIST_WIDTH + getSpacingPx(DEFAULT_MARGIN)}px 0 0`,
        }}
      >
        <Box width="100%" maxWidth={PLAYER_MAX_WIDTH}>
          <PlaylistLinkInput />
        </Box>

        <Box ref={playerRef} width={playerWidth} height={playerHeight}>
          {renderServices()}
        </Box>

        <Box position="relative" width="100%" maxWidth={PLAYER_MAX_WIDTH}>
          <MediaController />
        </Box>
      </Stack>

      <Box
        position="absolute"
        width={PLAYLIST_WIDTH}
        margin={DEFAULT_MARGIN}
        sx={{ inset: '0 0 0 auto' }}
      >
        <Playlist />
      </Box>
    </PlayerContext.Provider>
  );
};
