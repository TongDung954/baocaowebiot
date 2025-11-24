// db.js — kết nối SQL Server chuẩn cho dự án IoT
const sql = require("mssql");
require("dotenv").config();

// cấu hình SQL Server
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    server: process.env.DB_HOST,        // đúng biến trong .env
    options: {
        encrypt: true,                  // bật SSL (không ảnh hưởng local)
        trustServerCertificate: true    // cho phép tự xác nhận chứng chỉ
    }
};

let pool;

// Hàm kết nối (tự tái sử dụng pool)
async function getConnection() {
    try {
        if (pool) {
            return pool; // nếu đã kết nối → dùng lại
        }

        pool = await sql.connect(config);
        console.log("✅ SQL Server connected!");
        return pool;

    } catch (err) {
        console.error("❌ SQL Connection ERROR:", err);
        throw err;
    }
}

module.exports = {
    sql,
    getConnection
};
