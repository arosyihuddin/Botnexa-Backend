import { Request, Response } from "express";
import { ActivityLogs, LogAction, LogStatus } from "../database/entities/ActivityLogs";
import { Like, Repository } from "typeorm";
import { Profiles } from "../database/entities/Profiles";
import { Bots } from "../database/entities/Bots";
import { AppDataSource } from "../config/typeorm.config";

interface AuthRequest extends Request {
    user?: {
        id: string;
    };
}

interface CreateLogRequest {
    botId?: number;
    action: LogAction;
    details: string;
    status: LogStatus;
}

interface LogResponse {
    id: number;
    timestamp: Date;
    botName: string;
    action: LogAction;
    details: string;
    status: LogStatus;
}

// Get repositories
const logsRepository = AppDataSource.getRepository(ActivityLogs);
const usersRepository = AppDataSource.getRepository(Profiles);
const botsRepository = AppDataSource.getRepository(Bots);

// Helper function to ensure string
const ensureString = (value: string | undefined | null): string => value || '';

export const getLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                status: "error",
                message: "Unauthorized"
            });
            return;
        }

        // Parse query parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const botId = req.query.botId ? parseInt(req.query.botId as string) : undefined;
        const action = req.query.action as LogAction;
        const status = req.query.status as LogStatus;
        const search = req.query.search as string;

        // Calculate offset
        const offset = (page - 1) * limit;

        // Create query builder
        const queryBuilder = logsRepository.createQueryBuilder('log')
            .leftJoinAndSelect('log.bot', 'bot')
            .leftJoinAndSelect('log.user', 'user')
            .where('user.id = :userId', { userId });

        // Add filters
        if (botId) {
            queryBuilder.andWhere('bot.id = :botId', { botId });
        }

        if (action) {
            queryBuilder.andWhere('log.action = :action', { action });
        }

        if (status) {
            queryBuilder.andWhere('log.status = :status', { status });
        }

        if (search) {
            queryBuilder.andWhere('log.details LIKE :search', { search: `%${search}%` });
        }

        // Get total count
        const total = await queryBuilder.getCount();

        // Get logs with pagination and eager load relationships
        const logs = await queryBuilder
            .orderBy('log.created_at', 'DESC')
            .skip(offset)
            .take(limit)
            .getMany();

        // Format logs for response
        const formattedLogs: LogResponse[] = logs.map(log => ({
            id: log.id,
            timestamp: log.created_at,
            botName: log.bot ? (log.bot as unknown as Bots).name : 'System',
            action: log.action,
            details: ensureString(log.details),
            status: log.status
        }));

        res.json({
            status: "success",
            data: {
                logs: formattedLogs,
                total,
                page,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};

export const createLog = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                status: "error",
                message: "Unauthorized"
            });
            return;
        }

        const { botId, action, details: rawDetails = '', status } = req.body as CreateLogRequest;
        const details = ensureString(rawDetails);

        // Find user and bot
        const user = await usersRepository.findOneByOrFail({ supabase_uid: userId });
        let bot: Bots | null = null;

        if (botId) {
            bot = await botsRepository.findOneByOrFail({ id: botId });
        }

        // Create new log
        const logData = {
            action,
            details,
            status,
            user_id: userId,
            bot_id: botId || null
        };

        const log = await logsRepository.save(logData);

        // Get the complete log with relationships
        const savedLog = await logsRepository.findOne({
            where: { id: log.id },
            relations: ['bot', 'user']
        });

        if (!savedLog) {
            throw new Error('Failed to create log');
        }

        // Format response
        const response: LogResponse = {
            id: savedLog.id,
            timestamp: savedLog.created_at,
            botName: bot?.name ?? 'System',
            action: savedLog.action,
            details: ensureString(savedLog.details),
            status: savedLog.status
        };

        // Emit socket event for real-time updates
        const io = req.app.get('io');
        if (io) {
            io.emit('activity_created');
        }

        res.json({
            status: "success",
            data: response
        });
    } catch (error) {
        console.error('Error creating activity log:', error);
        res.status(500).json({
            status: "error",
            message: error instanceof Error ? error.message : "Internal server error"
        });
    }
};
