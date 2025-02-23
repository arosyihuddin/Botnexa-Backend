import addActivityLog from "./helper.js";
import { deleteSelectedBot, selectedBot } from "./script.js";
import { socket } from "./socket.js";

const API_URL = "http://localhost:3000/api/v1";

export let bots = [];
const addBotModal = document.getElementById("addBotModal");
const qrSection = document.getElementById("qrSection");
const pairingSection = document.getElementById("pairingSection");

export default async function fetchBots() {
    try {
        const response = await fetch(`${API_URL}/bots`);
        const data = await response.json();
        console.log(data);
        bots = data.data;
        updateBotList();
    } catch (error) {
        console.error("Failed to fetch bots:", error);
        addActivityLog("Failed to fetch bots", "error");
    }
}

export function updateBotList() {
    const botList = document.getElementById("botList");
    botList.innerHTML = bots
        .map(
            (bot) => `
        <div class="bot-item" data-bot-id="${bot.id}">
            <button class="w-full text-left p-2 rounded-lg ${
                selectedBot?.id === bot.id
                    ? "bg-green-50 text-green-700"
                    : "hover:bg-gray-50"
            }">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full ${
                        bot.isConnected ? "bg-green-500" : "bg-gray-300"
                    }"></div>
                    <span class="text-sm font-medium">${bot.name}</span>
                </div>
            </button>
        </div>
    `
        )
        .join("");
}

export async function connectToWhatsapp(selectedBot) {
    if (!selectedBot) {
        addActivityLog("Please select a bot first", "error");
        return;
    }
    try {
        // socket.emit("connectWhatsapp", { botId: selectedBot.id });
        addActivityLog("QR Code Generating...");
        socket.on("qr", (qr) => {
            const qrContainer = document.querySelector("#qrSection .w-48");
            if (qrContainer) {
                // Clear previous QR code
                qrContainer.innerHTML = "";
                // Create new QR code
                new QRCode(qrContainer, {
                    text: qr,
                    width: 192,
                    height: 192,
                });
            }
            addActivityLog("QR Code Generated");
        });
    } catch (e) {
        addActivityLog("Failed to connect to Whatsapp", "error", e.message);
    }
}

// Update bot connection status
async function updateBotConnectionStatus(botId, status) {
    try {
        const response = await fetch(`${API_URL}/bots/${botId}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
        });

        if (!response.ok) {
            throw new Error("Failed to update bot status");
        }

        const bot = bots.find((b) => b.id === botId);
        if (bot) {
            bot.status = status;
            updateBotList();
        }
    } catch (error) {
        console.error("Failed to update bot status:", error);
        addActivityLog("Failed to update bot status", "error");
    }
}

export function showAddBotModal() {
    addBotModal.classList.remove("hidden");
}

export function hideAddBotModal() {
    addBotModal.classList.add("hidden");
    document.getElementById("addBotForm").reset();
}

export async function showQrSection() {
    if (!selectedBot) {
        addActivityLog("Please select a bot first", "error");
        return;
    }

    qrSection.classList.remove("hidden");
    pairingSection.classList.add("hidden");
    addActivityLog(`Bot ID: ${selectedBot.id}`);
    connectToWhatsapp(selectedBot);
}

export function showDeleteConfirm() {
    document.getElementById("deleteConfirmModal").classList.remove("hidden");
}

export function hideDeleteConfirm() {
    document.getElementById("deleteConfirmModal").classList.add("hidden");
}

export function confirmDelete() {
    if (selectedBot) {
        deleteSelectedBot();
        hideDeleteConfirm();
    }
}

// Handle bot creation
export async function handleAddBot(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    try {
        const response = await fetch(`${API_URL}/bots`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: formData.get("botName"),
                number: formData.get("phoneNumber"),
            }),
        });

        const data = await response.json();
        console.log(data);
        if (response.ok) {
            bots.push(data.data);
            updateBotList();
            hideAddBotModal();
            event.target.reset();
            addActivityLog(`Bot "${data.data.name}" created successfully`);
            createLog("Bot Created", data.data.id);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Failed to create bot:", error);
        addActivityLog(`Failed to create bot: ${error.message}`, "error");
    }
}
