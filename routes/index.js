var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var mongodb = require('mongodb');
var wss = require('../lib/wss');
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
    Account.update({ _id : req.user.id }, { username : req.body.username, firstname: req.body.firstname, lastname: req.body.lastname }, function (err, numberAffected, rawResponse) {
        if (err) {
            console.log("Error saving details");
        }
    });
    req.flash('status', 'Profile details updated');
    res.redirect('/profile');
});

router.get('/users/users', isAuthenticated, function(req, res, next) {
    Account.find({}, function(err, users) {
        return res.render('users/users', { title : 'Users' });
    });
});

router.get('/test', isAuthenticated, function(req, res, next) {
    return res.render('test', { title : 'Test', user: req.user });
})

// API
router.post('/users/create', function(req, res, next) {
    if (!req.user) {
        return res.json({
            "status" : "error",
            "code" : 401,
            "message" : "You do not have permission for this action"
        });
    }
    Account.register(new Account({ username : req.body.username, firstname: req.body.firstname, lastname: req.body.lastname, role: req.body.role, tagID: req.body.tagID }), req.body.password, function(err, account) {
        if (err) {
            return res.json({
                "status" : "error",
                "code" : 500,
                "message" : err
            });
        }
        res.json({
            "status" : "success",
            "code" : 200,
            "message" : "User created successfully"
        });
    });
});

router.delete("/users/user/:id", function(req, res, next) {
    if (!req.user || (req.user._id != req.params.id && req.user.role != "Administrator")) {
        return res.json({
            "status" : "error",
            "code" : 401,
            "message" : "You do not have permission for this action"
        });
    }
    Account.remove({ _id : req.params.id }, function(err) {
        if (err) {
            return res.json({
                "status" : "error",
                "code" : 500,
                "message" : err
            });
        }
        return res.json({
            "status" : "success",
            "code" : 200,
            "message" : "User deleted successfully"
        })
    });
});

router.post('/users/user/:id', function(req, res, next) {
    console.log(req.body);
    if (!req.user || (req.user._id != req.params.id && req.user.role != "Administrator")) {
        return res.json({
            "status" : "error",
            "code" : 401,
            "message" : "You do not have permission for this action"
        });
    }
    Account.update({ _id : req.params.id }, { username : req.body.username, firstname: req.body.firstname, lastname: req.body.lastname, role: req.body.role, tagID: req.body.tagid }, function (err, numberAffected, rawResponse) {
        if (err) {
            return res.json({
                "status" : "error",
                "code" : 500,
                "message" : err
            });
        }
    });
    res.json({
        "status" : "success",
        "code" : 200,
        "message" : "User information updated successfully"
    })
});

router.post('/users/password/:id', function(req, res, next) {
    if (!req.user || req.user._id != req.params.id) {
        return res.json({
            "status" : "error",
            "code" : 401,
            "message" : "You do not have permission for this action"
        });
    }
    Account.findOne({ _id: req.params.id }, function(err, user) {
        if (err) {
            return res.json({
                "status" : "error",
                "code" : 404,
                "message" : "Requested user not found in database"
            });
        }
        user.setPassword(req.body.password, function(err) {
            if (err) {
                return res.json({
                    "status" : "error",
                    "code" : 500,
                    "message" : "An error occurred while setting the password"
                });
            }
            user.save(function(err) {
                if (err) {
                    return res.json({
                        "status" : "error",
                        "code" : 500,
                        "message" : "An error occurred while saving the password"
                    });
                }
            });
        });
    });
    return res.json({
        "status" : "success",
        "code" : 200,
        "message" : "Password updated successfully"
    });
});

router.get('/users/list', function(req, res, next) {
    if (!req.user) {
        return res.json({
            "status" : "error",
            "code" : 401,
            "message" : "You do not have permission to perform this action"
        });
    }
    Account.find().lean().exec(function(err, users) {
        if (err) {
            return res.json({
                "status" : "error",
                "code" : 500,
                "message" : err
            });
        }
        return res.json({
            "status" : "success",
            "code" : 200,
            "message" : "User list retrieved successfully",
            "data" : JSON.stringify(users)
        });
    });
});

router.get('/users/user/:id', function(req, res, next) {
    if (!req.user) {
        return res.json({
            "status" : "error",
            "code" : 401,
            "message" : "You do not have permission to perform this action"
        });
    }
    Account.findOne({ _id: req.params.id }).lean().exec(function(err, user) {
        if (err) {
            return res.json({
                "status" : "error",
                "code" : 500,
                "message" : err
            });
        }
        return res.json({
            "status" : "success",
            "code" : 200,
            "message" : "User listing retrieved",
            "data" : JSON.stringify(user),
        });
    });
});

router.post('/users/tag/:tagid/location/:location', function(req, res, next) {
    Account.findOne({ tagID: req.params.tagid }).lean().exec(function(err, user) {
        if (err) {
            return res.json({
                "status" : "error",
                "code" : 404,
                "message" : "Requested user not found in database"
            });
        }
        Account.update({ tagID : req.params.tagid }, { location: req.params.location }, function (err, numberAffected, rawResponse) {
            if (err) {
                return res.json({
                    "status" : "error",
                    "code" : 500,
                    "message" : err
                });
            }
            res.json({
                "status" : "success",
                "code" : 200,
                "message" : "User information updated successfully"
            })
            Account.find({}).lean().exec(function(err, users) {
                var res = {
                'type': 'users',
                'data': users
                };
                wss.broadcast(JSON.stringify(res));
            });
        });
    })
});

module.exports = router;
