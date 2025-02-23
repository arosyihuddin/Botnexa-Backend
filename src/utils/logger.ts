// utils/logger.ts
export const logger = {
    info: (message: string, data?: any) => {
        const time = new Date().toLocaleTimeString("en-US", { hour12: false });
        console.log(`[\x1b[36mINFO\x1b[0m] \x1b[1m\x1b[90m${time}\x1b[0m ${message}`, data || "");
    },
    warn: (message: string, data?: any) => {
        const time = new Date().toLocaleTimeString("en-US", { hour12: false });
        console.warn(`[\x1b[33mWARN\x1b[0m] \x1b[1m\x1b[90m${time}\x1b[0m ${message}`, data || "");
    },
    error: (message: string, data?: any) => {
        const time = new Date().toLocaleTimeString("en-US", { hour12: false });
        console.error(`[\x1b[31mERROR\x1b[0m] \x1b[1m\x1b[90m${time}\x1b[0m ${message}`, data || "");
    }
};