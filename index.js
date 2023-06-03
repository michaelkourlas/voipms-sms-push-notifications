const admin = require("firebase-admin");
const process = require("process");

process.env["GOOGLE_APPLICATION_CREDENTIALS"] =
    "./voip-ms-sms-9ee2b-firebase-adminsdk-t66ep-2a0be3ffad.json";

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://voip-ms-sms-9ee2b.firebaseio.com",
});

function isDid(str) {
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        if (c < 48 || c > 57) {
            return false;
        }
    }
    return true;
}

function main(params) {
    // Get the DID from the request.
    const did = params["did"];
    if (!isDid(did)) {
        return {
            statusCode: 400
        };
    }

    // Send a push notification message to all devices who have subscribed
    // to the DID topic from the request.
    const message = {
        android: {
            priority: "high",
            collapse_key: "sms"
        },
        data: {},
        topic: `did-${did}`
    };
    return admin.messaging().send(message).then(() => {
        console.log(`${did}: notified`);
        return {
            statusCode: 200,
        };
    }).catch((err) => {
        console.error(`${did}: failed to notify`, err);
        return {
            statusCode: 500,
        };
    });
}

exports.main = main;
