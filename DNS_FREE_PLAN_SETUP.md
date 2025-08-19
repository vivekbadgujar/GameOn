# DNS Configuration for Vercel Free Plan Deployment

This guide provides step-by-step DNS configuration for your GameOn Platform custom domains on Vercel's free plan.

## 🎯 Domain Structure

- **Frontend**: `gameonesport.xyz` → Vercel (Static Export)
- **Admin Panel**: `admin.gameonesport.xyz` → Vercel (Static Export)
- **Backend API**: `api.gameonesport.xyz` → Render (Existing)

## 🌐 DNS Records Configuration

### Required DNS Records

Add these records to your domain registrar's DNS management:

```dns
# Main domain (Frontend)
Type: A
Name: @
Value: 76.76.19.61
TTL: 300

# www subdomain (Frontend redirect)
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 300

# Admin subdomain (Admin Panel)
Type: CNAME
Name: admin
Value: cname.vercel-dns.com
TTL: 300

# API subdomain (Backend - already configured)
Type: CNAME
Name: api
Value: [your-render-service].onrender.com
TTL: 300
```

## 🔧 Step-by-Step Configuration

### Step 1: Deploy to Vercel First

Before configuring DNS, ensure your projects are deployed:

```powershell
# Deploy both projects
.\deploy-vercel-free.ps1
```

### Step 2: Add Custom Domains in Vercel

#### Frontend Domain Setup
1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your **frontend project**
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `gameonesport.xyz`
6. Click **Add**
7. Add redirect domain: `www.gameonesport.xyz` → `gameonesport.xyz`

#### Admin Panel Domain Setup
1. Select your **admin panel project** in Vercel Dashboard
2. Go to **Settings** → **Domains**
3. Click **Add Domain**
4. Enter: `admin.gameonesport.xyz`
5. Click **Add**

### Step 3: Configure DNS Records

#### For Namecheap Users

1. **Login to Namecheap**
2. Go to **Domain List** → **Manage**
3. Click **Advanced DNS** tab
4. **Delete existing records** (if any) for @, www, admin
5. **Add new records**:

```dns
Type: A Record
Host: @
Value: 76.76.19.61
TTL: 5 min

Type: CNAME Record
Host: www
Value: cname.vercel-dns.com
TTL: 5 min

Type: CNAME Record
Host: admin
Value: cname.vercel-dns.com
TTL: 5 min
```

#### For GoDaddy Users

1. **Login to GoDaddy**
2. Go to **My Products** → **DNS**
3. Click **Manage Zones**
4. Select your domain
5. **Add/Edit records**:

```dns
Type: A
Name: @
Value: 76.76.19.61
TTL: 600

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600

Type: CNAME
Name: admin
Value: cname.vercel-dns.com
TTL: 600
```

#### For Cloudflare Users

1. **Login to Cloudflare**
2. Select your domain
3. Go to **DNS** → **Records**
4. **Add records** (set proxy status to "DNS only" initially):

```dns
Type: A
Name: @
IPv4 address: 76.76.19.61
Proxy status: DNS only
TTL: Auto

Type: CNAME
Name: www
Target: cname.vercel-dns.com
Proxy status: DNS only
TTL: Auto

Type: CNAME
Name: admin
Target: cname.vercel-dns.com
Proxy status: DNS only
TTL: Auto
```

#### For Other Registrars

The general pattern for any DNS provider:

1. **A Record**: `@` → `76.76.19.61`
2. **CNAME Record**: `www` → `cname.vercel-dns.com`
3. **CNAME Record**: `admin` → `cname.vercel-dns.com`

## ⏱️ DNS Propagation

### Expected Timeframes
- **Minimum**: 15 minutes
- **Typical**: 2-4 hours
- **Maximum**: 48 hours (rare)

### Check Propagation Status

```powershell
# Check main domain
nslookup gameonesport.xyz

# Check admin subdomain
nslookup admin.gameonesport.xyz

# Check with specific DNS servers
nslookup gameonesport.xyz 8.8.8.8
nslookup admin.gameonesport.xyz 1.1.1.1
```

### Online DNS Checkers
- **WhatsMyDNS**: https://www.whatsmydns.net/
- **DNS Checker**: https://dnschecker.org/
- **DNS Propagation**: https://www.dnspropagation.net/

## 🔒 SSL Certificate Provisioning

### Automatic SSL (Vercel)
Once DNS propagates, Vercel automatically:

1. **Detects DNS Configuration**: Verifies domain points to Vercel
2. **Requests SSL Certificate**: From Let's Encrypt
3. **Installs Certificate**: Automatically on all edge locations
4. **Enables HTTPS**: Redirects HTTP to HTTPS

### SSL Status Check
1. **Vercel Dashboard** → Project → Settings → Domains
2. Look for **SSL Certificate** status
3. Should show "Active" with green checkmark

### Manual SSL Verification

