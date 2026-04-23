import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Zap, Save, RefreshCw, AlertCircle } from "lucide-react";

export function WazuhSettings() {
  const [formData, setFormData] = useState({
    apiUrl: "",
    apiUsername: "",
    apiPassword: "",
    elasticsearchUrl: "",
    elasticsearchUsername: "",
    elasticsearchPassword: "",
    alertIndexPattern: "wazuh-alerts-*",
    refreshInterval: 5,
    alertLimit: 50,
    enabled: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    apiPassword: false,
    elasticsearchPassword: false,
  });

  const { data: settings } = trpc.wazuh.getSettings.useQuery();
  const updateMutation = trpc.wazuh.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Wazuh settings saved successfully");
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error(`Failed to save settings: ${error.message}`);
      setIsSaving(false);
    },
  });

  const [testLoading, setTestLoading] = React.useState(false);

  const handleTestConnection = async () => {
    setTestLoading(true);
    try {
      const result = await (trpc.wazuh.testConnection as any).query();
      if (result.success) {
        toast.success("Wazuh connection successful!");
      } else {
        toast.error(`Connection failed: ${result.message}`);
      }
    } catch (error: any) {
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setTestLoading(false);
    }
  }

  useEffect(() => {
    if (settings) {
      setFormData({
        apiUrl: settings.apiUrl || "",
        apiUsername: settings.apiUsername || "",
        apiPassword: settings.apiPassword || "",
        elasticsearchUrl: settings.elasticsearchUrl || "",
        elasticsearchUsername: settings.elasticsearchUsername || "",
        elasticsearchPassword: settings.elasticsearchPassword || "",
        alertIndexPattern: settings.alertIndexPattern || "wazuh-alerts-*",
        refreshInterval: settings.refreshInterval || 5,
        alertLimit: settings.alertLimit || 50,
        enabled: settings.enabled !== false,
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateMutation.mutateAsync(formData);
  };



  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <CardTitle className="text-sm font-semibold text-foreground">
              Wazuh Configuration
            </CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleTestConnection}
            disabled={testLoading || !formData.elasticsearchUrl}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testLoading ? 'animate-spin' : ''}`} />
            {testLoading ? 'Testing...' : 'Test Connection'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Info banner */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Configure your Wazuh API and Elasticsearch endpoints to enable real-time alert monitoring on the Dashboard.
          </p>
        </div>

        {/* Elasticsearch Configuration */}
        <div className="space-y-3 p-3 bg-muted/30 rounded-md border border-border">
          <h3 className="text-xs font-semibold text-foreground">Elasticsearch Configuration</h3>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Elasticsearch URL</label>
            <Input
              type="text"
              placeholder="https://192.168.1.14:9200"
              value={formData.elasticsearchUrl}
              onChange={(e) => handleChange("elasticsearchUrl", e.target.value)}
              className="mt-1 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Username (optional)</label>
              <Input
                type="text"
                placeholder="elastic"
                value={formData.elasticsearchUsername}
                onChange={(e) => handleChange("elasticsearchUsername", e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Password (optional)</label>
              <Input
                type={showPasswords.elasticsearchPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.elasticsearchPassword}
                onChange={(e) => handleChange("elasticsearchPassword", e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Alert Index Pattern</label>
            <Input
              type="text"
              placeholder="wazuh-alerts-*"
              value={formData.alertIndexPattern}
              onChange={(e) => handleChange("alertIndexPattern", e.target.value)}
              className="mt-1 text-sm"
            />
          </div>
        </div>

        {/* Alert Display Settings */}
        <div className="space-y-3 p-3 bg-muted/30 rounded-md border border-border">
          <h3 className="text-xs font-semibold text-foreground">Alert Display Settings</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Refresh Interval (seconds)</label>
              <Input
                type="number"
                min="1"
                max="60"
                value={formData.refreshInterval}
                onChange={(e) => handleChange("refreshInterval", parseInt(e.target.value))}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Alert Limit</label>
              <Input
                type="number"
                min="10"
                max="500"
                value={formData.alertLimit}
                onChange={(e) => handleChange("alertLimit", parseInt(e.target.value))}
                className="mt-1 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="wazuh-enabled"
              checked={formData.enabled}
              onChange={(e) => handleChange("enabled", e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            <label htmlFor="wazuh-enabled" className="text-xs font-medium text-muted-foreground cursor-pointer">
              Enable Wazuh alert monitoring
            </label>
          </div>
        </div>

        {/* Wazuh API Configuration (Optional) */}
        <details className="text-xs">
          <summary className="font-medium text-muted-foreground cursor-pointer hover:text-foreground">
            Advanced: Wazuh API Configuration (Optional)
          </summary>
          <div className="space-y-3 mt-3 p-3 bg-muted/30 rounded-md border border-border">
            <p className="text-xs text-muted-foreground">
              These settings are optional. The widget primarily uses Elasticsearch for alert fetching.
            </p>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Wazuh API URL</label>
              <Input
                type="text"
                placeholder="https://192.168.1.14:55000"
                value={formData.apiUrl}
                onChange={(e) => handleChange("apiUrl", e.target.value)}
                className="mt-1 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">API Username</label>
                <Input
                  type="text"
                  placeholder="wazuh"
                  value={formData.apiUsername}
                  onChange={(e) => handleChange("apiUsername", e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">API Password</label>
                <Input
                  type={showPasswords.apiPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.apiPassword}
                  onChange={(e) => handleChange("apiPassword", e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>
            </div>
          </div>
        </details>

        {/* Save Button */}
        <div className="flex gap-2 pt-3 border-t border-border">
          <Button
            onClick={handleSave}
            disabled={isSaving || updateMutation.isPending}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
