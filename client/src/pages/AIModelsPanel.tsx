import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Activity, AlertTriangle, Brain, CheckCircle2, Clock, Globe, Users, XCircle } from "lucide-react";

const modelIcons: Record<string, any> = {
  "anomaly-detection": Activity,
  "alert-classification": AlertTriangle,
  uba: Users,
  "local-ti": Globe,
};

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  running: { label: "RUNNING", color: "text-emerald-400", dot: "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" },
  stopped: { label: "STOPPED", color: "text-red-400", dot: "bg-red-500" },
  error: { label: "ERROR", color: "text-orange-400", dot: "bg-orange-500 animate-pulse" },
  unknown: { label: "UNKNOWN", color: "text-slate-400", dot: "bg-slate-500" },
};

const modelGradients: Record<string, string> = {
  "anomaly-detection": "from-cyan-500/10",
  "alert-classification": "from-orange-500/10",
  uba: "from-purple-500/10",
  "local-ti": "from-red-500/10",
};

export default function AIModelsPanel() {
  const { user } = useAuth();
  const { data: models, refetch } = trpc.aiModels.list.useQuery(undefined, { refetchInterval: 60_000 });
  const updateMutation = trpc.aiModels.update.useMutation({
    onSuccess: () => { toast.success("AI model updated"); refetch(); },
    onError: (e) => toast.error(`Update failed: ${e.message}`),
  });

  const isAdmin = user?.role === "Admin" || user?.role === "admin";

  const cycleStatus = (model: any) => {
    const statuses = ["running", "stopped", "error", "unknown"] as const;
    const current = statuses.indexOf(model.status);
    const next = statuses[(current + 1) % statuses.length];
    updateMutation.mutate({ id: model.id, status: next });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Brain className="w-6 h-6 text-emerald-400" />
          AI Models Status
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Live health and output summaries for the 4 AI security services — auto-refreshes every 1 minute
        </p>
      </div>

      {/* Status Summary Bar */}
      <div className="flex items-center gap-6 p-3 bg-muted/20 border border-border rounded-lg text-xs font-mono">
        {(["running", "stopped", "error", "unknown"] as const).map(status => {
          const count = (models ?? []).filter(m => m.status === status).length;
          const cfg = statusConfig[status];
          return (
            <div key={status} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className={cfg.color}>{cfg.label}</span>
              <span className="text-muted-foreground">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Model Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(models ?? []).map(model => {
          const Icon = modelIcons[model.slug] ?? Brain;
          const status = statusConfig[model.status] ?? statusConfig.unknown;
          const gradient = modelGradients[model.slug] ?? "from-slate-500/10";

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
                      <span className="text-base">{model.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status.dot}`} />
                        <span className={`text-[10px] font-mono ${status.color}`}>{status.label}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{model.slug}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">{model.description}</p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="text-muted-foreground/60 font-mono uppercase text-[10px]">Last Active</p>
                    <p className="font-mono text-foreground">
                      {model.lastActive ? new Date(model.lastActive).toLocaleString() : "Never"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground/60 font-mono uppercase text-[10px]">Endpoint</p>
                    <p className="font-mono text-primary/80 truncate">
                      {model.endpointUrl ?? "Not configured"}
                    </p>
                  </div>
                </div>

                {model.recentOutput && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground/60 font-mono uppercase text-[10px]">Recent Output</p>
                    <div className="bg-muted/30 border border-border rounded px-3 py-2">
                      <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap line-clamp-3">
                        {model.recentOutput}
                      </pre>
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-[10px] font-mono border-border text-muted-foreground hover:text-foreground"
                    onClick={() => cycleStatus(model)}
                    disabled={updateMutation.isPending}
                  >
                    Cycle Status (Admin Test)
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
