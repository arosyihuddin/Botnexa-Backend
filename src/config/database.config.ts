import { DataSource } from "typeorm";
import * as path from "path";
import * as dotenv from "dotenv";
import { Users } from "../database/entities/Profiles";
import { Bots } from "../database/entities/Bots";
import { ActivityLogs } from "../database/entities/ActivityLogs";
import { UserSettings } from "../database/entities/ProfileSettings";
import { PaymentMethods } from "../database/entities/PaymentMethods";
import { BillingHistory } from "../database/entities/BillingHistory-final";

// Load environment variables from .env file
dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_URL || "aws-0-ap-southeast-1.pooler.supabase.com",
    port: parseInt(process.env.DB_PORT!) || 5432,
    username: process.env.DB_USERNAME || "postgres.ywskcjllsdbnapecmfkg",
    password: process.env.DB_PASSWORD || "jarvis123.,",
    database: process.env.DB_NAME || "postgres",
    synchronize: true,
    logging: false,
    entities: [path.join(__dirname, "../database/entities/**/*.{ts,js}")],
    migrations: [path.join(__dirname, "../database/migrations/**/*.{ts,js}")],
    subscribers: [path.join(__dirname, "../database/subscribers/**/*.{ts,js}")],
});
