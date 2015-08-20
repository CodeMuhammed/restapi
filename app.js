//Require dependencies phase
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var errorHandler = require('errorhandler');
var logger = require('morgan');
var compression = require('compression');
var methodOverride = require('method-override');
var favicon = require('serve-favicon');
var busboy = require('connect-busboy');
var passport  = require('passport');
var cors  = require('cors');

var socket = require('socket.io');
var http  = require ('http');
var fs = require('fs');
var path = require('path');


//Instantiate a new express app
var app = express();

//set the model source @TODO use app.set(app.use) here ., Then return a function
//that returns the object
var dbResource = require('./app_server/models/dbResource')('restapi' , {} , app);
//initialize database
dbResource.initColls(function(){
	//Run map reduce task for tags
	var tagsReducer = require('./app_server/controllers/tagsReducer')(dbResource);

	//Email client 
	var emailClient = require('./app_server/controllers/emailClient')(dbResource , tagsReducer);

	//initialize passport
	var initPassport = require('./app_server/controllers/passportCtrl');
	initPassport(passport , dbResource);

	//Configure the express app
	app.set('busboy' , busboy);
	app.set('port' , process.env.PORT || 3000);

    //cors 
	app.use(cors({credentials: true, origin: true}));
	
	app.use(compression({threshold:1}));
	//app.use(logger('combined'));
	app.use(methodOverride('_method'));

	//configure router to use cookie-parser  ,body-parser 
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended:true}));
	app.use(cookieParser());
	app.use(session({resave:true , secret:'this string' , saveUninitialized:true}));

	//use passport local strategy for login , logout and signup 
	app.use(passport.initialize());
	app.use(passport.session());
	
	app.get('/' , function(req , res){
		res.json('palingram restapi deployed :-) just awesome.now');
	});
	
	//Define routes for authentication
	app.use('/auth' , require('./routes/authenticate')(passport));

	//api routes starts here
	app.use('/api' , require('./routes/api')(dbResource , tagsReducer , emailClient));

	//Define routes and middle wares in a separate module
	//require('./routes')(app , dbResource);

	//handle errors using custom or 3rd party middle-wares
	app.use(errorHandler());

	//Start the app
	var server  = http.createServer(app);
	var io = socket.listen(server);

	io.sockets.on('connection' , function(socket){
		socket.on('messageChange' , function(data){
		});
		socket.emit('hey' , {msg:'hello'});
	});

	server.listen(app.get('port') , function(){
		console.log('Server running on port ' ,app.get('port'));
	});
});
