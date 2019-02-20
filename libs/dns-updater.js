"use strict"
require('dotenv').config()
const user = process.env.FREENOM_USER;
const pass = process.env.FREENOM_PASS;
const domain = process.env.DOMAIN

const fs = require('fs');
const publicIp = require("public-ip");
const freenom = require("freenom-dns").init(user,pass);

let recursive_update = (records_to_update, fun) => {
	if (records_to_update.length){
		let record = records_to_update.pop();
		console.log("Setting record Subdomain: "+record.subdomain+" to: "+record.ip)
		freenom.dns.setRecord(record.subdomain, "A", record.ip).then(ret => {
			console.log("Record set");
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




		}).catch(err => {
			console.log(err);
			return fun()
		})
	} else {
		return fun();
	}
}


function updater(fun=()=>{}, force){
	console.log("Starting update.")

	publicIp.v4().then(ip => {
			freenom.dns.listRecords(domain).then(records => {
				
				const public_ip = String(ip);
				//console.log(records);
				let records_to_update = records.reduce((acc, rec) => {
					if(rec.value != public_ip || force){
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

let on_file_change = () =>{
	fs.unwatchFile("./ip_addr.txt",on_file_change);
	updater(file_watcher);
}

let file_watcher = () => {
	fs.watchFile("./ip_addr.txt",on_file_change);
}

module.exports.start = file_watcher;
module.exports.force_update = (callback) => {updater(callback, true)};