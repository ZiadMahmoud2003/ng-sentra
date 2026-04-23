# NG-SENTRA Local Deployment Guide

This guide will help you deploy NG-SENTRA on your local network so it can connect to your Elasticsearch/Wazuh instance at `192.168.1.14:9200`.

## Prerequisites

Before deploying, ensure you have:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **pnpm** - Install with: `npm install -g pnpm`
- **MySQL/TiDB Database** - For storing configuration and audit logs
- **Git** (optional) - For cloning the repository

## Step 1: Download the Project

Download the project files to your local machine. You can either:

### Option A: Download as ZIP
1. Go to the Management UI → More menu (⋯) → Download as ZIP
2. Extract the ZIP file to your desired location
3. Open terminal in the extracted folder

### Option B: Clone from GitHub (if connected)
```bash
git clone <your-github-repo-url> ng-sentra
cd ng-sentra
```

## Step 2: Install Dependencies

```bash
pnpm install
```

This will install all required Node.js packages.

## Step 3: Configure Environment Variables

Create a `.env.local` file in the project root with your database connection:

```bash
# Database connection (TiDB or MySQL)
DATABASE_URL="mysql://username:password@host:port/database_name?ssl=true"

# Local auth mode (recommended for self-hosted)
LOCAL_AUTH_ENABLED=true
VITE_LOCAL_AUTH_ENABLED=true
LOCAL_AUTH_OPEN_ID=local-admin
LOCAL_AUTH_NAME=Local Admin
LOCAL_AUTH_EMAIL=admin@localhost
LOCAL_AUTH_ROLE=Admin
VITE_APP_ID=local-app
OAUTH_SERVER_URL=
VITE_OAUTH_PORTAL_URL=
JWT_SECRET=your_jwt_secret

# Wazuh/Elasticsearch (your local instance)
WAZUH_ELASTICSEARCH_URL=https://192.168.1.14:9200
WAZUH_ELASTICSEARCH_USERNAME=admin
WAZUH_ELASTICSEARCH_PASSWORD=SecretPassword
WAZUH_ALERT_INDEX=wazuh-alerts-*
```

**Important:** Replace the values with your actual credentials.

## Step 4: Run the Development Server

```bash
pnpm dev
```

This will start the development server. You should see:
```
Server running on http://localhost:3000/
```

## Step 5: Access the Dashboard

Open your browser and go to:
```
http://localhost:3000
```

You should see the NG-SENTRA dashboard.

## Step 6: Test Wazuh Connection

1. Click **Sign In Locally** on the login page
2. Go to **System Settings** → **Wazuh Configuration**
3. Click **Test Connection**
4. You should see: ✅ **"Connected successfully. Cluster status: yellow"**

If the connection works, the Wazuh alert feed widget will start displaying real-time alerts from your Elasticsearch instance.

## Troubleshooting

### Connection Still Fails

If the connection test fails, run the standalone test script:

```bash
node test-wazuh-local.mjs
```

This will show detailed error messages to help diagnose the issue.

### Common Issues

**1. "Connection refused"**
- Make sure Elasticsearch is running on 192.168.1.14:9200
- Check if port 9200 is open and accessible

**2. "Cannot resolve hostname"**
- Verify the IP address is correct
- Try: `ping 192.168.1.14`

**3. "Authentication failed"**
- Double-check username and password
- Verify credentials in your Wazuh configuration

**4. "SSL certificate error"**
- The dashboard automatically bypasses self-signed certificates
- If still failing, check your Elasticsearch SSL configuration

## Production Deployment

For production deployment on your local network:

### Option A: Docker Container
```bash
pnpm build
docker build -t ng-sentra .
docker run -p 3000:3000 \
  -e DATABASE_URL="your_database_url" \
  -e WAZUH_ELASTICSEARCH_URL="https://192.168.1.14:9200" \
  ng-sentra
```

### Option B: System Service (Linux)
Create a systemd service file at `/etc/systemd/system/ng-sentra.service`:

```ini
[Unit]
Description=NG-SENTRA Security Operations Center
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ng-sentra
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
Environment="NODE_ENV=production"
Environment="DATABASE_URL=your_database_url"
Environment="WAZUH_ELASTICSEARCH_URL=https://192.168.1.14:9200"

[Install]
WantedBy=multi-user.target
```

Then enable and start:
```bash
sudo systemctl enable ng-sentra
sudo systemctl start ng-sentra
```

### Option C: PM2 Process Manager
```bash
npm install -g pm2
pnpm build
pm2 start "node server/index.js" --name ng-sentra
pm2 save
pm2 startup
```

## Network Access

To access the dashboard from other machines on your network:

1. Find your machine's IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Linux/Mac: `ifconfig` or `ip addr`

2. Access from another machine:
   ```
   http://<your-machine-ip>:3000
   ```

## Security Considerations

For production use on your network:

1. **Use HTTPS** - Set up SSL certificates (Let's Encrypt, self-signed, etc.)
2. **Firewall Rules** - Restrict access to trusted machines only
3. **Strong Passwords** - Use strong credentials for all services
4. **Regular Updates** - Keep Node.js and dependencies updated
5. **Database Security** - Use encrypted connections for database

## Support

If you encounter issues:

1. Check the server logs: `tail -f .manus-logs/devserver.log`
2. Run the test script: `node test-wazuh-local.mjs`
3. Verify Elasticsearch is accessible: `curl -k -u admin:SecretPassword https://192.168.1.14:9200/_cluster/health`

## Next Steps

After successful deployment:

1. **Configure Components** - Add your security components (firewalls, IDS, etc.)
2. **Set Up SOAR** - Create automation playbooks for incident response
3. **Manage Users** - Add team members and assign roles
4. **Monitor Alerts** - Set up real-time alert monitoring from Wazuh

Good luck! 🚀
