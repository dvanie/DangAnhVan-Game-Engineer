const fs = require("fs");
const path = require("path");

const { STORAGE } = require("../../config/paths");

const STORAGE_DIR = STORAGE;
const LOG_FILE = path.join(STORAGE_DIR, "logs.json");

/**
 * Khởi tạo storage nếu chưa tồn tại
 */
function initialize() {

    if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }

    if (!fs.existsSync(LOG_FILE)) {
        fs.writeFileSync(
            LOG_FILE,
            JSON.stringify([], null, 2),
            "utf8"
        );
    }

}

/**
 * Đọc toàn bộ log
 */
function getAllLogs() {

    initialize();

    try {

        const raw = fs.readFileSync(LOG_FILE, "utf8");

        if (!raw.trim()) {
            return [];
        }

        return JSON.parse(raw);

    } catch (err) {

        console.error("[DevOS Memory] Failed to read logs.");

        console.error(err);

        return [];

    }

}

/**
 * Ghi toàn bộ log xuống storage
 */
function saveAllLogs(logs) {

    initialize();

    fs.writeFileSync(
        LOG_FILE,
        JSON.stringify(logs, null, 2),
        "utf8"
    );

}

/**
 * ghi log cuoi cung, khong cho lap lai
 */

function getLastLog() {

    const logs = getAllLogs();

    if (logs.length === 0)
        return null;

    return logs[logs.length - 1];

}

/**
 * Thêm một log mới
 */
function saveLog(entry) {

    const logs = getAllLogs();

    logs.push(entry);

    saveAllLogs(logs);

}

/**
 * Xóa toàn bộ log
 */
function clearLogs() {

    saveAllLogs([]);

}

module.exports = {

    initialize,

    getAllLogs,
    
    getLastLog,

    saveAllLogs,

    saveLog,

    clearLogs

};