# NG-SENTRA: Security Operations Center Dashboard
## Complete Project Documentation

**Project Name:** ng-sentra  
**Version:** 3.0.4  
**Type:** Full-stack web application (React + Express + tRPC + Database)  
**Purpose:** Real-time security operations center dashboard with Wazuh alert monitoring, threat analysis, and incident response automation

---

## 1. PROJECT OVERVIEW

NG-SENTRA is a professional Security Operations Center (SOC) dashboard designed to provide real-time security monitoring, alert management, and incident response capabilities. It integrates with Wazuh/Elasticsearch for security event monitoring and provides advanced analytics, filtering, and automation features.

### Key Objectives
- Real-time security alert monitoring from Wazuh/Elasticsearch
- Professional UI with interactive charts and analytics
- Advanced filtering and search capabilities
- Incident response automation (SOAR playbooks)
- Multi-user access with role-based controls
- Audit logging and compliance tracking

---

## 2. TECHNOLOGY STACK

### Frontend
- **Framework:** React 19 with TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui components
- **State Management:** tRPC for server state, React hooks for local state
- **Charts/Visualization:** Recharts (line, bar, pie charts)
- **Icons:** Lucide React
- **Build Tool:** Vite
- **Routing:** Wouter (lightweight routing)

### Backend
- **Runtime:** Node.js (v22.13.0)
- **Framework:** Express 4
- **API:** tRPC 11 (end-to-end type-safe API)
- **Language:** TypeScript
- **Database:** TiDB (MySQL-compatible)
- **ORM:** Drizzle ORM with migrations
- **Authentication:** Manus OAuth 2.0
- **HTTP Client:** Axios (for Elasticsearch/Wazuh connections)

### Infrastructure
- **Deployment:** Manus Cloud Platform
- **Database:** TiDB Cloud (MySQL-compatible)
- **File Storage:** S3-compatible storage via Manus
- **Authentication:** Manus OAuth Portal
- **Monitoring:** Elasticsearch/Wazuh (external)

### Development Tools
- **Package Manager:** pnpm
- **Testing:** Vitest (23 tests passing)
- **Code Quality:** TypeScript, ESLint, Prettier
- **Build:** esbuild for production

---

## 3. PROJECT STRUCTURE

```
ng-sentra/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   └── Home.tsx            # Main dashboard (SOC dashboard)
│   │   ├── components/
│   │   │   ├── WazuhAlertDashboard.tsx    # Professional alert dashboard (463 lines)
│   │   │   ├── WazuhAlertFeed.tsx         # Simple alert feed (deprecated)
│   │   │   ├── WazuhSettings.tsx          # Wazuh configuration UI
│   │   │   ├── DashboardLayout.tsx        # Main layout wrapper
│   │   │   ├── SOCLayout.tsx              # SOC-specific layout
│   │   │   ├── AIChatBox.tsx              # AI chat interface
│   │   │   ├── Map.tsx                    # Google Maps integration
│   │   │   ├── OpenSSHButton.tsx          # SSH terminal launcher
│   │   │   ├── WebTerminal.tsx            # Web-based terminal
│   │   │   ├── SSHCredentialsSettings.tsx # SSH credential management
│   │   │   └── ui/                        # shadcn/ui components
│   │   ├── contexts/                # React contexts
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/
│   │   │   └── trpc.ts             # tRPC client setup
│   │   ├── App.tsx                 # Main app router
│   │   ├── main.tsx                # React entry point
│   │   └── index.css               # Global styles
│   ├── public/                      # Static files (favicon, robots.txt)
│   └── index.html                   # HTML template
│
├── server/                          # Express backend
│   ├── _core/
│   │   ├── index.ts                # Server entry point
│   │   ├── context.ts              # tRPC context (user, auth)
│   │   ├── env.ts                  # Environment variables
│   │   ├── oauth.ts                # OAuth flow handling
│   │   ├── llm.ts                  # LLM integration (Claude)
│   │   ├── voiceTranscription.ts   # Whisper API integration
│   │   ├── imageGeneration.ts      # Image generation service
│   │   ├── map.ts                  # Google Maps proxy
│   │   ├── notification.ts         # Owner notifications
│   │   ├── storageProxy.ts         # S3 storage proxy
│   │   ├── terminalHandler.ts      # Terminal handling (stub)
│   │   └── middleware/             # Express middleware
│   ├── db.ts                        # Database queries (Drizzle)
│   ├── routers.ts                   # tRPC procedure definitions
│   ├── wazuh-service.ts             # Wazuh/Elasticsearch integration
│   ├── wazuh.test.ts                # Wazuh connection tests
│   ├── auth.logout.test.ts          # Auth tests
│   └── storage.ts                   # S3 storage helpers
│
├── drizzle/
│   ├── schema.ts                    # Database schema (Drizzle)
│   └── migrations/                  # SQL migration files
│
├── shared/                          # Shared types and constants
│   └── types.ts                     # Shared TypeScript types
│
├── storage/                         # S3 storage helpers
│   └── index.ts                     # Storage utilities
│
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite configuration
├── drizzle.config.ts                # Drizzle ORM configuration
├── vitest.config.ts                 # Vitest configuration
│
├── DEPLOYMENT.md                    # Local deployment guide
├── WAZUH_DASHBOARD_UPGRADE.md       # Dashboard upgrade instructions
└── PROJECT_DOCUMENTATION.md         # This file
```

