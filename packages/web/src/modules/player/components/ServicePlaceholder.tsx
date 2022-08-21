import { AddCircleOutline, Edit } from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';
import { FC, useContext } from 'react';

import { PlayerContext, PlayerContextType } from '../contexts/player.context';
import { PlayerActionType } from '../reducers/player.reducer';

export const ServicePlaceholder: FC = () => {
  // Properties

  const { playerDispatch } = useContext(PlayerContext) as PlayerContextType;

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
        spacing={4}
        width="50%"
        margin="auto"
        justifyContent="center"
        alignItems="center"
        textAlign="center"
      >
        <Box fontSize="3rem" lineHeight={0}>
          <AddCircleOutline fontSize="inherit" />
        </Box>
        <Typography variant="h5" component="span">
          No playlists loaded.
        </Typography>
        <Typography variant="h5" component="span">
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
