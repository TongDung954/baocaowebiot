// routes/sensorRoutes.js
console.log("🔥 sensorRoutes.js LOADED!");

const express = require("express");
const router = express.Router();
const { getConnection } = require("../db");

/* ======================================================
   1) GET: Lấy danh sách lịch sử
====================================================== */
router.get("/sensor-data", async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT TOP 500 *
      FROM SensorData
      ORDER BY Timestamp DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Lỗi lấy dữ liệu sensor", detail: err.message });
  }
});

/* ======================================================
   2) GET: Lấy dữ liệu mới nhất
====================================================== */
router.get("/sensor-data/latest", async (req, res) => {
  try {
    const pool = await getConnection();

    const tempQuery = await pool.request().query(`
      SELECT TOP 1 Value, Timestamp 
      FROM SensorData 
      WHERE SensorID = (SELECT TOP 1 SensorID FROM Sensors WHERE Type='Temperature')
      ORDER BY Timestamp DESC
    `);

    const humQuery = await pool.request().query(`
      SELECT TOP 1 Value, Timestamp 
      FROM SensorData 
      WHERE SensorID = (SELECT TOP 1 SensorID FROM Sensors WHERE Type='Humidity')
      ORDER BY Timestamp DESC
    `);

    res.json({
      temperature: tempQuery.recordset[0]?.Value ?? null,
      humidity: humQuery.recordset[0]?.Value ?? null,
      timestamp:
        tempQuery.recordset[0]?.Timestamp ??
        humQuery.recordset[0]?.Timestamp ??
        null
    });

  } catch (err) {
    res.status(500).json({ error: "Lỗi lấy dữ liệu mới nhất", detail: err.message });
  }
});

/* ======================================================
   3) POST: Thêm dữ liệu (Test API)
====================================================== */
router.post("/sensor-data", async (req, res) => {
  const { sensorId, value } = req.body;

  if (!sensorId || value == null) {
    return res.status(400).json({ error: "Thiếu sensorId hoặc value" });
  }

  try {
    const pool = await getConnection();
    await pool.request()
      .input("sensorId", sensorId)
      .input("value", value)
      .query("INSERT INTO SensorData (SensorID, Value) VALUES (@sensorId, @value)");

    res.json({ message: "Đã thêm dữ liệu sensor", sensorId, value });
  } catch (err) {
    res.status(500).json({ error: "Lỗi thêm dữ liệu sensor", detail: err.message });
  }
});

/* ======================================================
   ⭐ 4) DELETE: Xóa TỪNG DÒNG theo DataID
====================================================== */
router.delete("/sensor-data/:id", async (req, res) => {
  const dataId = req.params.id;

  try {
    const pool = await getConnection();
    await pool.request()
      .input("id", dataId)
      .query("DELETE FROM SensorData WHERE DataID = @id");

    res.json({ message: `Đã xóa DataID = ${dataId}` });
  } catch (err) {
    res.status(500).json({ error: "Lỗi xóa dữ liệu", detail: err.message });
  }
});

/* ======================================================
   ⭐ 5) DELETE ALL HISTORY
====================================================== */
router.delete("/sensor-data", async (req, res) => {
  try {
    const pool = await getConnection();
    await pool.request().query("DELETE FROM SensorData");

    res.json({ message: "🔥 ĐÃ XÓA TOÀN BỘ LỊCH SỬ!" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi xóa ALL", detail: err.message });
  }
});

/* ======================================================
   6) GET: Danh sách Devices
====================================================== */
router.get("/devices", async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`SELECT * FROM Devices`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Lỗi lấy danh sách devices", detail: err.message });
  }
});

/* ======================================================
   7) PUT: Update Device Status
====================================================== */
router.put("/devices/:id", async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  if (status === undefined) {
    return res.status(400).json({ error: "Thiếu status (0 hoặc 1)" });
  }

  try {
    const pool = await getConnection();
    await pool.request()
      .input("id", id)
      .input("status", status)
      .query("UPDATE Devices SET Status = @status WHERE DeviceID = @id");

    res.json({ message: "Đã cập nhật thiết bị", id, status });
  } catch (err) {
    res.status(500).json({ error: "Lỗi cập nhật thiết bị", detail: err.message });
  }
});

/* ======================================================
   8) GET Sensors
====================================================== */
router.get("/sensors", async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT s.SensorID, s.DeviceID, s.Type, s.Unit, d.Name AS DeviceName
      FROM Sensors s
      JOIN Devices d ON s.DeviceID = d.DeviceID
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Lỗi lấy danh sách sensors", detail: err.message });
  }
});

/* ======================================================
   9) Filter History
====================================================== */
router.get("/sensor-data/filter", async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: "Cần start và end" });
  }

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("start", start)
      .input("end", end)
      .query(`
        SELECT * 
        FROM SensorData
        WHERE Timestamp BETWEEN @start AND @end
        ORDER BY Timestamp ASC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Lỗi lọc dữ liệu", detail: err.message });
  }
});

console.log("🔥 Router READY!");
module.exports = router;
