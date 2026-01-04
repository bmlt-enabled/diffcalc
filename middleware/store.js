var redis = require("redis");

// Helper function to create and connect Redis client with proper TLS configuration
async function createRedisClient() {
    var redisUrl = process.env.REDIS_URL || process.env.REDISCLOUD_URL;
    var client;

    // Check if using TLS (rediss://)
    if (redisUrl && redisUrl.startsWith('rediss://')) {
        client = redis.createClient({
            url: redisUrl,
            socket: {
                tls: true,
                rejectUnauthorized: false
            }
        });
    } else if (redisUrl) {
        client = redis.createClient({ url: redisUrl });
    } else {
        client = redis.createClient();
    }

    client.on("error", function (err) {
        console.log("Error " + err);
    });

    await client.connect();
    return client;
}

module.exports = {
    'save' : async function(hash, type, key, value, callback) {
        var client = await createRedisClient();

        await client.hSet(hash + ":" + type, key, JSON.stringify(value));
        await client.disconnect();
        if (callback != null) callback();
    },

    'getAll' : async function(hash, type, callback) {
        var client = await createRedisClient();

        var results = await client.hGetAll(hash + ":" + type);
        await client.disconnect();
        callback(results);
    },

    'export' : async function(hash, type, callback) {
        var client = await createRedisClient();
        var exportText = "";

        var results = await client.hGetAll(hash + ":" + type);
        await client.disconnect();

        if (results != null && Object.keys(results).length > 0) {
            Object.keys(results).forEach(function(key) {
                var keyObject = JSON.parse(results[key]);
                if (keyObject.email != null && keyObject.email.length > 0) {
                    exportText += keyObject.email + "\r\n";
                }
            });
        }

        callback(exportText);
    },

    'get' : async function(hash, type, key, callback) {
        var client = await createRedisClient();

        var result = await client.hGet(hash + ":" + type, key);
        await client.disconnect();
        callback(result ? JSON.parse(result) : null);
    },

    'delete' : async function(hash, type, key, callback) {
        var client = await createRedisClient();

        var result = await client.hDel(hash + ":" + type, key);
        await client.disconnect();
        if (callback != null) callback(result);
    }
};
