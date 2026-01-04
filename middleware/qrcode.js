var QRCode = require('qrcode');

module.exports = {
    'generate': function(url, callback) {
        QRCode.toDataURL(url, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        }, function(err, qrCodeDataUrl) {
            if (err) {
                console.log("QR Code generation error: " + err);
                callback(null);
            } else {
                callback(qrCodeDataUrl);
            }
        });
    }
};
