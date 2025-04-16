import { Request, Response } from "express";
import { Profiles } from "../database/entities/Profiles";
import { ActivityLogs, LogAction } from "../database/entities/ActivityLogs";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { Bots } from "../database/entities/Bots";

// Get user profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.supabase_uid;
        if (!userId) {
            res.status(401).json({
                status: "error",
                message: "Unauthorized"
            });
            return;
        }

        const user = await Profiles.findOne({
            where: { supabase_uid: userId },
            select: ["supabase_uid", "name", "email", "created_at"]
        });

        if (!user) {
            res.status(404).json({
                status: "error",
                message: "User not found"
            });
            return;
        }

        res.json({
            status: "success",
            data: user
        });
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.supabase_uid;
        if (!userId) {
            res.status(401).json({
                status: "error",
                message: "Unauthorized"
            });
            return;
        }

        const { name } = req.body;
        if (!name) {
            res.status(400).json({
                status: "error",
                message: "Name is required"
            });
            return;
        }

        const user = await Profiles.findOne({ where: { supabase_uid: userId } });
        if (!user) {
            res.status(404).json({
                status: "error",
                message: "User not found"
            });
            return;
        }

        user.name = name;
        await user.save();

        // Log activity
        await ActivityLogs.createLog(
            'update',
            user.supabase_uid,
            undefined,
            'User profile updated',
            'success'
        );

        res.json({
            status: "success",
            data: {
                id: user.supabase_uid,
                name: user.name,
                email: user.email,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};

// Change password
// export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
//     try {
//         const userId = req.user?.id;
//         if (!userId) {
//             res.status(401).json({
//                 status: "error",
//                 message: "Unauthorized"
//             });
//             return;
//         }

//         const { currentPassword, newPassword } = req.body;
//         if (!currentPassword || !newPassword) {
//             res.status(400).json({
//                 status: "error",
//                 message: "Current password and new password are required"
//             });
//             return;
//         }

//         const user = await Profiles.findOne({
//             where: { id: userId },
//             select: ["id", "password"]
//         });

//         if (!user) {
//             res.status(404).json({
//                 status: "error",
//                 message: "User not found"
//             });
//             return;
//         }

//         // Verify current password
//         const isValid = await user.verifyPassword(currentPassword);
//         if (!isValid) {
//             res.status(400).json({
//                 status: "error",
//                 message: "Current password is incorrect"
//             });
//             return;
//         }

//         // Update password
//         await user.setPassword(newPassword);

//         // Log activity
//         await ActivityLogs.createLog(
//             'update',
//             user.id,
//             undefined,
//             'Password changed',
//             'success'
//         );

//         res.json({
//             status: "success",
//             message: "Password updated successfully"
//         });
//     } catch (error) {
//         console.error('Error changing password:', error);
//         res.status(500).json({
//             status: "error",
//             message: "Internal server error"
//         });
//     }
// };

// Update user preferences
export const updatePreferences = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.supabase_uid;
        if (!userId) {
            res.status(401).json({
                status: "error",
                message: "Unauthorized"
            });
            return;
        }

        const { language } = req.body;
        if (!language) {
            res.status(400).json({
                status: "error",
                message: "Language preference is required"
            });
            return;
        }

        const user = await Profiles.findOne({ where: { supabase_uid: userId } });
        if (!user) {
            res.status(404).json({
                status: "error",
                message: "User not found"
            });
            return;
        }

        // Log activity
        await ActivityLogs.createLog(
            'update',
            user.supabase_uid,
            undefined,
            'User preferences updated',
            'success'
        );

        res.json({
            status: "success",
            message: "Preferences updated successfully"
        });
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};

interface AuthRequest extends Request {
    user?: {
        supabase_uid: string;
    };
}

export const register = async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await Profiles.findOne({ where: { email } });
        if (existingUser) {
            res.status(400).json({ status: "error", message: "Email sudah terdaftar." });
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new Profiles();
        user.name = name;
        user.email = email;
        await user.save();

        // Log activity
        await ActivityLogs.createLog(
            'create',
            user.supabase_uid,
            undefined,
            'User registered',
            'success'
        );

        res.status(201).json({ status: "success", message: "Registrasi berhasil." });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat registrasi." });
    }
};

