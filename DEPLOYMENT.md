# DigitalOcean Deployment Guide for Nexus Ai

This guide will help you deploy Nexus Ai on DigitalOcean using Docker containers.

## Prerequisites

- DigitalOcean account
- Docker installed locally (for testing)
- Domain name (optional, for custom domain)

## Deployment Options

### Option 1: DigitalOcean App Platform (Recommended)

1. **Prepare your repository:**
   ```bash
   git push origin main
   ```

2. **Create a new App on DigitalOcean:**
   - Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Connect your GitHub repository
   - Select the branch (main)

3. **Configure the app:**
   - App Name: `nexus-ai`
   - Region: Choose closest to your users
   - Plan: Basic ($5/month) or higher depending on needs

4. **Set environment variables:**
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nexusai
   JWT_SECRET=your_super_secret_jwt_key
   GEMINI_API_KEY=your_gemini_api_key
   PERPLEXITY_API_KEY=your_perplexity_api_key
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   CORS_ORIGIN=https://your-app-name.ondigitalocean.app
   REACT_APP_API_URL=https://your-app-name.ondigitalocean.app/api
   ```

5. **Deploy:**
   - Click "Create Resources"
   - Wait for deployment to complete

### Option 2: DigitalOcean Droplet with Docker

1. **Create a Droplet:**
   - Choose Ubuntu 22.04 LTS
   - Size: Basic plan ($6/month minimum)
   - Add your SSH key

2. **Connect to your Droplet:**
   ```bash
   ssh root@your_droplet_ip
   ```

3. **Install Docker and Docker Compose:**
   ```bash
   apt update
   apt install -y docker.io docker-compose
   systemctl start docker
   systemctl enable docker
   ```

4. **Clone your repository:**
   ```bash
   git clone https://github.com/DenxVil/NexusAi.git
   cd NexusAi
   ```

5. **Create environment file:**
   ```bash
   cp server/.env.example .env
   nano .env
   ```

   Add your configuration:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb://mongo:27017/nexusai
   JWT_SECRET=your_super_secret_jwt_key
   GEMINI_API_KEY=your_gemini_api_key
   PERPLEXITY_API_KEY=your_perplexity_api_key
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   CORS_ORIGIN=http://your_droplet_ip:5000
   REACT_APP_API_URL=http://your_droplet_ip:5000/api
   MONGO_ROOT_USERNAME=admin
   MONGO_ROOT_PASSWORD=secure_password
   ```

6. **Start the application:**
   ```bash
   docker-compose up -d
   ```

7. **Configure firewall:**
   ```bash
   ufw allow OpenSSH
   ufw allow 5000
   ufw enable
   ```

## Database Setup

### Option A: MongoDB Atlas (Recommended)
1. Create a free MongoDB Atlas cluster
2. Get connection string
3. Use it in MONGODB_URI environment variable

### Option B: Local MongoDB (with Docker Compose)
- MongoDB is included in the docker-compose.yml
- Data persists in Docker volumes
- Accessible at mongodb://mongo:27017

## SSL/HTTPS Setup

### With DigitalOcean App Platform
- SSL is automatically provided
- Custom domains supported

### With Droplet + Nginx
1. **Install Nginx:**
   ```bash
   apt install -y nginx certbot python3-certbot-nginx
   ```

2. **Configure Nginx:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Get SSL certificate:**
   ```bash
   certbot --nginx -d your-domain.com
   ```

## Monitoring and Maintenance

### Health Checks
- Health endpoint available at `/health`
- Docker health checks configured
- Monitor logs: `docker-compose logs -f`

### Backups
```bash
# Backup MongoDB
docker-compose exec mongo mongodump --db nexusai --out /backup

# Backup to host
docker cp container_name:/backup ./backup
```

### Updates
```bash
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   docker-compose down
   lsof -i :5000
   kill -9 PID
   ```

2. **Memory issues:**
   - Upgrade to larger Droplet
   - Add swap space

3. **Database connection:**
   - Check MongoDB URI
   - Verify network connectivity
   - Check firewall rules

### Logs
```bash
# Application logs
docker-compose logs app

# MongoDB logs
docker-compose logs mongo

# All services
docker-compose logs
```

## Security Best Practices

1. **Use strong passwords**
2. **Keep environment variables secure**
3. **Regular updates**
4. **Monitor logs for suspicious activity**
5. **Use HTTPS in production**
6. **Configure proper CORS origins**

## Cost Estimation

### DigitalOcean App Platform
- Basic plan: $5/month
- Professional: $12/month (recommended for production)

### Droplet + Managed Database
- Basic Droplet: $6/month
- Managed MongoDB: $15/month
- Total: ~$21/month

## Support

For deployment issues, contact:
- Telegram: [@xDenvil_bot](https://t.me/xDenvil_bot)
- Email: [NexusAisupport@gmail.com](mailto:NexusAisupport@gmail.com)

---

*Created by ◉Ɗєиνιℓ*