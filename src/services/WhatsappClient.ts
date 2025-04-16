import makeWASocket, { 
    delay, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore, 
    useMultiFileAuthState, 
    DisconnectReason 
} from "@whiskeysockets/baileys";
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

// Map to hold multiple bot sockets
const botSockets: { [botId: number]: any } = {};

export const startBot = async (botId: number, phoneNumber: string, usePairingCode = false, io: Server) => {
    try {
        if (botSockets[botId]) {
            await botSockets[botId].end();
            delete botSockets[botId];
        }

        // Initialize store for signal keys
        const { state, saveCreds } = await useMultiFileAuthState(`auth_info_${botId}`);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

        const sock = makeWASocket({
            version,
            logger,
            printQRInTerminal: true,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            msgRetryCounterCache,
            generateHighQualityLinkPreview: true,
            getMessage: async () => {
                return { conversation: 'hello' }; // Default message for now
            }
        });

        // Store the socket in the map
        botSockets[botId] = sock;

        // Handle pairing code for web client
        if (usePairingCode && !sock.authState.creds.registered) {
            console.log("Getting pairing code...");
            await delay(3000);
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`Pairing code: ${code}`);
                io.emit('pairingCode', { botId, code });
                return code;
            } catch (error) {
                console.error('Error requesting pairing code:', error);
                throw error;
            }
        }

        // Connection update handler
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                // Emit QR code to frontend
                io.emit('qr', { botId, qr });
                console.log(`[INFO] New QR code emitted for bot ${botId}`);
                return qr;
            }

            if (connection === 'open') {
                console.log(`Bot ${botId} connected!`);
                
                // Update bot status in database
                await Bots.update(botId, { isConnected: true });
                
                // Emit connection status
                io.emit('connection_update', { 
                    botId, 
                    connected: true,
                    status: 'connected'
                });
            }

            if (connection === 'close') {
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
            console.log(`[INFO] New message for bot ${botId}:`, JSON.stringify(m, undefined, 2));
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
            await sock.logout();
            await sock.end();
            
            // Clean up auth files
            const fs = require('fs');
            const path = require('path');
            const authPath = `auth_info_${botId}`;
            if (fs.existsSync(authPath)) {
                fs.rmSync(authPath, { recursive: true, force: true });
            }
            
            // Remove from active sockets
            delete botSockets[botId];
            
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
