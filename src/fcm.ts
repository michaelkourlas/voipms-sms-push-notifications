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
        log.info("FCM response received", {did, responseCode: res.statusCode});
        if (res.statusCode !== 200) {
            log.error("FCM response contains invalid response code", {did});
            callback("fcm_response_code_error");
            return;
        }

        let rawResponse = "";
        res.on("data", (data) => {
            rawResponse += data;
        });
        res.on("end", () => {
            let response: any;
            try {
                response = JSON.parse(rawResponse);
            } catch (err) {
                log.info("Error parsing FCM response as JSON",
                         {did, rawResponse});
                callback("fcm_json_parse_error");
                return;
            }
            log.info("FCM response parsed",
                     {did, response: JSON.stringify(response)});

            if (response.success === registrationIds.length
                && response.failure === 0
                && response.canonical_ids === 0)
            {
                log.info("FCM response all OK", {did});
                callback();
                return;
            }

            const results = response.results;
            if (!Array.isArray(results)
                || results.length !== registrationIds.length)
            {
                log.error("FCM results array is not valid or does not match"
                          + " request registration IDs array", {did});
                callback("fcm_parse_error");
                return;
            }

            let oldRegistrationIds: string[] = [];
            let newRegistrationIds: string[] = [];
            for (let i = 0; i < response.results.length; i++) {
                const oldRegistrationId = registrationIds[i];
                const result = results[i];

                if (result.message_id) {
                    log.info(`FCM response OK for entry ${i}`,
                             {did});
                } else {
                    log.warn(`FCM response error for entry ${i}`,
                             {did, error: result.error});
                }

                if (result.registration_id) {
                    const newRegistrationId = result.registration_id;
                    log.warn("FCM registration ID must be replaced",
                             {did, oldRegistrationId, newRegistrationId});
                    oldRegistrationIds.push(oldRegistrationId);
                    newRegistrationIds.push(newRegistrationId);
                }

                if (result.error === "NotRegistered"
                    || result.error === "InvalidRegistration")
                {
                    log.warn("FCM registration ID must be removed",
                             {did, oldRegistrationId});
                    oldRegistrationIds.push(oldRegistrationId);
                }
            }

            callback(undefined, oldRegistrationIds, newRegistrationIds);
        });
    }

    private static onFcmError(err: Error,
                              did: string,
                              callback: (err?: string) => any): void
    {
        log.error("Error connecting to FCM server",
                  {did, err});
        callback("fcm_connect_error");
    }

    private _key: string;

    constructor(key: string) {
        this._key = key;
    }

    public sendRequest(did: string, registrationIds: string[],
                       callback: (err?: string,
                                  oldRegistrationIds?: string[],
                                  newRegistrationIds?: string[]) => any): void
    {
        const fcmMessage = {
            data: {did},
            registration_ids: registrationIds
        };
        const fcmRequest = https.request(
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
        fcmRequest.on("response", (res: http.IncomingMessage) => {
            Fcm.onFcmResponse(res, did, registrationIds, callback);
        });
        fcmRequest.on("error", (err) => {
            Fcm.onFcmError(err, did, callback);
        });
        fcmRequest.end(JSON.stringify(fcmMessage), undefined, () => {
            log.info("FCM request sent",
                     {did, request: JSON.stringify(fcmMessage)});
        });
    }
}
