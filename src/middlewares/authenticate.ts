import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

// Ambil secret key dari environment variables
const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key";

export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    // Periksa apakah header Authorization ada
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Unauthorized: Missing or invalid token" });
        return;
    }

    // Ambil token dari header
    const token = authHeader.split(" ")[1];

    try {
        // Verifikasi token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Tambahkan data pengguna ke objek request
        (req as any).user = decoded;

        // Lanjutkan ke route handler
        next();
    } catch (error) {
        // Tangani kesalahan verifikasi token
        res.status(403).json({ message: "Forbidden: Invalid or expired token" });
    }
}