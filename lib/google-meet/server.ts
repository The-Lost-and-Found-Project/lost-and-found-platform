import "server-only";

import { createSign } from "node:crypto";

const MEET_SCOPE = "https://www.googleapis.com/auth/meetings.space.created";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const MEET_API = "https://meet.googleapis.com/v2";

type MeetSpace = {
  name: string;
  meetingUri?: string;
  meetingCode?: string;
};

type MeetMember = {
  name?: string;
  email: string;
  role?: "COHOST" | "ROLE_UNSPECIFIED";
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

async function delegatedAccessToken() {
  const serviceAccountEmail = requiredEnv("GOOGLE_MEET_SERVICE_ACCOUNT_EMAIL");
  const delegatedOrganizer = requiredEnv("GOOGLE_MEET_DELEGATED_ORGANIZER");
  const privateKey = requiredEnv("GOOGLE_MEET_SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: serviceAccountEmail,
      sub: delegatedOrganizer,
      scope: MEET_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );

  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(privateKey).toString("base64url");
  const assertion = `${unsigned}.${signature}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  const body = await response.json();
  if (!response.ok || !body.access_token) {
    throw new Error(`Google OAuth token exchange failed: ${body.error_description || body.error || response.status}`);
  }

  return body.access_token as string;
}

async function meetFetch<T>(path: string, init: RequestInit = {}) {
  const accessToken = await delegatedAccessToken();
  const response = await fetch(`${MEET_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const detail = body?.error?.message || body?.message || response.statusText;
    throw new Error(`Google Meet API request failed (${response.status}): ${detail}`);
  }
  return body as T;
}

export async function createMeetSpace() {
  return meetFetch<MeetSpace>("/spaces", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function addMeetCohost(spaceName: string, email: string) {
  if (!spaceName.startsWith("spaces/")) throw new Error("Invalid Google Meet space resource name.");
  return meetFetch<MeetMember>(`/${spaceName}/members`, {
    method: "POST",
    body: JSON.stringify({ email, role: "COHOST" }),
  });
}

export async function provisionMeetSpace(cohostEmail?: string | null) {
  const space = await createMeetSpace();
  if (!space.name || !space.meetingUri) throw new Error("Google Meet created a space without a usable meeting URI.");

  if (cohostEmail) {
    await addMeetCohost(space.name, cohostEmail);
  }

  return {
    spaceName: space.name,
    meetingCode: space.meetingCode || null,
    meetingUri: space.meetingUri,
    organizerEmail: requiredEnv("GOOGLE_MEET_DELEGATED_ORGANIZER"),
  };
}
