var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var router = express.Router();

function isAuthenticated(req, res, next) {
    if (req.user)
        return next();
    req.session.return = req.path;
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

router.post('/login', function(req, res, next) {
    passport.authenticate('local', {
        successRedirect : req.session.return || '/',
        failureRedirect : '/login',
        failureFlash : true
    })(req, res, next);
    delete req.session.return;
});

router.get('/logout', isAuthenticated, function(req, res, next) {
    req.logout();
    res.redirect('/');
});

router.get('/map', isAuthenticated, function(req, res, next) {
    res.render('map', { title: 'Map' });
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

router.get('/users/create', isAuthenticated, function(req, res, next) {
    return res.render('users/create', { title : 'Create', message : req.flash('status') });
});

router.post('/users/create', function(req, res, next) {
    Account.register(new Account({ username : req.body.username, firstname: req.body.firstname, lastname: req.body.lastname }), req.body.password, function(err, account) {
        if (err) {
            req.flash('status', 'An error occurred while creating the user.');
            return res.redirect('users/create');
        }
        req.flash('status', 'User ' + req.body.username + ' created');
        res.redirect('/users/create');
    });
});

router.get('/users/manage', isAuthenticated, function(req, res, next) {
    Account.find({}, function(err, users) {
        return res.render('users/manage', { title : 'Manage', users: users });
    });
});

module.exports = router;
