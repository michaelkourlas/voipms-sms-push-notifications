/**
 * VoIP.ms SMS Server
 * Copyright (C) 2015 Michael Kourlas
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var gcm = require('./gcm.js');
var log = require("./log.js");
var http = require('http');

var TAG = "server";

var port = process.env["OPENSHIFT_NODEJS_PORT"] || 8080;
var ip = process.env["OPENSHIFT_NODEJS_IP"] || '127.0.0.1';

log.info(TAG, "ip: " + ip);
log.info(TAG, "port: " + port);

var server = http.createServer(gcm);

server.on("listening", function() {
    log.info(TAG, "server listening");
});

server.on("error", function(err) {
    log.error(TAG, "error occurred while starting server", err);
    process.exit(1);
});

server.listen(port, ip);