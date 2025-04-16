import { Request, Response } from "express";
import { Bots, BotSettings } from "../database/entities/Bots";
import { ActivityLogs, LogAction, LogStatus } from "../database/entities/ActivityLogs";

import { startBot, disconnectBot as disconnectWhatsappBot } from "../services/WhatsappClient";

interface AuthRequest extends Request {
    user?: {
        id: string;
    };
}

export const getBots = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const bots = await Bots.find();
        res.status(200).json({ status: "success", data: bots });
    } catch (error) {
        console.error('Error fetching bots:', error);
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat mengambil data bot." });
    }
};

export const getBotById = async (req: AuthRequest, res: Response): Promise<void> => {
    const botId = req.params.id;

    try {
        const bot = await Bots.findOne({
            where: { id: parseInt(botId, 10) },
            relations: ['logs']
        });

        if (bot) {
            res.status(200).json({ status: "success", data: bot });
        } else {
            res.status(404).json({ status: "error", message: `Bot dengan ID ${botId} tidak ditemukan.` });
        }
    } catch (error) {
        console.error('Error fetching bot:', error);
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat mengambil data bot." });
    }
};

export const getBotSettings = async (req: AuthRequest, res: Response): Promise<void> => {
    const botId = req.params.id;
    try {
        const bot = await Bots.findOne({ where: { id: parseInt(botId, 10) } });
        if (!bot) {
            res.status(404).json({
                status: "error",
                message: "Bot tidak ditemukan."
            });
            return;
        }

        res.status(200).json({
            status: "success",
            data: bot.settings
        });
    } catch (error) {
        console.error('Error fetching bot settings:', error);
        res.status(500).json({
            status: "error",
            message: "Terjadi kesalahan saat mengambil pengaturan bot."
        });
    }
};

export const updateBotSettings = async (req: AuthRequest, res: Response): Promise<void> => {
    const botId = req.params.id;
    const settings: Partial<BotSettings> = req.body;
    const userId = req.user?.id;

    try {
        const bot = await Bots.findOne({ where: { id: parseInt(botId, 10) } });
        if (!bot) {
            res.status(404).json({
                status: "error",
                message: "Bot tidak ditemukan."
            });
            return;
        }

        // Update settings
        await bot.updateSettings(settings);

        // Log the activity
        if (userId) {
            await ActivityLogs.createLog(
                'update_settings',
                userId,
                bot.id,
                'Bot settings updated',
                'success'
            );
        }

        res.status(200).json({
            status: "success",
            message: "Pengaturan bot berhasil diperbarui.",
            data: bot.settings
        });
    } catch (error) {
        console.error('Error updating bot settings:', error);
        res.status(500).json({
            status: "error",
            message: "Terjadi kesalahan saat memperbarui pengaturan bot."
        });
    }
};

export const createBot = async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, number } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        res.status(401).json({ status: "error", message: "Unauthorized" });
        return;
    }

    try {
        const bot = new Bots({
            name,
            number,
            userId,
            isConnected: false
        });

        await bot.save();

        await ActivityLogs.createLog(
            'create',
            userId,
            bot.id,
            'Bot created',
            'success'
        );

        res.status(201).json({ status: "success", data: bot });
    } catch (error) {
        console.error('Error creating bot:', error);
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat membuat bot baru." });
    }
};

export const updateBot = async (req: AuthRequest, res: Response): Promise<void> => {
    const botId = req.params.id;
    const { name, number } = req.body;
    const userId = req.user?.id;

    try {
        const bot = await Bots.findOne({ where: { id: parseInt(botId, 10) } });

        if (!bot) {
            res.status(404).json({ status: "error", message: `Bot dengan ID ${botId} tidak ditemukan.` });
            return;
        }

        if (name) bot.name = name;
        if (number) bot.number = number;
        await bot.save();

        if (userId) {
            await ActivityLogs.createLog(
                'update',
                userId,
                bot.id,
                'Bot updated',
                'success'
            );
        }

        res.status(200).json({ status: "success", data: bot });
    } catch (error) {
        console.error('Error updating bot:', error);
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat mengubah data bot." });
    }
};

