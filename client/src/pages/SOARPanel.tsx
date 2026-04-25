import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Activity, AlertTriangle, Clock, FileText, Globe, Play,
  Shield, Zap, Link, Terminal, CalendarClock, Webhook,
  Brain, Mail, Eye, Pencil, Save, X, Edit
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const approachIcons: Record<string, any> = {
  ip: Shield,
  behavior: Activity,
  file: FileText,
  "url-realtime": Globe,
  "url-scheduled": CalendarClock,
};

const approachColors: Record<string, { card: string; icon: string; badge: string }> = {
  ip:            { card: "border-cyan-500/30",   icon: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",    badge: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30" },
  behavior:      { card: "border-purple-500/30", icon: "text-purple-400 bg-purple-400/10 border-purple-400/30", badge: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
  file:          { card: "border-orange-500/30", icon: "text-orange-400 bg-orange-400/10 border-orange-400/30", badge: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
  "url-realtime":{ card: "border-red-500/30",    icon: "text-red-400 bg-red-400/10 border-red-400/30",       badge: "text-red-400 bg-red-400/10 border-red-400/30" },
  "url-scheduled":{ card: "border-blue-500/30",  icon: "text-blue-400 bg-blue-400/10 border-blue-400/30",    badge: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
};

// Static enrichment from n8n JSON analysis
const approachMeta: Record<string, {
  triggerType: "webhook" | "schedule" | "webhook+schedule";
  triggerLabel: string;
  aiModels: string[];
  actions: string[];
  irCommand?: string;
}> = {
  ip: {
    triggerType: "webhook",
    triggerLabel: "POST /webhook/wazuh-realtime",
    aiModels: ["Local AI Brain", "Gemini 2.5 Flash"],
    actions: ["UFW block via SSH", "Push alert to Wazuh", "Send HTML email report"],
    irCommand: "sudo python3 /soc/incident_response.py <ip> <ir_action>  # via SSH {SSH_USER}@{SSH_HOST}",
  },
  behavior: {
    triggerType: "schedule",
    triggerLabel: "Schedule (seconds interval)",
    aiModels: ["Local AI Brain", "UBA Model", "Gemini 2.5 Flash"],
    actions: ["Poll Wazuh alerts", "UBA historical profile lookup", "SSH IR decision", "Send email report"],
    irCommand: "python3 /soc/incident_response.py '<src_ip>' '<ir_action>'",
  },
  file: {
    triggerType: "webhook",
    triggerLabel: "POST /webhook/downloaded-file",
    aiModels: ["Local AI Brain 3", "VirusTotal API", "Gemini 2.5 Flash"],
    actions: ["VirusTotal file scan", "Local AI analysis", "Delete malicious file", "Send HTML email alert"],
  },
  "url-realtime": {
    triggerType: "webhook",
    triggerLabel: "POST /webhook/url-scan",
    aiModels: ["Local AI Brain 4", "VirusTotal API", "Gemini 2.5 Flash"],
    actions: ["VirusTotal domain check", "Local AI scoring", "Return block/allow JSON", "Push to Wazuh", "Send email"],
  },
  "url-scheduled": {
    triggerType: "schedule",
    triggerLabel: "Schedule (every 1 minute)",
    aiModels: ["Local AI Brain 2", "VirusTotal API", "Gemini 2.5 Flash"],
    actions: ["Query Wazuh Elasticsearch DNS logs (last 6h)", "Deduplicate domains", "VirusTotal check", "Send email report"],
  },
};

export default function SOARPanel() {
  const { user } = useAuth();
  const { data: approaches, refetch } = trpc.soar.list.useQuery();
  const { data: settings } = trpc.settings.list.useQuery();

  // Resolve dynamic settings
  const getSetting = (key: string) => settings?.find(s => s.key === key)?.value ?? "";
  const n8nBaseUrl = getSetting("n8n_base_url") || "http://<n8n-host>:5678";
  const sshHost = getSetting("soar_ssh_host") || "<ssh-host>";
  const sshUser = getSetting("soar_ssh_user") || "ubuntu";
  const triggerMutation = trpc.soar.trigger.useMutation({
    onSuccess: () => { toast.success("IR workflow triggered successfully"); refetch(); },
    onError: (e) => toast.error(`Trigger failed: ${e.message}`),
  });

  const isAnalystOrAdmin = ["Admin", "admin", "Analyst"].includes(user?.role ?? "");
  const isAdmin = user?.role === "Admin" || user?.role === "admin";

  // Edit config state
  const [editingApproach, setEditingApproach] = useState<any>(null);
  const [editForm, setEditForm] = useState({ webhookUrl: "", description: "" });

  const updateSoarMutation = trpc.soar.update.useMutation({
    onSuccess: () => {
      toast.success("IR Approach configuration updated");
      setEditingApproach(null);
      refetch();
    },
    onError: (e) => toast.error(`Update failed: ${e.message}`),
  });

  const handleEditClick = (approach: any) => {
    setEditingApproach(approach);
    setEditForm({
      webhookUrl: approach.webhookUrl || "",
      description: approach.description || "",
    });
  };

  const submitEdit = () => {
    if (!editingApproach) return;
    updateSoarMutation.mutate({
      id: editingApproach.id,
      webhookUrl: editForm.webhookUrl || undefined,
      description: editForm.description || undefined
    });
  };

  const totalTriggers = (approaches ?? []).reduce((sum, a) => sum + (a.triggerCount ?? 0), 0);
  const activeApproaches = (approaches ?? []).filter(a => a.enabled).length;
  const webhookApproaches = (approaches ?? []).filter(a => a.webhookUrl).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Zap className="w-6 h-6 text-pink-400" />
            n8n SOAR Panel
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Incident Response automation — 5 workflows running on n8n at{" "}
            <code className="text-primary/80 font-mono text-xs">{n8nBaseUrl}</code>
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "IR Approaches", value: approaches?.length ?? 5, icon: Zap, color: "text-pink-400" },
          { label: "Active", value: activeApproaches, icon: Activity, color: "text-emerald-400" },
          { label: "Webhook-Triggered", value: webhookApproaches, icon: Webhook, color: "text-cyan-400" },
          { label: "Total Triggers", value: totalTriggers, icon: Play, color: "text-orange-400" },
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

      {/* IR Approach Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(approaches ?? []).map(approach => {
          const Icon = approachIcons[approach.slug] ?? Zap;
          const colors = approachColors[approach.slug] ?? approachColors.ip;
          const meta = approachMeta[approach.slug];

          return (
            <Card key={approach.id} className={`bg-card border relative overflow-hidden ${colors.card}`}>
              {/* Left accent bar */}
              <div className={`absolute top-0 left-0 w-0.5 h-full`}
                style={{ background: `var(--tw-gradient-stops, currentColor)` }} />

              <CardHeader className="pb-2 pl-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-md border flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{approach.name} IR</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        approach.enabled
                          ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
                          : "text-slate-400 bg-slate-400/10 border-slate-400/30"
                      }`}>
                        {approach.enabled ? "ACTIVE" : "INACTIVE"}
                      </span>
                      {meta && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${colors.badge}`}>
                          {meta.triggerType === "webhook" ? "WEBHOOK" : meta.triggerType === "schedule" ? "SCHEDULED" : "HYBRID"}
                        </span>
                      )}
                      {isAdmin && (
                        <button onClick={() => handleEditClick(approach)} className="text-muted-foreground hover:text-primary transition-colors ml-auto">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="pl-4 space-y-3">
                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed">{approach.description}</p>

                {/* Trigger info */}
                {meta && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Trigger</p>
                    <div className="flex items-center gap-2 bg-muted/20 rounded px-2 py-1.5 border border-border">
                      {meta.triggerType === "webhook" || meta.triggerType === "webhook+schedule"
                        ? <Webhook className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        : <CalendarClock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      }
                      <code className="text-[10px] font-mono text-primary/80 truncate">{meta.triggerLabel}</code>
                    </div>
                  </div>
                )}

                {/* Webhook URL */}
                {approach.webhookUrl && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Webhook Endpoint</p>
                    <div className="flex items-center gap-2 bg-muted/30 rounded px-2 py-1.5 border border-border">
                      <Link className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <code className="text-[10px] font-mono text-primary/80 truncate flex-1">{approach.webhookUrl}</code>
                    </div>
                  </div>
                )}

                {/* No webhook — schedule-only */}
                {!approach.webhookUrl && (
                  <div className="flex items-center gap-2 text-xs text-blue-400/80 bg-blue-400/5 border border-blue-400/20 rounded px-2 py-1.5">
                    <CalendarClock className="w-3 h-3 flex-shrink-0" />
                    <span>Schedule-triggered — no external webhook endpoint</span>
                  </div>
                )}

                {/* AI Models used */}
                {meta?.aiModels && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1">
                      <Brain className="w-3 h-3" /> AI Models
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {meta.aiModels.map(m => (
                        <span key={m} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary/80">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* IR Actions */}
                {meta?.actions && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Actions
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {meta.actions.map(a => (
                        <span key={a} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/40 border border-border text-muted-foreground">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* SSH IR Command (IP & Behavior only) */}
                {meta?.irCommand && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1">
                      <Terminal className="w-3 h-3" /> IR Command (SSH)
                    </p>
                    <div className="bg-black/40 rounded px-2 py-1.5 border border-border">
                      <code className="text-[10px] font-mono text-emerald-400/80 break-all">
                        {meta.irCommand
                          .replace("{SSH_USER}", sshUser || "ubuntu")
                          .replace("{SSH_HOST}", sshHost || "<ssh-host>")}
                      </code>
                    </div>
                  </div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-border">
                  <div>
                    <p className="text-muted-foreground/60 font-mono uppercase text-[10px]">Trigger Count</p>
                    <p className="font-mono text-foreground font-bold">{approach.triggerCount ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground/60 font-mono uppercase text-[10px]">Last Triggered</p>
                    <p className="font-mono text-foreground text-[11px]">
                      {approach.lastTriggered
                        ? new Date(approach.lastTriggered).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                </div>

                {/* Trigger Button */}
                {isAnalystOrAdmin && approach.webhookUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs font-mono border-primary/30 text-primary hover:bg-primary/10"
                    disabled={!approach.enabled || triggerMutation.isPending}
                    onClick={() => triggerMutation.mutate({ id: approach.id })}
                  >
                    <Play className="w-3 h-3 mr-1.5" />
                    TRIGGER WEBHOOK
                  </Button>
                )}
                {isAnalystOrAdmin && !approach.webhookUrl && (
                  <div className="text-[10px] text-muted-foreground/50 text-center font-mono py-1">
                    Schedule-triggered — cannot be manually triggered via webhook
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ═══════════ EDIT CONFIGURATION DIALOG ═══════════ */}
      <Dialog open={!!editingApproach} onOpenChange={(open) => !open && setEditingApproach(null)}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit IR Approach Config</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update webhook settings for <span className="font-mono text-primary">{editingApproach?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="webhook" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Webhook URL</Label>
              <Input
                id="webhook"
                value={editForm.webhookUrl}
                onChange={(e) => setEditForm(f => ({ ...f, webhookUrl: e.target.value }))}
                placeholder={`${n8nBaseUrl}/webhook/...`}
                className="bg-background/50 border-border font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                The n8n webhook endpoint URL that this IR approach triggers. Leave empty for schedule-only approaches.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea
                id="desc"
                value={editForm.description}
                onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                className="bg-background/50 border-border text-sm min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingApproach(null)}>Cancel</Button>
            <Button onClick={submitEdit} disabled={updateSoarMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {updateSoarMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
