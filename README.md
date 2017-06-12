# Firebase Cloud Function for VoIP.ms SMS #

## Overview ##

This is a simple Firebase Cloud Function that enables push notifications on
devices running [VoIP.ms SMS](https://github.com/michaelkourlas/voipms-sms-client)
by forwarding SMS callbacks for a particular DID from VoIP.ms.

## Features ##

To protect the privacy of VoIP.ms SMS users, when receiving a callback for a
DID, the function simply sends an empty message to a Firebase Cloud Messaging
topic equal to that DID. It does not process or store the text of individual
messages.

## Usage ##

Consult the [Firebase documentation](https://firebase.google.com/docs/functions/)
for information on how to use Firebase Cloud Functions. You will have to
rebuild VoIP.ms SMS from source in order to use your own Firebase Cloud
Function instance.

## License ##

Firebase Cloud Function for VoIP.ms SMS is licensed under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).
Please see the LICENSE.md file for more information.
