import * as winston from 'winston'

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug'
export type LogFormat = 'json' | 'pretty'

export interface LoggerConfig {
    level?: LogLevel
    format?: LogFormat
    silent?: boolean
    service?: string
}

export function createLogger(config: LoggerConfig = {}): winston.Logger {
    const level = config.level ?? 'info'
    const formatType = config.format ?? 'pretty'
    const silent = config.silent ?? false

    const formats = []

    if (formatType === 'pretty') {
        formats.push(winston.format.colorize())
    }

    formats.push(winston.format.simple())

    const format =
        formatType === 'json' ? winston.format.json() : winston.format.combine(...formats)

    return winston.createLogger({
        level,
        format,
        silent,
        defaultMeta: config.service ? { service: config.service } : undefined,
        transports: [new winston.transports.Console()],
    })
}

// Default logger instance - consumer can reconfigure if needed
export const logger = createLogger()

export default logger
