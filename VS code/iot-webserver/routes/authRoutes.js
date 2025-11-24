// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getConnection } = require("../db");

// khoá JWT tạm (đề tài dùng tạm)
const JWT_SECRET = "very_secret_key_123"; 

// Đăng ký
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Thiếu username hoặc password" });

  try {
    const hash = await bcrypt.hash(password, 10);
    const pool = await getConnection();
    await pool.request()
      .input("u", username)
      .input("p", hash)
      .query("INSERT INTO Users (Username, PasswordHash) VALUES (@u, @p)");

    res.json({ message: "Đăng ký thành công" });
  } catch (err) {
    res.status(500).json({ error: "Lỗi đăng ký", detail: err.message });
  }
});

// Đăng nhập
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Thiếu username hoặc password" });

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("u", username)
      .query("SELECT * FROM Users WHERE Username = @u");

    const user = result.recordset[0];
    if (!user) return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });

    const ok = await bcrypt.compare(password, user.PasswordHash);
    if (!ok) return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });

    const token = jwt.sign(
      { userId: user.UserID, username: user.Username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Đăng nhập thành công", token });
  } catch (err) {
    res.status(500).json({ error: "Lỗi đăng nhập", detail: err.message });
  }
});

module.exports = router;
