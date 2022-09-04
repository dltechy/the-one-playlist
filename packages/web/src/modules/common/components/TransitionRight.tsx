import { Slide } from '@mui/material';
import { FC } from 'react';

interface Props {
  children: JSX.Element;
}

export const TransitionRight: FC<Props> = (props) => (
  <Slide {...props} direction="right" />
);
