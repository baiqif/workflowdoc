var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config');
var modelfactory = require('./models/model-factory');
var session = require( 'express-session' )
var logger = require('./logs'); 

module.exports = function(app){
    

    // app.use(session({secret: config.get('SECRET'), 
    //              saveUninitialized: true,
    //              resave: true}));
    
    app.get('/signin', function(req, res){
      res.render('signin', { isSigninForm: true });
    });
    
    app.get('/', function(req, res){
      res.render('index', { user: req.user });
    });
    app.get('/logout', function(req, res){
      req.logout();
      res.redirect('/');
    });
    
    app.get('/newworkflow',ensureAuthenticated,function(req, res){
      res.render('newworkflow', { user: req.user });
    });
    
    
    app.get('/users', function list (req, res, next) {
         var User= modelfactory.getModel("users");
         User.find({},function(err,users){
            if(err) throw err;
            res.render('users/list.jade', {
                  users: users
                });
            
          });
      });
     
    
    
    
    // Simple route middleware to ensure user is authenticated.
    //   Use this route middleware on any resource that needs to be protected.  If
    //   the request is authenticated (typically via a persistent login session),
    //   the request will proceed.  Otherwise, the user will be redirected to the
    //   login page.
    function ensureAuthenticated(req, res, next) {
      if (req.isAuthenticated()){ 
          return next(); 
      }
      else{
         req.session.returnTo = req.path;
         res.redirect('/login');
      }    

    }

}