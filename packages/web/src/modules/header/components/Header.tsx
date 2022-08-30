import { AppBar, Box, Button, Stack, Toolbar, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC } from 'react';

export const Header: FC = () => {
  // Properties

  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? '';
  const paypalDonateButtonId = process.env.NEXT_PUBLIC_PAYPAL_DONATE_BUTTON_ID;

  const router = useRouter();

  // Element

  return (
    <AppBar position="static">
      <Toolbar>
        <Stack direction="row" spacing={2} width="100%" alignItems="baseline">
          <Link href="/" passHref>
            <Button
              variant="text"
              disableElevation
              disableRipple
              sx={{
                '&:hover': {
                  background: 'transparent',
                },
              }}
            >
              <Typography
                variant="h6"
                component="span"
                color="white"
                textTransform="none"
              >
                {appName}
              </Typography>
            </Button>
          </Link>

          <Link href="/" passHref>
            <Button variant={router.pathname === '/' ? 'outlined' : 'text'}>
              <Typography component="span" color="white" textTransform="none">
                Home
              </Typography>
            </Button>
          </Link>
          <Link href="/player" passHref>
            <Button
              variant={router.pathname === '/player' ? 'outlined' : 'text'}
            >
              <Typography component="span" color="white" textTransform="none">
                Player
              </Typography>
            </Button>
          </Link>
          <Link href="https://github.com/dltechy/the-one-playlist" passHref>
            <Button
              variant="text"
              href=""
              target="_blank"
              rel="noopener noreferrer"
            >
              <Typography component="span" color="white" textTransform="none">
                GitHub
              </Typography>
            </Button>
          </Link>

          <Box flexGrow={1} />

          {paypalDonateButtonId != null ? (
            <Box
              component="form"
              method="post"
              action="https://www.paypal.com/donate"
              target="_blank"
              alignSelf="center"
              lineHeight={0}
            >
              <Box
                name="hosted_button_id"
                component="input"
                type="hidden"
                value={paypalDonateButtonId}
              />
              <Box
                component="input"
                name="submit"
                type="image"
                title="PayPal - The safer, easier way to pay online!"
                src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif"
                alt="Donate with PayPal button"
                border={0}
              />
            </Box>
          ) : null}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
