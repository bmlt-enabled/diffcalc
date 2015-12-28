var redis = require("redis");

module.exports = {
    'save' : function(hash, type, key, value, callback) {
        var client = redis.createClient();

        client.on("error", function (err) {
            console.log("Error " + err);
        });

        client.hset(hash + ":" + type, key, JSON.stringify(value), function() {
            client.quit();
            if (callback != null) callback();
        });
    },

    'getAll' : function(hash, type, callback) {
        var client = redis.createClient();

        client.hgetall(hash + ":" + type, function(err, results) {
            client.quit();
            callback(results);
        });
    }
};