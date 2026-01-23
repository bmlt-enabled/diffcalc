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

    // Events table for configuration
    await db.execute(`
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hash TEXT NOT NULL UNIQUE,
            title TEXT,
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_events_hash ON events(hash)
    `);

    // Submissions table for date entries
    await db.execute(`
        CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hash TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(hash, key)
        )
    `);
    await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_submissions_hash ON submissions(hash)
    `);
}

// Initialize on module load
initializeDatabase().catch(function(err) {
    console.log("Database initialization error: " + err);
});

module.exports = {
    // Event configuration methods
    'saveConfig': async function(hash, config, callback) {
        var db = getClient();

        await db.execute({
            sql: `INSERT INTO events (hash, title, message, updated_at)
                  VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                  ON CONFLICT(hash) DO UPDATE SET
                  title = excluded.title,
                  message = excluded.message,
                  updated_at = CURRENT_TIMESTAMP`,
            args: [hash, config.title || '', config.message || '']
        });

        if (callback != null) callback();
    },

    'getConfig': async function(hash, callback) {
        var db = getClient();

        var result = await db.execute({
            sql: `SELECT title, message FROM events WHERE hash = ?`,
            args: [hash]
        });

        if (result.rows.length > 0) {
            callback({
                title: result.rows[0].title,
                message: result.rows[0].message
            });
        } else {
            callback(null);
        }
    },

    // Submission methods
    'save': async function(hash, key, value, callback) {
        var db = getClient();

        await db.execute({
            sql: `INSERT OR REPLACE INTO submissions (hash, key, value) VALUES (?, ?, ?)`,
            args: [hash, key, JSON.stringify(value)]
        });

        if (callback != null) callback();
    },

    'getAll': async function(hash, callback) {
        var db = getClient();

        var result = await db.execute({
            sql: `SELECT key, value FROM submissions WHERE hash = ?`,
            args: [hash]
        });

        var results = {};
        result.rows.forEach(function(row) {
            results[row.key] = row.value;
        });

        callback(results);
    },

    'export': async function(hash, callback) {
        var db = getClient();
        var exportText = "";

        var result = await db.execute({
            sql: `SELECT value FROM submissions WHERE hash = ?`,
            args: [hash]
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

    'get': async function(hash, key, callback) {
        var db = getClient();

        var result = await db.execute({
            sql: `SELECT value FROM submissions WHERE hash = ? AND key = ?`,
            args: [hash, key]
        });

        if (result.rows.length > 0) {
            callback(JSON.parse(result.rows[0].value));
        } else {
            callback(null);
        }
    },

    'delete': async function(hash, key, callback) {
        var db = getClient();

        var result = await db.execute({
            sql: `DELETE FROM submissions WHERE hash = ? AND key = ?`,
            args: [hash, key]
        });

        if (callback != null) callback(result.rowsAffected);
    }
};
