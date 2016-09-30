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

import * as http from "http";
import * as https from "https";
import * as log from "winston";

export class Fcm {
    private static onFcmResponse(res: http.ClientResponse,
                                 did: string,
                                 registrationIds: string[],
                                 callback: (err?: string,
                                            oldRegIds?: string[],
                                            newRegIds?: string[]) => any): void
    {
        if (res.statusCode !== 200) {
            log.error(`FCM returned response code ${res.statusCode}`, {did});
            callback("gcm_response_code_error");
        }
        log.info("FCM returned response code 200");

        let rawResponse = "";
        res.on("data", (data) => {
            rawResponse += data;
        });
        res.on("end", () => {
            log.info("FCM response received", {did});
            let response: any;
            try {
                response = JSON.parse(rawResponse);
            } catch (err) {
                log.info("Error parsing FCM response as JSON",
                         {did, rawResponse});
                callback("gcm_json_parse_error");
                return;
            }
            log.info("FCM response parsed", {did, response});

            if (response.failure === 0 && response.canonical_ids === 0) {
                log.info("FCM response ok", {did});
                callback();
                return;
            }

            const results = response.results;
            if (!Array.isArray(results)
                || results.length !== registrationIds.length)
            {
                log.error("FCM results array does not match registration IDs"
                          + " array", {did});
                callback("gcm_parse_error");
            }

            let oldRegistrationIds: string[] = [];
            let newRegistrationIds: string[] = [];
            for (let i = 0; i < response.results.length; i++) {
                const oldRegistrationId = registrationIds[i];
                const result = results[i];
                if (result.message_id && result.registration_id) {
                    const newRegistrationId = result.registration_id;
                    log.info(`FCM registration ID ${oldRegistrationId} must be`
                             + ` replaced with ${newRegistrationId}`);
                    oldRegistrationIds.push(oldRegistrationId);
                    newRegistrationIds.push(newRegistrationId);
                } else if (result.error === "NotRegistered"
                           || result.error === "InvalidRegistration")
                {
                    oldRegistrationIds.push(oldRegistrationId);
                } else {
                    log.error("FCM unknown error", {did});
                    callback("gcm_parse_error");
                }
            }

            callback(undefined, oldRegistrationIds, newRegistrationIds);
        });
    }

    private static onFcmError(err: Error,
                              did: string,
                              callback: (err?: string) => any): void
    {
        log.error("Error connecting to GCM server",
                  {err, did});
        callback("gcm_connect_error");
    }

    private _key: string;

    constructor(key: string) {
        this._key = key;
    }

    public sendMessage(did: string, registrationIds: string[],
                       callback: (err?: string,
                                  oldRegistrationIds?: string[],
                                  newRegistrationIds?: string[]) => any): void
    {
        const gcmMessage = {
            data: {},
            registration_ids: registrationIds
        };
        const gcmRequest = https.request(
            {
                headers: {
                    "Authorization": "key=" + this._key,
                    "Content-Type": "application/json"
                },
                hostname: "fcm.googleapis.com",
                method: "POST",
                path: "/fcm/send"
            }
        );
        gcmRequest.on("response", (res: http.IncomingMessage) => {
            Fcm.onFcmResponse(res, did, registrationIds, callback);
        });
        gcmRequest.on("error", (err) => {
            Fcm.onFcmError(err, did, callback);
        });
        gcmRequest.end(JSON.stringify(gcmMessage), undefined, () => {
            log.info("FCM message sent", {did, gcmMessage});
        });
    }
}
