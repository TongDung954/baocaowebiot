// mqttClient.js — phiên bản chuẩn cho IoT Monitoring
require("dotenv").config();

console.log("DEBUG MQTT_URI =", process.env.MQTT_URI);
console.log("DEBUG MQTT_USER =", process.env.MQTT_USER);
console.log("DEBUG MQTT_PASS =", process.env.MQTT_PASS);

const mqtt = require("mqtt");
const { getConnection } = require("./db");
const { getIO } = require("./socket");

// Kết nối MQTT từ biến môi trường
const client = mqtt.connect(process.env.MQTT_URI, {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
  rejectUnauthorized: false
});

client.on("connect", () => {
  console.log("🚀 MQTT connected!");

  client.subscribe("data/sensor/dht22", (err) => {
    if (err) console.log("❌ Subscribe lỗi:", err);
    else console.log("📡 Đã subscribe topic: data/sensor/dht22");
  });
});

client.on("message", async (topic, message) => {
  console.log("📥 MQTT Data:", message.toString());

  try {
    const data = JSON.parse(message.toString());
    const temperature = data.temperature;
    const humidity = data.humidity;

    const pool = await getConnection();

    // Tìm SensorID theo type
    const tempSensor = await pool.request()
      .query("SELECT TOP 1 SensorID FROM Sensors WHERE Type='Temperature'");
    const humSensor = await pool.request()
      .query("SELECT TOP 1 SensorID FROM Sensors WHERE Type='Humidity'");

    const tempID = tempSensor.recordset[0]?.SensorID;
    const humID = humSensor.recordset[0]?.SensorID;

    if (!tempID || !humID) {
      console.log("⚠ Sensors chưa có trong database!");
      return;
    }

    // Lưu Temperature
    await pool.request()
      .input("sensorId", tempID)
      .input("value", temperature)
      .query("INSERT INTO SensorData (SensorID, Value) VALUES (@sensorId, @value)");

    // Lưu Humidity
    await pool.request()
      .input("sensorId", humID)
      .input("value", humidity)
      .query("INSERT INTO SensorData (SensorID, Value) VALUES (@sensorId, @value)");

    console.log("💾 SQL: Đã lưu dữ liệu vào SensorData!");

    // realtime qua Socket.IO
    const io = getIO();
    if (io) {
      io.emit("sensorData", {
        temperature,
        humidity,
        timestamp: new Date().toISOString()
      });
    }

  } catch (err) {
    console.error("❌ Lỗi xử lý MQTT:", err);
  }
});

client.on("error", (err) => console.error("❌ MQTT Error:", err));
client.on("reconnect", () => console.log("♻️ MQTT reconnecting..."));
client.on("close", () => console.log("🔒 MQTT closed"));

module.exports = client;
