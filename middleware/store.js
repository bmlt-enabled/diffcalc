var { createClient } = require("@libsql/client");

// Create Turso client - connection is managed internally
var client = null;

function getClient() {
    if (!client) {
        var url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
        var authToken = process.env.TURSO_AUTH_TOKEN;

        if (!url) {
            // Default to local SQLite file for development
            url = "file:./data/diffcalc.db";
        }

        client = createClient({
            url: url,
            authToken: authToken
        });
    }
    return client;
}

// Initialize database schema
async function initializeDatabase() {
    var db = getClient();
    await db.execute(`
        CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hash TEXT NOT NULL,
            type TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(hash, type, key)
        )
    `);
    await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_hash_type ON submissions(hash, type)
    `);
}

// Initialize on module load
initializeDatabase().catch(function(err) {
    console.log("Database initialization error: " + err);
});

module.exports = {
    'save': async function(hash, type, key, value, callback) {
        var db = getClient();

        await db.execute({
            sql: `INSERT OR REPLACE INTO submissions (hash, type, key, value) VALUES (?, ?, ?, ?)`,
            args: [hash, type, key, JSON.stringify(value)]
        });

        if (callback != null) callback();
    },

    'getAll': async function(hash, type, callback) {
        var db = getClient();

        var result = await db.execute({
            sql: `SELECT key, value FROM submissions WHERE hash = ? AND type = ?`,
            args: [hash, type]
        });

        var results = {};
        result.rows.forEach(function(row) {
            results[row.key] = row.value;
        });

        callback(results);
    },

    'export': async function(hash, type, callback) {
        var db = getClient();
        var exportText = "";

        var result = await db.execute({
            sql: `SELECT value FROM submissions WHERE hash = ? AND type = ?`,
            args: [hash, type]
        });

        if (result.rows != null && result.rows.length > 0) {
            result.rows.forEach(function(row) {
                var keyObject = JSON.parse(row.value);
                if (keyObject.email != null && keyObject.email.length > 0) {
                    exportText += keyObject.email + "\r\n";
                }
            });
        }

        callback(exportText);
    },

    'get': async function(hash, type, key, callback) {
        var db = getClient();

        var result = await db.execute({
            sql: `SELECT value FROM submissions WHERE hash = ? AND type = ? AND key = ?`,
            args: [hash, type, key]
        });

        if (result.rows.length > 0) {
            callback(JSON.parse(result.rows[0].value));
        } else {
            callback(null);
        }
    },

    'delete': async function(hash, type, key, callback) {
        var db = getClient();

        var result = await db.execute({
            sql: `DELETE FROM submissions WHERE hash = ? AND type = ? AND key = ?`,
            args: [hash, type, key]
        });

        if (callback != null) callback(result.rowsAffected);
    }
};
