import { AxiosError } from 'axios';

/** Uniform error for all /v1/relay/* calls — carries the HTTP status and the backend `{ message }`. */
export class RelayApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'RelayApiError';
    this.status = status;
  }
}

export function normalizeError(error: unknown): RelayApiError {
  if (error instanceof RelayApiError) return error;

  const axiosErr = error as AxiosError<{ message?: string }>;
  if (axiosErr?.isAxiosError) {
    const status = axiosErr.response?.status ?? 0;
    const message =
      axiosErr.response?.data?.message ?? axiosErr.message ?? 'Request failed';
    return new RelayApiError(message, status);
  }

  return new RelayApiError(
    error instanceof Error ? error.message : 'Unknown error',
    0,
  );
}
