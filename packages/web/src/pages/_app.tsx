import { CacheProvider, EmotionCache } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppProps } from 'next/app';
import { FC, useMemo, useReducer } from 'react';

import { createEmotionCache } from '@app/lib/emotion/createEmotionCache';
import {
  AppContext,
  AppContextType,
} from '@app/modules/app/contexts/app.context';
import { appReducer } from '@app/modules/app/reducers/app.reducer';
import { GTag } from '@app/modules/gtag/components/GTag';
import { theme } from '@app/styles/theme';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

const MyApp: FC<MyAppProps> = (props) => {
  // Properties

  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  const [appState, appDispatch] = useReducer(appReducer, {
    isSidebarOpen: false,
  });

  const contextState = useMemo<AppContextType>(
    () => ({ appState, appDispatch }),
    [appState],
  );

  // Element

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <GTag />

        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <AppContext.Provider value={contextState}>
          <Component {...pageProps} />
        </AppContext.Provider>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default MyApp;
