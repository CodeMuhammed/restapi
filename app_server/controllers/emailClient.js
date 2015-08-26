var ObjectId = require('mongodb').ObjectId;
var nodemailer =  require('nodemailer');
var path = require('path');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'mailgun',
    auth: {
        user: 'postmaster@palingram.com',
        pass:  process.env.mailpassword
    }
});

module.exports = function(dbResource , tagsReducer){
	
  function sendEmail(htmldata , email , subject , cb){
      // setup e-mail data with unicode symbols
      var mailOptions = {
          from: 'Muhammed Ali <palingramblog@gmail.com>', // sender address
          to: email, // list of receivers
          subject: subject, // Subject line
          html: htmldata // html body
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
		sendEmail : sendEmail
	};
} 