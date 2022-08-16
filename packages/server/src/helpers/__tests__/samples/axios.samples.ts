import { AxiosError, AxiosResponse } from 'axios';

const createAxiosError = (res: AxiosResponse): AxiosError => {
  return new AxiosError(undefined, undefined, undefined, undefined, res);
};

const createSamples = (): {
  unauthorizedResponse: AxiosResponse;
  unauthorizedError: AxiosError;
  errorResponse: AxiosResponse;
  error: AxiosError;
} => {
  const unauthorizedResponse = {
    status: 401,
    data: 'sampleAxiosUnauthorizedErrorData',
  } as AxiosResponse;
  const unauthorizedError = createAxiosError(unauthorizedResponse);

  const errorResponse = {
    status: 500,
    data: 'sampleAxiosErrorData',
  } as AxiosResponse;
  const error = createAxiosError(errorResponse);

  return {
    unauthorizedResponse,
    unauthorizedError,
    errorResponse,
    error,
  };
};

export const axiosSamples = createSamples();