---

## 4. DATABASE SCHEMA

### Tables

#### `users`
- `id` (primary key)
- `openId` (OAuth identifier)
- `name` (user display name)
- `email` (user email)
- `role` (enum: 'admin' | 'user')
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

#### `wazuh_settings`
- `id` (primary key)
- `userId` (foreign key to users)
- `elasticsearchUrl` (Elasticsearch endpoint)
- `elasticsearchUsername` (auth username)
- `elasticsearchPassword` (encrypted password)
- `alertIndexPattern` (Wazuh alert index, e.g., 'wazuh-alerts-*')
- `enabled` (boolean)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

#### `audit_logs`
- `id` (primary key)
- `userId` (foreign key to users)
- `action` (action type)
- `target` (affected resource)
- `details` (JSON metadata)
- `createdAt` (timestamp)

#### `metrics`
- `id` (primary key)
- `timestamp` (event time)
- `alertCount` (number of alerts)
- `criticalCount` (critical severity alerts)
- `agentStatus` (JSON agent statuses)
- `createdAt` (timestamp)

---

## 5. ENVIRONMENT VARIABLES

### Required (Auto-injected by Manus)
```
DATABASE_URL=mysql://user:pass@host:port/db?ssl=true
JWT_SECRET=<secret-key>
VITE_APP_ID=<app-id>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=<owner-id>
OWNER_NAME=<owner-name>
BUILT_IN_FORGE_API_URL=<manus-api-url>
BUILT_IN_FORGE_API_KEY=<manus-api-key>
VITE_FRONTEND_FORGE_API_URL=<manus-api-url>
VITE_FRONTEND_FORGE_API_KEY=<manus-api-key>
```

### Wazuh/Elasticsearch Configuration
```
WAZUH_ELASTICSEARCH_URL=https://192.168.1.14:9200
WAZUH_ELASTICSEARCH_USERNAME=admin
WAZUH_ELASTICSEARCH_PASSWORD=SecretPassword
WAZUH_ALERT_INDEX=wazuh-alerts-*
```

### Optional
```
VITE_ANALYTICS_ENDPOINT=<analytics-url>
VITE_ANALYTICS_WEBSITE_ID=<website-id>
VITE_APP_TITLE=NG-SENTRA
VITE_APP_LOGO=<logo-url>
```

---

## 6. API ENDPOINTS (tRPC Procedures)

### Authentication
- `auth.me` - Get current user info
- `auth.logout` - Logout user

### Wazuh/Alerts
- `wazuh.getAlerts` - Fetch recent alerts (limit: 50)
- `wazuh.testConnection` - Test Elasticsearch connection
- `wazuh.getSettings` - Get Wazuh configuration
- `wazuh.updateSettings` - Update Wazuh configuration

### Metrics
- `metrics.summary` - Get system metrics summary
- `metrics.alertTimeline` - Get alert timeline data

### Components
- `components.list` - Get list of components
- `components.status` - Get component status

