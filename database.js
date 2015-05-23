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