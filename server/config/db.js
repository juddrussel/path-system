// config/db.js — mysql2 pool setup
const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host:               process.env.DB_HOST || "localhost",
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER || "root",
  password:           process.env.DB_PASS || "",
  database:           process.env.DB_NAME || "path_db",
  waitForConnections: true,
  connectionLimit:    10,
  timezone:           "+00:00",
});

// Confirm connectivity at startup
db.getConnection()
  .then((conn) => {
    console.log("✅  MySQL connected:", process.env.DB_NAME || "path_db");
    conn.release();
  })
  .catch((err) => {
    console.error("❌  MySQL connection failed:", err.message);
    process.exit(1);
  });

module.exports = db;

/* ─── SQL: Create users table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  full_name   VARCHAR(150)  NOT NULL,
  email       VARCHAR(255)  NOT NULL UNIQUE,
  phone       VARCHAR(30)   DEFAULT NULL,
  department  VARCHAR(100)  NOT NULL,
  username    VARCHAR(80)   NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('pending','user','admin','Program Chair') NOT NULL DEFAULT 'pending',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      ON UPDATE CURRENT_TIMESTAMP
);

─── SQL: Create workflows table ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workflows (
  id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name         VARCHAR(255)    NOT NULL,
  description  TEXT            NULL,
  status       ENUM('Draft','Published','Archived') NOT NULL DEFAULT 'Draft',
  created_by   INT UNSIGNED    NOT NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_status     (status),
  KEY idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

─────────────────────────────────────────────────────────────────────────────── */