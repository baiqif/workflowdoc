var express          = require( 'express' )
  , app              = express()
  , server           = require( 'http' ).createServer( app ) 
  , passport         = require( 'passport' )
  , util             = require( 'util' )
  , bodyParser       = require( 'body-parser' )
  , cookieParser     = require( 'cookie-parser' )
  , session          = require( 'express-session' )
  , GoogleStrategy   = require( 'passport-google-oauth2' ).Strategy
  , LdapStrategy = require('passport-ldapauth');  
  
var logger = require('./logs');   
var config = require('./config');
var modelfactory = require('./models/model-factory');

// In production use the App Engine Memcache instance to store session data,
// otherwise fallback to the default MemoryStore in development.
// if (config.get('NODE_ENV') === 'production') {
//   sessionConfig.store = new MemcachedStore({
//     hosts: [config.get('MEMCACHE_URL')]
//   });
// }



// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Google profile is
//   serialized and deserialized.
passport.serializeUser(function(user, callback) {
  callback(null, user);
});

passport.deserializeUser(function(user, callback) {
  callback(null, user);
});


// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new GoogleStrategy({
    clientID:config.get('GOOGLE_CLIENT_ID'),
    clientSecret: config.get('GOOGLE_CLIENT_SECRET'),
    //NOTE :
    //Carefull ! and avoid usage of Private IP, otherwise you will get the device_id device_name issue for Private IP during authentication
    //The workaround is to set up thru the google cloud console a fully qualified domain name such as http://mydomain:3000/ 
    //then edit your /etc/hosts local file to point on your private IP. 
    //Also both sign-in button + callbackURL has to be share the same url, otherwise two cookies will be created and lead to lost your session
    //if you use it.
    callbackURL: config.get('GOOGLE_CALLBACK_URL'),
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      //console.log(profile);
      // To keep the example simple, the user's Google profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Google account with a user record in your database,
      // and return that user instead.
      var User= modelfactory.getModel("users");
      

      
      User.find({ userid:profile.email},function(err,users){
        if (users.length==0){
              var registered_user = new User({
                  userid:profile.email,
                  displayName : profile.displayName,
                  email : profile.email,
                  admin : false
               });
              registered_user.save(function(err,user){
                  if(err) throw err;
                  return done(null, registered_user);
              })
        }else
           return done(null, users[0]);
      });

    });
  }
));


var OPTS = {
  server: {
    url: 'ldap://act.ldap.csiro.au',
    bindDn: 'ou=People,DC=nexus,DC=csiro,DC=au',
    bindCredentials: 'password',
    searchBase: 'ou=People,DC=nexus,DC=csiro,DC=au',
    searchFilter: '(uid={{username}})'
  },
  usernameField: "username",
  passwordField: "password"
};

passport.use(new LdapStrategy(OPTS),
  function(request, accessToken, refreshToken, profile, done) {
    logger.debug(profile) 
    return done(null, profile);
  });

app.route('/signin')
	.get(function(req, res){
		res.render('signin', { isSigninForm: true });
		})

     .post(function(req, res, next) {
		  passport.authenticate('ldapauth', {session: false}, function(err, user, info) {
		    if (err) {
		      return next(err); // will generate a 500 error
		    }
		    // Generate a JSON response reflecting authentication status
		    if (!user) {
		      return res.send({ success : false, message : 'authentication failed' });
		    }
		    return res.send({ success : true, message : 'authentication succeeded' });
		  });
		});



// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');


app.use( express.static(__dirname + '/public'));
app.use( cookieParser()); 
app.use( bodyParser.json());
app.use( bodyParser.urlencoded({
	extended: true
}));




app.use(session({secret: config.get('SECRET'), 
               saveUninitialized: true,
               resave: true}));

app.use( passport.initialize());
app.use( passport.session());
app.use(function(req,res,next){
    res.locals.user = req.user || null;
    next();
});

require('./routes')(app);

app.use(errorHandler);



// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get('/auth/google', passport.authenticate('google', { scope: [
       'https://www.googleapis.com/auth/userinfo.email',
       'https://www.googleapis.com/auth/userinfo.profile'] 
}));

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.

// app.get( '/oauth2callback', 
//     	passport.authenticate( 'google', { 
//     		successRedirect: 'back',
//     		failureRedirect: '/login'
// }));

app.get('/oauth2callback', passport.authenticate('google'), function(req, res) {
    if (req.isAuthenticated()){
      res.redirect(req.session.returnTo || '/flow');
       delete req.session.returnTo;
    }else{
      res.redirect('/signin')
    }

});




// sometimes, code sequence doese matter
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  res.status(500);
  res.render('error', { error: err });
}

app.get('*', function(req, res, next) {
  res.render('error', { error: "OOPS. The page you are looking for does not exist!" });
});

server.listen(process.env.PORT || config.get('PORT'), process.env.IP || "0.0.0.0",function(){
   var port = server.address().port;
   logger.info('App listening on port %s', port);
});



