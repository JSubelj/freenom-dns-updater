require('dotenv').config()
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

app.post("/sendmail", (req,res)=>{
	mailer.send_mail_with_ip(null, (err,info)=>{
		if(err) res.send(err);
		else res.send(info);
	})
})
var is_force_updating = false;
app.post("/forcednsupdate", (req,res)=>{
	if(!is_force_updating){
		is_force_updating = true;
		dnsUpdater.force_update((text)=>{
			if(text){
				res.send(text);
			}else{
				res.send("DNS records were force updated!")
			}
			is_force_updating = false;
		})
	}else{
		res.send("Working on it!")
	}
})

app.listen(PORT,HOST);
console.log(`Running on http://${HOST}:${PORT}`);


