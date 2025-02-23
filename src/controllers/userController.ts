// controllers/userController.ts
import { Request, Response } from 'express';
import { Users } from '../database/entities/Users';
import bcrypt from "bcrypt";
import { ActivityLogs } from '../database/entities/ActivityLogs';
import jwt from "jsonwebtoken";

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await Users.find();
        res.status(200).json({ status: "success", data: users });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat mengambil data pengguna." });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    const userId = req.params.id;
    try {
        const user = await Users.findOne({ where: { id: parseInt(userId, 10) } });
        if (user) {
            res.status(200).json({ status: "success", data: user });
        } else {
            res.status(404).json({ status: "error", message: `Pengguna dengan ID ${userId} tidak ditemukan.` });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat mengambil data pengguna." });
    }
};

export const getUserBots = async (req: Request, res: Response) => {
    const userId = req.params.id;
    try {
        const user = await Users.findOne({ where: { id: parseInt(userId, 10) }, relations: ["bots"] });
        if (user) {
            res.status(200).json({ status: "success", data: user.bots });
        } else {
            res.status(404).json({ status: "error", message: `Pengguna dengan ID ${userId} tidak ditemukan.` });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat mengambil data bot." });
    }
};

export const register = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = Users.create({
            name,
            email,
            password: hashedPassword,
        });

        await newUser.save();
        res.status(201).json({ status: "success", data: newUser });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat membuat pengguna baru." });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const userId = req.params.id;
    const { name, email } = req.body;
    try {
        const user = await Users.findOne({ where: { id: parseInt(userId, 10) } });
        if (user) {
            try {
                user.name = name;
                user.email = email;
                await user.save();
                res.status(200).json({ status: "success", data: user });
            } catch (error) {
                res.status(500).json({ status: "error", message: "Terjadi kesalahan saat mengubah data pengguna." });
            }
        } else {
            res.status(404).json({ status: "error", message: `Pengguna dengan ID ${userId} tidak ditemukan.` });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat mengubah data pengguna." });
    }
};


export const deleteUser = async (req: Request, res: Response) => {
    const userId = req.params.id;
    try {
        const user = await Users.findOne({ where: { id: parseInt(userId, 10) } });
        if (user) {
            await user.remove();
            res.status(200).json({ status: "success", message: "Pengguna berhasil dihapus." });
        } else {
            res.status(404).json({ status: "error", message: `Pengguna dengan ID ${userId} tidak ditemukan.` });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat menghapus pengguna." });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const user = await Users.findOne({ where: { email } });
        if (user) {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (isPasswordValid) {
                try {
                    const log = ActivityLogs.create({
                        action: "Login",
                        user: user.id
                    });
                    await log.save();
                    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secret", { expiresIn: "240h" });
                    res.status(200).json({
                        status: "success",
                        token: token,
                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email
                        }
                    });
                } catch (error) {
                    res.status(500).json({ status: "error", message: "Terjadi kesalahan menyimpan log." });
                }
            } else {
                res.status(401).json({ status: "error", message: "Email atau password salah." });
            }
        } else {
            res.status(404).json({ status: "error", message: "Pengguna tidak ditemukan." });
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat login." });
    }
};