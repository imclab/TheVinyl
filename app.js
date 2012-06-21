//version number
var version = 0.2;

//configuration file for everyauth
var conf = require('./conf')

//require path
var path = require('path');

//require express
var express = require('express');
var app = express.createServer();

//require crypto
var crypto = require('crypto');

//gzippo, gzip middleware for express
var gzippo = require('gzippo');

var mongoose = require('mongoose')
var Schema = mongoose.Schema;
var UserSchema = new Schema({});
mongoose.connect('mongodb://localhost/thevinyl');
mongoose.model('User', UserSchema);
User = mongoose.model('User');

//passport.js stuff
var passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy
  , LocalStrategy = require('passport-local').Strategy;

passport.use(new FacebookStrategy({
    clientID: conf.fb.appId,
    clientSecret: conf.fb.appSecret,
    callbackURL: "http://localhost:8080/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({profile: profile}, function (err, user) {
      if (err) { return done(err); }
      done(null, user);
    });
  }
));

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Unknown user' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Invalid password' });
      }
      return done(null, user);
    });
  }
));

//start express
app.configure(function() {
	app.set('view options', { layout: false});
	app.set('view engine', 'ejs');
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.session({ secret: 'sessionthevinylsecret' }));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);
	app.use(gzippo.staticGzip(__dirname + '/static'));
	app.set('views', __dirname + '/views');
	app.use(gzippo.compress());
});

//require socket.io
var io = require('socket.io').listen(app);
//set socket.io log level 1-3
io.set('log level', 1);
io.enable('browser client gzip');
io.enable('browser client minification');
io.enable('browser client etag');

app.get("/", function (req, res) {
	res.render("index", { layout: 'layoutMain' });
});
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/login' }));
app.get('/auth/local', passport.authenticate('facebook'));
app.get('/auth/local/callback', 
  passport.authenticate('local', { successRedirect: '/',
                                      failureRedirect: '/login' }));

function dirExistsSync (d) { 
	try { fs.statSync(d); return true } 
	catch (er) { return false } 
}

//Set server listening port (need root for port 80)
app.listen(8080);