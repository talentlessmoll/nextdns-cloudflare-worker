/**
 * Custom DNS-over-HTTPS (DoH) Cloudflare Worker for NextDNS
 * Proxies encrypted DNS queries from your custom domain to NextDNS
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const profileId = env.NEXTDNS_PROFILE_ID || "3c22d8";
    const acceptHeader = request.headers.get("Accept") || "";

    // If accessed via a browser directly without a DNS payload, show the dashboard
    const isBrowserVisit =
      request.method === "GET" &&
      !url.searchParams.has("dns") &&
      !url.searchParams.has("name") &&
      acceptHeader.includes("text/html");

    if (url.pathname === "/" || url.pathname === "/health" || isBrowserVisit) {
      return renderLandingPage(request, profileId);
    }

    // Determine target NextDNS path and device name
    // Supported formats:
    //  - /dns-query
    //  - /dns-query/DeviceName
    //  - /DeviceName/dns-query
    //  - /DeviceName
    let deviceName = "";
    let cleanPath = url.pathname.replace(/^\/+/, "");

    const parts = cleanPath.split("/").filter(Boolean);
    if (parts.length === 1) {
      if (parts[0] !== "dns-query") {
        deviceName = parts[0];
      }
    } else if (parts.length >= 2) {
      if (parts[0] === "dns-query") {
        deviceName = parts.slice(1).join("-");
      } else if (parts[parts.length - 1] === "dns-query") {
        deviceName = parts.slice(0, -1).join("-");
      } else {
        deviceName = parts.join("-");
      }
    }

    // Build the destination NextDNS URL
    let targetPath = `/${profileId}`;
    if (deviceName) {
      targetPath += `/${encodeURIComponent(deviceName)}`;
    }
    
    // Preserve RFC8484 standard /dns-query or subpath query params
    const targetUrl = new URL(targetPath + url.search, "https://dns.nextdns.io");

    // Copy and prepare request headers
    const headers = new Headers(request.headers);
    headers.set("Host", "dns.nextdns.io");

    // Pass client IP to NextDNS for accurate analytics
    const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For");
    if (clientIp) {
      headers.set("X-Forwarded-For", clientIp);
    }

    try {
      const response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: headers,
        body: request.method === "POST" ? request.body : null,
        redirect: "follow",
      });

      // Clone response to add CORS headers
      const resHeaders = new Headers(response.headers);
      resHeaders.set("Access-Control-Allow-Origin", "*");
      resHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      resHeaders.set("Access-Control-Allow-Headers", "Content-Type, Accept");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: resHeaders,
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Upstream DNS query failed", details: err.message }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};

function renderLandingPage(request, profileId) {
  const host = request.headers.get("Host") || "dns.yourdomain.com";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Custom DNS Gateway</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.2);
      --border: #334155;
      --code-bg: #0b1120;
    }
    body {
      margin: 0;
      padding: 2rem 1rem;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      display: flex;
      justify-content: center;
    }
    .container {
      max-width: 720px;
      width: 100%;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    h1 {
      margin: 0 0 0.5rem;
      font-size: 2rem;
      letter-spacing: -0.02em;
    }
    p.lead {
      color: var(--text-muted);
      margin-top: 0;
      font-size: 1.1rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      margin-top: 1.5rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }
    .card h2 {
      margin-top: 0;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .endpoint-box {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.85rem 1rem;
      font-family: monospace;
      font-size: 0.95rem;
      color: var(--accent);
      word-break: break-all;
      margin: 0.75rem 0;
      user-select: all;
    }
    .instructions {
      margin-top: 1.5rem;
    }
    .instructions ol {
      padding-left: 1.25rem;
      color: var(--text-muted);
    }
    .instructions li {
      margin-bottom: 0.75rem;
      line-height: 1.5;
    }
    .instructions code {
      background: var(--code-bg);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      color: var(--accent);
      font-size: 0.9em;
    }
    footer {
      text-align: center;
      margin-top: 2rem;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">&#x25CF; Online & Secure</span>
    <h1>Custom DNS Gateway</h1>
    <p class="lead">Encrypted DNS-over-HTTPS (DoH) resolver powered by Cloudflare Workers & NextDNS.</p>

    <div class="card">
      <h2>&#x1F680; Your Custom DoH Endpoint</h2>
      <p style="color: var(--text-muted); margin-bottom: 0.5rem;">Use this URL in your browser or OS secure DNS settings:</p>
      <div class="endpoint-box">https://${host}/dns-query</div>

      <h3 style="font-size: 1rem; margin-top: 1.25rem; margin-bottom: 0.5rem;">&#x1F4F1; Per-Device Tracking Endpoint</h3>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0;">Specify a device name so it shows cleanly in NextDNS analytics:</p>
      <div class="endpoint-box">https://${host}/dns-query/MyPhone</div>
    </div>

    <div class="card instructions">
      <h2>&#x2699;&#xFE0F; Quick Setup Instructions</h2>
      <ol>
        <li><strong>Google Chrome / Brave / Edge:</strong> Go to <em>Settings</em> &rarr; <em>Privacy and Security</em> &rarr; <em>Security</em> &rarr; <em>Use Secure DNS</em> &rarr; Select <em>Custom</em> &rarr; Paste <code>https://${host}/dns-query</code></li>
        <li><strong>Mozilla Firefox:</strong> Go to <em>Settings</em> &rarr; <em>Privacy & Security</em> &rarr; <em>DNS over HTTPS</em> &rarr; <em>Max Protection</em> &rarr; Select <em>Custom</em> &rarr; Paste <code>https://${host}/dns-query</code></li>
        <li><strong>Apple iOS / macOS:</strong> Generate an Apple mobileconfig profile using this endpoint or use DNSCrypt/AdGuard apps.</li>
        <li><strong>Windows 11:</strong> Go to <em>Settings</em> &rarr; <em>Network & Internet</em> &rarr; <em>Hardware Properties</em> &rarr; <em>DNS Server Assignment</em> &rarr; Enable <em>DNS over HTTPS</em>.</li>
      </ol>
    </div>

    <footer>
      Profile ID: <code>${profileId}</code> &bull; Powered by Cloudflare Edge & NextDNS
    </footer>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  });
}
