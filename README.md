# VoIP.ms SMS Server #

[![Build Status](https://travis-ci.org/michaelkourlas/node-js2xmlparser.svg?branch=master)](https://travis-ci.org/michaelkourlas/node-js2xmlparser)

## Overview ##

VoIP.ms SMS Server is a Node.js server that sends push notifications to 
[VoIP.ms SMS](https://github.com/michaelkourlas/voipms-sms-client) users using 
Firebase Cloud Messaging in response to SMS callbacks from VoIP.ms.

## Features ##

To protect the privacy of VoIP.ms SMS users, the server only links DIDs with 
FCM registration IDs and tells the client when to sync with the VoIP.ms servers.
It does not process or store the text of individual SMSes.

## Usage ##

The developer hosts an instance of the server using 
[OpenShift](https://voipmssms-kourlas.rhcloud.com/). To use this server, access 
the SMS settings for your DID on the VoIP.ms portal and enable the 'SMS URL 
Callback' feature, entering the following URL into the neighbouring field:

    http://voipmssms-kourlas.rhcloud.com/sms_callback?did={TO}
    
The server runs on Node.js and requires access to a MySQL database.

You can also build VoIP.ms SMS Server from source using gulp:

```
git clone https://github.com/michaelkourlas/voipms-sms-server.git
npm install
gulp
```

You'll need to install gulp first if you don't have it:

```
npm install -g gulp
```

You can then copy the folder into your node_modules directory.

The `default` and `prod` targets will build the production variant of VoIP.ms 
SMS Server. You can also build the development version using the target `dev`.
At the moment, the only difference between the two is that the development 
version includes source maps.

## License ##

VoIP.ms SMS Server is licensed under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).
Please see the LICENSE.md file for more information.
