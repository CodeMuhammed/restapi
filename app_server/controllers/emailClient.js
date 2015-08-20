var ObjectId = require('mongodb').ObjectId;
var nodemailer =  require('nodemailer');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'palingramblog@gmail.com',
        pass: process.env.emailpassword
    }
});

module.exports = function(dbResource , tagsReducer){
	
  function test(cb){
      console.log('node mailer test');

      // setup e-mail data with unicode symbols
      var mailOptions = {
          from: 'Muhammed Ali <palingramblog@gmail.com>', // sender address
          to: 'codemuhammed@gmail.com', // list of receivers
          subject: 'Palingram test mailer', // Subject line
          text: 'Hello world ✔', // plaintext body
          html: '<b>Hello world ✔</b>' // html body
      };

      // send mail with defined transport object
      transporter.sendMail(mailOptions, function(error, info){
          if(error){
              cb(error , false);
          }
          else {
              cb(false , info);
          }

      });
  }

	return {
		test : test
	};
} 