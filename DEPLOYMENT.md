# 🚀 TikTok Analytics Deployment Guide

Deploy your TikTok analytics app to `analytics.tryfleur.com` using your DigitalOcean VPS.

## 📋 Prerequisites

- ✅ DigitalOcean VPS (Ubuntu 20.04+)
- ✅ Domain: `tryfleur.com` managed by Namecheap
- ✅ TikTok API credentials
- ✅ SSH access to your VPS

## 🌐 Step 1: DNS Configuration (Namecheap)

### In Namecheap DNS Management:

1. **Go to**: Domain List → Manage → Advanced DNS
2. **Add A Record**:
   - **Type**: A Record
   - **Host**: `analytics`
   - **Value**: `YOUR_DROPLET_IP` (your DigitalOcean VPS IP)
   - **TTL**: Automatic (or 300)

3. **Optional CNAME** (for www):
   - **Type**: CNAME Record  
   - **Host**: `www.analytics`
   - **Value**: `analytics.tryfleur.com`
   - **TTL**: Automatic

**Result**: Only `analytics.tryfleur.com` routes to your VPS, main domain stays with Shopify.

---

## 🖥️ Step 2: VPS Setup

### Connect to your VPS:
```bash
# Use your existing user account
ssh jcrowe85@YOUR_DROPLET_IP
```

### Upload your code:
```bash
# Option A: Git clone (if you have a repo)
git clone https://github.com/yourusername/tiktok-analytics.git
cd tiktok-analytics

# Option B: SCP upload (from your local machine)
# scp -r /path/to/tiktok-analytics jcrowe85@YOUR_DROPLET_IP:/home/jcrowe85/
```

### Run deployment script:
```bash
# Make executable
chmod +x deploy.sh

# Run initial setup
./deploy.sh

# Setup SSL certificate
./deploy.sh setup-ssl

# Deploy the application
./deploy.sh deploy
```

---

## 🔧 Step 3: Environment Configuration

### Copy environment file:
```bash
cp env.production.example .env
nano .env
```

### Fill in your values:
```env
TIKTOK_CLIENT_KEY=your_actual_client_key
TIKTOK_CLIENT_SECRET=your_actual_client_secret
TIKTOK_REDIRECT_URI=https://analytics.tryfleur.com/callback
```

### Authenticate with TikTok:
```bash
# This will open a browser for OAuth
npm run auth
```

---

## 🚀 Step 4: Deploy

### Build and start:
```bash
docker-compose up -d
```

### Check status:
```bash
docker-compose ps
docker-compose logs -f
```

### Test your deployment:
```bash
curl https://analytics.tryfleur.com/api/health
```

---

## 🔒 Step 5: SSL Certificate (Automatic)

The deployment script automatically:
- ✅ Installs Let's Encrypt
- ✅ Gets SSL certificate for `analytics.tryfleur.com`
- ✅ Sets up auto-renewal
- ✅ Configures nginx with HTTPS

---

## 📊 Step 6: Automation Setup

### Daily data fetching:
```bash
# Already configured by deploy script
crontab -l  # View cron jobs
```

### Manual fetch:
```bash
docker-compose exec tiktok-analytics npm run fetch
```

---

## 🛠️ Management Commands

### View logs:
```bash
docker-compose logs -f tiktok-analytics
docker-compose logs -f nginx
```

### Restart services:
```bash
docker-compose restart
```

### Update application:
```bash
git pull
docker-compose build
docker-compose up -d
```

### Stop services:
```bash
docker-compose down
```

---

## 🔍 Troubleshooting

### Check DNS propagation:
```bash
nslookup analytics.tryfleur.com
dig analytics.tryfleur.com
```

### Check SSL certificate:
```bash
openssl s_client -connect analytics.tryfleur.com:443 -servername analytics.tryfleur.com
```

### Check nginx config:
```bash
docker-compose exec nginx nginx -t
```

### View all containers:
```bash
docker ps -a
```

---

## 📈 Monitoring

### Health check endpoint:
```
https://analytics.tryfleur.com/api/health
```

### Application logs:
```bash
tail -f logs/cron.log
```

### System resources:
```bash
htop
df -h
free -h
```

---

## 🔄 Updates

### To update your app:
1. **Pull latest code**: `git pull`
2. **Rebuild**: `docker-compose build`
3. **Restart**: `docker-compose up -d`

### To update dependencies:
1. **Update package.json**
2. **Rebuild**: `docker-compose build --no-cache`
3. **Restart**: `docker-compose up -d`

---

## 🎯 Final Result

After deployment, you'll have:
- ✅ **Live app**: `https://analytics.tryfleur.com`
- ✅ **SSL certificate**: Auto-renewing
- ✅ **Daily automation**: Data fetches at 9 AM
- ✅ **Monitoring**: Health checks and logs
- ✅ **Scalable**: Docker-based deployment

Your TikTok analytics will be live and automatically updating! 🎉
