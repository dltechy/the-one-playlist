import { CheckCircle } from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material';
import cookie from 'cookie';
import { useRouter } from 'next/router';
import {
  FC,
  FormEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  getSpotifyPlaylistTrackDetails,
  spotifyLogin,
  spotifyLogout,
} from '@app/modules/spotify/apis/spotify.api';
import {
  connect as spotifyConnect,
  disconnect as spotifyDisconnect,
} from '@app/modules/spotify/helpers/spotify.helper';
import { getYouTubeVideoDetails } from '@app/modules/youtube/apis/youtube.api';
import { loadYouTubePlaylist } from '@app/modules/youtube/helpers/youtubePlaylist.helper';

import { PlayerContext, PlayerContextType } from '../contexts/player.context';
import { PlayerActionType } from '../reducers/player.reducer';
import { createEmptyMediaInfoList } from '../types/mediaInfoList';
import { MediaService } from '../types/mediaService';

export const PlaylistLinkInput: FC = () => {
  // Properties

  const router = useRouter();
  const prevIsRouterReady = useRef(false);

  const inputRef = useRef<HTMLElement>(null);

  const [playlistLink, setPlaylistLink] = useState('');
  const [isPlaylistLinkValid, setIsPlaylistLinkValid] = useState(true);

  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  const [spotifyRefreshToken, setSpotifyRefreshToken] = useState<string>('');

  const { playerDispatch } = useContext(PlayerContext) as PlayerContextType;

  const [tick, setTick] = useState(false);
  const prevTick = useRef(!tick);

  // General methods

  const getQueryPlaylistIds = useCallback((): string[] => {
    const { query } = router;
    let playlistIds: string[];
    if (query.playlistIds != null) {
      playlistIds = Array.isArray(query.playlistIds)
        ? query.playlistIds
        : [query.playlistIds];
    } else {
      playlistIds = [];
    }

    return playlistIds;
  }, [router]);

  const loadYouTube = useCallback(
    async (playlistId: string): Promise<void> => {
      const videoIds = await loadYouTubePlaylist(playlistId);
      const videos = await getYouTubeVideoDetails(videoIds);

      playerDispatch({
        type: PlayerActionType.AddMediaList,
        payload: {
          originalMediaIds: videoIds.map((id) => ({
            service: MediaService.YouTube,
            id,
          })),
          mediaInfoList: {
            ...createEmptyMediaInfoList(),
            [MediaService.YouTube]: videos,
          },
        },
      });
    },
    [playerDispatch],
  );

  const loadSpotify = useCallback(
    async (playlistId: string): Promise<void> => {
      const { trackIds, tracks } = await getSpotifyPlaylistTrackDetails(
        playlistId,
      );

      playerDispatch({
        type: PlayerActionType.AddMediaList,
        payload: {
          originalMediaIds: trackIds.map((id) => ({
            service: MediaService.Spotify,
            id,
          })),
          mediaInfoList: {
            ...createEmptyMediaInfoList(),
            [MediaService.Spotify]: tracks,
          },
        },
      });
    },
    [playerDispatch],
  );

  // Effects

  // Focus on input when page is loaded
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Update login state
  useEffect(() => {
    if (tick !== prevTick.current) {
      const cookies = cookie.parse(document.cookie);
      setSpotifyRefreshToken(cookies.spotifyRefreshToken);

      if (cookies.spotifyRefreshToken != null) {
        spotifyConnect().catch();
      } else {
        spotifyDisconnect();
      }

      prevTick.current = tick;
      setTimeout(() => setTick((prev) => !prev), 1000);
    }
  }, [tick]);

  // Load playlists from query
  useEffect(() => {
    if (!prevIsRouterReady.current && router.isReady) {
      const loadPlaylists = async (): Promise<void> => {
        const playlistIds = getQueryPlaylistIds();
        if (playlistIds != null) {
          setIsLoadingMedia(true);

          const loadedPlaylistIds: string[] = [];

          for (let i = 0; i < playlistIds.length; i += 1) {
            try {
              const playlistId = playlistIds[i];
              const [service, id] = playlistId.split(' ');

              if (service != null && id != null) {
                /* eslint-disable no-await-in-loop */
                switch (service) {
                  case MediaService.YouTube: {
                    await loadYouTube(id);
                    break;
                  }
                  case MediaService.Spotify: {
                    await loadSpotify(id);
                    break;
                  }
                  default: {
                    break;
                  }
                }
                /* eslint-enable no-await-in-loop */
              }

              loadedPlaylistIds.push(playlistId);
            } catch {
              // Do nothing
            }
          }
        }
      };
      loadPlaylists()
        .catch()
        .finally(() => {
          setIsLoadingMedia(false);
        });

      prevIsRouterReady.current = router.isReady;
    }
  }, [router, getQueryPlaylistIds, loadYouTube, loadSpotify]);

  // Handlers

  const handleLoadPlaylistClick = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const loadPlaylist = async (): Promise<void> => {
      const youtubeLinkRegex =
        /^https?:\/\/www\.youtube\.com\/playlist\?.*list=([^&]+).*$/;
      const spotifyLinkRegex =
        /^https?:\/\/(?:[^/]*\.)*spotify\.com\/playlist\/([^/?]+).*$/;

      let hasMatch = false;

      let match = youtubeLinkRegex.exec(playlistLink);
      if (match && match[1]) {
        if (!isLoadingMedia) {
          setIsLoadingMedia(true);

          const playlistId = match[1];
          await loadYouTube(playlistId);

          router.replace({
            query: {
              ...router.query,
              playlistIds: [
                ...getQueryPlaylistIds(),
                `${MediaService.YouTube} ${playlistId}`,
              ],
            },
          });
          hasMatch = true;
        }
      }

      if (!match) {
        match = spotifyLinkRegex.exec(playlistLink);
        if (match && match[1]) {
          if (!isLoadingMedia) {
            setIsLoadingMedia(true);

            const playlistId = match[1];
            await loadSpotify(playlistId);

            router.replace({
              query: {
                ...router.query,
                playlistIds: [
                  ...getQueryPlaylistIds(),
                  `${MediaService.Spotify} ${playlistId}`,
                ],
              },
            });
            hasMatch = true;
          }
        }
      }

      if (hasMatch) {
        playerDispatch({ type: PlayerActionType.Play });

        setPlaylistLink('');
        setIsPlaylistLinkValid(true);
      } else {
        setIsPlaylistLinkValid(false);
      }
    };
    loadPlaylist()
      .catch()
      .finally(() => {
        setIsLoadingMedia(false);
      });
  };

  // Element

  return (
    <Stack spacing={2}>
      <form onSubmit={handleLoadPlaylistClick}>
        <TextField
          label="Playlist link"
          variant="outlined"
          fullWidth
          value={playlistLink}
          error={!isPlaylistLinkValid}
          helperText={isPlaylistLinkValid ? '' : 'Invalid playlist link'}
          inputRef={inputRef}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  type="submit"
                  aria-label="Load playlist"
                  disabled={isLoadingMedia}
                >
                  <CheckCircle fontSize="large" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          onChange={(event): void => setPlaylistLink(event.target.value.trim())}
        />
      </form>

      <Box display="flex" width="100%" justifyContent="center">
        {spotifyRefreshToken == null ? (
          <Button
            variant="contained"
            onClick={(): Promise<void> => spotifyLogin().catch()}
          >
            Login with Spotify
          </Button>
        ) : (
          <Button
            variant="outlined"
            onClick={(): Promise<void> => spotifyLogout().catch()}
          >
            Logout from Spotify
          </Button>
        )}
      </Box>
    </Stack>
  );
};
