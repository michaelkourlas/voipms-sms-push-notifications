# VoIP.ms SMS Server #

## Overview ##

VoIP.ms SMS Server sends push notifications to [VoIP.ms SMS](https://github.com/michaelkourlas/voipms-sms-client) users
using Google Cloud Messaging in response to SMS callbacks from VoIP.ms.

## Features ##

To protect the privacy of VoIP.ms SMS users, the server only links DIDs with GCM registration IDs and tells the client 
when to sync with the VoIP.ms servers. It does not process or store the text of individual SMSes.

## Usage ##

The developer hosts an instance of the server using [OpenShift](https://voipmssms-kourlas.rhcloud.com/). To use this 
server, copy and paste the following URL into the "SMS URL Callback" field of the SMS settings for your DID on the 
VoIP.ms portal:

    http://voipmssms-kourlas.rhcloud.com/sms_callback?did={DID}

## License ##

VoIP.ms SMS Server is licensed under the Apache License 2.0. Please see the LICENSE.md file for more information.