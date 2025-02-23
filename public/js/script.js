import addActivityLog from "./helper.js";
import fetchBots, {
    showAddBotModal,
    hideAddBotModal,
    handleAddBot,
    showDeleteConfirm,
    confirmDelete,
    hideDeleteConfirm,
    bots,
} from "./bot.js";

fetchBots();

const botNameHeader = document.getElementById("botNameHeader");
const selectedBotNumber = document.getElementById("selectedBotNumber");
const connectionStatus = document.getElementById("connectionStatus");
const deleteButton = document.getElementById("deleteButton");
const whatsappConnection = document.querySelector(".max-w-2xl");
const statusElement = document.getElementById("connectionStatus");
const activityLogs = document.querySelector(".activityLogs-content");

export let selectedBot = null;

// Event Listener Add Bot
document
    .getElementById("buttonAddBotModal")
    .addEventListener("click", showAddBotModal);
document
    .getElementById("closeXAddBotModal")
    .addEventListener("click", hideAddBotModal);
document
    .getElementById("closeAddBotModal")
    .addEventListener("click", hideAddBotModal);
document.getElementById("addBotForm").addEventListener("submit", handleAddBot);

// Event listener Delet Bot
document
    .getElementById("deleteButton")
    .addEventListener("click", showDeleteConfirm);
document
    .getElementById("confirmDeleteButton")
    .addEventListener("click", confirmDelete);
document
    .getElementById("cencelDeleteButton")
    .addEventListener("click", hideDeleteConfirm);

document
    .getElementById("qrSectionButton")
    .addEventListener("click", showQrSection);
document
    .getElementById("pairingSectionButton")
    .addEventListener("click", showPairingSection);

// Event Listener Navigasi

document.querySelector("nav").addEventListener("click", (e) => {
    botNameHeader.textContent = "Bot Dashboard";
    selectedBotNumber.textContent = "Select a bot to begin";
    connectionStatus.classList.add("hidden");
    deleteButton.classList.add("hidden");
    whatsappConnection.classList.add("hidden");
    selectedBot = null;

    const btn = e.target.closest("[nav-btn]");
    if (btn) {
        const section = btn.getAttribute("nav-btn");
        if (section == "dasboard") {
            console.log("Navigasi ke:", section);
            activityLogs.classList.add("hidden");
        }
        if (section == "messages") {
            console.log("Navigasi ke:", section);
            activityLogs.classList.add("hidden");
        }
        if (section == "activity-logs") {
            console.log("Navigasi ke:", section);
            activityLogs.classList.remove("hidden");
        }
        if (section == "settings") {
            console.log("Navigasi ke:", section);
            activityLogs.classList.add("hidden");
        }
    }
});

// Event delegation untuk bot list
document.getElementById("botList").addEventListener("click", (event) => {
    const botItem = event.target.closest("[data-bot-id]");
    if (botItem) {
        const botId = botItem.dataset.botId;
        selectBot(botId);
    }
});

export function selectBot(botId) {
    const bot = bots.find((b) => b.id === botId);
    if (!bot) return;

    selectedBot = bot;
    // Perbarui UI

    document.getElementById("botNameHeader").textContent = bot.name;
    document.getElementById("selectedBotNumber").textContent = bot.number;

    // Perbarui status koneksi
    statusElement.classList.remove("bg-green-500", "bg-gray-300");
    statusElement.classList.add(
        bot.status === "connected" ? "bg-green-500" : "bg-gray-300"
    );
    statusElement.classList.remove("hidden");
    whatsappConnection.classList.toggle("hidden", bot.status === "connected");
    document.getElementById("deleteButton").classList.remove("hidden");
    activityLogs.classList.add("hidden");

    addActivityLog(`Selected bot "${bot.name}"`);
}

export async function deleteSelectedBot() {
    if (!selectedBot) return;

    try {
        const response = await fetch(`${API_URL}/bots/${selectedBot.id}`, {
            method: "DELETE",
        });

        if (response.ok) {
            const botName = selectedBot.name;
            bots = bots.filter((bot) => bot.id !== selectedBot.id);
            selectedBot = null;
            botNameHeader.textContent = "Bot Dashboard";
            selectedBotNumber.textContent = "Select a bot to begin";
            connectionStatus.classList.add("hidden");
            deleteButton.classList.add("hidden");
            updateBotList();
            addActivityLog(`Bot "${botName}" deleted successfully`);
        } else {
            throw new Error("Failed to delete bot");
        }
    } catch (error) {
        console.error("Failed to delete bot:", error);
        addActivityLog(`Failed to delete bot: ${error.message}`, "error");
    }
}

export async function showPairingSection() {
    if (!selectedBot) {
        addActivityLog("Please select a bot first", "error");
        return;
    }

    pairingSection.classList.remove("hidden");
    qrSection.classList.add("hidden");

    try {
        const response = await fetch(
            `${API_URL}/bots/${selectedBot.id}/connect`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ method: "pairing" }),
            }
        );
        addActivityLog("Request Pairing Code..");
        const res = await response.json();
        addActivityLog("Get Pairing Code");
        const pairingCodeContainer = document.querySelector(
            "#pairingSection .text-2xl"
        );
        if (pairingCodeContainer) {
            pairingCodeContainer.textContent = res.pairingCode;
        }

        addActivityLog("Waiting for pairing code...");
    } catch (error) {
        addActivityLog("Failed to start pairing connection", "error");
        console.error(error);
    }
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
