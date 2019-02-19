require('dotenv').config()
const publicIp = require('public-ip');
const fs = require('fs');
const nodemailer = require('nodemailer');
const user = process.env.FREENOM_USER;
const pass = process.env.FREENOM_PASS;
const domain = process.env.DOMAIN
const freenom = require("freenom-dns").init(user,pass);
const express= require("express");
const PORT = process.env.SERVER_PORT;
const HOST = "0.0.0.0";


const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.GMAIL_SENDER,
		pass: process.env.GMAIL_PASS
	}
})

const mailOptions = {
	from: process.env.GMAIL_SENDER,
	to: process.env.RECIPIENT,
	subject: "Ip address for today",
	html: '<p> Ip was changed! This is the new ip: </p>'
}

transporter.sendMail(mailOptions, (err,info)=>{
	if(err) console.log(err);
	else console.log(info);
})


let recursive_update = (records_to_update, fun) => {
	if (records_to_update.length){
		let record = records_to_update.pop();
		freenom.dns.setRecord(record.subdomain, "A", record.ip).then(ret => {
			if (!ret[0].status){
				console.log("Error whilst update!")
				console.log(ret);
				return fun();
			}

			freenom.dns.listRecords(domain).then(records => {
				let new_record = records.find(el => el.name == record.subdomain.split('.')[0])
				if (new_record.value != record.ip){
					console.log("Wrong IP!")
					console.log("Wanted:")
					console.log(record);
					console.log("Currently set:")
					console.log(new_record)
					return fun();
				}
				console.log("Subdomain: "+record.subdomain+" successfully updated to: "+new_record.value);
				return recursive_update(records_to_update, fun);
				
			}).catch(err => {
				console.log("Error whilst getting records!")
				console.log(err);
				return fun();
			})




		})
	} else {
		return fun();
	}
}

function updater(fun=()=>{}){
	console.log("Starting update.")

	publicIp.v4().then(ip => {
			freenom.dns.listRecords(domain).then(records => {
				
				const public_ip = fs.readFileSync("./ip.txt","utf-8");//String(ip);
				//console.log(records);
				let records_to_update = records.reduce((acc, rec) => {
					if(rec.value != public_ip){
						acc.push({ip: public_ip, subdomain: rec.name+"."+domain});
					}
					return acc
				},[]);

				//console.log(records_to_update);
				if (!records_to_update.length) {
					console.log("Nothing to do! Exiting.");
					return fun();
				}else{
					console.log(records_to_update.length+" records to update");
					recursive_update(records_to_update, fun);
				}

			}).catch(err => {
				console.log(err);
				return fun();
			});
		}).catch(err=>{
			console.log(err);
			return fun();
		})
}

function main(){
	let update_runner = () => setTimeout(() => {updater(update_runner);}, 1000, "updater");
	updater(update_runner);
	
	const app = express();
	app.get("/", (req,res)=>{
		res.send("hello");
	})

	app.listen(PORT,HOST);
	console.log(`Running on http://${HOST}:${PORT}`);
}
 main();
