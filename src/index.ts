import { getAccessToken, clearCachedAccessToken } from "./auth";

export interface Env {
    CLIENT_EMAIL: string,
    PRIVATE_KEY: string,
}

function isDid(str: string) {
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        if (c < 48 || c > 57) {
            return false;
        }
    }
    return true;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const accessToken = await getAccessToken(env);

        // Get the DID from the request.
        const url = new URL(request.url);
        const did = url.searchParams.get("did");
        if (typeof did != "string" || !isDid(did)) {
            return new Response("invalid", { status: 400 });
        }

        // Send a push notification message to all devices who have subscribed
        // to the DID topic from the request.
        const message = {
            android: {
                priority: "high",
                collapseKey: "sms"
            },
            data: {},
            topic: `did-${did}`
        };

        const response = await fetch(`https://fcm.googleapis.com/v1/projects/voip-ms-sms-9ee2b/messages:send`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ message: message })
        });
        if (response.status == 200) {
            return new Response("notified", { status: 200 });
        } else {
            if (response.status == 401) {
                clearCachedAccessToken();
            }
            return new Response("fail", { status: 500 });
        }
    },
};
