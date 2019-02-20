require('dotenv').config()
const nodemailer = require('nodemailer');
const publicIp = require("public-ip");


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


module.exports.send_mail_with_ip = (ip, callback) => {
	if (ip){
		mailOptions.html = `<h1>Your server's IP has changed! </h1> <h3>The new IP is: <b>${ip}</b></h3><p>Sent from <a href="https://github.com/JSubelj/freenom-dns-updater">freenom-dns-updater</a></p>`
		transporter.sendMail(mailOptions, (err,info)=>{
			if(err) console.log(err);
			else console.log(info);
			if (callback) callback(err,info);
		})
	}else{
		publicIp.v4().then(ip => {
			mailOptions.html = `<h1>Your server's IP has changed! </h1> <h3>The new IP is: <b>${ip}</b></h3><p>Sent from <a href="https://github.com/JSubelj/freenom-dns-updater">freenom-dns-updater</a></p>`
			transporter.sendMail(mailOptions, (err,info)=>{
				if(err) console.log(err);
				else console.log(info);
				if (callback) callback(err,info);
			})
		})
	}
}


