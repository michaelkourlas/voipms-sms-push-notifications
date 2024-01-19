import { Env } from "./index";
import { importPKCS8, SignJWT } from "jose";

interface TokenResponse {
    access_token: string,
    expires_in: number,
}

let accessToken: string | null = null;
let accessTokenExpiryTime: number = Date.now();

async function createAccessTokenRequestJwt(env: Env) {
    const alg = "RS256";
    const key = await importPKCS8(env.PRIVATE_KEY, alg);
    const header = { alg };
    const payload = {
        scope: "https://www.googleapis.com/auth/firebase.messaging"
    };
    return await new SignJWT(payload)
        .setProtectedHeader(header)
        .setIssuedAt()
        .setIssuer(env.CLIENT_EMAIL)
        .setAudience("https://oauth2.googleapis.com/token")
        .setExpirationTime("60s")
        .sign(key);
}

export async function getAccessToken(env: Env) {
    // If we have a cached access token that is not expiring in the next 5 
    // seconds, use that instead.
    if (accessToken != null && accessTokenExpiryTime - Date.now() > 5000) {
        return accessToken;
    }

    const jwt = await createAccessTokenRequestJwt(env);

    const params = new URLSearchParams();
    params.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
    params.append("assertion", jwt);

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
    });
    const json = await response.json<TokenResponse>();

    accessToken = json.access_token;
    accessTokenExpiryTime = Date.now() + (json.expires_in * 1000);

    return accessToken;
}

export function clearCachedAccessToken() {
    accessToken = null;
    accessTokenExpiryTime = Date.now();
}