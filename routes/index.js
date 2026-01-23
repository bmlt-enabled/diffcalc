var express = require('express');
var store = require('../middleware/store');
var calculator = require('../middleware/calculator');
var qrcode = require('../middleware/qrcode');
var router = express.Router();

// Password for configure page (from environment variable)
var CONFIGURE_PASSWORD = process.env.CONFIGURE_PASSWORD;

// Middleware to check if user is authenticated for configure routes
function requireAuth(req, res, next) {
  if (req.signedCookies.configureAuth === 'authenticated') {
    next();
  } else {
    res.redirect('/' + req.params.hash + '/configure/login');
  }
}

router.get('/:hash', function(req, res, next) {
  store.getConfig(req.params.hash, function(configuration) {
    if (configuration) {
      res.render('index', {
        hash: req.params.hash,
        configuration: configuration,
        error: req.query.error || null
      });
    } else {
      res.send(404);
    }
  });
});

router.post("/:hash/submit", function(req, res, next) {
  // get the data
  var day = req.body["day"];
  var month = req.body["month"];
  var year = req.body["year"];
  var firstname = req.body["firstname"].trim();
  var lastname = req.body["lastname"].trim();
  var allFields = req.body;

  // Update allFields with trimmed values
  allFields.firstname = firstname;
  allFields.lastname = lastname;

  var hash = req.params.hash;
  // Use lowercase for key to make duplicate check case-insensitive
  var key = firstname.toLowerCase() + "_" + lastname.toLowerCase() + "_" + month + "-" + day + "-" + year;

  // Check for duplicate before saving
  store.get(hash, key, function(existing) {
    if (existing) {
      // Duplicate found - redirect back with error message
      res.redirect('/' + hash + '?error=duplicate');
    } else {
      // No duplicate - calculate and save
      var calculated = calculator.calculate(year, month, day);
      store.save(hash, key, allFields);
      res.render('submitted', { hash: hash, allFields: allFields, calculated: calculated });
    }
  });
});

router.get("/:hash/total", function(req, res, next) {
  store.getAll(req.params.hash, function(results) {
    var total = calculator.grandTotal(results);

    res.render('total', { total: total } );
  });
});

router.get("/:hash/export", function(req, res, next) {
  store.export(req.params.hash, function(results) {
    if (results != null) {
      res.writeHead(200, {
        'Content-Type': 'application/force-download',
        'Content-disposition': 'attachment; filename=emails.txt'
      });
      res.end(results);
    } else {
      res.send(404);
    }
  });
});

router.get("/:hash/qr", function(req, res, next) {
  var formUrl = 'https://' + req.get('host') + '/' + req.params.hash;
  store.getConfig(req.params.hash, function(configuration) {
    if (configuration) {
      qrcode.generate(formUrl, function(qrCodeDataUrl) {
        if (qrCodeDataUrl) {
          res.render('qr-code', {
            hash: req.params.hash,
            qrCodeUrl: qrCodeDataUrl,
            formUrl: formUrl,
            configuration: configuration
          });
        } else {
          res.status(500).send("Error generating QR code");
        }
      });
    } else {
      res.send(404);
    }
  });
});

// Login page for configure
router.get("/:hash/configure/login", function(req, res, next) {
  res.render('configure-login', { hash: req.params.hash, error: null });
});

router.post("/:hash/configure/login", function(req, res, next) {
  if (req.body.password === CONFIGURE_PASSWORD) {
    res.cookie('configureAuth', 'authenticated', { signed: true, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.redirect('/' + req.params.hash + '/configure');
  } else {
    res.render('configure-login', { hash: req.params.hash, error: 'Invalid password' });
  }
});

router.get("/:hash/configure/logout", function(req, res, next) {
  res.clearCookie('configureAuth');
  res.redirect('/' + req.params.hash);
});

router.get("/:hash/configure", requireAuth, function(req, res, next) {
  store.getConfig(req.params.hash, function(configuration) {
    store.getAll(req.params.hash, function(datesResults) {
      var records = [];

      if (datesResults) {
        Object.keys(datesResults).forEach(function(key) {
          var record = JSON.parse(datesResults[key]);
          record._key = key;
          records.push(record);
        });
      }

      res.render('configure', {
        hash: req.params.hash,
        configuration: configuration,
        records: records
      });
    });
  });
});

router.post("/:hash/configure/save", requireAuth, function(req, res, next) {
  store.saveConfig(req.params.hash, req.body, function() {
    res.redirect('/' + req.params.hash + '/configure');
  });
});

router.post("/:hash/record/delete", requireAuth, function(req, res, next) {
  var key = req.body.key;
  store.delete(req.params.hash, key, function(result) {
    res.redirect('/' + req.params.hash + '/configure');
  });
});

router.get("/:hash/record/edit/:key", requireAuth, function(req, res, next) {
  var key = decodeURIComponent(req.params.key);
  store.get(req.params.hash, key, function(record) {
    if (record) {
      record._key = key;
      res.render('edit-record', { hash: req.params.hash, record: record });
    } else {
      res.redirect('/' + req.params.hash + '/configure');
    }
  });
});

router.post("/:hash/record/edit/:key", requireAuth, function(req, res, next) {
  var oldKey = decodeURIComponent(req.params.key);
  var hash = req.params.hash;

  var day = req.body["day"];
  var month = req.body["month"];
  var year = req.body["year"];
  var firstname = req.body["firstname"].trim();
  var lastname = req.body["lastname"].trim();

  // Update req.body with trimmed values
  req.body.firstname = firstname;
  req.body.lastname = lastname;

  // Use lowercase for key to match submit route
  var newKey = firstname.toLowerCase() + "_" + lastname.toLowerCase() + "_" + month + "-" + day + "-" + year;

  // Delete old record first, then save with new key
  store.delete(hash, oldKey, function() {
    store.save(hash, newKey, req.body, function() {
      res.redirect('/' + hash + '/configure');
    });
  });
});

module.exports = router;
