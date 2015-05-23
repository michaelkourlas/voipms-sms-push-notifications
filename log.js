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

module.exports.info = function(module, message) {
    console.info(new Date().toISOString() + " [" + module + "] INFO " + message);
};

module.exports.error = function(module, message, err) {
    console.error(new Date().toISOString() + " [" + module + "] ERROR " + message);
    if (err) {
        console.trace(err);
    }
};