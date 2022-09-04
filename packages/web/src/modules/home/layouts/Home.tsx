import { ArrowForward } from '@mui/icons-material';
import { Box, Button, Stack, Typography, useMediaQuery } from '@mui/material';
import Link from 'next/link';
import { FC } from 'react';

import { theme } from '@app/styles/theme';

export const Home: FC = () => {
  // Properties

  const md = useMediaQuery(theme.breakpoints.up('md'));
  const sm = useMediaQuery(theme.breakpoints.up('sm'));

  // Element

  return (
    <Box
      display={md ? 'flex' : 'block'}
      width="100%"
      height="100%"
      padding={4}
      overflow="auto"
    >
      <Stack
        spacing={md ? 8 : 4}
        width={sm ? '75%' : '100%'}
        margin="auto"
        justifyContent="center"
        alignItems="center"
        textAlign="center"
        fontWeight="bold"
      >
        <Typography
          variant={md ? 'h2' : 'h4'}
          component="h1"
          fontWeight="inherit"
        >
          The One Playlist
        </Typography>

        <Stack
          direction={sm ? 'row' : 'column'}
          spacing={sm ? 4 : 0}
          alignItems="center"
        >
          <Box
            display="flex"
            width={sm ? '50%' : '100%'}
            justifyContent={sm ? 'right' : 'center'}
          >
            <Box
              component="img"
              src="/assets/home/youtube-drawing.png"
              alt="Promo"
              width="75%"
              height="75%"
            />
          </Box>
          <Box>
            <Typography variant={md ? 'h2' : 'h4'} component="span">
              +
            </Typography>
          </Box>
          <Box
            display="flex"
            width={sm ? '50%' : '100%'}
            justifyContent={sm ? 'left' : 'center'}
          >
            <Box
              component="img"
              src="/assets/home/spotify-drawing.png"
              alt="Promo"
              width="75%"
              height="75%"
            />
          </Box>
        </Stack>

        <Typography
          variant={md ? 'h4' : 'h6'}
          component="span"
          fontWeight="inherit"
        >
          Listen to media from YouTube and Spotify in a single playlist!
        </Typography>

        <Link href="/player" passHref>
          <Button variant="contained" sx={{ borderRadius: 8 }}>
            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              alignItems="center"
              fontSize={md ? '2.5rem' : '1.5rem'}
            >
              <Typography
                variant={md ? 'h4' : 'h6'}
                component="span"
                fontWeight="bold"
              >
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
