import React, { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WazuhAlert {
  id: string;
  timestamp: string;
  rule_id: string;
  rule_description: string;
  severity: number;
  agent_id: string;
  agent_name: string;
  source_ip?: string;
  destination_ip?: string;
  action: string;
}

const severityColors: Record<number, string> = {
  0: "bg-gray-100 text-gray-800",
  1: "bg-blue-100 text-blue-800",
  2: "bg-cyan-100 text-cyan-800",
  3: "bg-green-100 text-green-800",
  4: "bg-yellow-100 text-yellow-800",
  5: "bg-orange-100 text-orange-800",
  6: "bg-red-100 text-red-800",
  7: "bg-red-200 text-red-900",
  8: "bg-red-300 text-red-950",
  9: "bg-red-400 text-red-950",
  10: "bg-red-500 text-white",
  11: "bg-red-600 text-white",
  12: "bg-red-700 text-white",
  13: "bg-red-800 text-white",
  14: "bg-red-900 text-white",
  15: "bg-black text-white",
};

const severityLabels: Record<number, string> = {
  0: "Info",
  1: "Low",
  2: "Low",
  3: "Medium",
  4: "Medium",
  5: "Medium",
  6: "High",
  7: "High",
  8: "Critical",
  9: "Critical",
  10: "Critical",
  11: "Critical",
  12: "Critical",
  13: "Critical",
  14: "Critical",
  15: "Critical",
};

export function WazuhAlertFeed() {
  const [alerts, setAlerts] = useState<WazuhAlert[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: alertsData, isLoading, refetch } = trpc.wazuh.getAlerts.useQuery(
    { limit: 50 },
    {
      refetchInterval: 5000, // Auto-refresh every 5 seconds
      enabled: true,
    }
  );

  useEffect(() => {
    if (alertsData?.success && alertsData.alerts) {
      setAlerts(alertsData.alerts);
      setLastUpdate(new Date());
      setError(null);
    } else if (!alertsData?.success) {
      setError(alertsData?.error || "Failed to fetch alerts");
    }
  }, [alertsData]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getSeverityColor = (severity: number) => {
    return severityColors[severity] || severityColors[0];
  };

  const getSeverityLabel = (severity: number) => {
    return severityLabels[severity] || "Unknown";
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <CardTitle>Wazuh Security Alerts</CardTitle>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Updated {formatTime(lastUpdate.toISOString())}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRefresh}
          disabled={isRefreshing || isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Connection Error</p>
              <p className="text-xs text-red-700">{error}</p>
              <p className="text-xs text-red-600 mt-1">
                Configure Wazuh settings in System Settings to enable alerts.
              </p>
            </div>
          </div>
        )}

        {isLoading && !alerts.length && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin">
              <RefreshCw className="h-6 w-6 text-gray-400" />
            </div>
          </div>
        )}

        {alerts.length === 0 && !isLoading && !error && (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No alerts at the moment</p>
          </div>
        )}

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {getSeverityLabel(alert.severity)}
                    </Badge>
                    <span className="text-xs font-mono text-gray-600">
                      {alert.rule_id}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {alert.rule_description}
                  </p>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <p>
                      <span className="font-medium">Agent:</span> {alert.agent_name} (
                      {alert.agent_id})
                    </p>
                    {alert.source_ip && (
                      <p>
                        <span className="font-medium">Source:</span> {alert.source_ip}
                      </p>
                    )}
                    {alert.destination_ip && (
                      <p>
                        <span className="font-medium">Destination:</span>{" "}
                        {alert.destination_ip}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Action:</span> {alert.action}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {formatTime(alert.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {alerts.length > 0 && (
          <div className="mt-3 text-xs text-gray-500 text-center">
            Showing {String(alerts.length)} recent alerts (auto-refreshing every 5 seconds)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
