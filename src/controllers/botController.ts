import { Request, Response } from "express";
import { Bots } from "../database/entities/Bots";

export const getBots = async (req: Request, res: Response) => {
    try {
        const bots = await Bots.find();
        res.status(200).json({ status: "success", data: bots });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat mengambil data bot." });
    }
};

export const getBotById = async (req: Request, res: Response) => {
    const botId = req.params.id;
    try {
        const bot = await Bots.findOne({ where: { id: parseInt(botId, 10) } });
        if (bot) {
            res.status(200).json({ status: "success", data: bot });
        } else {
            res.status(404).json({ status: "error", message: `Bot dengan ID ${botId} tidak ditemukan.` });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat mengambil data bot." });
    }
};

export const createBot = async (req: Request, res: Response) => {
    const { name, description, number, user_id } = req.body;
    try {
        const newBot = Bots.create({
            name,
            description,
            number,
            user: user_id
        });

        await newBot.save();
        res.status(201).json({ status: "success", data: newBot });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat membuat bot baru.", "error": error });
    }
};

export const updateBot = async (req: Request, res: Response) => {
    const botId = req.params.id;
    const { name, description, number, user_id } = req.body;
    try {
        const bot = await Bots.findOne({ where: { id: parseInt(botId, 10) } });
        if (bot) {
            bot.name = name;
            bot.description = description;
            bot.number = number;
            bot.user = user_id;
            await bot.save();
            res.status(200).json({ status: "success", data: bot });
        } else {
            res.status(404).json({ status: "error", message: `Bot dengan ID ${botId} tidak ditemukan.` });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat mengubah data bot." });
    }
};

export const deleteBot = async (req: Request, res: Response) => {
    const botId = req.params.id;
    try {
        const bot = await Bots.findOne({ where: { id: parseInt(botId, 10) } });
        if (bot) {
            await bot.remove();
            res.status(200).json({ status: "success", message: `Bot dengan ID ${botId} berhasil dihapus.` });
        } else {
            res.status(404).json({ status: "error", message: `Bot dengan ID ${botId} tidak ditemukan.` });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat menghapus data bot." });
    }
};

