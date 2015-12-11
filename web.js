var express = require("express");
var logfmt = require("logfmt");
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var mongo = require('mongodb');
var crypto = require('crypto');
var moment = require('moment');
var fs = require('fs');
var assert = require('assert');
var Mailgun = require('mailgun-js');

var app = express();

var bodyParser = require('body-parser');

var oneDay = 0 * 86400000;

app.use(express.static(__dirname + '/public', { maxAge: oneDay }));
app.use(logfmt.requestLogger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(expressSession({secret:'The most secret secret ever!', resave: true, saveUninitialized: true}));

// Mailgun
var mailgunApiKey = 'key-84bfa652ed4e40d37329c9823e6fbdea';
var mailgunDomain = 'sandboxed7c3b61ef5a4cceb0f62639a167193d.mailgun.org';

// [Auth middleware]
var authenticate = function (req, res, next) {
	if(req.session.user) {
		next();
	} else {
		res.redirect('/signin');
	}
}

// [Routing]
app.get('/signup', function(req, res) {
	res.sendFile('/public/signup.html', { root: __dirname });
});

app.get('/signin', function(req, res) {
	res.sendFile('/public/signin.html', { root: __dirname });
});

app.get('/confirm/:token', function(req, res) {
	var params = req.params;
	
	// confirmation based on token + email

	Users.update({ conf: params.token },
		{ $set: { 
			conf: true 
		} },
		function(err, result) {
			if (err) {
				console.warn(err.message);
				res.send(false);
			} else {

				// Create own db based on confirmation token

				// add "You successfully confirmed your account!" message

				res.redirect("/signin");
			}
		});
});


// [Ajax]
app.post('/ajax/subscribe', function(req, res) {

	var params = req.body;

	Subscribers.findOne({ email: params.email }, function(err, user) { 
		if (user) {
			console.log(user);
			res.send(false);
		} else {

			var doc = {
				email: params.email,
				subscribed: true
			};

			Subscribers.insert(doc, function(err, records) {

				var mailgun = new Mailgun({ apiKey: mailgunApiKey, domain: mailgunDomain });

				var data = {
					from: 'support@bestguides.ro',
					to: params.email,
					bcc: ['cosmin.atomei@gmail.com', 'ioana_muscanu@yahoo.com'],
					subject: 'Hello from BestGuides!',
					html: '<h2>Hi,</h2><br>Welcome to <a href="http://bestguides.ro"><strong>BestGuides</strong></a>, we\'re glad to have you here and hope you enjoy this new experience!<br><br>We\'ll keep you posted on the release dates and all the awesome features we\'re preparing for you.<br><br>Thank you and have a great day,<br>Ioana, Co-founder BestGuides.ro'
				}

				mailgun.messages().send(data, function (err, body) {
					if (err) {
						res.send(true);
						console.log("Mailgun --- got an error: ", err);
					} else {
						res.send(true);
					}
				});
			});
		}
	});
});

app.post('/ajax/signin', function(req, res) {
	var params = req.body,
		passwordHash = null;
	
	Users.findOne({ email: params.email, conf: true }, function(err, user) { 
		if (user) {
			crypto.pbkdf2(params.password, user.passwordSalt, 10000, 512, function(err, derivedKey) {
				passwordHash = derivedKey.toString();
				if(user.password === passwordHash) {
					req.session.user = user;
					res.send(true);
				} else {
					res.send(false);
				}
			});
		} else {
			res.send(false);	
		}
	});
});

app.post('/ajax/signup', function(req, res) {

	var params = req.body,
		passwordHash = null,
		passwordSalt = crypto.randomBytes(128).toString('base64'),
		token = null;

	Users.findOne({ email: params.email }, function(err, user) { 
		if (user) {
			console.log(user);
			res.send(false);
		} else {
			crypto.pbkdf2(params.password, passwordSalt, 10000, 512, function(err, derivedKey) {
				passwordHash = derivedKey.toString();
				
				crypto.randomBytes(48, function(ex, buf) {
					token = buf.toString('hex');
				
					var doc = {
						email: params.email,
						password: passwordHash,
						passwordSalt: passwordSalt,
						conf: token,
						website: {
							general: {
								title: '',
								description: '',
								handle: '',
								logo: '',
								cover: '',
								state: ''
							},	
							team: [],
							navigation: [],
							content: [],
							tags: []
						}
					};

					Users.insert(doc, function(err, records) {

						var mailgun = new Mailgun({ apiKey: mailgunApiKey, domain: mailgunDomain });

						var data = {
							from: 'support@bestguides.ro',
							to: params.email,
							bcc: ['cosmin.atomei@gmail.com', 'ioana_muscanu@yahoo.com'],
							subject: 'Hello from BestGuides!',
							html: '<h2>Hi,</h2><br>Welcome to <a href="http://bestguides.ro"><strong>BestGuides</strong></a>, we\'re glad to have you here and hope you enjoy this new experience!<br><br>To <i>confirm your email</i> just click on the link below:<br><a href="http://bestguides.ro/confirm/'+token+'">Confirm this email address!</a><br><br>Thank you and have a great day,<br>Ioana, Co-founder BestGuides'
						}

						mailgun.messages().send(data, function (err, body) {
							if (err) {
								res.send(false);
								console.log("Mailgun --- got an error: ", err);
							} else {
								res.send(true);
							}
						});
					});

				});
			});
		}
	});
});

app.post('/ajax/signout', function(req, res) {
	req.session.destroy();
	res.send(true);
});

app.get('*', function(req, res) {
	res.sendFile('/public/index.html', { root: __dirname });
});

var MongoClient = mongo.MongoClient,
	url = 'mongodb://localhost:27017/bestguides';

MongoClient.connect(url, function(err, database) {
	if(err) throw err;

	db = database;
	Users = db.collection('users');
	Subscribers = db.collection('subscribers');

	var server = app.listen('8081', function() {
		var host = server.address().address;
		var port = server.address().port;

		console.log("App listening on " + host + ' ' + port);
	});
});