### Audit
- `audit.recent` - Get recent audit logs

### System
- `system.notifyOwner` - Send notification to owner

---

## 7. WAZUH INTEGRATION

### Connection Details
- **Type:** Elasticsearch/OpenSearch
- **Protocol:** HTTPS with self-signed certificate support
- **Authentication:** Basic auth (username/password)
- **Alert Index:** `wazuh-alerts-*` (configurable)
- **Auto-refresh:** 5 seconds (configurable)

### Alert Structure
```typescript
interface WazuhAlert {
  id: string;
  timestamp: string;
  rule_id: string;
  rule_description: string;
  severity: number;        // 3-8 (Low to Critical)
  agent_id: string;
  agent_name: string;
  source_ip?: string;
  destination_ip?: string;
  action: string;
}
```

### Severity Levels
- 3: Low
- 4: Medium
- 5: High
- 6: Critical
- 7: Emergency
- 8: Alert

---

## 8. WAZUH ALERT DASHBOARD FEATURES

### Professional UI Components
1. **KPI Cards** - Real-time counts (Total, Critical, High, Medium)
2. **Line Chart** - Alert timeline over 24 hours
3. **Pie Chart** - Severity distribution
4. **Advanced Filters** - By severity, agent, action, search term
5. **Sortable Table** - Last 20 filtered alerts with full details
6. **Export** - CSV download of filtered alerts
7. **Auto-refresh** - Toggle 5-second auto-refresh or manual refresh

### Customization Options
- Alert limit: Default 50 (configurable in code)
- Auto-refresh interval: Default 5000ms (5 seconds)
- Table rows shown: Default 20 (configurable)
- Color scheme: Customizable severity colors

---

## 9. AUTHENTICATION & AUTHORIZATION

### OAuth Flow
1. User clicks login
2. Redirected to Manus OAuth portal
3. User authenticates with credentials
4. Portal redirects back to `/api/oauth/callback`
5. Session cookie created
6. User logged in

### Role-Based Access Control
- **Admin:** Full access to all features, settings, and user management
- **User:** Access to dashboards and alerts, limited settings access

### Protected Procedures
- Use `protectedProcedure` for user-only endpoints
- Use `adminProcedure` for admin-only endpoints
- Public endpoints use `publicProcedure`

---

## 10. TESTING

### Test Suite (23 tests passing)
- **Core Tests:** 21 tests
- **Auth Tests:** 1 test (logout)
- **Wazuh Tests:** 1 test (connection validation)

### Running Tests
```bash
pnpm test                    # Run all tests
pnpm test -- server/wazuh   # Run specific test file
```

### Test Framework
- **Runner:** Vitest
- **Assertion:** Vitest built-in assertions
- **Coverage:** Can be enabled with `--coverage` flag

---

## 11. DEPLOYMENT

### Local Deployment
1. Install dependencies: `pnpm install`
2. Configure `.env` with Wazuh credentials
3. Start dev server: `$env:NODE_ENV="development"; pnpm exec tsx watch server/_core/index.ts`
4. Access at `http://localhost:3000`

### Cloud Deployment (Manus)
1. Create checkpoint: `webdev_save_checkpoint`
2. Click "Publish" button in Management UI
3. Dashboard accessible at `https://sentradash-cvbmnmig.manus.space`

### Production Considerations
- Use HTTPS with valid SSL certificates
- Configure firewall rules for Elasticsearch access
- Set up VPN/tunnel for secure Elasticsearch connection
- Enable audit logging for compliance
- Implement rate limiting on API endpoints
- Use strong authentication credentials

---

## 12. KNOWN LIMITATIONS & ISSUES

### Current Limitations
1. **Network Isolation:** Cloud-hosted dashboard cannot reach local Elasticsearch (requires VPN/tunnel)
2. **Embedded Terminal:** Disabled (use OpenSSHButton for SSH access)
3. **Alert Limit:** Fetches last 50 alerts (configurable but impacts performance)
4. **Real-time Sync:** 5-second refresh interval (configurable)

### Fixed Issues (v3.0.4)
- ✅ TS7053 error in storageProxy.ts (fixed)
- ✅ ssh2 import error (replaced with stub)
- ✅ Wazuh test connection button error (fixed)
- ✅ SSL certificate handling (axios with self-signed cert support)
- ✅ All 23 tests passing

