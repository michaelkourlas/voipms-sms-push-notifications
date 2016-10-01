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

import {IConnection, createConnection} from "mysql";
import * as log from "winston";

const TABLE_NAME = "main2";
const COLUMN_ID = "Id";
const COLUMN_DID = "Did";
const COLUMN_REGISTRATION_ID = "RegistrationId";

const create = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  ${COLUMN_ID} int(11) NOT NULL AUTO_INCREMENT,
  ${COLUMN_DID} varchar(10) NOT NULL,
  ${COLUMN_REGISTRATION_ID} varchar(255) NOT NULL,
  PRIMARY KEY (${COLUMN_ID})
) ENGINE=InnoDB DEFAULT CHARSET=utf8;`;

const config = {
    database: "voipmssms",
    host: process.env.OPENSHIFT_MYSQL_DB_HOST || "127.0.0.1",
    password: process.env.OPENSHIFT_MYSQL_DB_PASSWORD || "password",
    port: process.env.OPENSHIFT_MYSQL_DB_PORT || "3306",
    user: process.env.OPENSHIFT_MYSQL_DB_USERNAME || "admin"
};

export class Database {
    private _connection: IConnection;

    constructor() {
        this._connection = createConnection(config);
    }

    public connect(callback: (err?: string) => any): void {
        this._connection.connect((err) => {
            if (err) {
                log.error("Error connecting to database", {err});
                callback("err");
            }
            /* tslint:disable:object-literal-sort-keys */
            log.info("Connected to database",
                     {
                         name: config.database,
                         host: config.host,
                         port: config.port,
                         user: config.user
                     });
            /* tslint:enable:object-literal-sort-keys */

            this._connection.query(create, (err2) => {
                if (err2) {
                    log.error("Error creating table", {err2});
                }
                callback();
            });

        });
    }

    public addRegistrationId(did: string,
                             registrationId: string,
                             callback?: (err?: string) => any): void
    {
        log.info("Received registration ID insertion request",
                 {did, registrationId});
        this._connection.query(
            `REPLACE INTO ${TABLE_NAME} (${COLUMN_DID},`
            + ` ${COLUMN_REGISTRATION_ID}) VALUES (?, ?)`,
            [did, registrationId],
            (err) => {
                if (err) {
                    log.error("Error inserting registration ID into"
                              + " database", {did, err});
                    if (callback) {
                        callback("database_error");
                    }
                    return;
                }
                log.info("Inserted registration ID into database", {did});
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
        log.info("Received registration ID deletion request",
                 {did, registrationId});
        this._connection.query(
            `DELETE FROM ${TABLE_NAME} WHERE ${COLUMN_DID}=? AND`
            + ` ${COLUMN_REGISTRATION_ID}=?`,
            [did, registrationId],
            (err) => {
                if (err) {
                    log.error("Error deleting registration ID from"
                              + " database", {did, err});
                    if (callback) {
                        callback("database_error");
                    }
                    return;
                }
                log.info("Deleted registration ID from database", {did});
                if (callback) {
                    callback();
                }
            }
        );
    }

    public getRegistrationIds(did: string,
                              callback: (err?: string,
                                         regIds?: string[]) => any): void
    {
        log.info("Received registration ID retrieval request", {did});
        this._connection.query(
            `SELECT ${COLUMN_REGISTRATION_ID} FROM ${TABLE_NAME}`
            + ` WHERE ${COLUMN_DID}=?`,
            [did],
            (err, results) => {
                if (err) {
                    log.error("Error retrieving registration ID from database",
                              {did, err});
                    callback("database_error");
                    return;
                }

                let registrationIds: string[] = [];
                for (const result of results) {
                    if (registrationIds.indexOf(result) === -1) {
                        registrationIds.push(result.RegistrationId);
                        log.info("Registration ID found",
                                 {did, registrationId: result.RegistrationId});
                    }
                }

                if (registrationIds.length === 0) {
                    log.error("No registration IDs found", {did});
                    callback("no_reg_id_for_did");
                    return;
                }

                callback(undefined, registrationIds);
            }
        );
    }
}
