let socket = null;
let messageHandlerRef = null;

export const connectSocket = (token, onMessage, onError) => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        return;
    }

    const BASE_WS = import.meta.env.VITE_WS_URL;

    const url = `${BASE_WS}/ws/chat/?token=${token}`;
    messageHandlerRef = onMessage;
    socket = new WebSocket(url);

    socket.onopen = () => {
        console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        messageHandlerRef(data);
    };

    socket.onerror = (e) => {
       console.warn("Socket error", e) 
    };

    socket.onclose = (e) => {
        console.log("WebSocket closed:", e.code);
        setTimeout(() => {
            socket = null;
        }, 1000);
    };

    return socket;
};

export const updateSocketHandler = (onMessage) => {
    messageHandlerRef = onMessage;
};

export const sendSocketMessage = (message, conversationId = null, model = "gemini") => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.warn("Socket not ready");
        return;
    }

    socket.send(JSON.stringify({
        message,
        conversation_id: conversationId,
        model
    }));
};

export const disconnectSocket = () => {
    if (socket) {
        socket.close();
        socket = null;
    }
};