/*
 * VoIP.ms SMS Server
 * Copyright (C) 2015-2016 Michael Kourlas
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

import {Database} from "./db";
import {Fcm} from "./fcm";
import * as express from "express";

export class Server {
    private _app: express.Application;
    private _db: Database;
    private _fcm: Fcm;

    constructor(key: string) {
        this._app = express();
        this._db = new Database();
        this._fcm = new Fcm(key);
    }

    public init(callback: () => any): void {
        this._db.connect((err) => {
            if (err) {
                process.exit(1);
            }

            this.addInputValidationHandlers();
            this.addFcmRegistrationHandler();
            this.addSmsCallbackHandler();
            this.addStaticHandler();

            callback();
        });
    }

    private addInputValidationHandlers(): void {
        // Input validation for DIDs
        this._app.use(/\/(register|sms_callback)/, (req, res, next) => {
            const did = req.query.did;
            if (typeof did === "undefined") {
                res.json({status: "did_missing"});
            } else if (did === "") {
                res.json({status: "did_empty"});
            } else if (isNaN(did) || did < 0 || did.length !== 10) {
                res.json({status: "did_invalid"});
            } else {
                next();
            }
        });

        // Input validation for registration IDs
        this._app.use("/register", (req, res, next) => {
            const registrationId = req.query.reg_id;
            if (typeof registrationId === "undefined") {
                res.json({status: "reg_id_missing"});
            } else if (registrationId === "") {
                res.json({status: "reg_id_empty"});
            } else if (registrationId.length > 4096) {
                res.json({status: "reg_id_invalid"});
            } else {
                next();
            }
        });
    }

    private addFcmRegistrationHandler(): void {
        this._app.use("/register", (req, res) => {
            const did = req.query.did;
            const registrationId = req.query.reg_id;

            this._db.addRegistrationId(did, registrationId, (err) => {
                if (err) {
                    res.json({status: err});
                    return;
                }
                res.json({status: "success"});
            });
        });
    }

    private addSmsCallbackHandler(): void {
        this._app.use("/sms_callback", (req, res) => {
            const did = req.query.did;

            this._db.getRegistrationIds(did, (err, registrationIds) => {
                if (err || !registrationIds) {
                    res.json({status: err});
                    return;
                }

                this._fcm.sendMessage(
                    did,
                    registrationIds,
                    (err2, oldRegistrationIds, newRegistrationIds) => {
                        if (err2 || !oldRegistrationIds
                            || !newRegistrationIds)
                        {
                            res.json({status: err2});
                            return;
                        }

                        if (oldRegistrationIds.length > 0) {
                            res.json({status: "gcm_remove_old"});
                        } else {
                            res.json({status: "success"});
                        }

                        for (const registrationId of oldRegistrationIds) {
                            this._db.removeRegistrationId(did, registrationId);
                        }

                        for (const registrationId of newRegistrationIds) {
                            this._db.addRegistrationId(did, registrationId);
                        }
                    }
                );
            });
        });
    }

    private addStaticHandler(): void {
        this._app.use(express.static(__dirname + "/public"));
        this._app.use((_, res) => {
            res.sendFile(__dirname + "/public/index.html");
        });
    }

    public get app(): express.Application {
        return this._app;
    }
}
