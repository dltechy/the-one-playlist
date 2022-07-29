import { AxiosError, AxiosResponse } from 'axios';

const createAxiosError = ({
  status,
  data,
}: {
  status: number;
  data: string;
}): AxiosError => {
  return new AxiosError(undefined, undefined, undefined, undefined, {
    status,
    data,
  } as AxiosResponse);
};

const createSamples = (): {
  error: AxiosError;
} => {
  const error = createAxiosError({
    status: 500,
    data: 'sampleAxiosErrorData',
  });

  return {
    error,
  };
};

export const axiosSamples = createSamples();
