import makeWASocket, { delay, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import NodeCache from "node-cache";
import P from "pino";
import { Boom } from '@hapi/boom'
import dotenv from 'dotenv';
dotenv.config();

const logger: any = P({
    timestamp: () => `,"time":"${new Date().toJSON()}"`
});
logger.level = process.env.LOG_LEVEL || 'info';

const msgRetryCounterCache = new NodeCache();

// Function to convert JSON Buffer objects to actual Buffer instances
const convertJsonBuffersToBuffers = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(convertJsonBuffersToBuffers);
    } else if (typeof obj === 'object' && obj !== null) {
        if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
            return Buffer.from(obj.data);
        }
        return Object.keys(obj).reduce((acc, key) => {
            acc[key] = convertJsonBuffersToBuffers(obj[key]);
            return acc;
        }, {} as any);
    }
    return obj;
};

// Map to hold multiple bot sockets
const botSockets: { [botId: number]: any } = {};
export const startBot = async (botId: number, phoneNumber: string, usePairingCode = false, io: any) => {
    try {
        if (botSockets[botId]) {
            await botSockets[botId].end();
            delete botSockets[botId];
        }
        // Initialize store for signal keys
        const { state, saveCreds } = await useMultiFileAuthState(`auth_info_${botId}`);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`Menggunakan WA v${version.join('.')}, isLatest: ${isLatest}`);

        const sock = makeWASocket({
            version,
            logger,
            printQRInTerminal: !usePairingCode,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            msgRetryCounterCache: msgRetryCounterCache,
            generateHighQualityLinkPreview: true,
            getMessage: getMessage,
        });

        // Store the socket in the map
        botSockets[botId] = sock;

        // Handle pairing code for web client
        if (usePairingCode && !sock.authState.creds.registered) {
            console.log("Mengambil Kode Pairing...");
            await delay(6000);
            const code = await sock.requestPairingCode(phoneNumber);
            console.log(`Kode Pairing: ${code}`);
            io.emit('pairingCode', code);
        }

        console.log("Menghubungkan ke Whatsapp...");

        // Process all received events
        sock.ev.process(async (events) => {
            if (events['connection.update']) {
                const update = events['connection.update'];
                const { connection, qr } = update;

                if (qr) {
                    io.to(botId).emit('qr', { botId, qr });
                }

                if (connection === 'open') {
                    io.to(botId).emit('status', {
                        botId,
                        status: 'connected'
                    });
                }
            }
        });

        return sock;
    } catch (error) {
        io.to(botId).emit('error', {
            botId,
            message: "Gagal menghubungkan bot: " + error
        });
    }
};

const getMessage = async (key: any): Promise<any> => {
    return null; // Implement as needed
};

const handleConnectionUpdate = async (update: any, sock: any, botId: number, io: any, phoneNumber: string) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
        io.emit('qr', qr);
    }
    if (connection === 'open') {
        io.emit('connection-status', 'connected');
    }
    if (connection === 'close') {
        io.emit('connection-status', 'disconnected');
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
            console.log('Koneksi ditutup. Mencoba menyambung ulang...');
            await startBot(botId, phoneNumber, false, io) // Rekoneksi
        } else {
            console.log('Koneksi ditutup. Anda telah logout.');

        }
    }
    if (connection === 'connecting') {
        io.emit('connection-status', 'connecting');
    }
    if (lastDisconnect && lastDisconnect.error) {
        logger.error('Last disconnect error:', lastDisconnect.error);
        io.emit('error', lastDisconnect.error.message);
    }
};

const handleMessagesUpsert = async (upsert: any, sock: any) => {
    // Handle messages upsert
    // console.log('Messages Upsert:', upsert);
    sock.ev.emit('messages.upsert', upsert);
};