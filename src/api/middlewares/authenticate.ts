import { NextFunction, Request, Response } from "express";
import { supabase } from "../../config/supabase.config";

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        res.status(401).json({ status: "error", message: "Token tidak ditemukan." });
        return;
    }

    const { data, error } = await supabase.auth.getUser(token)

    if (error) {
        res.status(401).json({ status: "error", message: "Token tidak valid." });
        return;
    }

    if (!data.user) {
        res.status(401).json({ status: "error", message: "Token tidak valid." });
        return;
    }

    next();

}
