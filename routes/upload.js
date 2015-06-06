module.exports = function(app){
	//import upload controllers here
    var uploadCtrl = require('../app_server/controllers/uploadCtrl.js')(app);

    app.use('/upload' , app.get('busboy')({immediate:true})); 
	app.use('/upload' , uploadCtrl.serverUpload);
	app.get ('/awsUpload' , uploadCtrl.awsUpload);
};