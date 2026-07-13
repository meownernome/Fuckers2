"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    static formatTime() {
        return new Date().toISOString().replace('T', ' ').substring(0, 19);
    }
    static info(message, ...args) {
        console.log(`[${this.formatTime()}] [INFO] ${message}`, ...args);
    }
    static warn(message, ...args) {
        console.warn(`[${this.formatTime()}] [WARN] ${message}`, ...args);
    }
    static error(message, error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`[${this.formatTime()}] [ERROR] ${message}`, errMsg);
    }
    static debug(message, ...args) {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[${this.formatTime()}] [DEBUG] ${message}`, ...args);
        }
    }
    static rateLimit(message, retryAfter) {
        console.warn(`[${this.formatTime()}] [RATELIMIT] ${message} - Retry after ${retryAfter}ms`);
    }
    static success(message, ...args) {
        console.log(`[${this.formatTime()}] [SUCCESS] ${message}`, ...args);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map