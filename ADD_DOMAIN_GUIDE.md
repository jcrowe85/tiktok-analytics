# Adding tiktokinsights.ai Domain to TikTok Analytics

## ✅ Prerequisites
- Domain DNS A record pointing to your VPS IP
- Root/sudo access to your VPS
- Docker running on VPS

---

## 📝 Step-by-Step Instructions

### **Step 1: Point DNS to Your VPS**

Before starting, make sure these DNS records are set up:

```
Type: A
Name: @
Value: YOUR_VPS_IP
TTL: 3600

Type: A
Name: www
Value: YOUR_VPS_IP
TTL: 3600
```

Wait for DNS propagation (can take 5-60 minutes). Test with:
```bash
nslookup tiktokinsights.ai
nslookup www.tiktokinsights.ai
```

---

### **Step 2: Deploy Updated nginx-simple.conf to VPS**

On your **local machine**, push the changes:
```bash
cd ~/Desktop/web-projects/tiktok-analytics
git add nginx-simple.conf
git commit -m "Add tiktokinsights.ai domain to nginx config"
git push origin main
```

On your **VPS**, pull the changes:
```bash
cd ~/tiktok-analytics
git pull origin main
```

---

### **Step 3: Obtain SSL Certificate (VPS)**

On your **VPS**, run:

```bash
# Stop nginx to free up port 80 for certbot
sudo systemctl stop nginx

# Obtain certificate for tiktokinsights.ai (with www)
sudo certbot certonly --standalone \
  -d tiktokinsights.ai \
  -d www.tiktokinsights.ai \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# Restart nginx
sudo systemctl start nginx
```

**Note**: Replace `your-email@example.com` with your actual email.

---

### **Step 4: Update docker-compose.yml SSL Mounts (VPS)**

On your **VPS**, edit the docker-compose.yml:

```bash
cd ~/tiktok-analytics
nano docker-compose.yml
```

Find the `nginx:` service volumes section (around line 182-185) and update it:

**BEFORE:**
```yaml
    volumes:
      - ./nginx-simple.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt/archive/analytics.tryfleur.com/fullchain1.pem:/etc/nginx/ssl/cert.pem:ro
      - /etc/letsencrypt/archive/analytics.tryfleur.com/privkey1.pem:/etc/nginx/ssl/key.pem:ro
```

**AFTER:**
```yaml
    volumes:
      - ./nginx-simple.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt/live/tiktokinsights.ai/fullchain.pem:/etc/nginx/ssl/cert.pem:ro
      - /etc/letsencrypt/live/tiktokinsights.ai/privkey.pem:/etc/nginx/ssl/key.pem:ro
```

**💡 Why this change?**
- Using `/live/` instead of `/archive/` - Let's Encrypt manages symlinks automatically
- Using `tiktokinsights.ai` certificate which includes both `tiktokinsights.ai` and `www.tiktokinsights.ai`

Save and exit (Ctrl+X, then Y, then Enter).

---

### **Step 5: Create Host Nginx Reverse Proxy Config (VPS)**

On your **VPS**, create a new nginx config:

```bash
sudo nano /etc/nginx/sites-available/tiktokinsights.ai.conf
```

