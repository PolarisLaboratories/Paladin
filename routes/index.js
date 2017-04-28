var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Paladin' });
});

router.get('/about', function(req, res, next) {
    res.render('about');
});

router.get('/login', function(req, res, next) {
    res.render('login', {flash: req.flash('error')});
});

router.post('/login', function(req, res, next) {
    console.log(req.body);
    res.redirect('/login');
});

router.get('/map', function(req, res, next) {
    res.render('map');
});

module.exports = router;
