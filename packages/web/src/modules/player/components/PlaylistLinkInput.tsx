import { CheckCircle } from '@mui/icons-material';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { FC, FormEvent, useContext, useEffect, useRef, useState } from 'react';

import { getYouTubeVideoDetails } from '@app/modules/youtube/apis/youtube.api';
import { loadYouTubePlaylist } from '@app/modules/youtube/helpers/youtubePlaylist.helper';

import { PlayerContext, PlayerContextType } from '../contexts/player.context';
import { PlayerActionType } from '../reducers/player.reducer';
import { createEmptyMediaInfoList } from '../types/mediaInfoList';
import { MediaService } from '../types/mediaService';

export const PlaylistLinkInput: FC = () => {
  // Properties

  const inputRef = useRef<HTMLElement>(null);

  const [playlistLink, setPlaylistLink] = useState('');
  const [isPlaylistLinkValid, setIsPlaylistLinkValid] = useState(true);

  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  const { playerDispatch } = useContext(PlayerContext) as PlayerContextType;

  // General methods

  const loadYouTube = async (playlistId: string): Promise<void> => {
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
  };

  // Effects

  // Focus on input when page is loaded
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handlers

  const handleLoadPlaylistClick = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const loadPlaylist = async (): Promise<void> => {
      const linkRegex =
        /^https?:\/\/www\.youtube\.com\/playlist\?.*list=([^&]+).*$/;

      let hasMatch = false;

      const match = linkRegex.exec(playlistLink);
      if (match && match[1]) {
        if (!isLoadingVideo) {
          setIsLoadingVideo(true);

          const playlistId = match[1];
          await loadYouTube(playlistId);

          hasMatch = true;
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
        setIsLoadingVideo(false);
      });
  };

  // Element

  return (
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
                disabled={isLoadingVideo}
              >
                <CheckCircle fontSize="large" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        onChange={(event): void => setPlaylistLink(event.target.value.trim())}
      />
    </form>
  );
};
