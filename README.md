# NextDNS Cloudflare Worker Gateway

Custom branded DNS-over-HTTPS (DoH) resolver powered by **Cloudflare Workers** with **NextDNS** as the filtering backend.

Allows you to use your own domain (e.g. `https://dns.yourdomain.com/dns-query`) for ad-blocking and privacy filtering while hiding the raw NextDNS endpoint.

---

## Features

- **Custom Domain Branding**: Use your own domain (e.g., `https://dns.yourdomain.com/dns-query`).
- **RFC 8484 Compliant**: Compatible with Chrome, Firefox, Safari, Brave, Edge, Windows 11, iOS, and Android DoH clients.
- **Device Identification**: Append device names in URLs (e.g., `https://dns.yourdomain.com/dns-query/Laptop`) to separate logs and analytics in your NextDNS dashboard.
- **Client IP Preservation**: Forwards `CF-Connecting-IP` via `X-Forwarded-For` so NextDNS location and profile routing work accurately.
- **Built-in Landing Page**: Visiting the root URL (`https://dns.yourdomain.com/`) serves a web status dashboard and setup instructions.
- **Zero Server Costs**: Runs entirely on Cloudflare Workers' free tier (100,000 requests/day).

---

## Deployment Options

### Option A: Via Cloudflare Dashboard (Quickest)

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com) &rarr; **Compute (Workers & Pages)**.
2. Click **Create Application** &rarr; **Create Worker**.
3. Name it `nextdns-doh-gateway` and click **Deploy**.
4. Click **Edit Code**, replace the entire contents of `worker.js` with [src/worker.js](src/worker.js), and click **Save and Deploy**.
5. Go to **Settings** &rarr; **Variables** &rarr; Add Environment Variable:
   - Variable Name: `NEXTDNS_PROFILE_ID`
   - Value: `3c22d8` (or your profile ID)
6. Go to **Settings** &rarr; **Domains & Routes** &rarr; **Add Custom Domain**:
   - Enter your subdomain: `dns.yourdomain.com`
   - Cloudflare will automatically provision the DNS record and SSL certificate!

---

### Option B: Deploy with Wrangler CLI

1. Clone this repository:
   ```bash
   git clone https://github.com/talentlessmoll/nextdns-cloudflare-worker.git
   cd nextdns-cloudflare-worker
   ```

2. Login to Cloudflare:
   ```bash
   npx wrangler login
   ```

3. (Optional) Check or update profile ID in `wrangler.toml`:
   ```toml
   [vars]
   NEXTDNS_PROFILE_ID = "3c22d8"
   ```

4. Deploy:
   ```bash
   npx wrangler deploy
   ```

---

## Setting Up Your Devices

### 1. Google Chrome / Brave / Microsoft Edge
1. Open **Settings** &rarr; **Privacy and security** &rarr; **Security**.
2. Scroll to **Use secure DNS**.
3. Select **With: Custom** and enter:
   ```text
   https://dns.yourdomain.com/dns-query
   ```

### 2. Mozilla Firefox
1. Open **Settings** &rarr; **Privacy & Security**.
2. Scroll down to **DNS over HTTPS**.
3. Select **Max Protection** &rarr; choose **Custom** &rarr; enter:
   ```text
   https://dns.yourdomain.com/dns-query
   ```

### 3. Identify Devices in NextDNS Logs
To give a device a specific name in your NextDNS logs, append the device name to the URL:
```text
https://dns.yourdomain.com/dns-query/Pixel8
https://dns.yourdomain.com/dns-query/MacBookPro
```

---

## License

MIT
