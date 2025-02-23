import { io } from "https://cdn.socket.io/4.5.0/socket.io.esm.min.js";
import addActivityLog from "./helper.js";

export const socket = io("http://localhost:3000", {
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
