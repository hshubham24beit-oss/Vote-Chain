# VoteChain Deployment Guide

## 🚀 Deployment Options

### 1. **Heroku (Recommended for beginners)**

#### Setup Steps:
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create Heroku app
heroku create your-votechain-app

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set ADMIN_KEY=your-secure-admin-key-here

# Deploy
git add .
git commit -m "Deploy VoteChain"
git push heroku main
```

#### Procfile:
```
web: node server.js
```

### 2. **Railway**

#### Setup:
1. Connect GitHub repository to Railway
2. Set environment variables:
   - `NODE_ENV=production`
   - `ADMIN_KEY=your-secure-key`
3. Railway auto-deploys on git push

### 3. **Vercel (Serverless)**

#### vercel.json:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 4. **DigitalOcean App Platform**

#### Setup:
1. Connect GitHub repository
2. Configure build settings:
   - Build Command: `npm install`
   - Run Command: `node server.js`
3. Set environment variables in dashboard

### 5. **AWS EC2 (Advanced)**

#### Setup Script:
```bash
#!/bin/bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Clone repository
git clone https://github.com/yourusername/vote-chain.git
cd vote-chain

# Install dependencies
npm install

# Set up environment
echo "NODE_ENV=production" > .env
echo "ADMIN_KEY=your-secure-key" >> .env
echo "PORT=3000" >> .env

# Start with PM2
pm2 start server.js --name "votechain"
pm2 startup
pm2 save

# Set up Nginx reverse proxy
sudo apt install nginx -y
```

#### Nginx Configuration (/etc/nginx/sites-available/votechain):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
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

## 📋 Pre-Deployment Checklist

### Essential Files to Add:

#### .env (for production):
```bash
NODE_ENV=production
ADMIN_KEY=your-very-secure-admin-key-here
PORT=3000
```

#### .gitignore:
```
node_modules/
.env
.env.local
.env.production
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
```

#### package.json (updated):
```json
{
  "name": "vote-chain",
  "version": "1.0.0",
  "description": "Secure blockchain-based voting application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.7.0",
    "dotenv": "^16.0.3",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^2.0.22",
    "jest": "^29.5.0"
  }
}
```

## 🔒 Production Security Checklist

- [ ] Set strong ADMIN_KEY environment variable
- [ ] Enable HTTPS (use Cloudflare or Let's Encrypt)
- [ ] Set up proper CORS policies
- [ ] Implement request rate limiting
- [ ] Add input validation and sanitization
- [ ] Set up monitoring and logging
- [ ] Regular security updates
- [ ] Database backup strategy (if using persistent storage)

## 📊 Monitoring & Maintenance

### Add Health Check Endpoint:
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    blockchain: voteChain.isChainValid() ? 'Valid' : 'Invalid'
  });
});
```

### Logging Setup:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 💾 Database Considerations

For production, consider replacing in-memory storage with:
- **PostgreSQL** for relational data
- **MongoDB** for document storage
- **Redis** for caching and sessions

## 🌐 Domain & SSL

1. Purchase domain from providers like Namecheap, GoDaddy
2. Set up DNS to point to your server
3. Install SSL certificate (free with Let's Encrypt)
4. Configure HTTPS redirect

## 📈 Scaling Considerations

- Use load balancers for high traffic
- Implement database clustering
- Add CDN for static assets
- Consider microservices architecture for complex features