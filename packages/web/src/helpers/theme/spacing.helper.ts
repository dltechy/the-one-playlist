import { theme } from '@app/styles/theme';

export const getSpacingPx = (value: number): number => {
  const spacing = theme.spacing(value);
  const spacingValueString = spacing.slice(0, -2);
  const spacingValue = Number.isNaN(spacingValueString)
    ? 0
    : parseFloat(spacingValueString);
  return spacingValue;
};
