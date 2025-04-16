import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
);
export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        res.status(401).json({ status: "error", message: "Token tidak ditemukan." });
        return;
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
        if (err) {
            res.status(401).json({ status: "error", message: "Token tidak valid." });
            return;
        }

        // Set user from decoded token
        (req as any).user = {
            id: (decoded as any).id,
            // Add any other user properties you need
        };

        // Continue to route handler
        next();
    });
}
