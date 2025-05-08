import type { URL } from 'node:url';
import { StatusError } from '@/utils/status-error.js';

export class StatusRedirect extends StatusError {
  public name: string;
  public location?: string;

  constructor(message: string, requestUrl: URL, statusCode: number, statusMessage: string, location?: string) {
    super(message, requestUrl, statusCode, statusMessage);
    this.name = 'StatusRedirect';
    this.location = location;
  }
}
