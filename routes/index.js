var express = require('express');
var store = require('../middleware/store');
var calculator = require('../middleware/calculator');
var router = express.Router();

/* GET home page. */
router.get('/:hash', function(req, res, next) {
  store.getAll(req.params.hash, "config", function(results) {
    if (results == null) {
      results = {
        title: "", message: ""
      };
    }
    res.render('index', { hash: req.params.hash, configuration : JSON.parse(results.config) });
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

router.get("/:hash/configure", function(req, res, next) {
  store.getAll(req.params.hash, "config", function(results) {
    if (results == null) {
      results = {
        title: "", message: ""
      };
    }
    res.render('configure', { hash: req.params.hash, configuration : JSON.parse(results.config) });
  });
});

router.post("/:hash/configure/save", function(req, res, next) {
  store.save(req.params.hash, "config", "config", req.body, function(results) {
    res.render('configure', { hash: req.params.hash, configuration : req.body });
  });
});

module.exports = router;
