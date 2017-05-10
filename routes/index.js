var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var router = express.Router();

function isAuthenticated(req, res, next) {
    if (req.user)
        return next();
    req.flash('error', 'Attempting to access a restricted area. Please sign in first');
    res.redirect('/login');
}

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Paladin' });
});

router.get('/about', function(req, res, next) {
    res.render('about', { title: 'About'});
});

router.get('/login', function(req, res, next) {
    res.render('login', { title: 'Login', message: req.flash('error') });
});

router.post('/login', passport.authenticate('local', {
    successRedirect : '/map',
    failureRedirect : '/login',
    failureFlash : true
}));

router.get('/register', function(req, res, next) {
    res.render('register', { title: 'Register' });
});

router.post('/register', function(req, res, next) {
    Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
        if (err) {
            return res.render('register', { account : account });
        }

        passport.authenticate('local')(req, res, function () {
            res.redirect('/');
        });
    });
});

router.get('/logout', isAuthenticated, function(req, res, next) {
    req.logout();
    res.redirect('/');
});

router.get('/map', isAuthenticated, function(req, res, next) {
    res.render('map', { title: 'Map' });
});

module.exports = router;
