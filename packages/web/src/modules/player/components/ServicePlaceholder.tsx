import { AddCircleOutline, Edit } from '@mui/icons-material';
import { Box, Stack, Typography, useMediaQuery } from '@mui/material';
import { FC, useContext } from 'react';

import { theme } from '@app/styles/theme';

import { PlayerContext, PlayerContextType } from '../contexts/player.context';
import { PlayerActionType } from '../reducers/player.reducer';

export const ServicePlaceholder: FC = () => {
  // Properties

  const { playerDispatch } = useContext(PlayerContext) as PlayerContextType;

  const md = useMediaQuery(theme.breakpoints.up('md'));

  // Element

  return (
    <Box
      display="flex"
      width="100%"
      height="100%"
      border="1px solid"
      borderColor="text.secondary"
      color="text.secondary"
      sx={{ cursor: 'pointer' }}
      onClick={(): void =>
        playerDispatch({ type: PlayerActionType.OpenPlaylistManager })
      }
    >
      <Stack
        spacing={md ? 4 : 0}
        width="75%"
        margin="auto"
        justifyContent="center"
        alignItems="center"
        textAlign="center"
      >
        <Box fontSize={md ? '3rem' : '1.5rem'} lineHeight={md ? 0 : 1.5}>
          <AddCircleOutline fontSize="inherit" />
        </Box>
        <Typography variant={md ? 'h5' : 'body1'} component="span">
          No playlists loaded.
        </Typography>
        <Typography variant={md ? 'h5' : 'body1'} component="span">
          Click this box or the edit (
          <Edit
            sx={{
              position: 'relative',
              top: 4,
            }}
          />
          ) button above the playlist view to manage loaded playlists.
        </Typography>
      </Stack>
    </Box>
  );
};
