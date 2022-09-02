import { Menu } from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  List,
  ListItem,
  Stack,
  SwipeableDrawer,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, useContext, useEffect } from 'react';

import {
  AppContext,
  AppContextType,
} from '@app/modules/app/contexts/app.context';
import { AppActionType } from '@app/modules/app/reducers/app.reducer';
import { theme } from '@app/styles/theme';

export const Header: FC = () => {
  // Properties

  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? '';
  const paypalDonateButtonId = process.env.NEXT_PUBLIC_PAYPAL_DONATE_BUTTON_ID;

  const router = useRouter();

  const md = useMediaQuery(theme.breakpoints.up('md'));

  const {
    appState: { isSidebarOpen },
    appDispatch,
  } = useContext(AppContext) as AppContextType;

  // Effects

  // Close sidebar if not visible
  useEffect(() => {
    if (isSidebarOpen && !md) {
      appDispatch({ type: AppActionType.OpenSidebar });
    } else {
      appDispatch({ type: AppActionType.CloseSidebar });
    }
  }, [md, isSidebarOpen, appDispatch]);

  // Element

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Stack
            direction="row"
            spacing={md ? 2 : 1}
            width="100%"
            alignItems="baseline"
          >
            {md ? null : (
              <Box display="flex" alignSelf="center">
                <Button
                  variant="text"
                  disableElevation
                  disableRipple
                  sx={{
                    '&:hover': {
                      background: 'transparent',
                    },
                    minWidth: 0,
                    padding: 0,
                  }}
                  onClick={(): void =>
                    appDispatch({ type: AppActionType.OpenSidebar })
                  }
                >
                  <Typography component="span" lineHeight={0} color="white">
                    <Menu />
                  </Typography>
                </Button>
              </Box>
            )}
            {md ? (
              <>
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
                  <Button
                    variant={router.pathname === '/' ? 'outlined' : 'text'}
                  >
                    <Typography
                      component="span"
                      color="white"
                      textTransform="none"
                    >
                      Home
                    </Typography>
                  </Button>
                </Link>
                <Link href="/player" passHref>
                  <Button
                    variant={
                      router.pathname === '/player' ? 'outlined' : 'text'
                    }
                  >
                    <Typography
                      component="span"
                      color="white"
                      textTransform="none"
                    >
                      Player
                    </Typography>
                  </Button>
                </Link>
                <Link
                  href="https://github.com/dltechy/the-one-playlist"
                  passHref
                >
                  <Button
                    variant="text"
                    href=""
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Typography
                      component="span"
                      color="white"
                      textTransform="none"
                    >
                      GitHub
                    </Typography>
                  </Button>
                </Link>
              </>
            ) : (
              <Typography
                variant="h6"
                component="span"
                color="white"
                textTransform="none"
              >
                {appName}
              </Typography>
            )}

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

      <SwipeableDrawer
        anchor="left"
        open={isSidebarOpen}
        onOpen={(): void => appDispatch({ type: AppActionType.OpenSidebar })}
        onClose={(): void => appDispatch({ type: AppActionType.CloseSidebar })}
      >
        <Box width={200}>
          <List>
            <ListItem>
              <Link href="/" passHref>
                <Button
                  variant={router.pathname === '/' ? 'outlined' : 'text'}
                  fullWidth
                >
                  <Typography
                    component="span"
                    color="white"
                    textTransform="none"
                  >
                    Home
                  </Typography>
                </Button>
              </Link>
            </ListItem>
            <ListItem>
              <Link href="/player" passHref>
                <Button
                  variant={router.pathname === '/player' ? 'outlined' : 'text'}
                  fullWidth
                >
                  <Typography
                    component="span"
                    color="white"
                    textTransform="none"
                  >
                    Player
                  </Typography>
                </Button>
              </Link>
            </ListItem>
            <ListItem>
              <Link href="https://github.com/dltechy/the-one-playlist" passHref>
                <Button
                  variant="text"
                  href=""
                  target="_blank"
                  rel="noopener noreferrer"
                  fullWidth
                >
                  <Typography
                    component="span"
                    color="white"
                    textTransform="none"
                  >
                    GitHub
                  </Typography>
                </Button>
              </Link>
            </ListItem>
          </List>
        </Box>
      </SwipeableDrawer>
    </>
  );
};
