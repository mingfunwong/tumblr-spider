'use strict';
const fs = require('fs');
const path = require('path');
const needle = require('needle');
const events = require('events');
const filenamify = require('filenamify');
const Multiprogress = require("multi-progress");
const download = require('./download');

var multi = new Multiprogress(process.stderr);

var START = 0
var MEDIA_NUM = 50
var THREADS = 2
var THREADS_NOW = 0
var listen = new events.EventEmitter();
var download_list = [];

listen.on("_get_page", function (args){
	args.url = `https://${args.user}.tumblr.com/api/read?type=video&num=${MEDIA_NUM}&start=${args.start}`
	// console.log(`get_page start ${args.url}`);
	needle.get(args.url, function(error, response, body) {
		args.body = body;
		args.response = response;
		if (!error && response.statusCode == 200 && response.body.length >= 512) {
			// console.log(`get_page done  ${args.url}`);
			args.start += MEDIA_NUM;
			listen.emit("_get_page", args);
			listen.emit("_get_list", args);
		}
	});
});

listen.on("_get_list", function (args){
	var list = args.body.match(/src=\S+/g);
	list = unique(list);
	for (let i in list) {
		var url = list[i];
		if (url.indexOf("tumblr.com") == -1) {
			continue;
		}
		url = url.replace('src="', '');
		url = url.replace('"', '');
		url = url.replace('/480', '');
		args.download_url = url;
		download_list.push(url);
	}

});

listen.on("_download_video", function (args) {
	// console.log(`download start ${args.download_url}`);

	var dest = path.join("video", filenamify(path.basename(args.download_url + ".mp4")));
	var dest_temp = path.join("temp", filenamify(path.basename(args.download_url + ".mp4")));
	
	if (fs.existsSync(dest)) {
		// console.log(`download skip  ${args.download_url}`);
		THREADS_NOW -- ;
		return;
	}

	var bar = multi.newBar(`[:bar] :percent ${args.download_url}`, {
		complete: '=',
		incomplete: ' ',
		width: 30,
		total: 100
	});
	bar.tick(0)

	download(args.download_url, 'temp')
	.on('response', res => {
		bar.total = res.headers['content-length'];
		res.on('data', data => {
			bar.tick(data.length);
			if (bar.curr > 0.1 * 1024 * 1024 && res.headers['content-length'] == bar.curr) {
				setTimeout(() => fs.rename(dest_temp, dest), 1000);
			}
		});
	})
	.then(()=>{
		// console.log(`download done  ${args.download_url}`);
		THREADS_NOW -- ;
	})
	.catch(error => {
		// console.log(`download error ${args.download_url}`);
		THREADS_NOW -- ;
    });

	
});

setInterval(() => {
	if (THREADS > THREADS_NOW && download_list.length) {
		THREADS_NOW ++ ;
		download_list = unique(download_list);
		var download_url = download_list.shift();
		listen.emit("_download_video", {download_url: download_url});
	}
}, 50);

// listen.emit("_get_page", {user: "nuclear-warrior", start: 0});
var content = fs.readFileSync("./user.txt", 'utf8');
var users = content.split("\r\n");
for (let i in users) {
	var user = users[i];
	listen.emit("_get_page", {user: user, start: 0});
}

function unique(array) {
    var n = [];
    if (array != null && array.length) {
	    for(var i = 0;i < array.length; i++){
	        if(n.indexOf(array[i]) == -1) n.push(array[i]);
	    }
    }
    return n;
}
