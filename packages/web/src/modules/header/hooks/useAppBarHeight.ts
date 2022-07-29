import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { CSSProperties } from '@mui/material/styles/createMixins';

interface MinHeight {
  minHeight: number;
}

export const useAppBarHeight = (): number => {
  const {
    mixins: { toolbar },
    breakpoints,
  } = useTheme();

  const sm = breakpoints.up('sm');
  const xs = breakpoints.up('xs');
  const landscape = '@media (orientation: landscape)';

  const isDesktop = useMediaQuery(sm);
  const isLandscape = useMediaQuery(`${xs} and (orientation: landscape)`);

  let currentToolbarMinHeight;
  if (isDesktop) {
    currentToolbarMinHeight = toolbar[sm];
  } else if (isLandscape) {
    currentToolbarMinHeight = (toolbar[xs] as CSSProperties)[landscape];
  } else {
    currentToolbarMinHeight = toolbar;
  }

  return (currentToolbarMinHeight as MinHeight).minHeight;
};
