import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

/**
 * Winston logger configuration
 */
export const createWinstonConfig = (isProduction: boolean) => {
  const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');
  const logDir = process.env.LOG_DIR || 'logs';

  // Custom format for file logging
  const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  );

  // Custom format for console logging
  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    nestWinstonModuleUtilities.format.nestLike('MES', {
      colors: !isProduction,
      prettyPrint: !isProduction,
    }),
  );

  // Define log transports
  const transports: winston.transport[] = [];

  // Console transport
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: logLevel,
    }),
  );

  // File transports for production and development
  if (isProduction || process.env.ENABLE_FILE_LOGGING === 'true') {
    // Combined log - all levels
    transports.push(
      new DailyRotateFile({
        dirname: logDir,
        filename: 'combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: fileFormat,
        level: logLevel,
      }),
    );

    // Error log - only errors
    transports.push(
      new DailyRotateFile({
        dirname: logDir,
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        format: fileFormat,
        level: 'error',
      }),
    );

    // Application log - info and above
    transports.push(
      new DailyRotateFile({
        dirname: logDir,
        filename: 'application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '7d',
        format: fileFormat,
        level: 'info',
      }),
    );

    // Access log for HTTP requests
    transports.push(
      new DailyRotateFile({
        dirname: `${logDir}/access`,
        filename: 'access-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '50m',
        maxFiles: '7d',
        format: fileFormat,
        level: 'http',
      }),
    );
  }

  // Debug log in development
  if (!isProduction && process.env.ENABLE_DEBUG_LOG === 'true') {
    transports.push(
      new winston.transports.File({
        dirname: logDir,
        filename: 'debug.log',
        format: fileFormat,
        level: 'debug',
        maxsize: 10485760, // 10MB
        maxFiles: 1,
        tailable: true,
      }),
    );
  }

  return {
    level: logLevel,
    format: fileFormat,
    transports,
    exitOnError: false,
    silent: process.env.DISABLE_LOGGING === 'true',
  };
};

/**
 * Create custom log levels
 */
export const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'grey',
  },
};

/**
 * Create logger instance
 */
export const createLogger = (isProduction: boolean): winston.Logger => {
  const logger = winston.createLogger(createWinstonConfig(isProduction));

  // Add custom levels
  winston.addColors(customLevels.colors);

  return logger;
};
