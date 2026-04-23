import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WazuhAlertFeed } from "@/components/WazuhAlertFeed";
import {
  Activity, AlertTriangle, Brain, CheckCircle2, Clock, HardDrive,
  RefreshCw, Shield, TrendingUp, Users, Zap, XCircle
} from "lucide-react";
import { useEffect, useState } from "react";

const statusColors: Record<string, string> = {
  running: "text-emerald-400",
  stopped: "text-red-400",
  error: "text-orange-400",
  unknown: "text-slate-400",
};

const statusDots: Record<string, string> = {
  running: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]",
  stopped: "bg-red-500",
  error: "bg-orange-500",
  unknown: "bg-slate-500",
};

function StatusDot({ status }: { status: string }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${statusDots[status] ?? statusDots.unknown} ${status === "running" ? "animate-pulse" : ""}`} />
  );
}

export default function Home() {
  const { user } = useAuth();
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [countdown, setCountdown] = useState(60);

  const { data: metrics, refetch, isLoading } = trpc.metrics.summary.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 55_000,
  });

  const { data: components } = trpc.components.list.useQuery();
  const { data: recentLogs } = trpc.audit.recent.useQuery({ limit: 8 });

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setLastRefresh(new Date());
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const roleLabel = user?.role === "admin" ? "Admin" : user?.role ?? "Viewer";

  const aiRunning = metrics?.aiModels?.filter(m => m.status === "running").length ?? 0;
  const aiTotal = metrics?.aiModels?.length ?? 4;
  const configuredCount = metrics?.configuredComponents ?? 0;
  const totalCount = metrics?.totalComponents ?? 6;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Security Operations Center
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back, <span className="text-primary font-medium">{user?.name ?? "Operator"}</span>
            <span className={`ml-2 text-xs font-mono px-1.5 py-0.5 rounded border ${
              roleLabel === "Admin" ? "bg-red-500/20 text-red-400 border-red-500/30" :
              roleLabel === "Analyst" ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" :
              "bg-slate-500/20 text-slate-400 border-slate-500/30"
            }`}>{roleLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted/30 px-3 py-2 rounded-md border border-border">
          <RefreshCw className={`w-3 h-3 ${countdown <= 5 ? "animate-spin text-primary" : ""}`} />
          <span>Refresh in <span className="text-primary font-bold">{countdown}s</span></span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">COMPONENTS</span>
            </div>
            <div className="text-3xl font-bold text-foreground font-mono">{configuredCount}<span className="text-muted-foreground text-lg">/{totalCount}</span></div>
            <p className="text-xs text-muted-foreground mt-1">Configured / Total</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Brain className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-mono text-muted-foreground">AI MODELS</span>
            </div>
            <div className="text-3xl font-bold text-foreground font-mono">{aiRunning}<span className="text-muted-foreground text-lg">/{aiTotal}</span></div>
            <p className="text-xs text-muted-foreground mt-1">Running / Total</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Activity className="w-5 h-5 text-orange-400" />
              <span className="text-xs font-mono text-muted-foreground">ACTIVITY</span>
            </div>
            <div className="text-3xl font-bold text-foreground font-mono">{recentLogs?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Recent events</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-mono text-muted-foreground">ENABLED</span>
            </div>
            <div className="text-3xl font-bold text-foreground font-mono">{metrics?.enabledComponents ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active components</p>
          </CardContent>
        </Card>
      </div>

      {/* Wazuh Alert Feed */}
      <WazuhAlertFeed />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Component Health Grid */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Component Health Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Array.from({ length: 11 }).map((_, i) => (
                    <div key={i} className="h-14 bg-muted/30 rounded-md animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(components ?? []).map(comp => (
                    <div key={comp.id} className="flex items-center gap-2 p-2.5 rounded-md bg-muted/20 border border-border/50 hover:border-primary/30 transition-colors">
                      <StatusDot status={comp.url ? "running" : "unknown"} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{comp.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{comp.url ? `Port ${comp.port ?? "—"}` : "Not configured"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Models Status */}
        <div>
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-400" />
                AI Models Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(metrics?.aiModels ?? []).map(model => (
                <div key={model.id} className="flex items-center gap-3 p-2.5 rounded-md bg-muted/20 border border-border/50">
                  <StatusDot status={model.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{model.name}</p>
                    <p className={`text-[10px] font-mono ${statusColors[model.status] ?? "text-slate-400"}`}>
                      {model.status.toUpperCase()}
                    </p>
                  </div>
                </div>
              ))}
              {(!metrics?.aiModels || metrics.aiModels.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-4">Loading AI model status...</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-400" />
            Recent Activity
            <span className="ml-auto text-xs text-muted-foreground font-mono">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(recentLogs ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No recent activity recorded.</p>
          ) : (
            <div className="space-y-1">
              {(recentLogs ?? []).map(log => (
                <div key={log.id} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/20 transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                  <span className="text-xs font-mono text-primary/80 w-36 flex-shrink-0 truncate">{log.action}</span>
                  <span className="text-xs text-muted-foreground flex-1 truncate">{log.target ?? "—"}</span>
                  <span className="text-xs text-muted-foreground font-mono flex-shrink-0">{log.userName ?? "System"}</span>
                  <span className="text-[10px] text-muted-foreground/60 font-mono flex-shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
