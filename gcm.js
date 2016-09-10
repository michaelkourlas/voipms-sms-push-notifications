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

var database = require("./database.js");
var express = require("express");
var http = require("http");
var log = require("./log.js");
var util = require("util");

var TAG = "gcm";
var KEY = fs.readFileSync(process.env["OPENSHIFT_DATA_DIR"] + "/key.txt", {encoding: "UTF-8"});

var app = express();

database.connect(function(connection) {
    // Input validation for DIDs
    app.use(/\/(register|sms_callback)/, function(req, res, next) {
        var did = req.query["did"];
        if (typeof did === "undefined") {
            res.json({
                status: "did_missing"
            });
        }
        else if (did === "") {
            res.json({
                status: "did_empty"
            });
        }
        else if (isNaN(did) || did < 0 || did.length != 10) {
            res.json({
                status: "did_invalid"
            });
        }
        else {
            next();
        }
    });

    // Input validation for registration IDs
    app.use("/register", function(req, res, next) {
        var registrationId = req.query["reg_id"];
        if (typeof registrationId === "undefined") {
            res.json({
                status: "reg_id_missing"
            });
        }
        else if (registrationId === "") {
            res.json({
                status: "reg_id_empty"
            });
        }
        else if (registrationId.length > 4096) {
            res.json({
                status: "reg_id_invalid"
            });
        }
        else {
            next();
        }
    });

    // Handler for GCM registration
    app.use("/register", function(req, res) {
        var did = req.query["did"];
        var registrationId = req.query["reg_id"];
        var tag = TAG + " " + did;

        log.info(tag, "received registration request: registration ID " + registrationId);
        connection.query('REPLACE INTO main (RegistrationId, Did) VALUES (' + connection.escape(registrationId) + ',' +
            connection.escape(did) + ');', function(err) {
                if (err) {
                    res.json({
                        status: "database_error"
                    });
                    log.error(tag, "error inserting registration request into database: registration ID " +
                        registrationId, err);
                }
                else {
                    res.json({
                        status: "success"
                    });
                    log.info(tag, "inserted registration request into database: registration ID " + registrationId);
                }
            }
        );
    });

    // Handler for SMS callbacks
    app.use("/sms_callback", function(req, res) {
        var did = req.query["did"];
        var tag = TAG + " " + did;

        log.info(tag, "received sms callback request");
        connection.query("SELECT RegistrationId FROM main WHERE Did=" + connection.escape(did) + ";",
            function(err, results) {
                if (err) {
                    res.json({
                        status: "database_error"
                    });
                    log.error(tag, "error accessing database to find registration ID", err);
                    return;
                }

                if (results.length == 0) {
                    res.json({
                        status: "no_reg_id_for_did"
                    });
                    log.info(tag, "could not find registration ID");
                    return;
                }

                var registrationId = results[0]["RegistrationId"];
                log.info(tag, "registration ID found: " + registrationId);

                var gcmMessage = {
                    registration_ids: [registrationId]
                };
                var gcmRequest = http.request({
                    hostname: "android.googleapis.com",
                    path: "/gcm/send",
                    method: "POST",
                    headers: {
                        "Authorization": "key=" + KEY,
                        "Content-Type": "application/json"
                    }
                }, function(gcmRes) {
                    if (gcmRes.statusCode != 200) {
                        log.error(tag, "GCM returned response code " + gcmRes.statusCode);
                        return;
                    }
                    else {
                        log.info(tag, "GCM returned response code 200");
                    }

                    var responseString = "";
                    gcmRes.on('data', function(chunk) {
                        responseString += chunk;
                    });
                    gcmRes.on('end', function() {
                        log.info(tag, "GCM full response received");
                        try {
                            var response = JSON.parse(responseString);
                            if (response["failure"] === 0 && response["canonical_ids"] === 0) {
                                res.json({
                                    status: "success"
                                });
                                log.info(tag, "GCM response ok");
                            }
                            else {
                                var result = response["results"][0];
                                if (result["message_id"] && result["registration_id"]) {
                                    res.json({
                                        status: "success"
                                    });
                                    log.info(tag, "GCM registration ID must be replaced");

                                    var newRegistrationId = result["registration_id"];
                                    connection.query('REPLACE INTO main (RegistrationId, Did) VALUES (' +
                                        connection.escape(newRegistrationId) + ',' + connection.escape(did) + ');',
                                        function(err) {
                                            if (!err) {
                                                log.error(tag, "error inserting new registration ID into database: " +
                                                    "new registration ID " + newRegistrationId, err);
                                            }
                                            else {
                                                log.info(tag, "inserted new registration ID into database: " +
                                                    "new registration ID " + newRegistrationId);
                                            }
                                        }
                                    );
                                }
                                else if (result["error"] === "NotRegistered" || result["error"] === "InvalidRegistration") {
                                    res.json({
                                        status: "gcm_not_registered_invalid_registration"
                                    });
                                    log.info(tag, "GCM registration ID no longer valid or was never valid");
                                    connection.query("DELETE FROM main WHERE Did=" + connection.escape(did) + ";",
                                        function(err) {
                                            if (err) {
                                                log.error(tag, "error accessing database to delete registration ID",
                                                    err);
                                            }
                                            else {
                                                log.info(tag, "deleted registration ID from database");
                                            }
                                        }
                                    );
                                }
                                else {
                                    res.json({
                                        status: "gcm_unknown_error"
                                    });
                                    log.error(tag, "error in GCM response: result " +
                                        util.inspect(result));
                                }
                            }
                        }
                        catch (err) {
                            res.json({
                                status: "gcm_parse_error"
                            });
                            log.error(tag, "error parsing GCM response: " + data, err);
                        }
                    });
                });
                gcmRequest.on("error", function(err) {
                    res.json({
                        status: "gcm_connect_error"
                    });
                    log.error(tag, "error connecting to GCM server", err);
                });
                gcmRequest.write(JSON.stringify(gcmMessage));
                gcmRequest.end(null, null, function() {
                    log.info(tag, "GCM request sent");
                });
            }
        );
    });

    app.use(express.static(__dirname + '/public'));
    app.use(function(req, res) {
        res.sendFile(__dirname + "/public/index.html")
    });
});

module.exports = app;