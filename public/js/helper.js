const API_URL = "http://localhost:3000/api/v1";

export const addChatBubble = (msg, name, type) => {
    const chatContainer = document.getElementById("chatContainer"); // Kontainer chat

    // Container untuk bubble dan nama
    const bubbleContainer = document.createElement("div");
    bubbleContainer.className = `chat-bubble-container ${type}`;

    // Nama di atas bubble
    const chatName = document.createElement("span");
    chatName.className = "chat-bubble-name";
    chatName.textContent = name;
    bubbleContainer.appendChild(chatName);

    // Bubble chat
    const chatBubble = document.createElement("div");
    chatBubble.className = `chat-bubble ${type}`;
    chatBubble.textContent = msg;
    bubbleContainer.appendChild(chatBubble);

    // Tambahkan ke container utama
    chatContainer.appendChild(bubbleContainer);
    chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll otomatis
};

export default async function addActivityLog(message, type = "info") {
    const logsContainer = document.getElementById("activityLogs");
    const logEntry = document.createElement("div");
    logEntry.className = `text-sm ${
        type === "error" ? "text-red-600" : "text-gray-600"
    }`;
    logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    logsContainer.insertBefore(logEntry, logsContainer.firstChild);
}

export async function getLogs() {
    const response = await fetch(`${API_URL}/logs`);
    const data = await response.json();
    console.log(data);
}

export async function createLog(action, user_id) {
    const response = await fetch(`${API_URL}/logs/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, user_id }),
    });
    console.log(response);
}