export const deleteBot = async (req: AuthRequest, res: Response): Promise<void> => {
    const botId = req.params.id;
    const userId = req.user?.id;

    try {
        const bot = await Bots.findOne({ where: { id: parseInt(botId, 10) } });

        if (!bot) {
            res.status(404).json({ status: "error", message: `Bot dengan ID ${botId} tidak ditemukan.` });
            return;
        }

        if (userId) {
            await ActivityLogs.createLog(
                'delete',
                userId,
                bot.id,
                'Bot deleted',
                'success'
            );
        }

        await bot.remove();
        res.status(200).json({ status: "success", message: `Bot dengan ID ${botId} berhasil dihapus.` });
    } catch (error) {
        console.error('Error deleting bot:', error);
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat menghapus data bot." });
    }
};

export const getQRCode = async (req: AuthRequest, res: Response): Promise<void> => {
    const botId = parseInt(req.params.id, 10);
    const userId = req.user?.id;

    try {
        const bot = await Bots.findOne({ where: { id: botId } });
        if (!bot) {
            res.status(404).json({ status: "error", message: "Bot tidak ditemukan." });
            return;
        }

        if (!bot.number) {
            res.status(400).json({ status: "error", message: "Bot number is required." });
            return;
        }

        // Get socket.io instance
        const io = req.app.get('io');
        if (!io) {
            throw new Error('Socket.IO instance not found');
        }

        // Start the bot and get QR code
        const qrCode = await startBot(botId, bot.number, false, io);

        if (userId) {
            await ActivityLogs.createLog(
                'connect',
                userId,
                bot.id,
                'QR code generated',
                'pending'
            );
        }

        // Send initial response
        res.status(200).json({
            status: "success",
            message: "Bot initialization started. QR code will be sent through WebSocket.",
            botId: botId,
            botName: bot.name,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`[ERROR] Failed to get QR code for bot ${botId}:`, error);
        res.status(500).json({
            status: "error",
            message: "Terjadi kesalahan saat mengambil QR code.",
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export const getPairingCode = async (req: AuthRequest, res: Response): Promise<void> => {
    const botId = parseInt(req.params.id, 10);
    const userId = req.user?.id;

    try {
        const bot = await Bots.findOne({ where: { id: botId } });
        if (!bot) {
            res.status(404).json({ status: "error", message: "Bot tidak ditemukan." });
            return;
        }

        if (!bot.number) {
            res.status(400).json({ status: "error", message: "Bot number is required." });
            return;
        }

        // Get socket.io instance
        const io = req.app.get('io');
        if (!io) {
            throw new Error('Socket.IO instance not found');
        }

        // Start bot with pairing code
        const code = await startBot(botId, bot.number, true, io);

        if (userId) {
            await ActivityLogs.createLog(
                'connect',
                userId,
                bot.id,
                'Pairing code generated',
                'pending'
            );
        }

        res.status(200).json({
            status: "success",
            message: "Bot initialization started with pairing code.",
            code: code
        });
    } catch (error) {
        console.error(`[ERROR] Failed to get pairing code for bot ${botId}:`, error);
        res.status(500).json({
            status: "error",
            message: "Terjadi kesalahan saat mengambil kode pairing.",
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export const disconnectBot = async (req: AuthRequest, res: Response): Promise<void> => {
    const botId = parseInt(req.params.id, 10);
    const userId = req.user?.id;

    try {
        const bot = await Bots.findOne({ where: { id: botId } });
        if (!bot) {
            res.status(404).json({ status: "error", message: "Bot tidak ditemukan." });
            return;
        }

        // Disconnect from WhatsApp
        await disconnectWhatsappBot(botId);

        // Update bot status and log activity
        await bot.disconnect();

        if (userId) {
            await ActivityLogs.createLog(
                'disconnect',
                userId,
                bot.id,
                'Bot disconnected',
                'success'
            );
        }

        // Emit disconnection event through socket.io
        const io = req.app.get('io');
        if (io) {
            io.emit('connection_update', { botId, connected: false });
        }

        res.status(200).json({ status: "success", message: "Bot berhasil diputuskan." });
    } catch (error) {
        console.error(`[ERROR] Failed to disconnect bot ${botId}:`, error);
        res.status(500).json({
            status: "error",
            message: "Terjadi kesalahan saat memutuskan bot.",
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
