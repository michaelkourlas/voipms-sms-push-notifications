const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

function isDid(str) {
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        if (c < 48 || c > 57) {
            return false;
        }
    }
    return true;
}

exports.notify = functions.https.onRequest((req, res) => {
    // Get the DID from the request
    const did = req.query["did"];
    if (req.method !== "GET" || !did || !isDid(did)) {
        res.status(400).end();
        return;
    }

    // Send a push notification message to all devices who have subscribed
    // to the DID topic from the request
    const message = {
        android: {
            priority: "high",
            ttl: 0
        },
        data: {},
        topic: `did-${did}`
    };
    admin.messaging().send(message).then(() => {
	    console.log(`${did}: notified`);
	    res.status(200).end();
    }).catch((err) => {
	    console.error(`${did}: failed to notify`, err);
	    res.status(500).end();
    });
});
