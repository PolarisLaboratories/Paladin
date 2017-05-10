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
    successRedirect : '/',
    failureRedirect : '/login',
    failureFlash : true
}));

router.get('/logout', isAuthenticated, function(req, res, next) {
    req.logout();
    res.redirect('/');
});

router.get('/map', isAuthenticated, function(req, res, next) {
    res.render('map', { title: 'Map' });
});

router.get('/register', isAuthenticated, function(req, res, next) {
    res.render('register', { title: 'Register' });
});

router.post('/register', function(req, res, next) {
    Account.register(new Account({ username : req.body.username, firstname: req.body.firstname, lastname: req.body.lastname }), req.body.password, function(err, account) {
        if (err) {
            return res.render('register', { title : 'Register' });
        }
        passport.authenticate('local')(req, res, function () {
            res.redirect('/');
        });
    });
});

router.get('/profile', isAuthenticated, function(req, res, next) {
    res.render('profile', { title: 'Profile', user: req.user, message: req.flash('status') });
});

router.post('/profile', isAuthenticated, function(req, res, next) {
    var username = (req.body.username == "") ? req.user.username : req.body.username;
    var firstname = (req.body.firstname == "") ? req.user.firstname : req.body.firstname;
    var lastname = (req.body.lastname == "") ? req.user.lastname : req.body.lastname;
    Account.update({ _id : req.user.id }, { username : username, firstname: firstname, lastname: lastname }, function (err, numberAffected, rawResponse) {
        if (err) {
            console.log("Error saving details");
        }
    });
    req.flash('status', 'Profile details updated');
    res.redirect('/profile');
});

module.exports = router;
