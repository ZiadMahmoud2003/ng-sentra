import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Activity, AlertTriangle, Brain, Globe, Users, Zap,
  Link, Terminal, Workflow, RefreshCw, Server, Lock
} from "lucide-react";

const modelIcons: Record<string, any> = {
  "anomaly-detection": Activity,
  "alert-classification": AlertTriangle,
  uba: Users,
  "local-ti": Globe,
};

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  running: { label: "RUNNING",  color: "text-emerald-400", dot: "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" },
  stopped: { label: "STOPPED",  color: "text-red-400",     dot: "bg-red-500" },
  error:   { label: "ERROR",    color: "text-orange-400",  dot: "bg-orange-500 animate-pulse" },
  unknown: { label: "UNKNOWN",  color: "text-slate-400",   dot: "bg-slate-500" },
};

const modelGradients: Record<string, string> = {
  "anomaly-detection":   "from-cyan-500/10",
  "alert-classification":"from-orange-500/10",
  uba:                   "from-purple-500/10",
  "local-ti":            "from-red-500/10",
};

// Which n8n IR workflows each AI model is used in
const modelWorkflows: Record<string, string[]> = {
  "anomaly-detection":    ["IP (wazuh-realtime)", "Behavior (scheduled)", "URL scheduled"],
  "alert-classification": ["IP", "File", "URL real-time", "URL scheduled"],
  uba:                    ["Behavior (scheduled)"],
  "local-ti":             ["IP", "File", "URL real-time", "URL scheduled"],
};

// Technology stack per model
const modelTech: Record<string, string[]> = {
  "anomaly-detection":    ["Isolation Forest", "Behavioral Baselines", "REST API (Waitress)"],
  "alert-classification": ["Gemini 2.5 Flash", "Google AI Studio", "HTML Report Generation"],
  uba:                    ["Historical IP Profiles", "UFW Action History", "REST API"],
  "local-ti":             ["Local AI Brain", "Threat Scoring", "REST API (port 5000)", "Waitress Server"],
};

export default function AIModelsPanel() {
  const { user } = useAuth();
  const { data: models, refetch, isLoading } = trpc.aiModels.list.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const updateMutation = trpc.aiModels.update.useMutation({
    onSuccess: () => { toast.success("AI model status updated"); refetch(); },
    onError: (e) => toast.error(`Update failed: ${e.message}`),
  });

  const isAdmin = user?.role === "Admin" || user?.role === "admin";

  const cycleStatus = (model: any) => {
    const statuses = ["running", "stopped", "error", "unknown"] as const;
    const current = statuses.indexOf(model.status);
    const next = statuses[(current + 1) % statuses.length];
    updateMutation.mutate({ id: model.id, status: next });
  };

  const runningCount = (models ?? []).filter(m => m.status === "running").length;
  const errorCount   = (models ?? []).filter(m => m.status === "error").length;
  const unknownCount = (models ?? []).filter(m => m.status === "unknown").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Brain className="w-6 h-6 text-emerald-400" />
            AI Models Status
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            4 AI services integrated into n8n SOAR workflows — auto-refreshes every 1 minute
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs font-mono border-border text-muted-foreground hover:text-foreground gap-1.5"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Status Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total AI Services", value: models?.length ?? 4, icon: Brain, color: "text-primary" },
          { label: "Running",           value: runningCount,         icon: Activity, color: "text-emerald-400" },
          { label: "Error / Stopped",   value: errorCount,           icon: AlertTriangle, color: "text-red-400" },
          { label: "Status Unknown",    value: unknownCount,         icon: Zap, color: "text-slate-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
            <stat.icon className={`w-5 h-5 flex-shrink-0 ${stat.color}`} />
            <div>
              <p className="text-lg font-bold text-foreground font-mono">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Note about AI integration */}
      <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-muted-foreground">
        <Workflow className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p>
          These AI services run as <span className="text-primary font-mono">background services</span> on your VirtualBox environment — they have no direct web UI and cannot be accessed via browser. They are invoked exclusively by your{" "}
            <span className="text-primary font-mono">n8n SOAR</span> workflows. The Local AI Brain and UBA
            services run locally via Waitress (port 5000). Alert Classification uses Google Gemini 2.5 Flash via the n8n Google AI node.
            Status reflects the last known state — update manually or via your monitoring scripts.
        </p>
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(models ?? []).map(model => {
          const Icon = modelIcons[model.slug] ?? Brain;
          const status = statusConfig[model.status as keyof typeof statusConfig] ?? statusConfig.unknown;
          const gradient = modelGradients[model.slug] ?? "from-slate-500/10";
          const workflows = modelWorkflows[model.slug] ?? [];
          const tech = modelTech[model.slug] ?? [];

          return (
            <Card key={model.id} className="bg-card border-border relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} to-transparent pointer-events-none`} />
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/40 border border-border flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold">{model.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status.dot}`} />
                        <span className={`text-[10px] font-mono ${status.color}`}>{status.label}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{model.slug}</p>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed">{model.description}</p>

                {/* Service Type Banner */}
                <div className="flex items-center gap-2 bg-slate-500/10 border border-slate-500/20 rounded px-2 py-1.5">
                  <Server className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="text-[10px] font-mono text-slate-400">Background Service — No Web UI</span>
                  <Lock className="w-3 h-3 text-slate-500 ml-auto" />
                </div>

                {/* Internal Endpoint (info only, not clickable) */}
                {model.endpointUrl && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1">
                      <Link className="w-3 h-3" /> Internal Endpoint (n8n use only)
                    </p>
                    <div className="flex items-center gap-2 bg-muted/30 rounded px-2 py-1.5 border border-border">
                      <Terminal className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <code className="text-[10px] font-mono text-muted-foreground truncate">
                        {model.endpointUrl}
                      </code>
                    </div>
                  </div>
                )}

                {/* Technology stack */}
                {tech.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Technology</p>
                    <div className="flex flex-wrap gap-1">
                      {tech.map(t => (
                        <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/40 border border-border text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* n8n Workflows using this model */}
                {workflows.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1">
                      <Workflow className="w-3 h-3" /> Used in n8n Workflows
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {workflows.map(w => (
                        <span key={w} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary/80">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last active + recent output */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-border">
                  <div>
                    <p className="text-muted-foreground/60 font-mono uppercase text-[10px]">Last Active</p>
                    <p className="font-mono text-foreground text-[11px]">
                      {model.lastActive ? new Date(model.lastActive).toLocaleString() : "Never"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground/60 font-mono uppercase text-[10px]">Invocations</p>
                    <p className="font-mono text-foreground font-bold">—</p>
                  </div>
                </div>

                {model.recentOutput && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground/60 font-mono uppercase text-[10px]">Recent Output</p>
                    <div className="bg-black/40 border border-border rounded px-3 py-2">
                      <pre className="text-[10px] font-mono text-emerald-400/80 whitespace-pre-wrap line-clamp-4">
                        {model.recentOutput}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Admin status control */}
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-[10px] font-mono border-border text-muted-foreground hover:text-foreground"
                    onClick={() => cycleStatus(model)}
                    disabled={updateMutation.isPending}
                  >
                    Cycle Status (Admin)
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
