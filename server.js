if(process.env.PRODUCTION == "false") require('dotenv').config()
else console.log("Production!");
const express= require("express");
const PORT = process.env.SERVER_PORT;
const HOST = "0.0.0.0";
const mailer = require("./libs/mailer");
const path = require("path");
const dnsUpdater = require("./libs/dns-updater")

require("./libs/watcher").start();
dnsUpdater.start();


const app = express();

if (process.env.WEBSITE_AUTH_USER && process.env.WEBSITE_AUTH_PASS){
	app.use((req, res, next) => {

		// -----------------------------------------------------------------------
		// authentication middleware
	
		const auth = {login: process.env.WEBSITE_AUTH_USER, password: process.env.WEBSITE_AUTH_PASS} // change this
	
		// parse login and password from headers
		const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
		const [login, password] = new Buffer(b64auth, 'base64').toString().split(':')
	
		// Verify login and password are set and correct
		if (!login || !password || login !== auth.login || password !== auth.password) {
			res.set('WWW-Authenticate', 'Basic realm="Authentication required!"') 
			res.status(401).send('Authentication required.') // custom message
			return
		}
	
		// -----------------------------------------------------------------------
		// Access granted...
		next()
	
	})
}
app.get("/", (req,res)=>{
	res.sendFile(path.join(__dirname+ "/index.html"));
})

app.get("/log.json",(req,res)=>{
	res.sendFile(path.join(__dirname+ "/log.json"));
})

app.post("/sendmail", (req,res)=>{
	mailer.send_mail_with_ip(null, (err,info)=>{
		if(err) res.send(err);
		else {
			let stringToSend = `<h1>Email sent!</h1> <p>${JSON.stringify(info)}</p>`
			/*<p>Sent <br>From: ${info.envelope.from} <br>To: ${info.envelope.to}</p>
			</p>Accepted: ${info.accepted}; Rejected: ${info.rejected}</p>
			`*/
			res.send(stringToSend);
		}
	})
})
var is_force_updating = false;
app.post("/forcednsupdate", (req,res)=>{
	if(!is_force_updating){
		is_force_updating = true;
		dnsUpdater.force_update((err, results)=>{
			let strToSend = `
			<h1>Force dns record update results</h1>
			<h2>Server Ip: ${results.public_ip}</h2>
			`;


			strToSend += err ? `<h3>Error: ${err}</h4>` : ""
			if (results){
				strToSend += "<h4>Dns records that don't match public Ip of server</h4>"
				if(results.different_ip.length){
					strToSend += `
					<table>
					<tr><th>Subdomain</th><th>Set Ip address</th><th>Servers Ip</th></tr>
					`
					
					results.different_ip.forEach((rec) => {
						strToSend += `
						<tr>
							<td>${rec.subdomain}</td><td>${rec.current_ip}</td><td>${rec.ip}</td>
						</tr>
						`
					})
					strToSend += "</table>"
				}

				strToSend += "<h4>Dns records that match public Ip of server</h4>"
				if(results.same_ip.length){

					strToSend += `
					<table>
					<tr><th>Subdomain</th><th>Set Ip address</th></tr>
					`
					
					results.same_ip.forEach((rec) => {
						strToSend += `
						<tr>
							<td>${rec.subdomain}</td><td>${rec.ip}</td>
						</tr>
						`
					})
					strToSend += "</table>"
				}
			}

			res.send(strToSend);		
			
			is_force_updating = false;
		})
	}else{
		res.send("Working on it!")
	}
})

app.listen(PORT,HOST);
console.log(`Running on http://${HOST}:${PORT}`);


