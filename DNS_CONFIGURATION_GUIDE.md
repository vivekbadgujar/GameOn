# DNS Configuration Guide for GameOn Platform

This guide provides the exact DNS records needed to configure your `gameonesport.xyz` domain for the GameOn Platform.

## 🌐 Domain Structure

- **Main Frontend**: `gameonesport.xyz` → Vercel
- **Admin Panel**: `admin.gameonesport.xyz` → Vercel  
- **Backend API**: `api.gameonesport.xyz` → Render

## 📋 DNS Records Configuration

### Step 1: Frontend Domain (gameonesport.xyz)

**For Vercel Deployment:**

```dns
Type: A
Name: @
Value: 76.76.19.61
TTL: 300

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
TTL: 300
```

### Step 2: Admin Panel (admin.gameonesport.xyz)

**For Vercel Deployment:**

```dns
Type: CNAME
Name: admin
Value: cname.vercel-dns.com
TTL: 300
```

### Step 3: Backend API (api.gameonesport.xyz)

**For Render Deployment:**

```dns
Type: CNAME
Name: api
Value: [Your Render CNAME - get this from Render dashboard]
TTL: 300
```

> **Note**: The Render CNAME value will be provided in your Render service dashboard under "Custom Domains". It typically looks like: `your-service-name.onrender.com`

## 🔧 Provider-Specific Instructions

### Namecheap

1. Login to Namecheap account
2. Go to Domain List → Manage → Advanced DNS
3. Add the records as shown above
4. Save changes

### GoDaddy

1. Login to GoDaddy account
2. Go to My Products → DNS → Manage Zones
3. Select your domain
4. Add the records as shown above
5. Save changes

### Cloudflare

1. Login to Cloudflare account
2. Select your domain
3. Go to DNS → Records
4. Add the records as shown above
5. Ensure proxy status is appropriate:
   - **Frontend/Admin**: Can be proxied (orange cloud)
   - **API**: Should be DNS only (gray cloud) initially

### Google Domains

1. Login to Google Domains
2. Select your domain
3. Go to DNS → Custom records
4. Add the records as shown above
5. Save changes

## ⏱️ Propagation Time

- **Typical**: 15 minutes to 2 hours
- **Maximum**: Up to 48 hours
- **Check status**: Use tools like `nslookup` or online DNS checkers

## 🧪 Verification Commands

### Check DNS Propagation

```bash
# Check main domain
nslookup gameonesport.xyz

# Check admin subdomain  
nslookup admin.gameonesport.xyz

# Check API subdomain
nslookup api.gameonesport.xyz
```

### Test HTTPS Access

```bash
# Test frontend
curl -I https://gameonesport.xyz

# Test admin panel
curl -I https://admin.gameonesport.xyz

# Test API
curl -I https://api.gameonesport.xyz/api/health
```

## 🔒 SSL Certificate Verification

All platforms (Vercel and Render) automatically provision SSL certificates:

1. **Vercel**: Automatic SSL via Let's Encrypt
2. **Render**: Automatic SSL via Let's Encrypt

Verify SSL is working:
- Look for 🔒 icon in browser address bar
- Certificate should be valid and trusted
- No mixed content warnings

## 🚨 Troubleshooting

### Common Issues:

1. **DNS Not Propagating**:
   - Wait longer (up to 48 hours)
   - Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
   - Try different DNS servers (8.8.8.8, 1.1.1.1)

2. **SSL Certificate Issues**:
   - Wait for automatic provisioning (can take up to 24 hours)
   - Verify DNS records are correct
   - Contact platform support if issues persist

3. **CNAME Conflicts**:
   - Remove any existing A records for subdomains when adding CNAME
   - Ensure no duplicate records exist

4. **Render CNAME Not Working**:
   - Verify the CNAME value from Render dashboard
   - Ensure custom domain is added in Render service settings
   - Check Render service is deployed and running

## 📞 Support Resources

- **Vercel DNS Help**: [Vercel Domains Documentation](https://vercel.com/docs/concepts/projects/domains)
- **Render DNS Help**: [Render Custom Domains](https://render.com/docs/custom-domains)
- **DNS Checker Tool**: [whatsmydns.net](https://www.whatsmydns.net/)
- **SSL Checker Tool**: [ssllabs.com](https://www.ssllabs.com/ssltest/)

## ✅ Final Verification Checklist

- [ ] `https://gameonesport.xyz` loads frontend
- [ ] `https://admin.gameonesport.xyz` loads admin panel
- [ ] `https://api.gameonesport.xyz/api/health` returns API health status
- [ ] All domains show valid SSL certificates
- [ ] No mixed content warnings
- [ ] Real-time features work (WebSocket connections)
- [ ] Payment integration functional

---

**🎉 Once all DNS records are configured and propagated, your GameOn Platform will be fully accessible via custom domains!**