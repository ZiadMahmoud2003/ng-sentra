import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings, Save, Shield, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

type ComponentEdit = {
  url: string;
  port: string;
  description: string;
  enabled: boolean;
};

export default function AdminComponents() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: components, refetch } = trpc.components.list.useQuery();
  const updateMutation = trpc.components.update.useMutation({
    onSuccess: () => { toast.success("Component updated successfully"); refetch(); },
    onError: (e) => toast.error(`Update failed: ${e.message}`),
  });

  const [edits, setEdits] = useState<Record<number, ComponentEdit>>({});
  const [saving, setSaving] = useState<number | null>(null);

  const isAdmin = user?.role === "Admin" || user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) navigate("/");
  }, [isAdmin]);

  useEffect(() => {
    if (components) {
      const initial: Record<number, ComponentEdit> = {};
      components.forEach(c => {
        initial[c.id] = {
          url: c.url ?? "",
          port: c.port?.toString() ?? "",
          description: c.description ?? "",
          enabled: c.enabled,
        };
      });
      setEdits(initial);
    }
  }, [components]);

  const handleSave = async (id: number) => {
    const edit = edits[id];
    if (!edit) return;
    setSaving(id);
    await updateMutation.mutateAsync({
      id,
      url: edit.url || undefined,
      port: edit.port ? parseInt(edit.port) : null,
      description: edit.description || undefined,
      enabled: edit.enabled,
    });
    setSaving(null);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Settings className="w-6 h-6 text-primary" />
          Component Configuration
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure URLs, ports, and settings for all 11 SOC backend components
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(components ?? []).map(comp => {
          const edit = edits[comp.id];
          if (!edit) return null;
          return (
            <Card key={comp.id} className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  {comp.name}
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border ml-1">
                    {comp.category}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <Label htmlFor={`enabled-${comp.id}`} className="text-xs text-muted-foreground">Enabled</Label>
                    <Switch
                      id={`enabled-${comp.id}`}
                      checked={edit.enabled}
                      onCheckedChange={v => setEdits(prev => ({ ...prev, [comp.id]: { ...prev[comp.id], enabled: v } }))}
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs text-muted-foreground">URL / Host</Label>
                    <Input
                      value={edit.url}
                      onChange={e => setEdits(prev => ({ ...prev, [comp.id]: { ...prev[comp.id], url: e.target.value } }))}
                      placeholder="http://192.168.1.x"
                      className="h-8 text-xs font-mono bg-input border-border"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Port</Label>
                    <Input
                      value={edit.port}
                      onChange={e => setEdits(prev => ({ ...prev, [comp.id]: { ...prev[comp.id], port: e.target.value } }))}
                      placeholder={comp.port?.toString() ?? "—"}
                      className="h-8 text-xs font-mono bg-input border-border"
                      type="number"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Input
                    value={edit.description}
                    onChange={e => setEdits(prev => ({ ...prev, [comp.id]: { ...prev[comp.id], description: e.target.value } }))}
                    placeholder="Component description..."
                    className="h-8 text-xs bg-input border-border"
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full h-7 text-xs font-mono"
                  onClick={() => handleSave(comp.id)}
                  disabled={saving === comp.id || updateMutation.isPending}
                >
                  <Save className="w-3 h-3 mr-1.5" />
                  {saving === comp.id ? "SAVING..." : "SAVE CHANGES"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
