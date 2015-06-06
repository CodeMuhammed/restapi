//loads all the routes the application depends on
module.exports = function(app){
	require('./upload.js')(app);
	require('./test.js')(app);
	require('./resource.js')(app);
};