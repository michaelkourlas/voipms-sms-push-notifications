# IBM Cloud Function for VoIP.ms SMS #

## Overview ##

This is a simple IBM Cloud Function that enables push notifications on
devices running [VoIP.ms SMS](https://github.com/michaelkourlas/voipms-sms-client)
by forwarding SMS callbacks for a particular DID from VoIP.ms.

## Features ##

To protect the privacy of VoIP.ms SMS users, when receiving a callback for a
DID, the function simply sends an empty message to a Firebase Cloud Messaging
topic equal to that DID. It does not process or store the text of individual
messages.

## Usage ##

Consult the [IBM Cloud Functions documentation](https://cloud.ibm.com/docs/openwhisk)
for information on how to use IBM Cloud Functions. You will have to rebuild
VoIP.ms SMS from source in order to use your own IBM Cloud Function instance.

## License ##

IBM Cloud Function for VoIP.ms SMS is licensed under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).
