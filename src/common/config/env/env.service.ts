import { Injectable } from '@nestjs/common';
import { env } from './env';

@Injectable()
export class EnvService {
  get Env() {
    return env;
  }

  get isProduction() {
    return this.Env.NODE_ENV === 'production';
  }
}
