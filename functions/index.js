const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

exports.notify = functions.https.onRequest((req, res) => {
    // Get the DID from the request
    const did = req.query["did"];
    if (req.method !== "GET" || !did) {
        res.status(400).end();
        return;
    }

    // Send a push notification message to all devices who have subscribed
    // to the DID topic from the request
    admin.messaging().sendToTopic(`did-${did}`, {data: {}}).then(() => {
	    console.log(`${did}: notified`);
	    res.status(200).end();
    }).catch((err) => {
	    console.error(`${did}: failed to notify`, err);
	    res.status(500).end();
    });
});
