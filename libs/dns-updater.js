"use strict"
if (process.env.PRODUCTION == "false") require('dotenv').config()
const user = process.env.FREENOM_USER;
const pass = process.env.FREENOM_PASS;
const domain = process.env.DOMAIN

const fs = require('fs');
const freenom = require("freenom-dns").init(user, pass);

var http = require('http');



let recursive_update = (records_to_update, fun) => {
	if (records_to_update.length) {
		let record = records_to_update.pop();
		console.log(new Date().toISOString(), "Setting record Subdomain: " + record.subdomain + " to: " + record.ip)
		freenom.dns.setRecord(record.subdomain, "A", record.ip).then(ret => {
			console.log(new Date().toISOString(), "Record set");
		}).catch(err => {
			console.log(new Date().toISOString(), err);
		}).finally(() => {
			recursive_update(records_to_update, fun);
		})
	} else {
		return fun();
	}
}

function check_ips(ip, callback, force) {
	freenom.dns.listRecords(domain).then(records => {
		let results = records.reduce((acc, rec) => {
			if (rec.value != ip || force) {
				acc.different_ip.push({ ip: ip, subdomain: rec.name + "." + domain, current_ip: rec.value });
			} else {
				acc.same_ip.push({ ip: rec.value, subdomain: rec.name + "." + domain, });
			}
			return acc;
		}, { same_ip: [], different_ip: [] })

		callback(null, results);

	}).catch((err) => {
		callback(err)
	})


}

function updater(callback = () => { }, force) {
	// Update log function
	var fun = (err, results) => {
		if(!results){
			return callback()
		}
		fs.exists("./log.json", (exists) => {
			if (exists) {
				fs.readFile("./log.json", (err_rf, data) => {
					if (err_rf) {
						console.log(new Date().toISOString(), `Error reading to file: ${err_rf}`);

					}

					try {
						let log = JSON.parse(data);

						if (log.length == 5) {
							log.pop()
						}
						log.unshift({ err: err, results: results, timestamp: new Date().toISOString() })
						fs.writeFile("./log.json", JSON.stringify(log, null, 4), (err) => {
							if (err) {
								console.log(new Date().toISOString(), `Error reading to file: ${err}`);
							}
						})
					} catch (err) {
						return callback(err);
					}
				})
			} else {
				let log = [{ err: err, results: results, timestamp: new Date().toISOString() }]
				fs.writeFile("./log.json", JSON.stringify(log, null, 4), (err) => {
					if (err) {
						console.log(new Date().toISOString(), `Error reading to file: ${err}`);
					}
				})
			}
		});
		callback(err, results);
	}
	console.log(new Date().toISOString(),"Starting update.")

	http.get({ 'host': 'api.ipify.org', 'port': 80, 'path': '/' }, function (resp) {
		resp.on('data', function (ip) {
			const public_ip = String(ip);
			check_ips(public_ip, (err, results) => {
				results.public_ip = public_ip;
				if (err) {
					console.log(new Date().toISOString(), "Check ip error:")
					console.log(err);
					return fun(err);
				}

				if (!results.different_ip.length) {
					console.log(new Date().toISOString(), "Nothing to do! Exiting.");
					return fun(null, null);
				}

				console.log(new Date().toISOString(), results.different_ip.length + " records to update");
				recursive_update(results.different_ip, () => {
					check_ips(public_ip, (err, results) => {
						results.public_ip = public_ip;

						if (err) {
							console.log(new Date().toISOString(), "Check ip after update error:")
							console.log(new Date().toISOString(), err);
							return fun(err);
						}

						if (results.different_ip.length) {
							console.log(new Date().toISOString(), "Not all IPs updated!");
							console.log(new Date().toISOString(), results.different_ip);
							return fun(new Date().toISOString(), "Not all Ips were updated!", results);
						}

						return fun(null, results);
					})
				});

			}, force);
		});
	});

}

const watcher = () => setTimeout(() => { updater(watcher);  }, 60000, "ipwatcher");

module.exports.start = watcher
module.exports.force_update = (callback) => { updater(callback, true) };