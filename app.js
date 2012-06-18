//version number
var version = 0.2;

//require express
var express = require("express");

//require everyauth facebook/twitter login
var everyauth = require('everyauth');

//configuration file for everyauth
var conf = require('./conf')

//require path
var path = require('path');

//require crypto
var crypto = require('crypto');

//gzippo, gzip middleware for express
var gzippo = require('gzippo');

//require and start mongodb
//var mongo = require('mongodb');
//var BSON = mongo.BSONPure;
//var Db = require('mongodb').Db;
//var Connection = require('mongodb').Connection;
//var Server = require('mongodb').Server;

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var mongooseAuth = require('mongoose-auth');

var UserSchema = new Schema({});
var User;
UserSchema.plugin(mongooseAuth, {
    // Here, we attach your User model to every module
    everymodule: {
      everyauth: {
          User: function () {
            return User;
          }
      }
    }
  , facebook: {
      everyauth: {
          myHostname: 'http://localhost:8080'
        , appId: conf.fb.appId
        , appSecret: conf.fb.appSecret
        , redirectPath: '/'
      }
    }
  , password: {
  		extraParams: {
  			email: String
  		}
        everyauth: {
            getLoginPath: '/login',
        	postLoginPath: '/login',
        	loginView: 'login.ejs',
        	getRegisterPath: '/register',
        	postRegisterPath: '/register',
        	registerView: 'register.ejs',
        	loginSuccessRedirect: '/',
        	registerSuccessRedirect: '/'
        }
    }
});

mongoose.connect('mongodb://localhost/vinyl');
mongoose.model('User', UserSchema);
User = mongoose.model('User');

//start express
var app = express.createServer(
	express.bodyParser()
  , express.cookieParser()
  , express.session({ secret: 'thevinylsecret'})
  , mongooseAuth.middleware()
);

//Configuration (Express)
app.set('view options', { layout: false});
app.set('view engine', 'ejs');
app.use(express.errorHandler({ dumpExceptions: true, showStack: true}));
//server.use(express.static(__dirname + '/static'));
app.use(gzippo.staticGzip(__dirname + '/static'));
app.set('views', __dirname + '/views');
app.use(gzippo.compress());

//require socket.io
var io = require('socket.io').listen(server);
//set socket.io log level 1-3
io.set('log level', 1);
io.enable('browser client gzip');
io.enable('browser client minification');
io.enable('browser client etag');

//Routes
app.use(express.bodyParser({uploadDir:'./static/img'}));

app.get("/", function (req, res) {
	res.render("index", { layout: 'layoutMain' });
});
app.get("/media/*", function (req, res) {

});

mongooseAuth.helpExpress(app);

function dirExistsSync (d) { 
	try { fs.statSync(d); return true } 
	catch (er) { return false } 
}

//Set server listening port (need root for port 80)
app.listen(8080);