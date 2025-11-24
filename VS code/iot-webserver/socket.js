// socket.js — Quản lý Socket.IO toàn cục
let io = null;

function initSocket(server) {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: { origin: "*" },
  });

  console.log("🔌 Socket.IO initialized!");

  // Lắng nghe kết nối từ client (dashboard web)
  io.on("connection", (socket) => {
    console.log("🟢 Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });

  return io;
}

// Hàm lấy IO ở nơi khác (mqttClient,…)
function getIO() {
    if (!io) {
      console.warn("⚠️ WARNING: getIO() gọi trước khi initSocket()!");
    }
    return io;
}

module.exports = { initSocket, getIO };
