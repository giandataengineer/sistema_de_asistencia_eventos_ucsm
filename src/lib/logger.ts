type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel = process.env.NODE_ENV === "production" ? "info" : "debug";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function formatEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.context ? `[${entry.context}]` : ""} ${entry.message}`;
  if (entry.data && Object.keys(entry.data).length > 0) {
    return `${base} ${JSON.stringify(entry.data)}`;
  }
  return base;
}

function createEntry(level: LogLevel, message: string, context?: string, data?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    data,
  };
}

function log(level: LogLevel, message: string, context?: string, data?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const entry = createEntry(level, message, context, data);
  const formatted = formatEntry(entry);

  switch (level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export function createLogger(context: string) {
  return {
    debug: (message: string, data?: Record<string, unknown>) => log("debug", message, context, data),
    info: (message: string, data?: Record<string, unknown>) => log("info", message, context, data),
    warn: (message: string, data?: Record<string, unknown>) => log("warn", message, context, data),
    error: (message: string, data?: Record<string, unknown>) => log("error", message, context, data),
  };
}