// export const login = async (req: Request, res: Response): Promise<void> => {
//     const { email, password } = req.body;

//     try {
//         // Find user
//         const user = await Profiles.findOne({ where: { email } });
//         if (!user) {
//             res.status(401).json({ status: "error", message: "Email atau password salah." });
//             return;
//         }

//         // Check password
//         if (!user.password) {
//             res.status(401).json({ status: "error", message: "Password tidak ditemukan." });
//             return;
//         }

//         const validPassword = await bcrypt.compare(password, user.password);
//         if (!validPassword) {
//             res.status(401).json({ status: "error", message: "Email atau password salah." });
//             return;
//         }

//         // Generate token
//         const token = jwt.sign(
//             { id: user.id },
//             process.env.JWT_SECRET || 'jarvisai',
//             { expiresIn: '24h' }
//         );

//         // Log activity
//         await ActivityLogs.createLog(
//             'login',
//             user.id,
//             undefined,
//             'User logged in',
//             'success'
//         );

//         res.status(200).json({
//             status: "success",
//             data: {
//                 token,
//                 user: {
//                     id: user.id,
//                     name: user.name,
//                     email: user.email
//                 }
//             }
//         });
//     } catch (error) {
//         console.error('Error logging in:', error);
//         res.status(500).json({ status: "error", message: "Terjadi kesalahan saat login." });
//     }
// };

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await Profiles.find({
            select: ["supabase_uid", "name", "email", "created_at"]
        });
        res.status(200).json({ status: "success", data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat mengambil data pengguna." });
    }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;

    try {
        const user = await Profiles.findOne({
            where: { supabase_uid: userId },
            select: ["supabase_uid", "name", "email", "created_at"]
        });

        if (user) {
            res.status(200).json({ status: "success", data: user });
        } else {
            res.status(404).json({ status: "error", message: "Pengguna tidak ditemukan." });
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat mengambil data pengguna." });
    }
};

export const getUserBots = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;

    try {
        const bots = await Bots.find({
            where: { userId }
        });
        res.status(200).json({ status: "success", data: bots });
    } catch (error) {
        console.error('Error fetching user bots:', error);
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat mengambil data bot pengguna." });
    }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;
    const { name, email } = req.body;

    try {
        const user = await Profiles.findOne({ where: { supabase_uid: userId } });

        if (!user) {
            res.status(404).json({ status: "error", message: "Pengguna tidak ditemukan." });
            return;
        }

        // Check if email is being changed and if it's already taken
        if (email !== user.email) {
            const existingUser = await Profiles.findOne({ where: { email } });
            if (existingUser) {
                res.status(400).json({ status: "error", message: "Email sudah digunakan." });
                return;
            }
        }

        // Update user
        user.name = name;
        user.email = email;
        await user.save();

        // Log activity
        await ActivityLogs.createLog(
            'update',
            user.supabase_uid,
            undefined,
            'User updated',
            'success'
        );

        res.status(200).json({
            status: "success",
            data: {
                id: user.supabase_uid,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat memperbarui data pengguna." });
    }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id;

    try {
        const user = await Profiles.findOne({ where: { supabase_uid: userId } });

        if (!user) {
            res.status(404).json({ status: "error", message: "Pengguna tidak ditemukan." });
            return;
        }

        // Log activity before deletion
        await ActivityLogs.createLog(
            'delete',
            user.supabase_uid,
            undefined,
            'User deleted',
            'success'
        );

        await user.remove();
        res.status(200).json({ status: "success", message: "Pengguna berhasil dihapus." });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat menghapus pengguna." });
    }
};

export const verifyToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            res.status(401).json({ status: "error", message: "Token tidak ditemukan." });
            return
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "jarvisai");
        if (!decoded) {
            res.status(401).json({ status: "error", message: "Token tidak valid." });
            return
        }
        res.status(200).json({ status: "success", message: "Token valid." });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Terjadi kesalahan saat verifikasi token." });
    }
};