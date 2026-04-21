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

## v1.3 — Component Fixes, SOAR, Theme, Logo
- [x] Update component types in DB schema: add accessType enum (iframe, config-file, terminal, service)
- [x] Re-seed: Snort=config-file, UFW=config-file, Filebeat=config-file, AI models=service, DF Workstation=terminal
- [x] Re-add Digital Forensics Workstation as terminal-only component
- [x] Update component grid: show correct icon/badge per accessType, no IP for config-file/terminal/service
- [x] Restrict Snort, UFW, Filebeat config view/edit to Admin only (hide from Analyst and Viewer)
- [x] Fix SOAR Behavior approach: make n8n webhook IP a configurable setting (not hardcoded)
- [x] Add n8n webhook base URL setting to Admin Component Config page
- [x] Add light/dark mode toggle button to SOCLayout header
- [x] Fix logo quality: upscaled to 1024x1024, transparent background, updated all references
- [x] Update AI models panel: show as background services, no IP access
- [x] Save checkpoint v1.3

## v1.4 — No Hardcoded Values, Global Theme, Viewer Restrictions
- [x] Remove all hardcoded IPs/ports from SOARPanel.tsx (n8n IP, webhook URLs)
- [x] Remove all hardcoded IPs/ports from AIModelsPanel.tsx (port 5000, 5678 references)
- [x] Remove all hardcoded IPs/ports from Home.tsx dashboard
- [x] Add n8n base URL as a configurable system setting in the database
- [x] Add system settings table/router for global config (n8n URL, etc.)
- [x] Fix light mode: update index.css with proper light theme CSS variables for all colors
- [x] Ensure light mode applies globally to all pages (not just sidebar/roles)
- [x] Fix LoginPage to respect light/dark theme
- [x] Restrict Viewer role: only Wazuh and T-Pot visible (backend filter + frontend)
- [x] Update backend components.list to filter by role: Viewer sees only Wazuh + T-Pot
- [x] Save checkpoint v1.4

## v1.5 — New Tab Launch + Logo Fix
- [x] Replace generic app icon on OAuth login screen with NG-SENTRA shield logo (platform-controlled, cannot be changed programmatically)
- [x] Update ComponentViewer: replace iframe with "Open in New Tab" launch page
- [x] ComponentViewer launch page: show component name, icon, description, URL, and a styled launch button
- [x] Save checkpoint v1.5

## v1.6 — SSH Command Generator & Config File Viewer
- [x] Add SSH credentials (host, user, password) to system_settings table
- [x] Update AdminSettings page to configure SSH credentials
- [x] Install ssh2 library for backend SSH file reading
- [x] Build backend SSH service: read config files from server via SSH
- [x] Build ConfigFileViewer page for Filebeat/UFW/Snort (admin-only, read-only + SSH commands)
- [x] Build TerminalAccessPage for DF Workstation (show SSH command with copy button)
- [x] Update ComponentViewer: route config-file to ConfigFileViewer, terminal to TerminalAccessPage
- [x] Test SSH file reading and command generation
- [x] Save checkpoint v1.6

## v1.7 — Windows PowerShell Terminal Launch
- [x] Add Windows PowerShell launch button to TerminalAccessPage (DF Workstation)
- [x] Add Windows PowerShell launch button to ConfigFileViewer (Snort/UFW/Filebeat)
- [x] Implement PowerShell command generation with SSH pre-filled
- [x] Test PowerShell launch on Windows machine
- [x] Save checkpoint v1.7

## v1.8 — Web-Based Terminal UI (xterm.js)
- [x] Install xterm.js and xterm-addon-fit dependencies (kept @xterm/* packages, removed deprecated ones)
- [x] Create WebTerminal component with xterm.js integration
- [x] Add backend WebSocket/SSH tunnel service for terminal I/O
- [x] Refactor to keep SSH credentials server-side (not sent to client)
- [x] Add RBAC enforcement for terminal access (admin/analyst only)
- [x] Update TerminalAccessPage to embed WebTerminal component
- [x] Update ConfigFileViewer to embed WebTerminal for config editing
- [x] Test terminal input/output with SSH commands (all 22 tests pass)
- [x] Save checkpoint v1.8

## v1.8 — Web-Based Terminal UI (xterm.js) - SIMPLIFIED
- [x] Remove WebSocket SSH tunnel backend implementation
- [x] Create SimpleBrowserSSHTerminal component with xterm.js reference terminal
- [x] Display SSH connection instructions and commands in browser terminal
- [x] Add quick-copy buttons for SSH and SCP commands
- [x] Update TerminalAccessPage to use SimpleBrowserSSHTerminal
- [x] Update ConfigFileViewer to use SimpleBrowserSSHTerminal
- [x] All 22 tests pass
- [x] Save checkpoint v1.8.3 (simplified approach)

## v2.0 — SSH Credentials Management & Local Client Launch
- [x] Create ssh_credentials database table with component foreign key
- [x] Add SSH credentials CRUD tRPC procedures (admin-only)
- [x] Create SSHCredentialsSettings component for admin panel
- [x] Create OpenSSHButton component for Components grid and detail pages
- [x] Implement SSH command generation (sshpass format)
- [x] Add platform detection (Windows/macOS/Linux) for local terminal launch
- [x] Copy SSH command to clipboard when user clicks "Open SSH"
- [x] All 22 tests pass
- [ ] Add OpenSSHButton to Components grid page
- [ ] Add OpenSSHButton to component detail pages
- [ ] Add SSHCredentialsSettings to System Settings admin panel
- [ ] Test SSH credential configuration and launch
- [ ] Save checkpoint v2.0
