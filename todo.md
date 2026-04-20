# NG-SENTRA SOC Dashboard - TODO

## Database Schema
- [x] Extend schema: roles enum (Admin, Analyst, Viewer) on users table
- [x] Add components table (id, name, url, port, description, enabled, icon)
- [x] Add audit_logs table (id, userId, action, target, details, ip, timestamp)
- [x] Add soar_approaches table (id, name, slug, webhookUrl, enabled, triggerCount, lastTriggered)
- [x] Add ai_models table (id, name, slug, endpointUrl, status, lastActive, recentOutput)
- [x] Run migration SQL and seed initial data

## Backend (tRPC Routers)
- [x] RBAC middleware: adminProcedure, analystOrAdminProcedure, protectedProcedure
- [x] components router: list, update (admin only)
- [x] users router: list, updateRole, delete (admin only)
- [x] audit router: list with filters (admin only), log action, recent
- [x] metrics router: summary (protected, 1-min refresh)
- [x] soar router: list, trigger (analyst+), update (admin only)
- [x] aiModels router: list, update (admin only)

## Global UI / Layout
- [x] Dark-mode theme in index.css (cybersecurity palette: deep navy, cyan accents)
- [x] SOCLayout with sidebar navigation for SOC roles
- [x] Sidebar nav items: Dashboard, Components, SOAR Panel, AI Models, Admin section (conditional)
- [x] Top header with system status, date, user info, role badge, logout
- [x] ThemeProvider set to dark mode

## Pages & Features

### Landing Dashboard (/)
- [x] Real-time SOC metrics cards (component count, AI models, activity, enabled)
- [x] Auto-refresh every 1 minute with countdown timer
- [x] Component health status grid (11 components, configured/not configured indicators)
- [x] AI Models status panel (4 models with live status)
- [x] Recent audit log feed

### Component Grid (/components)
- [x] 11-tile responsive grid layout
- [x] Each tile: icon, name, category badge, status dot, "Open" button
- [x] All 11 components: Wazuh, Snort, UFW, T-Pot, Filebeat, Anomaly Detection AI, Alert Classification AI, UBA AI, Local TI API, n8n SOAR, Digital Forensics Workstation
- [x] Clicking tile navigates to iframe panel

### Iframe Panel (/components/:slug)
- [x] Full-screen iframe viewer for selected component
- [x] Back navigation to grid
- [x] Component info bar (name, URL, port)
- [x] Reload and open-in-new-tab buttons
- [x] Fallback message if URL not configured or unreachable
- [x] Audit log: record component access

### n8n SOAR Panel (/soar)
- [x] 5 IR approach cards: IP, Behavior, File, URL real-time, URL scheduled
- [x] Status indicators per approach (active/inactive)
- [x] Webhook URL display per approach
- [x] Last triggered timestamp and trigger count
- [x] Trigger webhook button (Analyst+ only)

### AI Models Status Panel (/ai-models)
- [x] 4 AI service cards: Anomaly Detection, Alert Classification, UBA, Local Threat Intelligence
- [x] Health status (running/stopped/error/unknown) with animated dots
- [x] Recent output summary
- [x] Last active timestamp
- [x] Endpoint URL display

### Admin: Component Config (/admin/components)
- [x] Grid of all 11 components with edit forms
- [x] Edit URL, port, description, enabled toggle per component
- [x] Save/update with audit log entry
- [x] Admin only (redirect if not admin)

### Admin: User Management (/admin/users)
- [x] Table of all users with role badges
- [x] Edit user role via dropdown (Admin, Analyst, Viewer)
- [x] Delete user with confirmation dialog
- [x] Role legend with permission descriptions
- [x] Admin only

### Admin: Audit Trail (/admin/audit)
- [x] Paginated table of all audit log entries
- [x] Filter by action type
- [x] Export to CSV
- [x] Admin only

## Security & Infrastructure
- [x] Nginx config with HTTPS/SSL, security headers for iframe embedding
- [x] X-Frame-Options, CSP, HSTS, X-Content-Type-Options headers configured
- [x] Role-based route guards on frontend
- [x] Protected procedures on backend (adminProcedure, analystOrAdminProcedure)

## Testing
- [x] Vitest: auth tests (2 tests)
- [x] Vitest: RBAC - components tests (4 tests)
- [x] Vitest: RBAC - users tests (4 tests)
- [x] Vitest: audit log tests (3 tests)
- [x] Vitest: SOAR tests (4 tests)
- [x] Vitest: AI Models tests (3 tests)
- [x] Vitest: Metrics tests (1 test)
- [x] All 22 tests passing

## Final
- [x] Save checkpoint

## Infrastructure Update (v1.1)
- [x] Update all component URLs to 192.168.1.14 with correct default ports
- [x] Update n8n SOAR webhook URLs to http://192.168.1.14:5678/webhook/<path>
- [x] Remove Anomaly Detection AI, Alert Classification AI, UBA AI, Local TI API from components grid
- [x] Remove Digital Forensics Workstation from components grid
- [x] Update AI models panel to reflect actual n8n-integrated AI (Gemini + Local AI Brain)
- [x] Update seed.ts with real data and re-seed database
- [x] Update SOAR panel with real webhook paths and IR descriptions from n8n JSON
- [x] Save checkpoint v1.1

## Logo & Branding (v1.2)
- [x] Upload NG-SENTRA logo to static assets
- [x] Add logo to sidebar (SOCLayout)
- [x] Add logo to login page
- [x] Animate brain icon jumping/wiggling on the N of NG SENTRA on login page
- [x] Save checkpoint v1.2
