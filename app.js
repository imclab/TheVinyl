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

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/thevinyl');
var Schema = mongoose.Schema;
var UserSchema = new Schema({
    type      : String
  , fbId      : Number
  , picture   : String
  , username  : String
  , name      : String
  , password  : String
  , date      : Date
  , songsOwned: Array
});
var User = mongoose.model('User', UserSchema);

var SongSchema = new Schema({
    title     : String
  , uploader  : String
  , album     : String
  , coverArt  : String
  , 
});
var Song = mongoose.model('Song', SongSchema);

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
    /*
    console.log("DONE: "+done);
    for (item in profile) {
      console.log(item+": "+profile[item]);
    }
    */
    User.findOne({fbId: profile.id}, function (err, account){
      //console.log("doc: "+account);
      if (err) { return done(err); }
      if (account) {
        return done(null, account);
      } else {
        var newAccount = new User();
        newAccount.type = 'facebook';
        newAccount.picture = 'https://graph.facebook.com/'+ profile.id +'/picture'
        newAccount.name = profile.displayName;
        newAccount.username = "";
        newAccount.password = "";
        newAccount.fbId = profile.id;
        newAccount.date = new Date();
        newAccount.save(function (err) {
          if (err) {
            console.log("ERROR: something went wrong when adding new person from Facebook to the database. User: "+profile.displayName)
          }
          return done(null, newAccount)
        });
      }
    });
    /*
    User.findOrCreate({profile: profile}, function (err, user) {
      if (err) { return done(err); }
      done(null, user);
    });
*/
  }
));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findOne({_id: id}, function (err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    console.log("username: "+username);
    console.log("password: "+password);
    if (username) {
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
    } else {
      return done(null, false, { message: 'Empty username' });
    }
  }
));

//start express
app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view options', { layout: false});
	app.set('view engine', 'ejs');
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.session({ secret: 'sessionthevinylsecret' }));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);
	app.use(gzippo.staticGzip(__dirname + '/static'));
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
	if (req.user) {
    res.render("index", { layout: 'layoutMain', user: req.user, page: 'home' });
  } else {
    res.render("index", { layout: 'layoutMain', user: undefined, page: 'home' });
  }
});
app.get("/login", function (req, res) {
  if (req.user) {
    res.redirect('/')
  } else {
    res.render("login", { layout: 'layoutMain', user: undefined, page: 'login' });
  }
});
app.get("/profile", function (req, res) {
  if (req.user) {
    res.render("profile", { layout: 'layoutMain', user: req.user, page: 'profile' });
  } else {
    res.redirect('/login');
  }
});
app.get("/logout", function (req, res) {
  req.logOut();
  res.redirect('/');
});
app.post('/register/local', function (req, res) {
  var regUser = req.body;
  User.findOne({username: regUser.username}, function (err, account){
    console.log(account);
    //console.log("doc: "+account);
    if (err) { console.log("Register Error"+err); return; }
    if (account) {
      res.redirect('/login'); 
    } else {
      console.log('derp');
      var newAccount = new User();
      newAccount.type = 'local';
      newAccount.picture = '/img/test.jpg';
      newAccount.name = regUser.name;
      newAccount.username = regUser.username;
      newAccount.password = regUser.password;
      newAccount.fbId = "";
      newAccount.date = new Date();
      console.log(newAccount);
      newAccount.save(function (err) {
        if (err) {
          console.log("ERROR: something went wrong when adding new person from Local to the database. User: "+regUser.name)
        }
        res.redirect('/login');
      });
    }
  });
});
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/login' }));
app.post('/auth/local',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: 'Invalid credentials' })
);

function dirExistsSync (d) { 
	try { fs.statSync(d); return true } 
	catch (er) { return false } 
}

//Set server listening port (need root for port 80)
app.listen(8080);