import makeWASocket, {
    delay,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
    DisconnectReason,
    Browsers,
    // } from "@whiskeysockets/baileys";
} from "baileys";
import NodeCache from "node-cache";
import P from "pino";
import { Boom } from '@hapi/boom'
import { Bots } from '../database/entities/Bots';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
dotenv.config();

const logger: any = P({
    timestamp: () => `,"time":"${new Date().toJSON()}"`
});
logger.level = process.env.LOG_LEVEL || 'info';

const msgRetryCounterCache = new NodeCache();
const groupCache = new NodeCache();

// Map to hold multiple bot sockets
const botSockets: { [botId: number]: any } = {};
const botLocks: { [botId: number]: boolean } = {};
const botTimeouts: { [botId: number]: NodeJS.Timeout } = {};
const isTimeout: { [botId: number]: boolean } = {};


export const startBot = async (botId: number, phoneNumber: string, usePairingCode = false, io: Server, timeout: number = 60000) => {
    try {
        // if (botLocks[botId]) {
        //     logger.warn(`Bot ${botId} is already starting, skipping...`);
        //     return;
        // }

        botLocks[botId] = true;

        if (botSockets[botId]) {
            await botSockets[botId].end();
            delete botSockets[botId];
        }

        let timeoutId = null;
        if (botTimeouts[botId]) {
            timeoutId = botTimeouts[botId];
        }
        else {
            timeoutId = setTimeout(() => {
                console.log(`Timeout reached for bot ${botId}, disconnecting...`);
                isTimeout[botId] = true;
                sock.end(undefined);
                io.emit('error', { botId, message: "Timeout reached. No QR Code or Pairing Code received." });
                delete botLocks[botId];
                io.emit(`timeout-${botId}`, { timeout: true });
                delete botTimeouts[botId];
            }, timeout);
        }

        botTimeouts[botId] = timeoutId;

        // io.emit(`qr-${botId}`, { qr: "2@uX/M0vFr2y9v4jjvhxbQ2zLt2dZiHz10xF1QeIrsXx78fgVCxHns2DFiRAnpnc7wmXjsiOW4mG5ahkV/8OZl6hbUVa2tflJ1ZLk=,MD2qCTWh/GCszhK0K0mR3JxdgnlcnAgc1L9ojmWosik=,T062ivrWMYWxFRcGAHFY6nUQKasFs5ZU1OeOhqRM93U=,7rNwDEUvtVUJzQMjPMNd4WWhZL8Raq62SkHGjizxn2I=" });
        // io.emit(`pairing-${botId}`, { code: "12345678" });
        // await delay(3000)
        // io.emit(`timeout-${botId}`, { timeout: true });
        // return


        // Initialize store for signal keys
        const { state, saveCreds } = await useMultiFileAuthState(`auth/auth_info_${botId}`);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

        const sock = makeWASocket({
            version,
            logger,
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            msgRetryCounterCache,
            browser: Browsers.macOS("Dekstop"),
            markOnlineOnConnect: false,
            cachedGroupMetadata: async (jid) => (groupCache.get(jid)),
        });

        // Store the socket in the map
        botSockets[botId] = sock;

        // Connection update handler
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) {
                // Emit QR code to frontend
                logger.info(`New QR code emitted for bot ${botId}`);
                io.emit(`qr-${botId}`, { qr });
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`Pairing code: ${code}`);
                io.emit(`pairing-${botId}`, { code });
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                    clearTimeout(botTimeouts[botId]);
                    isTimeout[botId] = false;
                    delete isTimeout[botId];
                    delete botTimeouts[botId];
                }
            }

            if (connection === 'open') {
                console.log(`Bot ${botId} connected!`);

                // Update bot status in database
                await Bots.update(botId, { isConnected: true });

                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                    clearTimeout(botTimeouts[botId]);
                    isTimeout[botId] = false;
                    delete isTimeout[botId];
                    delete botTimeouts[botId];
                }

                // Emit connection status
                io.emit('connection_update', {
                    botId,
                    connected: true,
                    status: 'connected'
                });
            }

            if (connection === 'close') {
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                    clearTimeout(botTimeouts[botId]);
                    isTimeout[botId] = false;
                    delete isTimeout[botId];
                    delete botTimeouts[botId];
                    return
                }
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log(`Bot ${botId} connection closed. Reconnecting:`, shouldReconnect);

                // Update bot status in database
                await Bots.update(botId, { isConnected: false });

                // Emit connection status
                io.emit('connection_update', {
                    botId,
                    connected: false,
                    status: 'disconnected'
                });

                if (shouldReconnect) {
                    await startBot(botId, phoneNumber, usePairingCode, io);
                }
            }

            if (connection === 'connecting') {
                io.emit('connection_update', {
                    botId,
                    status: 'connecting'
                });
            }
        });

        // Credentials update handler
        sock.ev.on('creds.update', saveCreds);

        // Messages handler
        sock.ev.on('messages.upsert', async (m) => {
            // console.log(`[INFO] New message for bot ${botId}:`, JSON.stringify(m, undefined, 2));
            io.emit('messages.upsert', { data: JSON.stringify(m, undefined, 2) });
        });

        return sock;
    } catch (error) {
        console.error(`Error starting bot ${botId}:`, error);
        io.emit('error', {
            botId,
            message: "Failed to connect bot: " + error
        });
        throw error;
    }
};

export const disconnectBot = async (botId: number): Promise<void> => {
    try {
        const sock = botSockets[botId];
        if (sock) {
            // Properly close all event listeners
            sock.ev.removeAllListeners('connection.update');
            sock.ev.removeAllListeners('creds.update');
            sock.ev.removeAllListeners('messages.upsert');

            // End the socket connection
            await sock.end(undefined);

            if (botTimeouts[botId]) {
                console.log(`Clearing timeout for bot ${botId}`);
                clearTimeout(botTimeouts[botId]);
                isTimeout[botId] = false;
                delete isTimeout[botId];
                delete botTimeouts[botId];
            }

            // Update bot status in database
            await Bots.update(botId, { isConnected: false });

            console.log(`[INFO] Bot ${botId} disconnected and cleaned up successfully`);
        } else {
            console.log(`[INFO] No active socket found for bot ${botId}`);

            // Still update database status just in case
            await Bots.update(botId, { isConnected: false });
        }
    } catch (error) {
        console.error(`[ERROR] Failed to disconnect bot ${botId}:`, error);

        // Try to clean up even if there's an error
        try {
            delete botSockets[botId];
            await Bots.update(botId, { isConnected: false });
        } catch (cleanupError) {
            console.error(`[ERROR] Failed to clean up bot ${botId}:`, cleanupError);
        }

        throw error;
    }
};

export const cleanBot = async (botId: number) => {
    // Clean up auth files
    const fs = require('fs');
    const authPath = `auth/auth_info_${botId}`;
    if (fs.existsSync(authPath)) {
        fs.rmSync(authPath, { recursive: true, force: true });
    }

    // Remove from active sockets
    delete botSockets[botId];
    delete botLocks[botId];
}