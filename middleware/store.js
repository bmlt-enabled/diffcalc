var redis = require("redis");

// Helper function to create Redis client with proper TLS configuration
function createRedisClient() {
    var redisUrl = process.env.REDIS_URL || process.env.REDISCLOUD_URL;

    // Check if using TLS (rediss://)
    if (redisUrl && redisUrl.startsWith('rediss://')) {
        return redis.createClient({
            url: redisUrl,
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    return redis.createClient(redisUrl);
}

module.exports = {
    'save' : function(hash, type, key, value, callback) {
        var client = createRedisClient();

        client.on("error", function (err) {
            console.log("Error " + err);
        });

        client.hset(hash + ":" + type, key, JSON.stringify(value), function() {
            client.quit();
            if (callback != null) callback();
        });
    },

    'getAll' : function(hash, type, callback) {
        var client = createRedisClient();

        client.hgetall(hash + ":" + type, function(err, results) {
            client.quit();
            callback(results);
        });
    },

    'export' : function(hash, type, callback) {
        var client = createRedisClient();
        var exportText = "";

        client.hgetall(hash + ":" + type, function(err, results) {
            client.quit();

            if (results != null) {
                Object.keys(results).forEach(function(key) {
                    var keyObject = JSON.parse(results[key]);
                    if (keyObject.email != null && keyObject.email.length > 0) {
                        exportText += keyObject.email + "\r\n";
                    }
                });
            }

            callback(exportText);
        });
    }
};
