import { Box } from '@mui/material';
import Head from 'next/head';
import { FC } from 'react';

import { Header } from '@app/modules/header/components/Header';
import { useAppBarHeight } from '@app/modules/header/hooks/useAppBarHeight';

interface Props {
  children?: JSX.Element;
}

export const BasePage: FC<Props> = ({ children }) => {
  // Properties

  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? '';

  const appBarHeight = useAppBarHeight();

  // Element

  return (
    <Box position="fixed" sx={{ inset: 0 }}>
      <Head>
        <title>{appName}</title>
      </Head>

      <Header />

      <Box
        position="absolute"
        width="100%"
        height={`calc(100% - ${appBarHeight}px)`}
        sx={{ inset: `${appBarHeight}px 0 0` }}
      >
        {children}
      </Box>
    </Box>
  );
};
