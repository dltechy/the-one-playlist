import { AppBar, Box, Toolbar, Typography } from '@mui/material';
import { FC } from 'react';

export const Header: FC = () => {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? '';

  return (
    <AppBar position="static">
      <Toolbar>
        <Box display="flex" alignItems="center">
          <Typography variant="h6" component="div">
            {appName}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
