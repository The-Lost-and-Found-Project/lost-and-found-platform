export function escapeEmailHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

type EmailAction = {
  href: string;
  label: string;
  primary?: boolean;
};

export function renderLfpEmail({
  preheader,
  eyebrow,
  title,
  bodyHtml,
  actions = [],
  reason,
  siteUrl,
}: {
  preheader: string;
  eyebrow: string;
  title: string;
  bodyHtml: string;
  actions?: EmailAction[];
  reason: string;
  siteUrl: string;
}) {
  const buttons = actions.map((action) => `
    <a href="${action.href}" style="display:inline-block;margin:0 8px 10px 0;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:800;${action.primary ? "background:#4f46e5;color:#ffffff;" : "border:1px solid #cbd5e1;background:#ffffff;color:#3730a3;"}">
      ${action.label}
    </a>
  `).join("");

  return `<!doctype html>
  <html lang="en">
    <body style="margin:0;background:#f8fafc;color:#1e293b;font-family:Arial,sans-serif;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 12px;">
        <tr><td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;overflow:hidden;border:1px solid #e2e8f0;border-radius:24px;background:#ffffff;">
            <tr><td style="background:#0f172a;padding:28px 32px;color:#ffffff;">
              <div style="font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#fcd34d;">The Lost and Found Project</div>
              <div style="margin-top:8px;font-size:14px;color:#c7d2fe;">Pray. Praise. Testify.</div>
            </td></tr>
            <tr><td style="padding:32px;">
              <div style="font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#4338ca;">${eyebrow}</div>
              <h1 style="margin:10px 0 18px;font-size:28px;line-height:1.2;color:#0f172a;">${title}</h1>
              <div style="font-size:16px;line-height:1.7;color:#475569;">${bodyHtml}</div>
              ${buttons ? `<div style="margin-top:26px;">${buttons}</div>` : ""}
            </td></tr>
            <tr><td style="border-top:1px solid #e2e8f0;padding:22px 32px;font-size:12px;line-height:1.6;color:#64748b;">
              <p style="margin:0 0 8px;">${reason}</p>
              <p style="margin:0;">You&apos;re not walking this alone. &mdash; The Lost and Found Project</p>
              <p style="margin:8px 0 0;"><a href="${siteUrl}" style="color:#4338ca;">Open the Community App</a></p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
  </html>`;
}
