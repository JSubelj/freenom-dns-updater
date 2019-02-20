"use strict"

const fs = require('fs');
const publicIp = require("public-ip");
const mailer = require("./mailer");


let write_ip_to_file = (ip) => {
    fs.writeFile("./ip_addr.txt", ip, (err) => {if(err)console.log("Write IP error: "+err)})
}

let has_ip_changed = () => {
    publicIp.v4().then(ip => {
        if(fs.existsSync("./ip_addr.txt")){
            fs.readFile("./ip_addr.txt", (err,data) => {

                if(err) {
                    console.log("Error when reading ip address: "+err);
                    return
                }
                
                if(data != String(ip)){
                    console.log("Ip changed to "+ip);
                    write_ip_to_file(ip);
                    mailer.send_mail_with_ip(ip);
                }
                

            })
        }else{
            write_ip_to_file(ip);
        }

    });
}

let watcher = () => setTimeout(() => {has_ip_changed();watcher()}, 1000, "ipwatcher");

module.exports.start = watcher