---

## 13. FUTURE ENHANCEMENTS

### Planned Features
1. **SOAR Automation Playbooks** - Incident response workflows
2. **Alert Severity Filtering** - Custom severity rules
3. **Real-time Notifications** - Browser notifications for critical alerts
4. **Alert Archiving** - Historical alert storage and analysis
5. **Custom Dashboards** - Role-based dashboard views
6. **Threat Intelligence** - Integration with threat feeds
7. **Multi-Wazuh Support** - Connect to multiple Wazuh instances
8. **Advanced Analytics** - ML-based anomaly detection
9. **Compliance Reports** - Automated compliance reporting
10. **Integration APIs** - Webhooks and external integrations

---

## 14. SUPPORT & TROUBLESHOOTING

### Common Issues

**Dashboard Not Showing Alerts**
- Check Wazuh connection in System Settings
- Verify Elasticsearch is running and accessible
- Ensure authentication credentials are correct
- Check browser console for errors (F12)

**Elasticsearch Connection Timeout**
- Verify URL is correct: `https://192.168.1.14:9200`
- Check firewall allows port 9200
- Ensure Elasticsearch is running
- For cloud deployment, set up VPN/tunnel to local network

**Charts Not Rendering**
- Ensure `recharts` is installed
- Check if alert data is being fetched
- Clear browser cache and reload
- Check browser console for TypeScript errors

**Export Not Working**
- Check browser download settings
- Ensure pop-ups are not blocked
- Try different browser if issue persists

### Debug Mode
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for API calls
- Check Application tab for stored data

---

## 15. CONTACT & RESOURCES

### Project Links
- **Cloud Dashboard:** https://sentradash-cvbmnmig.manus.space
- **GitHub:** (if connected)
- **Documentation:** See DEPLOYMENT.md and WAZUH_DASHBOARD_UPGRADE.md

### Support
- Check browser console for errors
- Review logs in `.manus-logs/` directory
- Refer to DEPLOYMENT.md for setup issues
- Check WAZUH_DASHBOARD_UPGRADE.md for dashboard customization

---

## 16. VERSION HISTORY

### v3.0.4 (Current)
- ✅ Enhanced Wazuh dashboard with professional UI
- ✅ Axios-based Elasticsearch connection with SSL support
- ✅ Advanced filtering and analytics
- ✅ CSV export functionality
- ✅ All tests passing (23/23)

### v3.0.3
- ✅ SSL certificate bypass for self-signed certificates

### v3.0.2
- ✅ Enhanced error messages and logging

### v3.0.1
- ✅ Fixed Wazuh test connection button error

### v3.0.0
- ✅ Initial Wazuh alert feed integration
- ✅ Real-time alert monitoring
- ✅ 5-second auto-refresh

---

## 17. QUICK REFERENCE COMMANDS

```bash
# Development
pnpm install                # Install dependencies
pnpm dev                    # Start dev server
pnpm test                   # Run tests
pnpm build                  # Build for production
pnpm check                  # Type check

# Database
pnpm drizzle-kit generate  # Generate migrations
pnpm db:push               # Apply migrations

# Formatting
pnpm format                # Format code with Prettier

# Deployment
webdev_save_checkpoint     # Save checkpoint
webdev_check_status        # Check project status
webdev_restart_server      # Restart dev server
```

---

## 18. KEY FILES SUMMARY

| File | Purpose | Lines |
|------|---------|-------|
| `client/src/components/WazuhAlertDashboard.tsx` | Professional alert dashboard | 463 |
| `client/src/pages/Home.tsx` | Main SOC dashboard | 239 |
| `server/wazuh-service.ts` | Elasticsearch/Wazuh integration | ~150 |
| `server/routers.ts` | tRPC API procedures | ~400 |
| `drizzle/schema.ts` | Database schema | ~100 |
| `server/db.ts` | Database queries | ~200 |
| `server/_core/index.ts` | Server entry point | ~100 |

---



---

This documentation provides a complete overview of the NG-SENTRA project. Use this file when sharing with other AIs to provide full context and reduce token usage.
