import "server-only";

const MEET_SCOPE = "https://www.googleapis.com/auth/meetings.space.created";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const STS_URL = "https://sts.googleapis.com/v1/token";
const IAM_CREDENTIALS_API = "https://iamcredentials.googleapis.com/v1";
const MEET_API = "https://meet.googleapis.com/v2";

// These values are not secrets. Environment variables remain available as
// overrides, but production is intentionally configured to work with Vercel's
// automatically-issued OIDC token and no long-lived Google private key.
const SERVICE_ACCOUNT_EMAIL =
  process.env.GOOGLE_MEET_SERVICE_ACCOUNT_EMAIL?.trim() ||
  "lf-meet-provisioner@the-lost-and-found-project.iam.gserviceaccount.com";
const DELEGATED_ORGANIZER =
  process.env.GOOGLE_MEET_DELEGATED_ORGANIZER?.trim() ||
  "meetings@lostandfoundproject.org";
const WORKLOAD_IDENTITY_PROVIDER =
  process.env.GOOGLE_MEET_WORKLOAD_IDENTITY_PROVIDER?.trim() ||
  "projects/66404996772/locations/global/workloadIdentityPools/vercel/providers/vercel";

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

type ErrorBody = {
  error?: string | { message?: string };
  error_description?: string;
  access_token?: string;
  signedJwt?: string;
  message?: string;
};

function requireVercelOidcToken() {
  const token = process.env.VERCEL_OIDC_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "Missing Vercel OIDC token. Google Meet provisioning must run in a Vercel deployment with OIDC Federation enabled.",
    );
  }
  return token;
}

function googleError(body: ErrorBody, fallback: string) {
  if (typeof body.error === "object" && body.error?.message) return body.error.message;
  return body.error_description || (typeof body.error === "string" ? body.error : undefined) || body.message || fallback;
}

async function workloadIdentityAccessToken() {
  const oidcToken = requireVercelOidcToken();
  const audience = `//iam.googleapis.com/${WORKLOAD_IDENTITY_PROVIDER}`;

  const response = await fetch(STS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      audience,
      grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
      scope: "https://www.googleapis.com/auth/cloud-platform",
      subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
      subject_token: oidcToken,
    }),
    cache: "no-store",
  });

  const body = (await response.json()) as ErrorBody;
  if (!response.ok || !body.access_token) {
    throw new Error(`Google Workload Identity exchange failed: ${googleError(body, String(response.status))}`);
  }
  return body.access_token;
}

async function signDelegatedJwt(payload: string) {
  const federatedToken = await workloadIdentityAccessToken();
  const serviceAccountPath = encodeURIComponent(SERVICE_ACCOUNT_EMAIL);
  const response = await fetch(
    `${IAM_CREDENTIALS_API}/projects/-/serviceAccounts/${serviceAccountPath}:signJwt`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${federatedToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload }),
      cache: "no-store",
    },
  );

  const body = (await response.json()) as ErrorBody;
  if (!response.ok || !body.signedJwt) {
    throw new Error(`Google signJwt failed: ${googleError(body, String(response.status))}`);
  }
  return body.signedJwt;
}

async function delegatedAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const signedJwt = await signDelegatedJwt(
    JSON.stringify({
      iss: SERVICE_ACCOUNT_EMAIL,
      sub: DELEGATED_ORGANIZER,
      scope: MEET_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt,
    }),
    cache: "no-store",
  });

  const body = (await response.json()) as ErrorBody;
  if (!response.ok || !body.access_token) {
    throw new Error(`Google OAuth token exchange failed: ${googleError(body, String(response.status))}`);
  }
  return body.access_token;
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
    organizerEmail: DELEGATED_ORGANIZER,
  };
}
