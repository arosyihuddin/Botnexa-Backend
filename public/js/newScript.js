import { io } from "https://cdn.socket.io/4.5.0/socket.io.esm.min.js";

// API endpoints
const API_URL = "http://localhost:3000/api";
let socket;
// Initialize Socket.IO after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  socket = io("http://localhost:3000", {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
  });

  // Socket event listeners
  socket.on("connect", () => {
    console.log("Connected to server");
    addActivityLog("Connected to server");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from server");
    addActivityLog("Disconnected from server", "error");
  });

  socket.on("pairingCode", (code) => {
    const pairingCodeElement = document.querySelector(
      "#pairingSection .text-2xl"
    );
    if (pairingCodeElement) {
      pairingCodeElement.textContent = code;
    }
    addActivityLog(`Pairing code received: ${code}`);
  });

  socket.on("connection-status", (status) => {
    if (status === "connected") {
      whatsappConnection.classList.add("hidden");
      addActivityLog("WhatsApp connected successfully");
      updateBotConnectionStatus(selectedBot.id, "connected");
    }
  });

  socket.on("messages.upsert", (upsert) => {
    handleMessagesUpsert(upsert);
  });

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
  document
    .getElementById("addBotForm")
    .addEventListener("submit", handleAddBot);

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

  document.querySelector("nav").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-view]");
    console.log(e);
    if (btn) {
      const view = btn.dataset.view;
      console.log("Navigasi ke:", view);
      // Tambahkan logika untuk menampilkan view yang sesuai
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
});

// DOM Elements
const addBotModal = document.getElementById("addBotModal");
const qrSection = document.getElementById("qrSection");
const pairingSection = document.getElementById("pairingSection");
const deleteButton = document.getElementById("deleteButton");
const botNameHeader = document.getElementById("botNameHeader");
const selectedBotNumber = document.getElementById("selectedBotNumber");
const connectionStatus = document.getElementById("connectionStatus");
const whatsappConnection = document.querySelector(".max-w-2xl");

// Fetch all bots

// Add activity log
export default function addActivityLog(message, type = "info") {
  const logsContainer = document.getElementById("activityLogs");
  const logEntry = document.createElement("div");
  logEntry.className = `text-sm ${
    type === "error" ? "text-red-600" : "text-gray-600"
  }`;
  logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
  logsContainer.insertBefore(logEntry, logsContainer.firstChild);
}

// Modal functions

// Connection methods

async function showPairingSection() {
  if (!selectedBot) {
    addActivityLog("Please select a bot first", "error");
    return;
  }

  pairingSection.classList.remove("hidden");
  qrSection.classList.add("hidden");

  try {
    const response = await fetch(`${API_URL}/bots/${selectedBot.id}/connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ method: "pairing" }),
    });
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

// Handle bot creation
async function handleAddBot(event) {
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

// Handle bot deletion
async function deleteSelectedBot() {
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

// Perbaiki fungsi selectBot
function selectBot(botId) {
  const bot = bots.find((b) => b.id === botId);
  if (!bot) return;

  selectedBot = bot;
  // Perbarui UI
  document.getElementById("botNameHeader").textContent = bot.name;
  document.getElementById("selectedBotNumber").textContent = bot.number;

  // Perbarui status koneksi
  const statusElement = document.getElementById("connectionStatus");
  statusElement.classList.remove("bg-green-500", "bg-gray-300");
  statusElement.classList.add(
    bot.status === "connected" ? "bg-green-500" : "bg-gray-300"
  );
  statusElement.classList.remove("hidden");

  // Tampilkan panel koneksi
  const whatsappConnection = document.querySelector(".max-w-2xl");
  whatsappConnection.classList.toggle("hidden", bot.status === "connected");

  // Perbarui tombol delete
  document.getElementById("deleteButton").classList.remove("hidden");

  addActivityLog(`Selected bot "${bot.name}"`);
}

// Perbaiki render bot list
function updateBotList() {
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
                      bot.status === "connected"
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }"></div>
                    <span class="text-sm font-medium">${bot.name}</span>
                </div>
            </button>
        </div>
    `
    )
    .join("");
}
