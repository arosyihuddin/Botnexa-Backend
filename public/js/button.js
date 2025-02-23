import addActivityLog from "./helper.js";
import { bots, updateBotList, connectToWhatsapp } from "./bot.js";
import { deleteSelectedBot, selectedBot } from "./script.js";

const API_URL = "http://localhost:3000/api";

const addBotModal = document.getElementById("addBotModal");
const qrSection = document.getElementById("qrSection");
const pairingSection = document.getElementById("pairingSection");

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
        if (response.ok) {
            bots.push(data.data);
            updateBotList();
            hideAddBotModal();
            event.target.reset();
            addActivityLog(`Bot "${data.data.name}" created successfully`);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Failed to create bot:", error);
        addActivityLog(`Failed to create bot: ${error.message}`, "error");
    }
}
