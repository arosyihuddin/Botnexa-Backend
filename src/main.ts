// main.ts
import "reflect-metadata";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { AppDataSource } from "./config/typeorm.config";
import userRoutes from './api/routes/userRoutes';
import botRoutes from './api/routes/botRoutes';
import logRoutes from './api/routes/logRoutes';
import settingsRoutes from './api/routes/settings.routes';
import { Bots } from "./database/entities/Bots";
import { startBot } from "./services/WhatsappClient";
import loggerMiddleware from "./api/middlewares/loggerMiddleware";
import { logger } from "./utils/logger";
import { authenticate } from "./api/middlewares/authenticate";
import cors from "cors";

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Sesuaikan dengan origin client Anda
        methods: ["GET", "POST"]
    }
});
const port = 3000;

app.use(cors());
app.use(loggerMiddleware)

app.use(express.static('public'));
app.use(express.json());
app.set('io', io);

// Gunakan app.use untuk mendaftarkan router
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/bots", authenticate, botRoutes);
app.use("/api/v1/logs", logRoutes);
app.use("/api/v1/settings", settingsRoutes);

AppDataSource.initialize()
    .then(async () => {
        logger.info("Database terhubung");

        // Start Bot Service
        const bots = await Bots.find({ where: { isConnected: true } });
        for (const bot of bots) {
            startBot(bot.id, bot.number, true, io);
        }

        server.listen(port, () => {
            logger.info(`Server berjalan di http://localhost:${port}`);
        });
    })
    .catch((error) => {
        logger.error("Terjadi kesalahan saat inisialisasi koneksi database:", error);
    });


// Handle koneksi Socket.io
io.on('connection', (socket) => {
    logger.info(`Client terhubung: ${socket.id}`);

    socket.on('joinBotRoom', (botId) => {
        socket.join(botId);
        logger.info(`Client ${socket.id} masuk ke room bot ${botId}`);
    });

    socket.on('disconnect', () => {
        logger.warn(`Client terputus: ${socket.id}`);
    });
});
