import { Request, Response } from "express";
import { Users } from "../database/entities/Profiles";
import { UserSettings, NotificationPreference, ThemePreference, LanguagePreference } from "../database/entities/ProfileSettings";
import { PaymentMethods, CardType } from "../database/entities/PaymentMethods";
import { BillingHistory } from "../database/entities/Billing";

interface AuthRequest extends Request {
    user?: {
        id: number;
    };
}

interface UpdateSettingsBody {
    notification_preferences?: NotificationPreference;
    theme?: ThemePreference;
    language?: LanguagePreference;
}

interface AddPaymentMethodBody {
    card_type: CardType;
    last_four: string;
    expiry_date: string;
    token: string;
}

export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                status: "error",
                message: "Unauthorized"
            });
            return;
        }

        const user = await Users.findByIdWithSettings(userId);
        if (!user) {
            res.status(404).json({
                status: "error",
                message: "User not found"
            });
            return;
        }

        res.json({
            status: "success",
            data: {
                settings: user.settings || await UserSettings.createForUser(userId)
            }
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};

export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                status: "error",
                message: "Unauthorized"
            });
            return;
        }

        const { notification_preferences, theme, language } = req.body as UpdateSettingsBody;

        let settings = await UserSettings.findByUserId(userId);
        if (!settings) {
            settings = await UserSettings.createForUser(userId);
        }

        if (notification_preferences) {
            settings.notification_preferences = notification_preferences;
        }
        if (theme) {
            settings.theme = theme;
        }
        if (language) {
            settings.language = language;
        }

        await settings.save();

        res.json({
            status: "success",
            data: {
                settings
            }
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};

export const getPaymentMethods = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                status: "error",
                message: "Unauthorized"
            });
            return;
        }

        const paymentMethods = await PaymentMethods.findByUserId(userId);

        res.json({
            status: "success",
            data: {
                payment_methods: paymentMethods
            }
        });
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};

export const addPaymentMethod = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                status: "error",
                message: "Unauthorized"
            });
            return;
        }

        const { card_type, last_four, expiry_date, token } = req.body as AddPaymentMethodBody;

        const paymentMethod = new PaymentMethods({
            user_id: userId,
            card_type,
            last_four,
            expiry_date,
            token,
            status: 'active'
        });

        await paymentMethod.save();

        res.json({
            status: "success",
            data: {
                payment_method: paymentMethod
            }
        });
    } catch (error) {
        console.error('Error adding payment method:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};

export const deletePaymentMethod = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                status: "error",
                message: "Unauthorized"
            });
            return;
        }

        const { id } = req.params;
        const paymentMethod = await PaymentMethods.findOne({
            where: { id: parseInt(id), user_id: userId }
        });

        if (!paymentMethod) {
            res.status(404).json({
                status: "error",
                message: "Payment method not found"
            });
            return;
        }

        await paymentMethod.softDelete();

        res.json({
            status: "success",
            message: "Payment method deleted"
        });
    } catch (error) {
        console.error('Error deleting payment method:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};

export const getBillingHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                status: "error",
                message: "Unauthorized"
            });
            return;
        }

        const limit = parseInt(req.query.limit as string) || 10;
        const billingHistory = await BillingHistory.findByUserId(userId, limit);

        res.json({
            status: "success",
            data: {
                billing_history: billingHistory
            }
        });
    } catch (error) {
        console.error('Error fetching billing history:', error);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};
