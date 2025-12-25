var express = require('express');
var store = require('../middleware/store');
var calculator = require('../middleware/calculator');
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
  store.getAll(req.params.hash, "config", function(results) {
    if (results != null) {
      res.render('index', { hash: req.params.hash, configuration : JSON.parse(results["config"]) });
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
  var firstname = req.body["firstname"];
  var lastname = req.body["lastname"];
  var allFields = req.body;

  // calculate
  var calculated = calculator.calculate(year, month, day)

  // store it
  var hash = req.params.hash;
  var key = firstname + "_" + lastname + "_" + month + "-" + day + "-" + year;
  store.save(hash, "dates", key, allFields);

  // show result
  res.render('submitted', { hash : hash, allFields : allFields, calculated : calculated });
});

router.get("/:hash/total", function(req, res, next) {
  store.getAll(req.params.hash, "dates", function(results) {
    var total = calculator.grandTotal(results);

    res.render('total', { total: total } );
  });
});

router.get("/:hash/export", function(req, res, next) {
  store.export(req.params.hash, "dates", function(results) {
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
  store.getAll(req.params.hash, "config", function(configResults) {
    store.getAll(req.params.hash, "dates", function(datesResults) {
      var configuration = configResults ? JSON.parse(configResults.config) : null;
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
  store.save(req.params.hash, "config", "config", req.body, function(results) {
    res.redirect('/' + req.params.hash + '/configure');
  });
});

router.post("/:hash/record/delete", requireAuth, function(req, res, next) {
  var key = req.body.key;
  store.delete(req.params.hash, "dates", key, function(result) {
    res.redirect('/' + req.params.hash + '/configure');
  });
});

router.get("/:hash/record/edit/:key", requireAuth, function(req, res, next) {
  var key = decodeURIComponent(req.params.key);
  store.get(req.params.hash, "dates", key, function(record) {
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
  var firstname = req.body["firstname"];
  var lastname = req.body["lastname"];
  var newKey = firstname + "_" + lastname + "_" + month + "-" + day + "-" + year;

  // Delete old record first, then save with new key
  store.delete(hash, "dates", oldKey, function() {
    store.save(hash, "dates", newKey, req.body, function() {
      res.redirect('/' + hash + '/configure');
    });
  });
});

module.exports = router;
