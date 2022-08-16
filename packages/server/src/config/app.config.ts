export interface AppConfig {
  nodeEnv: string;
  port: number;
  name?: string;
  corsOrigin?: string;
  baseUrl: string;
  webBaseUrl: string;
}
