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

var log = require("./log.js");
var mysql = require("mysql");

var TAG = "database";

var connectionInfo = {
    host: process.env["OPENSHIFT_MYSQL_DB_HOST"] || "127.0.0.1",
    port: process.env["OPENSHIFT_MYSQL_DB_PORT"] || "3306",
    user: process.env["OPENSHIFT_MYSQL_DB_USERNAME"] || "admin",
    password: process.env["OPENSHIFT_MYSQL_DB_PASSWORD"] || "password",
    database: "voipmssms"
};

var connection = mysql.createConnection(connectionInfo);

module.exports.connect = function(callback) {
    connection.connect(function(err) {
        log.info(TAG, "host: " + connectionInfo.host);
        log.info(TAG, "port: " + connectionInfo.port);
        log.info(TAG, "username: " + connectionInfo.user);
        log.info(TAG, "password: " + connectionInfo.password);
        log.info(TAG, "database name: " + connectionInfo.database);

        if (err) {
            log.error(TAG, "error connecting to database", err);
            process.exit(1);
        }

        log.info(TAG, "connected to database");
        callback(connection);
    });
};