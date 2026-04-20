import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle, Bug, Eye, FileText, Globe,
  Lock, Search, Shield, Terminal, Zap, Settings, Server
} from "lucide-react";
import { useLocation } from "wouter";

const iconMap: Record<string, any> = {
  Shield, Eye, Lock, Bug, FileText, Zap, Search,
  Terminal, Server, Globe, Settings, AlertTriangle,
};

const accessTypeConfig: Record<string, {
  label: string;
  badgeClass: string;
  hint: string;
  canOpen: boolean;
}> = {
  iframe: {
    label: "Web UI",
    badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    hint: "Click to open in embedded panel",
    canOpen: true,
  },
  "config-file": {
    label: "Config Files",
    badgeClass: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    hint: "Managed via SSH / configuration files",
    canOpen: false,
  },
  terminal: {
    label: "Terminal / SSH",
    badgeClass: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    hint: "Accessed via terminal or SSH",
    canOpen: false,
  },
  service: {
    label: "Background Service",
    badgeClass: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    hint: "Runs as a background service",
    canOpen: false,
  },
};

const categoryColors: Record<string, string> = {
  SIEM: "text-cyan-400",
  "IDS/IPS": "text-orange-400",
  Firewall: "text-red-400",
  Honeypot: "text-yellow-400",
  "Log Shipper": "text-blue-400",
  SOAR: "text-emerald-400",
  Forensics: "text-purple-400",
};

export default function ComponentsGrid() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: components, isLoading } = trpc.components.list.useQuery();

  const isAdmin = user?.role === "Admin" || user?.role === "admin";

  // Hide adminOnly components from non-admin users
  const visibleComponents = (components ?? []).filter(c => !c.adminOnly || isAdmin);

  const handleClick = (comp: any) => {
    const cfg = accessTypeConfig[comp.accessType ?? "iframe"];
    if (cfg?.canOpen) navigate(`/components/${comp.slug}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          SOC Components
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {visibleComponents.length} component{visibleComponents.length !== 1 ? "s" : ""} in your security stack
          {!isAdmin && (
            <span className="ml-2 text-[10px] text-muted-foreground/50 font-mono">(admin-only components hidden)</span>
          )}
        </p>
      </div>

      {/* Access type legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(accessTypeConfig).map(([type, cfg]) => (
          <span key={type} className={`text-[10px] font-mono px-2 py-0.5 rounded border ${cfg.badgeClass}`}>
            {cfg.label}
          </span>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-muted/30 animate-pulse border border-border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleComponents.map(comp => {
            const Icon = iconMap[comp.icon ?? "Shield"] ?? Shield;
            const atCfg = accessTypeConfig[comp.accessType ?? "iframe"] ?? accessTypeConfig.iframe;
            const catColor = categoryColors[comp.category ?? ""] ?? "text-muted-foreground";
            const clickable = atCfg.canOpen && comp.enabled;

            return (
              <Card
                key={comp.id}
                onClick={() => handleClick(comp)}
                className={`bg-card border-border relative overflow-hidden transition-all duration-200 group ${
                  clickable
                    ? "cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5"
                    : "cursor-default"
                } ${!comp.enabled ? "opacity-60" : ""}`}
              >
                {/* Top accent */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${
                  comp.enabled ? "bg-gradient-to-r from-primary/50 to-transparent" : "bg-muted/20"
                }`} />

                <CardContent className="p-5 space-y-3">
                  {/* Icon row */}
                  <div className="flex items-start justify-between">
                    <div className={`w-11 h-11 rounded-lg border flex items-center justify-center transition-colors ${
                      clickable
                        ? "bg-primary/10 border-primary/20 group-hover:bg-primary/20"
                        : "bg-muted/30 border-border"
                    }`}>
                      <Icon className={`w-5 h-5 ${clickable ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`w-2 h-2 rounded-full ${
                        comp.enabled
                          ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse"
                          : "bg-slate-500"
                      }`} />
                      {comp.adminOnly && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/20">
                          ADMIN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Name + category */}
                  <div>
                    <h3 className="font-semibold text-foreground text-sm leading-tight">{comp.name}</h3>
                    <p className={`text-[10px] font-mono mt-0.5 ${catColor}`}>{comp.category}</p>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {comp.description}
                  </p>

                  {/* Access type badge */}
                  <div className="space-y-1">
                    <span className={`inline-block text-[10px] font-mono px-1.5 py-0.5 rounded border ${atCfg.badgeClass}`}>
                      {atCfg.label}
                    </span>
                    {comp.url ? (
                      <p className="text-[10px] font-mono text-muted-foreground/60 truncate">{comp.url}</p>
                    ) : comp.port ? (
                      <p className="text-[10px] font-mono text-muted-foreground/50">Port: {comp.port}</p>
                    ) : (
                      <p className="text-[10px] font-mono text-muted-foreground/40 italic">{atCfg.hint}</p>
                    )}
                  </div>

                  {/* Action hint */}
                  <p className={`text-[10px] font-mono ${clickable ? "text-primary/60 group-hover:text-primary/80" : "text-muted-foreground/30 italic"}`}>
                    {clickable ? "Click to open →" : atCfg.hint}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info note for non-admins */}
      {!isAdmin && (
        <div className="flex items-start gap-3 p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="text-orange-400 font-mono font-semibold">Snort</span>,{" "}
            <span className="text-orange-400 font-mono font-semibold">UFW</span>, and{" "}
            <span className="text-orange-400 font-mono font-semibold">Filebeat</span> are Admin-only components
            managed via configuration files. Contact your administrator for access.
          </p>
        </div>
      )}
    </div>
  );
}
