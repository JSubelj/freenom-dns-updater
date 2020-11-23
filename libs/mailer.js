if (process.env.PRODUCTION == "false") require('dotenv').config()
const nodemailer = require('nodemailer');

var http = require('http');


const transporterGmail = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.GMAIL_SENDER,
		pass: process.env.GMAIL_PASS
	}
})

const transporterCockli = nodemailer.createTransport({
	pool: true,
	host: "mail.cock.li",
	port: 465,
	secure: true,
	auth: {
		user: process.env.COCKLI_SENDER,
		pass: process.env.COCKLI_PASS
	}
})


let mailOptions = {
	from: process.env.GMAIL_SENDER,
	to: process.env.RECIPIENT,
	subject: "Ip address for today",
}


let sendMail = (ip, callback) => {
	mailOptions.html = `<h1>Your server's IP has changed! </h1> <h3>The new IP is: <b>${ip}</b></h3><p>Sent from <a href="https://github.com/JSubelj/freenom-dns-updater">freenom-dns-updater</a></p>`
	mailOptions.from = process.env.COCKLI_SENDER;
	console.log(new Date().toISOString(), "Sending mail", mailOptions);

	transporterCockli.sendMail(mailOptions, (err, info) => {
		if (err) {
			console.log(new Date().toISOString(), err);
			mailOptions.from = process.env.GMAIL_SENDER;
			console.log(new Date().toISOString(), "Sending mail via gmail", mailOptions);

			transporterGmail.sendMail(mailOptions, (err, info) => {
				if (err) {
					console.log(new Date().toISOString(), err);

				}
				if (callback) callback(new Date().toISOString(), err, info);
			})
		}
		else {
			console.log(info);
			if (callback) callback(new Date().toISOString(), err, info);
		}
	});
}


module.exports.send_mail_with_ip = (ip, callback) => {
	if (ip) {
		ip = String(ip);
		if (ip.split(".").every(element => {
			return Number(element) < 256;
		}) && ip.split(".").length == 4) {
			sendMail(ip, callback);
		} else {
			console.warn(new Date().toISOString(), "This is not real ip!:", ip);
			console.log(new Date().toISOString(), "Trying again");
			module.exports.send_mail_with_ip(null, callback);

		}

	} else {

		http.get({ 'host': 'api.ipify.org', 'port': 80, 'path': '/' }, function (resp) {
			resp.on('data', function (ip) {
				ip = String(ip);
				if (ip.split(".").every(element => {
					return Number(element) < 256;
				}) && ip.split(".").length == 4) {
					sendMail(ip, callback);
				} else {
					console.warn(new Date().toISOString(), "This is not real ip!:", ip)
					console.log(new Date().toISOString(), "Trying again");
					module.exports.send_mail_with_ip(null, callback);
				}

			});
		});
	}
}


const cron = require("node-cron");

cron.schedule("28 9 * * *", () => {
	let fun = () => {
		console.log(new Date().toISOString(), "Sending scheduled mail.")
		module.exports.send_mail_with_ip(null, (err, succ) => {
			console.log(new Date().toISOString(), "err:",err);
			console.log(new Date().toISOString(), "succ:",succ);
		});
	};
	fun();
});