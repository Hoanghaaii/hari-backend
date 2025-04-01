import { ConnectOptions } from 'mongoose';

export interface MongoConfig {
  uri: string;
  mongooseOptions?: ConnectOptions;
}
