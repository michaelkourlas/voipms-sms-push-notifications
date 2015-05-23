/*
 * VoIP.ms SMS Server
 * Copyright (C) 2015 Michael Kourlas
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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