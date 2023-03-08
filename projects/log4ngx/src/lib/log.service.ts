import { Inject, Injectable, Injector } from '@angular/core';

import { Appender } from './appenders';
import { Level } from './level';
import { LogServiceConfig, LOG_SERVICE_CONFIG_TOKEN } from './log-service-config';
import { Logger } from './logger';
import { LoggerConfig } from './logger-config';
import { LoggingEvent } from './logging-event';

@Injectable()
export class LogService {
  private _loggers: Map<string, Logger> = new Map();
  private _appenders: Map<string, Appender> = new Map();
  private _loggerConfigs: Map<string, LoggerConfig> = new Map();

  constructor(injector: Injector,
              @Inject(LOG_SERVICE_CONFIG_TOKEN) config: LogServiceConfig) {
    for (const appenderConfig of config.appenders) {
      const appender: Appender = injector.get(appenderConfig.providerToken);
      appender.initialize(appenderConfig);

      this._appenders.set(appender.name, appender);
    }

    for (const loggerConfig of config.loggers) {
      this._loggerConfigs.set(loggerConfig.loggerName, loggerConfig);
    }
  }

  public getLogger(name: string): Logger {
    let logger: Logger | undefined = this._loggers.get(name);

    if (!logger) {
      logger = new Logger(name, this);
      this._loggers.set(name, logger);
    }

    return logger;
  }

  public dispatch(loggingEvent: LoggingEvent): void {
    let loggerConfig: LoggerConfig | undefined = this._loggerConfigs.get(loggingEvent.loggerName);

    if (!loggerConfig) {
      loggerConfig = this._loggerConfigs.get('');
    }

    if (loggerConfig) {
      const level: Level | undefined = Level.getLevel(loggerConfig.level);

      /* Need to check if a level was returned just in case the name in the config is wrong */
      if (level && loggingEvent.level.value >= level.value) {
        for (const appenderName of loggerConfig.appenderNames) {
          const appender: Appender | undefined = this._appenders.get(appenderName);
          if (appender) {
            appender.append(loggingEvent);
          }
        }
      }
    }
  }
}
