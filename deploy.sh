#!/bin/bash

# TikTok Analytics Deployment Script
# Run this on your DigitalOcean VPS

set -e

echo "🚀 TikTok Analytics Deployment"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="tiktok-analytics"
APP_DIR="/home/jcrowe85/$APP_NAME"
DOMAIN="analytics.tryfleur.com"

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "   App Name: $APP_NAME"
echo "   Domain: $DOMAIN"
echo "   Directory: $APP_DIR"
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ Don't run this script as root. Use your regular user account.${NC}"
   echo "   Run: su - jcrowe85"
   exit 1
fi

# Update system
echo -e "${YELLOW}🔄 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}🐳 Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker installed. Please log out and back in for group changes.${NC}"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}🐳 Installing Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create app directory
echo -e "${YELLOW}📁 Creating application directory...${NC}"
mkdir -p $APP_DIR

# Install Node.js (for building)
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 Installing PM2...${NC}"
    sudo npm install -g pm2
fi

# Create SSL directory
mkdir -p $APP_DIR/ssl

echo -e "${GREEN}✅ System setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Upload your code to $APP_DIR"
echo "2. Copy your .env file to $APP_DIR"
echo "3. Run: ./deploy.sh setup-ssl"
echo "4. Run: ./deploy.sh deploy"
echo ""
echo -e "${YELLOW}📋 Manual SSL Setup (if not using Let's Encrypt):${NC}"
echo "   Place your SSL certificate as: $APP_DIR/ssl/cert.pem"
echo "   Place your SSL key as: $APP_DIR/ssl/key.pem"
echo ""

# Function to setup SSL with Let's Encrypt
setup_ssl() {
    echo -e "${YELLOW}🔒 Setting up SSL with Let's Encrypt...${NC}"
    
    # Install certbot
    sudo apt install -y certbot
    
    # Get SSL certificate
    sudo certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@tryfleur.com
    
    # Copy certificates
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $APP_DIR/ssl/cert.pem
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $APP_DIR/ssl/key.pem
    sudo chown $USER:$USER $APP_DIR/ssl/*
    
    # Setup auto-renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $APP_DIR/ssl/cert.pem && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $APP_DIR/ssl/key.pem && docker-compose -f $APP_DIR/docker-compose.yml restart nginx" | sudo crontab -
    
    echo -e "${GREEN}✅ SSL setup complete!${NC}"
}

# Function to deploy the application
deploy() {
    echo -e "${YELLOW}🚀 Deploying application...${NC}"
    
    cd $APP_DIR
    
    # Build and start with Docker Compose
    docker-compose down || true
    docker-compose build --no-cache
    docker-compose up -d
    
    # Setup cron job for data fetching
    echo "0 9 * * * cd $APP_DIR && docker-compose exec -T tiktok-analytics npm run fetch" | crontab -
    
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo ""
    echo -e "${YELLOW}🌐 Your app should be available at: https://$DOMAIN${NC}"
    echo -e "${YELLOW}📊 Health check: https://$DOMAIN/api/health${NC}"
    echo ""
    echo -e "${YELLOW}📋 Useful commands:${NC}"
    echo "   View logs: docker-compose logs -f"
    echo "   Restart: docker-compose restart"
    echo "   Stop: docker-compose down"
    echo "   Update: git pull && docker-compose build && docker-compose up -d"
}

# Handle command line arguments
case "${1:-}" in
    "setup-ssl")
        setup_ssl
        ;;
    "deploy")
        deploy
        ;;
    *)
        echo "Usage: $0 [setup-ssl|deploy]"
        echo ""
        echo "Commands:"
        echo "  setup-ssl  - Setup SSL certificate with Let's Encrypt"
        echo "  deploy     - Deploy the application"
        ;;
esac
