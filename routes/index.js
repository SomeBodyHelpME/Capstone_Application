var express = require('express');
var router = express.Router();

const auth = require('./auth');
const navi = require('./navi');
const task = require('./task');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.use('/auth', auth);
router.use('/navi', navi);
router.use('/task', task);

module.exports = router;
