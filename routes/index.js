var express = require('express');
var store = require('../middleware/store');
var calculator = require('../middleware/calculator');
var router = express.Router();

/* GET home page. */
router.get('/:hash', function(req, res, next) {
  res.render('index', { hash : req.params.hash } );
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
  store.save(hash, key, allFields);

  // show result
  res.render('submitted', { hash : hash, allFields : allFields, calculated : calculated });
});

router.get("/:hash/total", function(req, res, next) {
  store.getAll(req.params.hash, function(results) {
    var total = calculator.grandTotal(results);

    res.render('total', { total: total } );
  });
});

module.exports = router;
