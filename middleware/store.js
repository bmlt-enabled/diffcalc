var redis = require("redis");

module.exports = {
    'save' : function(hash, key, value) {
        var client = redis.createClient();

        client.on("error", function (err) {
            console.log("Error " + err);
        });

        client.hset(hash, key, JSON.stringify(value), function() {
            client.quit();
        });
    },

    'getAll' : function(hash, callback) {
        var client = redis.createClient();

        client.hgetall(hash, function(err, results) {
            client.quit();
            callback(results);
        });
    }
};