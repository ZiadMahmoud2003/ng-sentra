import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity, AlertTriangle, Brain, Bug, Eye, FileText, Globe,
  HardDrive, Lock, Shield, Users, Zap, ExternalLink, Settings
} from "lucide-react";
import { useLocation } from "wouter";

const iconMap: Record<string, any> = {
  Shield, Eye, Lock, Bug, FileText, Activity, AlertTriangle, Users, Globe, Zap, HardDrive, Brain, Settings
};

const categoryColors: Record<string, string> = {
  SIEM: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
  IDS: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  Firewall: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  Honeypot: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  "Log Shipper": "text-purple-400 bg-purple-400/10 border-purple-400/30",
  "AI Model": "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  "Threat Intel": "text-red-400 bg-red-400/10 border-red-400/30",
  SOAR: "text-pink-400 bg-pink-400/10 border-pink-400/30",
  Forensics: "text-indigo-400 bg-indigo-400/10 border-indigo-400/30",
};

const tileGradients = [
  "from-cyan-500/10 to-transparent",
  "from-blue-500/10 to-transparent",
  "from-orange-500/10 to-transparent",
  "from-yellow-500/10 to-transparent",
  "from-purple-500/10 to-transparent",
  "from-emerald-500/10 to-transparent",
  "from-emerald-500/10 to-transparent",
  "from-emerald-500/10 to-transparent",
  "from-red-500/10 to-transparent",
  "from-pink-500/10 to-transparent",
  "from-indigo-500/10 to-transparent",
];

export default function ComponentsGrid() {
  const [, navigate] = useLocation();
  const { data: components, isLoading } = trpc.components.list.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Components</h1>
          <p className="text-muted-foreground text-sm mt-1">Select a component to open its interface</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-card border border-border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Components</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {components?.length ?? 0} components — click any tile to open its interface
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(components ?? []).map((comp, idx) => {
          const Icon = iconMap[comp.icon ?? "Shield"] ?? Shield;
          const catColor = categoryColors[comp.category ?? ""] ?? "text-slate-400 bg-slate-400/10 border-slate-400/30";
          const gradient = tileGradients[idx % tileGradients.length];
          const isConfigured = !!comp.url;

          return (
            <Card
              key={comp.id}
              className={`bg-card border-border relative overflow-hidden cursor-pointer group transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 ${!comp.enabled ? "opacity-50" : ""}`}
              onClick={() => isConfigured && navigate(`/components/${comp.slug}`)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none transition-opacity group-hover:opacity-150`} />
              <CardContent className="p-4 relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${catColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isConfigured && comp.enabled ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" : "bg-slate-500"}`} />
                    {!comp.enabled && (
                      <span className="text-[10px] font-mono text-muted-foreground">DISABLED</span>
                    )}
                  </div>
                </div>

                {/* Name & Category */}
                <h3 className="font-semibold text-foreground text-sm leading-tight mb-1">{comp.name}</h3>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${catColor}`}>
                  {comp.category}
                </span>

                {/* Description */}
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                  {comp.description}
                </p>

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between">
                  {isConfigured ? (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      :{comp.port ?? "—"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-orange-400/80">Not configured</span>
                  )}
                  <Button
                    size="sm"
                    variant={isConfigured ? "default" : "outline"}
                    className="h-6 text-[10px] px-2 font-mono"
                    disabled={!isConfigured || !comp.enabled}
                    onClick={e => { e.stopPropagation(); if (isConfigured) navigate(`/components/${comp.slug}`); }}
                  >
                    {isConfigured ? <><ExternalLink className="w-3 h-3 mr-1" />OPEN</> : "CLI ONLY"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
