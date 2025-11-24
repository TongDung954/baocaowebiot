// =============================================================
//  SERVER.JS — CHUẨN CHO DỰ ÁN IoT MONITORING
// =============================================================
console.log("🔥 SERVER.JS PATH:", __filename);
console.log("🔥 WORK DIR:", process.cwd());

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000;

// =====================
// MIDDLEWARE
// =====================
app.use(cors());
app.use(express.json());

// =====================
// SERVE STATIC (Dashboard, Devices, Sensors...)
// =====================
app.use(express.static("public"));   // phục vụ các file HTML trong thư mục public/

// =====================
// HTTP SERVER
// =====================
const server = http.createServer(app);

// =====================
// SOCKET.IO
// =====================
const { initSocket } = require("./socket");
const io = initSocket(server);       // khởi tạo socket realtime

// =====================
// MQTT CLIENT
// =====================
require("./mqttClient");             // tự động kết nối MQTT và xử lý dữ liệu

// =====================
// API ROUTES
// =====================
const apiRoutes = require("./routes/sensorRoutes");
app.use("/api", apiRoutes);          // tất cả API đều bắt đầu bằng /api/...

// =====================
// START SERVER
// =====================
server.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
