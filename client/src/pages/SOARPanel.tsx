import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Activity, AlertTriangle, Clock, FileText, Globe, Play,
  Shield, Zap, CheckCircle2, XCircle, Link
} from "lucide-react";

const approachIcons: Record<string, any> = {
  ip: Shield,
  behavior: Activity,
  file: FileText,
  "url-realtime": Globe,
  "url-scheduled": Clock,
};

const approachColors: Record<string, string> = {
  ip: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
  behavior: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  file: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  "url-realtime": "text-red-400 bg-red-400/10 border-red-400/30",
  "url-scheduled": "text-blue-400 bg-blue-400/10 border-blue-400/30",
};

export default function SOARPanel() {
  const { user } = useAuth();
  const { data: approaches, refetch } = trpc.soar.list.useQuery();
  const triggerMutation = trpc.soar.trigger.useMutation({
    onSuccess: () => { toast.success("IR approach triggered successfully"); refetch(); },
    onError: (e) => toast.error(`Failed to trigger: ${e.message}`),
  });

  const isAnalystOrAdmin = ["Admin", "admin", "Analyst"].includes(user?.role ?? "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Zap className="w-6 h-6 text-pink-400" />
          n8n SOAR Panel
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Incident Response automation — 5 approaches managed by n8n SOAR engine
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {(approaches ?? []).map(approach => {
          const Icon = approachIcons[approach.slug] ?? Zap;
          const color = approachColors[approach.slug] ?? "text-slate-400 bg-slate-400/10 border-slate-400/30";
          return (
            <div key={approach.id} className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-center ${color}`}>
              <Icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{approach.name}</span>
              <span className={`w-2 h-2 rounded-full ${approach.enabled ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
            </div>
          );
        })}
      </div>

      {/* Detailed Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(approaches ?? []).map(approach => {
          const Icon = approachIcons[approach.slug] ?? Zap;
          const color = approachColors[approach.slug] ?? "text-slate-400 bg-slate-400/10 border-slate-400/30";

          return (
            <Card key={approach.id} className="bg-card border-border relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/60 to-transparent" />
              <CardHeader className="pb-3 pl-5">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-md border flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span>{approach.name} Approach</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${approach.enabled ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" : "text-slate-400 bg-slate-400/10 border-slate-400/30"}`}>
                        {approach.enabled ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pl-5 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">{approach.description}</p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="text-muted-foreground/60 font-mono uppercase text-[10px]">Trigger Count</p>
                    <p className="font-mono text-foreground font-bold">{approach.triggerCount}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground/60 font-mono uppercase text-[10px]">Last Triggered</p>
                    <p className="font-mono text-foreground">
                      {approach.lastTriggered
                        ? new Date(approach.lastTriggered).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                </div>

                {approach.webhookUrl && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground/60 font-mono uppercase text-[10px]">Webhook URL</p>
                    <div className="flex items-center gap-2 bg-muted/30 rounded px-2 py-1.5 border border-border">
                      <Link className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <code className="text-[10px] font-mono text-primary/80 truncate flex-1">{approach.webhookUrl}</code>
                    </div>
                  </div>
                )}

                {!approach.webhookUrl && (
                  <div className="flex items-center gap-2 text-xs text-orange-400/80 bg-orange-400/5 border border-orange-400/20 rounded px-2 py-1.5">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span>Webhook URL not configured</span>
                  </div>
                )}

                {isAnalystOrAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-xs font-mono border-primary/30 text-primary hover:bg-primary/10"
                    disabled={!approach.enabled || !approach.webhookUrl || triggerMutation.isPending}
                    onClick={() => triggerMutation.mutate({ id: approach.id })}
                  >
                    <Play className="w-3 h-3 mr-1.5" />
                    TRIGGER IR
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
