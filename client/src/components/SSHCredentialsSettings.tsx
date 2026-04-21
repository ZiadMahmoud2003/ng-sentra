import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Trash2, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SSHCredentialsSettings() {
  const [credentials, setCredentials] = useState<Record<number, any>>({});
  const [editingComponentId, setEditingComponentId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    host: "",
    port: 22,
    username: "",
    password: "",
    description: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: components } = trpc.components.list.useQuery();
  const { data: allCredentials } = trpc.ssh.credentials.getAll.useQuery();
  const upsertMutation = trpc.ssh.credentials.upsert.useMutation();
  const deleteMutation = trpc.ssh.credentials.delete.useMutation();

  useEffect(() => {
    if (allCredentials) {
      const credMap: Record<number, any> = {};
      allCredentials.forEach((cred: any) => {
        credMap[cred.componentId] = cred;
      });
      setCredentials(credMap);
    }
  }, [allCredentials]);

  const handleEdit = (componentId: number) => {
    const cred = credentials[componentId];
    if (cred) {
      setFormData({
        host: cred.host,
        port: cred.port,
        username: cred.username,
        password: cred.password,
        description: cred.description || "",
      });
    } else {
      setFormData({
        host: "",
        port: 22,
        username: "",
        password: "",
        description: "",
      });
    }
    setEditingComponentId(componentId);
    setMessage(null);
  };

  const handleSave = async () => {
    if (!editingComponentId) return;
    if (!formData.host || !formData.username || !formData.password) {
      setMessage({ type: "error", text: "Host, username, and password are required" });
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        componentId: editingComponentId,
        host: formData.host,
        port: formData.port,
        username: formData.username,
        password: formData.password,
        description: formData.description || undefined,
      });
      setMessage({ type: "success", text: "SSH credentials saved successfully" });
      setEditingComponentId(null);
      // Refetch credentials
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const handleDelete = async (componentId: number) => {
    if (!confirm("Are you sure you want to delete SSH credentials for this component?")) return;

    try {
      await deleteMutation.mutateAsync({ componentId });
      setMessage({ type: "success", text: "SSH credentials deleted successfully" });
      setEditingComponentId(null);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const nonIframeComponents = components?.filter((c: any) => !["wazuh", "tpot"].includes(c.slug)) || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">SSH Credentials Management</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure SSH credentials for each component. These credentials will be used when users click "Open SSH" on component cards.
        </p>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {editingComponentId ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit SSH Credentials</CardTitle>
            <CardDescription>
              {components?.find((c: any) => c.id === editingComponentId)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="host">Host / IP Address *</Label>
              <Input
                id="host"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                placeholder="192.168.1.10 or example.com"
              />
            </div>

            <div>
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                min="1"
                max="65535"
              />
            </div>

            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="admin"
              />
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Primary Snort IDS"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={upsertMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save Credentials
              </Button>
              <Button variant="outline" onClick={() => setEditingComponentId(null)}>
                Cancel
              </Button>
              {credentials[editingComponentId] && (
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(editingComponentId)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {nonIframeComponents.map((component: any) => {
            const cred = credentials[component.id];
            return (
              <Card key={component.id}>
                <CardHeader>
                  <CardTitle className="text-base">{component.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {cred ? (
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Host:</span> {cred.host}:{cred.port}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Username:</span> {cred.username}
                      </div>
                      {cred.description && (
                        <div>
                          <span className="text-muted-foreground">Description:</span> {cred.description}
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(component.id)}
                        className="mt-2"
                      >
                        Edit
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No SSH credentials configured
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(component.id)}
                        className="mt-2"
                      >
                        Add Credentials
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
