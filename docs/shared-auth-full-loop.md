# L&F ↔ Emmaus authentication ownership

The Lost & Found Project account is the canonical member identity. Emmaus uses that identity through a separate, linked application session.

## Full loop

1. L&F entry signs into L&F normally.
2. Emmaus entry uses the L&F Emmaus-specific sign-in/sign-up door while preserving the requested Emmaus path.
3. After authentication or email confirmation, `/auth/emmaus` creates a short-lived HMAC assertion containing issuer, audience, L&F user id, verified email, display name, issued-at/expiry, and a safe Emmaus destination.
4. Emmaus validates the assertion and establishes its own origin-scoped session.
5. Existing L&F members never create a second account or password for Emmaus.
6. Primary password recovery/security remains owned by L&F.
7. Emmaus sign-out is application-specific and must not immediately recreate itself through an active L&F session.

## Security

- `EMMAUS_SSO_SECRET` is server-only and must be configured identically on both deployments.
- Assertions expire after 120 seconds.
- Emmaus destinations must be local absolute paths and reject protocol-relative/backslash forms.
- The Emmaus service role is never exposed to the browser.
- The identity link records the canonical L&F user id rather than treating matching email alone as the long-term identity contract.

## Product boundary

This integration is exclusively L&F ↔ Emmaus. Rare Network / Rare of Breed must not share this identity bridge, branding, runtime, database work, or navigation.