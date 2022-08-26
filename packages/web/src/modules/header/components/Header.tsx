import { AppBar, Box, Stack, Toolbar, Typography } from '@mui/material';
import { FC } from 'react';

export const Header: FC = () => {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? '';
  const paypalDonateButtonId = process.env.NEXT_PUBLIC_PAYPAL_DONATE_BUTTON_ID;

  return (
    <AppBar position="static">
      <Toolbar>
        <Stack direction="row" spacing={2} width="100%" alignItems="baseline">
          <Typography variant="h6" component="div">
            {appName}
          </Typography>

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
