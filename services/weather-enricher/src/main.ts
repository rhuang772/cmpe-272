import { loadConfig } from './config';
import { createHttpServer } from './http/server';
import { NoaaAlertsClient } from './noaa/noaa-alerts-client';
import { WeatherEnricher } from './weather-enricher';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const noaaClient = new NoaaAlertsClient(
    config.noaaAlertsBaseUrl,
    config.noaaUserAgent,
  );
  const enricher = new WeatherEnricher(
    noaaClient,
    config.weatherCacheTtlMs,
    config.enableSeattleThunderstormDemo,
  );

  createHttpServer(enricher, config.port);

  console.log('Weather enricher started');
  console.log(`NOAA base URL: ${config.noaaAlertsBaseUrl}`);
  console.log(
    `Seattle thunderstorm demo: ${config.enableSeattleThunderstormDemo ? 'enabled' : 'disabled'}`,
  );
}

bootstrap().catch((error: unknown) => {
  const message =
    error instanceof Error
      ? `${error.message}\n${error.stack ?? ''}`
      : String(error);
  console.error(message);
  process.exit(1);
});
