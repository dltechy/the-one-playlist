export const getDurationString = ({
  duration,
}: {
  duration: number;
}): string => {
  let seconds = Math.floor((Number.isNaN(duration) ? 0 : duration) / 1000);
  let minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  seconds %= 60;
  minutes %= 60;

  if (hours > 0) {
    return `${hours}:${`${minutes}`.padStart(2, '0')}:${`${seconds}`.padStart(
      2,
      '0',
    )}`;
  }
  return `${minutes}:${`${seconds}`.padStart(2, '0')}`;
};

export const getProgressString = ({
  duration,
  progress,
}: {
  duration: number;
  progress: number;
}): string => {
  let seconds = Math.floor((Number.isNaN(progress) ? 0 : progress) / 1000);
  let minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  seconds %= 60;
  minutes %= 60;

  if (duration >= 3600000) {
    return `${hours}:${`${minutes}`.padStart(2, '0')}:${`${seconds}`.padStart(
      2,
      '0',
    )}`;
  }
  return `${minutes}:${`${seconds}`.padStart(2, '0')}`;
};
