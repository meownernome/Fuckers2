export declare class Logger {
    private static formatTime;
    static info(message: string, ...args: unknown[]): void;
    static warn(message: string, ...args: unknown[]): void;
    static error(message: string, error?: Error | unknown): void;
    static debug(message: string, ...args: unknown[]): void;
    static rateLimit(message: string, retryAfter: number): void;
    static success(message: string, ...args: unknown[]): void;
}
//# sourceMappingURL=Logger.d.ts.map