if(process.env.PRODUCTION == "false") require('dotenv').config()
const nodemailer = require('nodemailer');
const publicIp = require("public-ip");
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

var http = require('http');


const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.GMAIL_SENDER,
		pass: process.env.GMAIL_PASS
	}
})

let mailOptions = {
	from: process.env.GMAIL_SENDER,
	to: process.env.RECIPIENT,
	subject: "Ip address for today",
	//html: '<p> Ip was changed! This is the new ip: </p>'
}

const schedule=require('node-schedule');



module.exports.send_mail_with_ip = (ip, callback) => {
	console.log("Api key",process.env.SENDGRID_API_KEY);
	if (ip){
		
		mailOptions.html = `<h1>Your server's IP has changed! </h1> <h3>The new IP is: <b>${ip}</b></h3><p>Sent from <a href="https://github.com/JSubelj/freenom-dns-updater">freenom-dns-updater</a></p>`
		console.log("Sending mail");
		sgMail.send(mailOptions,(err)=>{
					transporter.sendMail(mailOptions, (err,info)=>{
					if(err) console.log(err);
					else console.log(info);
					if (callback) callback(err,info);
					})
					
				});
	}else{
		http.get({'host': 'api.ipify.org', 'port': 80, 'path': '/'}, function(resp) {
			resp.on('data', function(ip) {
				console.log("Sending mail");
			
				mailOptions.html = `<h1>Your server's IP has changed! </h1> <h3>The new IP is: <b>${ip}</b></h3><p>Sent from <a href="https://github.com/JSubelj/freenom-dns-updater">freenom-dns-updater</a></p>`
				sgMail.send(mailOptions,(err)=>{
					transporter.sendMail(mailOptions, (err,info)=>{
					if(err) console.log(err);
					else console.log(info);
					if (callback) callback(err,info);
					})
					
				});
				
			});
		});
	}
}


schedule.scheduleJob({hour: 00, minute:00}, () => { 
	module.exports.send_mail_with_ip();
})