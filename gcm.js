/**
 * VoIP.ms SMS GCM Server
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

var database = require("./database.js");
var express = require("express");
var http = require("http");
var log = require("./log.js");
var util = require("util");

var TAG = "gcm";
var KEY = "insert key here";

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
        else if (!registrationId.match(/^[0-9a-zA-Z\-_]+$/) || registrationId.length > 4096) {
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

        log.info(TAG, "received registration request: DID " + did + "; registration ID " + registrationId);
        connection.query('REPLACE INTO main (RegistrationId, Did) VALUES (' + connection.escape(registrationId) + ',' +
            connection.escape(did) + ');', function(err) {
                if (err) {
                    res.json({
                        status: "database_error"
                    });
                    log.error(TAG, "error inserting registration request into database: DID " + did +
                        "; registration ID " + registrationId, err);
                }
                else {
                    res.json({
                        status: "success"
                    });
                    log.info(TAG, "inserted registration request into database: DID " + did + "; registration ID " +
                        registrationId);
                }
            }
        );
    });

    // Handler for SMS callbacks
    app.use("/sms_callback", function(req, res) {
        var did = req.query["did"];

        log.info(TAG, "received sms callback request: DID " + did);
        connection.query("SELECT RegistrationId FROM main WHERE Did=" + connection.escape(did) + ";",
            function(err, results) {
                if (err) {
                    res.json({
                        status: "database_error"
                    });
                    log.error(TAG, "error accessing database to find registration ID: DID " + did, err);
                    return;
                }

                if (results.length == 0) {
                    res.json({
                        status: "no_reg_id_for_did"
                    });
                    log.info(TAG, "could not find registration ID: DID " + did);
                    return;
                }

                var registrationId = results[0]["RegistrationId"];
                log.info(TAG, "registration ID found: DID " + did + "; registration ID " + registrationId);

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
                        log.error(TAG, "GCM returned response code " + gcmRes.statusCode);
                        return;
                    }
                    else {
                        log.info(TAG, "GCM returned response code 200");
                    }

                    var responseString = "";
                    gcmRes.on('data', function(chunk) {
                        responseString += chunk;
                    });
                    gcmRes.on('end', function() {
                        log.info(TAG, "received full GCM response");
                        try {
                            var response = JSON.parse(responseString);
                            if (response["failure"] === 0 && response["canonical_ids"] === 0) {
                                res.json({
                                    status: "success"
                                });
                                log.info(TAG, "GCM response ok");
                            }
                            else {
                                var result = response["results"][0];
                                if (result["message_id"] && result["registration_id"]) {
                                    res.json({
                                        status: "success"
                                    });
                                    log.info(TAG, "GCM registration ID must be replaced");

                                    var newRegistrationId = result["registration_id"];
                                    connection.query('REPLACE INTO main (RegistrationId, Did) VALUES (' +
                                        connection.escape(newRegistrationId) + ',' + connection.escape(did) + ');',
                                        function(err) {
                                            if (!err) {
                                                log.error(TAG, "error inserting new registration ID into database: " +
                                                    "DID " + did + "; registration ID " + newRegistrationId, err);
                                            }
                                            else {
                                                log.info(TAG, "inserted new registration ID into database: DID " +
                                                    did + "; registration ID " + newRegistrationId);
                                            }
                                        }
                                    );
                                }
                                else if (result["error"] === "NotRegistered" || result["error"] === "InvalidRegistration") {
                                    res.json({
                                        status: "gcm_not_registered_invalid_registration"
                                    });
                                    log.info(TAG, "GCM registration ID not or no longer valid");
                                    connection.query("DELETE FROM main WHERE Did=" + connection.escape(did) + ";",
                                        function(err) {
                                            if (err) {
                                                log.error(TAG, "error accessing database to delete registration " +
                                                    "ID: DID " + did, err);
                                            }
                                            else {
                                                log.info(TAG, "deleted registration ID from database: DID " + did);
                                            }
                                        }
                                    );
                                }
                                else {
                                    res.json({
                                        status: "gcm_unknown_error"
                                    });
                                    log.error(TAG, "GCM response contained unknown error: result " +
                                        util.inspect(result));
                                }
                            }
                        }
                        catch (err) {
                            res.json({
                                status: "gcm_parse_error"
                            });
                            log.error(TAG, "error parsing GCM response: " + data, err);
                        }
                    });
                });
                gcmRequest.on("error", function(err) {
                    res.json({
                        status: "gcm_connect_error"
                    });
                    log.error(TAG, "error connecting to GCM server", err);
                });
                gcmRequest.write(JSON.stringify(gcmMessage));
                gcmRequest.end(null, null, function() {
                    log.info(TAG, "sent GCM request");
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