Paste this configuration:

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name tiktokinsights.ai www.tiktokinsights.ai;
    
    # Allow Let's Encrypt challenges
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect everything else to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS - Reverse Proxy to Docker
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tiktokinsights.ai www.tiktokinsights.ai;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/tiktokinsights.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tiktokinsights.ai/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Proxy to Docker nginx container
    location / {
        proxy_pass https://localhost:8443;
        proxy_ssl_verify off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Save and exit (Ctrl+X, then Y, then Enter).

---

### **Step 6: Enable the Site and Test Config (VPS)**

```bash
# Create symlink to enable the site
sudo ln -s /etc/nginx/sites-available/tiktokinsights.ai.conf /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

---

### **Step 7: Restart Docker Containers (VPS)**

```bash
cd ~/tiktok-analytics

# Stop containers
docker-compose down

# Start containers with new configuration
docker-compose up -d

# Check if containers are running
docker ps

# Check nginx container logs for any errors
docker logs tiktok-analytics-nginx
```

---

### **Step 8: Verify Everything Works**

1. **Test HTTP redirect:**
   ```bash
   curl -I http://tiktokinsights.ai
   # Should return 301 redirect to HTTPS
   ```

2. **Test HTTPS:**
   ```bash
   curl -I https://tiktokinsights.ai
   # Should return 200 OK
   ```

3. **Open in browser:**
   - https://tiktokinsights.ai
   - https://www.tiktokinsights.ai
   - Both should work and show your TikTok Analytics site

4. **Check SSL certificate:**
   ```bash
   echo | openssl s_client -connect tiktokinsights.ai:443 -servername tiktokinsights.ai 2>/dev/null | openssl x509 -noout -dates
   ```

---

## 🔧 Troubleshooting

### **Issue: DNS not resolving**
```bash
# Check DNS propagation
nslookup tiktokinsights.ai
dig tiktokinsights.ai
```
**Solution**: Wait for DNS propagation (5-60 minutes)

### **Issue: SSL certificate error**
```bash
# Check if certificate was obtained
sudo ls -la /etc/letsencrypt/live/tiktokinsights.ai/

# Check certificate details
sudo certbot certificates
```
**Solution**: Re-run certbot command from Step 3

### **Issue: 502 Bad Gateway**
```bash
# Check if Docker containers are running
docker ps

# Check nginx container logs
docker logs tiktok-analytics-nginx

# Check main app container logs
docker logs tiktok-analytics
```
**Solution**: Restart Docker containers (Step 7)

### **Issue: Port conflict**
```bash
# Check what's using port 8443
sudo netstat -tlnp | grep 8443
```
**Solution**: Make sure no other service is using ports 8080 or 8443

### **Issue: Host nginx can't connect to Docker nginx**
```bash
# Test if Docker nginx is accessible
curl -k https://localhost:8443

# Check Docker network
docker network ls
docker network inspect tiktok-analytics_default
```

---

## 📊 SSL Certificate Auto-Renewal

Certbot should auto-renew certificates. To test:

```bash
# Dry run renewal
sudo certbot renew --dry-run

# Check auto-renewal timer
sudo systemctl status certbot.timer
```

---

## 🔄 Keeping Both Domains

Your site will now be accessible from:
- ✅ https://analytics.tryfleur.com (original)
- ✅ https://tiktokinsights.ai (new)
- ✅ https://www.tiktokinsights.ai (new with www)

All domains will serve the same TikTok Analytics application.

---

## 📝 Summary of Changed Files

### Local Files (committed to Git):
- ✅ `nginx-simple.conf` - Added tiktokinsights.ai to server_name

### VPS Files:
- ✅ `docker-compose.yml` - Updated SSL certificate mounts
- ✅ `/etc/nginx/sites-available/tiktokinsights.ai.conf` - New host nginx config
- ✅ `/etc/letsencrypt/live/tiktokinsights.ai/` - New SSL certificates

---

## 🎉 Success Checklist

- [ ] DNS A records created and propagated
- [ ] Local nginx-simple.conf updated and pushed to Git
- [ ] VPS code pulled from Git
- [ ] SSL certificate obtained for tiktokinsights.ai
- [ ] docker-compose.yml updated with new SSL paths
- [ ] Host nginx config created for tiktokinsights.ai
- [ ] Host nginx config enabled and reloaded
- [ ] Docker containers restarted
- [ ] Site accessible at https://tiktokinsights.ai
- [ ] Site accessible at https://www.tiktokinsights.ai
- [ ] Original domain still works: https://analytics.tryfleur.com

---

## 💡 Notes

- The Docker nginx container now uses the tiktokinsights.ai certificate for all domains
- The host nginx (on VPS) reverse proxies to Docker on port 8443
- Both domains will continue to work
- SSL certificates will auto-renew via certbot

