import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Modal,
  Stack,
  TextField,
  useMediaQuery,
} from '@mui/material';
import { FC, useContext, useEffect, useState } from 'react';

import {
  PlayerContext,
  PlayerContextType,
} from '@app/modules/player/contexts/player.context';
import { PlayerActionType } from '@app/modules/player/reducers/player.reducer';
import { theme } from '@app/styles/theme';

export const SpotifyKeyManager: FC = () => {
  // Properties

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isClientSecretVisible, setIsClientSecretVisible] = useState(false);

  const sm = useMediaQuery(theme.breakpoints.up('sm'));

  const {
    playerState: { isSpotifyKeyManagerOpen },
    playerDispatch,
  } = useContext(PlayerContext) as PlayerContextType;

  // Effects

  useEffect(() => {
    setClientId(localStorage.getItem('spotifyClientId') ?? '');
    setClientSecret(localStorage.getItem('spotifyClientSecret') ?? '');
  }, []);

  // Handlers

  const handleSaveClick = (): void => {
    if (clientId && clientSecret) {
      localStorage.setItem('spotifyClientId', clientId);
      localStorage.setItem('spotifyClientSecret', clientSecret);
    } else {
      localStorage.removeItem('spotifyClientId');
      localStorage.removeItem('spotifyClientSecret');
    }

    setIsClientSecretVisible(false);

    playerDispatch({
      type: PlayerActionType.CloseSpotifyKeyManager,
    });
  };

  const handleClose = (): void => {
    setClientId(localStorage.getItem('spotifyClientId') ?? '');
    setClientSecret(localStorage.getItem('spotifyClientSecret') ?? '');
    setIsClientSecretVisible(false);

    playerDispatch({
      type: PlayerActionType.CloseSpotifyKeyManager,
    });
  };

  // Element

  return (
    <Modal open={isSpotifyKeyManagerOpen} onClose={(): void => handleClose()}>
      <Box
        display="flex"
        width="100%"
        height="100%"
        sx={{ pointerEvents: 'none' }}
      >
        <Box display="flex" width="100%" height="100%" margin="auto">
          <Stack
            spacing={2}
            width={sm ? '75%' : '100%'}
            maxWidth={sm ? 800 : '100%'}
            maxHeight="100%"
            padding={4}
            margin="auto"
            bgcolor="background.paper"
            sx={{ pointerEvents: 'auto' }}
          >
            <TextField
              label="Spotify client ID"
              variant="outlined"
              fullWidth
              value={clientId}
              onChange={(event): void => setClientId(event.target.value.trim())}
            />
            <TextField
              label="Spotify client secret"
              variant="outlined"
              type={isClientSecretVisible ? 'text' : 'password'}
              fullWidth
              value={clientSecret}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Toggle Spotify client secret visibility"
                      onClick={(): void =>
                        setIsClientSecretVisible((prev) => !prev)
                      }
                    >
                      {isClientSecretVisible ? (
                        <Visibility />
                      ) : (
                        <VisibilityOff />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              onChange={(event): void =>
                setClientSecret(event.target.value.trim())
              }
            />

            <Stack direction="row-reverse" spacing={1}>
              <Box width={96}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={(): void => handleClose()}
                >
                  Cancel
                </Button>
              </Box>
              <Box width={96}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={(): void => handleSaveClick()}
                >
                  Save
                </Button>
              </Box>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
};
