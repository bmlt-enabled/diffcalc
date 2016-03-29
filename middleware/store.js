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
    },

    'export' : function(hash, type, callback) {
        var client = redis.createClient();
        var exportText = "";

        client.hgetall(hash + ":" + type, function(err, results) {
            client.quit();

            Object.keys(results).forEach(function(key) {
                var keyObject = JSON.parse(results[key]);
                if (keyObject.email != null && keyObject.email.length > 0) {
                    exportText += keyObject.email + "\r\n";
                }
            });

            callback(exportText);
        });
    }
};