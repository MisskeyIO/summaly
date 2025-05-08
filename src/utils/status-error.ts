import type { URL } from 'node:url';

export class StatusError extends Error {
  public name: string;
  public requestUrl: URL;
  public statusCode: number;
  public statusMessage: string;
  public isPermanentError: boolean;

  constructor(message: string, requestUrl: URL, statusCode: number, statusMessage: string) {
    super(message);
    this.name = 'StatusError';
    this.requestUrl = requestUrl;
    this.statusCode = statusCode;
    this.statusMessage = statusMessage;
    this.isPermanentError = this.statusCode >= 400 && this.statusCode < 500;
  }
}
