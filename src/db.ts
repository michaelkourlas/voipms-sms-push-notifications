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

import "es6-shim";
import {IConnection, createConnection} from "mysql";
import * as log from "winston";

const config = {
    database: "voipmssms",
    host: process.env.OPENSHIFT_MYSQL_DB_HOST || "127.0.0.1",
    password: process.env.OPENSHIFT_MYSQL_DB_PASSWORD || "password",
    port: process.env.OPENSHIFT_MYSQL_DB_PORT || "3306",
    user: process.env.OPENSHIFT_MYSQL_DB_USERNAME || "admin"
};

const TABLE_NAME = "main2";
const COLUMN_DID = "Did";
const COLUMN_REGISTRATION_ID = "RegistrationId";

export class Database {
    private _connection: IConnection;

    constructor() {
        this._connection = createConnection(config);
    }

    public connect(callback: (err?: string) => any): void {
        log.info("Connecting to database");
        this._connection.connect((err) => {
            if (err) {
                log.error(`Error connecting to database`, {err});
                callback("err");
            }
            log.info("Connected to database", {config});
            callback();
        });
    }

    public addRegistrationId(did: string,
                             registrationId: string,
                             callback?: (err?: string) => any): void
    {
        log.info(`Received registration request: ${registrationId}`, {did});
        this._connection.query(
            `INSERT INTO ${TABLE_NAME} (${COLUMN_DID},`
            + ` ${COLUMN_REGISTRATION_ID}) VALUES (?, ?)`,
            [did, registrationId],
            (err) => {
                if (err) {
                    log.error(`Error inserting registration request into`
                              + ` database: ${registrationId}`, {did, err});
                    if (callback) {
                        callback("database_error");
                    }
                    return;
                }
                log.info(`Inserted registration request into database:`
                         + ` ${registrationId}`, {did});
                if (callback) {
                    callback();
                }
            }
        );
    }

    public removeRegistrationId(did: string,
                                registrationId: string,
                                callback?: (err?: string) => any): void
    {
        log.info(`Received registration deletion request: ${registrationId}`,
                 {did});
        this._connection.query(
            `DELETE FROM ${TABLE_NAME} WHERE ${COLUMN_DID}=? AND`
            + ` ${COLUMN_REGISTRATION_ID}=?`,
            [did, registrationId],
            (err) => {
                if (err) {
                    log.error(`Error removing registration ID into`
                              + ` database: ${registrationId}`, {did, err});
                    if (callback) {
                        callback("database_error");
                    }
                    return;
                }
                log.info(`Removed registration ID from database:`
                         + ` ${registrationId}`, {did});
                if (callback) {
                    callback();
                }
            }
        );
    }

    public getRegistrationIds(
        did: string,
        callback: (err?: string, registrationIds?: string[]) => any): void
    {
        log.info("Received sms callback request", {did});
        this._connection.query(
            `SELECT ${COLUMN_REGISTRATION_ID} FROM ${TABLE_NAME}`
            + ` WHERE ${COLUMN_DID}=?`,
            [did],
            (err, results) => {
                if (err) {
                    log.error("Error accessing database to find registration"
                              + " ID", {did});
                    callback("database_error");
                    return;
                }

                let registrationIds: string[] = [];
                for (const result of results) {
                    registrationIds.push(result.RegistrationId);
                    log.info(`Registration ID found: ${result.RegistrationId}`,
                             {did});
                }

                if (registrationIds.length === 0) {
                    log.error("No registration IDs found");
                    callback("no_reg_id_for_did");
                    return;
                }

                callback(undefined, registrationIds);
            }
        );
    }
}
