import { Request, Response } from "express";
import { ActivityLogs } from "../database/entities/ActivityLogs";

export const getLogs = async (req: Request, res: Response) => {
    try {
        const logs = await ActivityLogs.find();
        res.status(200).json({ status: "success", data: logs });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat mengambil data log." });
    }
}

export const getLogById = async (req: Request, res: Response) => {
    const logId = req.params.id;
    try {
        const log = await ActivityLogs.findOne({ where: { id: parseInt(logId, 10) } });
        if (log) {
            res.status(200).json({ status: "success", data: log });
        } else {
            res.status(404).json({ status: "error", message: `Log dengan ID ${logId} tidak ditemukan.` });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat mengambil data log." });
    }
}

export const createLog = async (req: Request, res: Response) => {
    const { action, user_id } = req.body;
    try {
        const newLog = ActivityLogs.create({
            action,
            user: user_id
        });

        await newLog.save();
        res.status(201).json({ status: "success", data: newLog });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat membuat log baru." });
    }
}

export const updateLog = async (req: Request, res: Response) => {
    const logId = req.params.id;
    const { action, user_id } = req.body;
    try {
        const log = await ActivityLogs.findOne({ where: { id: parseInt(logId, 10) } });
        if (log) {
            log.action = action;
            log.user = user_id;
            await log.save();
            res.status(200).json({ status: "success", data: log });
        } else {
            res.status(404).json({ status: "error", message: `Log dengan ID ${logId} tidak ditemukan.` });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat mengubah data log." });
    }
}

export const deleteLog = async (req: Request, res: Response) => {
    const logId = req.params.id;
    try {
        const log = await ActivityLogs.findOne({ where: { id: parseInt(logId, 10) } });
        if (log) {
            await log.remove();
            res.status(200).json({ status: "success", message: `Log dengan ID ${logId} berhasil dihapus.` });
        } else {
            res.status(404).json({ status: "error", message: `Log dengan ID ${logId} tidak ditemukan.` });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat menghapus data log." });
    }
}
