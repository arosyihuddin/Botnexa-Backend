import { Request, Response, NextFunction } from "express";
import { logger } from "../../utils/logger";

const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    // Log ketika request masuk
    logger.info(`${req.method} ${req.url} from ${req.ip || "unknown"}`);

    // Log ketika response selesai dikirim
    res.on("finish", () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.url} - Status: ${res.statusCode}, Duration: ${duration}ms`);
    });

    next();
};

export default loggerMiddleware;