```powershell
# Check SSL certificate
curl -I https://gameonesport.xyz
curl -I https://admin.gameonesport.xyz

# Detailed SSL info
openssl s_client -connect gameonesport.xyz:443 -servername gameonesport.xyz
```

## 🧪 Testing and Verification

### Step 1: DNS Resolution Test

```powershell
# Should return 76.76.19.61
nslookup gameonesport.xyz

# Should return Vercel CNAME
nslookup admin.gameonesport.xyz

# Should return your Render service
nslookup api.gameonesport.xyz
```

### Step 2: HTTP/HTTPS Test

```powershell
# Should redirect to HTTPS
curl -I http://gameonesport.xyz

# Should return 200 OK
curl -I https://gameonesport.xyz
curl -I https://admin.gameonesport.xyz
```

### Step 3: Browser Test

1. **Frontend**: Visit `https://gameonesport.xyz`
   - Should load your GameOn frontend
   - Check for SSL certificate (🔒 icon)
   - Test user registration/login

2. **Admin Panel**: Visit `https://admin.gameonesport.xyz`
   - Should load your admin dashboard
   - Check for SSL certificate (🔒 icon)
   - Test admin login

3. **API**: Visit `https://api.gameonesport.xyz/api/health`
   - Should return API health status
   - Check for SSL certificate (🔒 icon)

## 🚨 Troubleshooting DNS Issues

### Common Problems and Solutions

#### 1. DNS Not Propagating
```powershell
# Clear local DNS cache
ipconfig /flushdns

# Use different DNS servers for testing
nslookup gameonesport.xyz 8.8.8.8
nslookup gameonesport.xyz 1.1.1.1
```

#### 2. SSL Certificate Not Provisioning
- **Wait 24 hours** for automatic provisioning
- **Check DNS records** are pointing to Vercel correctly
- **Remove and re-add domain** in Vercel Dashboard
- **Contact Vercel support** if issues persist

#### 3. Domain Shows "Not Found"
- **Verify DNS records** are correct
- **Check domain spelling** in Vercel Dashboard
- **Ensure domain is not expired**
- **Wait for DNS propagation**

#### 4. Redirect Loops
- **Check CNAME records** point to `cname.vercel-dns.com`
- **Verify A record** points to `76.76.19.61`
- **Clear browser cache** and cookies

#### 5. Mixed Content Warnings
- **Ensure all resources** use HTTPS URLs
- **Check API calls** use `https://api.gameonesport.xyz`
- **Update any hardcoded HTTP URLs**

### Debug Commands

```powershell
# Comprehensive DNS check
nslookup -type=A gameonesport.xyz
nslookup -type=CNAME www.gameonesport.xyz
nslookup -type=CNAME admin.gameonesport.xyz

# Trace DNS resolution
nslookup -debug gameonesport.xyz

# Check HTTP headers
curl -v https://gameonesport.xyz
```

## 📊 Monitoring and Maintenance

### Regular Checks
- **Monthly**: Verify SSL certificates are valid
- **Quarterly**: Check DNS record accuracy
- **Annually**: Renew domain registration

### Monitoring Tools
- **Vercel Dashboard**: Domain and SSL status
- **DNS Monitoring**: Set up alerts for DNS changes
- **SSL Monitoring**: Monitor certificate expiration

### Backup DNS Configuration
Document your DNS settings:

```dns
# Backup DNS Configuration for gameonesport.xyz
@ A 76.76.19.61
www CNAME cname.vercel-dns.com
admin CNAME cname.vercel-dns.com
api CNAME [your-render-service].onrender.com
```

## ✅ Final Verification Checklist

### DNS Configuration
- [ ] A record for @ pointing to 76.76.19.61
- [ ] CNAME record for www pointing to cname.vercel-dns.com
- [ ] CNAME record for admin pointing to cname.vercel-dns.com
- [ ] DNS propagation completed

### Vercel Configuration
- [ ] Custom domains added in Vercel Dashboard
- [ ] SSL certificates active and valid
- [ ] Domains showing "Active" status
- [ ] No configuration errors

### Functionality Testing
- [ ] Frontend loads at https://gameonesport.xyz
- [ ] Admin panel loads at https://admin.gameonesport.xyz
- [ ] API accessible at https://api.gameonesport.xyz
- [ ] All SSL certificates valid
- [ ] No mixed content warnings
- [ ] Payment integration working

---

## 🎉 DNS Configuration Complete!

Your custom domains are now properly configured for Vercel free plan deployment:

- **✅ Frontend**: https://gameonesport.xyz
- **✅ Admin Panel**: https://admin.gameonesport.xyz
- **✅ Backend API**: https://api.gameonesport.xyz
- **✅ SSL Certificates**: Automatic and active
- **✅ Global CDN**: Fast delivery worldwide

Your GameOn Platform is now live with professional custom domains! 🚀