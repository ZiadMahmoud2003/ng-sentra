import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { ShieldAlert, Activity, RefreshCw, RefreshCwOff, Zap, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ThreatAlert {
  id: string;
  time: string;
  model: string;
  type: string;
  score: string;
  target: string;
  description: string;
}

export default function AIThreatFeed() {
  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);
  const seenHashes = useRef<Set<string>>(new Set());
  const [autoPoll, setAutoPoll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: models, refetch } = trpc.aiModels.list.useQuery(undefined, {
    refetchInterval: autoPoll ? 10000 : false,
  });

  const healthCheckAll = trpc.aiModels.healthCheck.useMutation({
    onSuccess: (data) => {
      processLogs(data.results);
      refetch();
    }
  });

  // Auto-poll interval
  useEffect(() => {
    if (!autoPoll) return;
    // Initial fetch
    healthCheckAll.mutate();
    
    const id = setInterval(() => {
      healthCheckAll.mutate();
    }, 10000);
    return () => clearInterval(id);
  }, [autoPoll]);

  // Initial logs load from DB
  useEffect(() => {
    if (models) processLogs(models);
  }, [models]);

  const processLogs = (sourceModels: any[]) => {
    const newAlerts: ThreatAlert[] = [];
    const now = new Date().toLocaleTimeString();

    for (const m of sourceModels) {
      if (!m.recentOutput) continue;
      const lines = m.recentOutput.split('\n');
      for (const line of lines) {
        if (line.includes('[ALERT]')) {
          const hash = m.slug + ':' + line;
          if (!seenHashes.current.has(hash)) {
            seenHashes.current.add(hash);
            
            const parts = line.split('|').map((s: string) => s.trim());
            const type = parts[0]?.replace(/\[ALERT\]/g, '').trim() || 'Unknown';
            const score = parts[1] || 'N/A';
            const target = parts[2] || 'N/A';
            const description = parts.slice(3).join(' | ');

            newAlerts.push({
              id: Math.random().toString(36).substring(7),
              time: now,
              model: m.name || m.slug,
              type,
              score,
              target,
              description
            });
          }
        }
      }
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 500)); // keep last 500
    }
  };

  const filteredAlerts = alerts.filter(a => 
    a.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 cyber-grid-bg min-h-full">
      {/* ═══════════ HEADER ═══════════ */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                AI Threat Intelligence Feed
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Live streaming alerts detected by SOC AI engines
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant={autoPoll ? "default" : "outline"}
            className={`h-8 text-xs font-mono gap-1.5 ${autoPoll ? "bg-orange-500 hover:bg-orange-600 text-white border-none" : ""}`}
            onClick={() => setAutoPoll(!autoPoll)}>
            {autoPoll ? <Activity className="w-3 h-3 animate-pulse" /> : <RefreshCwOff className="w-3 h-3" />}
            {autoPoll ? "Live Stream Active" : "Stream Paused"}
          </Button>
          <Button size="sm" variant="outline"
            className="h-8 text-xs font-mono gap-1.5"
            onClick={() => healthCheckAll.mutate()}
            disabled={healthCheckAll.isPending || autoPoll}>
            <Zap className={`w-3 h-3 ${healthCheckAll.isPending ? "animate-pulse text-yellow-400" : ""}`} />
            {healthCheckAll.isPending ? "Fetching…" : "Fetch Now"}
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border shadow-lg overflow-hidden flex flex-col h-[70vh]">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search threat type, IP, or description..." 
              className="pl-9 h-9 bg-background/50 border-border font-mono text-xs"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 ml-auto text-xs font-mono text-muted-foreground">
            <Filter className="w-3 h-3" />
            Showing {filteredAlerts.length} of {alerts.length} threats
          </div>
        </div>

        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-black/40 text-muted-foreground/80 sticky top-0 backdrop-blur-md z-10 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-medium border-b border-border">Time</th>
                <th className="py-3 px-4 font-medium border-b border-border">Threat Type</th>
                <th className="py-3 px-4 font-medium border-b border-border">Confidence</th>
                <th className="py-3 px-4 font-medium border-b border-border">Target/Source</th>
                <th className="py-3 px-4 font-medium border-b border-border">AI Engine</th>
                <th className="py-3 px-4 font-medium border-b border-border w-1/3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-black/20">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground/50 font-mono text-xs">
                    {alerts.length === 0 ? "Awaiting live AI alerts... Turn on Live Stream." : "No alerts match your search."}
                  </td>
                </tr>
              ) : (
                filteredAlerts.map(alert => {
                  const scoreNum = parseFloat(alert.score);
                  const isHighRisk = scoreNum >= 0.8 || alert.type.toLowerCase().includes("critical");
                  const isMediumRisk = scoreNum >= 0.5 && scoreNum < 0.8;
                  
                  return (
                    <tr key={alert.id} className="hover:bg-muted/10 transition-colors font-mono text-[11px] group">
                      <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">{alert.time}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded border ${
                          isHighRisk ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          isMediumRisk ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                          "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                        }`}>
                          {alert.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`font-bold ${isHighRisk ? "text-red-400" : isMediumRisk ? "text-orange-400" : "text-cyan-400"}`}>
                          {alert.score}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">{alert.target}</td>
                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{alert.model}</td>
                      <td className="py-2.5 px-4 text-slate-300 break-words max-w-[300px]">
                        {alert.description}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
