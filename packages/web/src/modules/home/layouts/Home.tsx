import { ArrowForward } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { FC } from 'react';

export const Home: FC = () => {
  return (
    <Box display="flex" width="100%" height="100%" padding={4} overflow="auto">
      <Stack
        spacing={8}
        width="75%"
        margin="auto"
        justifyContent="center"
        alignItems="center"
        textAlign="center"
        fontWeight="bold"
      >
        <Typography variant="h2" component="span" fontWeight="inherit">
          The One Playlist
        </Typography>

        <Stack direction="row" spacing={4} alignItems="center">
          <Box display="flex" width="50%" justifyContent="right">
            <Box
              component="img"
              src="/assets/home/YouTube Drawing.png"
              alt="Promo"
              width="75%"
              height="75%"
            />
          </Box>
          <Box>
            <Typography variant="h2" component="span">
              +
            </Typography>
          </Box>
          <Box display="flex" width="50%" justifyContent="left">
            <Box
              component="img"
              src="/assets/home/Spotify Drawing.png"
              alt="Promo"
              width="75%"
              height="75%"
            />
          </Box>
        </Stack>

        <Typography variant="h4" component="span" fontWeight="inherit">
          Listen to media from YouTube and Spotify in a single playlist!
        </Typography>

        <Link href="/player" passHref>
          <Button variant="contained" sx={{ borderRadius: 8 }}>
            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              alignItems="center"
              fontSize="2.5rem"
            >
              <Typography variant="h4" component="span" fontWeight="bold">
                Go to player
              </Typography>
              <ArrowForward fontSize="inherit" />
            </Stack>
          </Button>
        </Link>
      </Stack>
    </Box>
  );
};
