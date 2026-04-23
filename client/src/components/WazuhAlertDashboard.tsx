import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, Clock, Filter, Download, RefreshCw } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

interface FilterState {
  severity: string;
  agent: string;
  action: string;
  searchTerm: string;
  dateRange: string;
}

const SEVERITY_COLORS: Record<number, string> = {
  3: '#ef4444', // red
  4: '#f97316', // orange
  5: '#eab308', // yellow
  6: '#3b82f6', // blue
  7: '#06b6d4', // cyan
  8: '#10b981', // green
};

const SEVERITY_LABELS: Record<number, string> = {
  3: 'Low',
  4: 'Medium',
  5: 'High',
  6: 'Critical',
  7: 'Emergency',
  8: 'Alert',
};

export function WazuhAlertDashboard() {
  const [filters, setFilters] = useState<FilterState>({
    severity: 'all',
    agent: 'all',
    action: 'all',
    searchTerm: '',
    dateRange: '24h',
  });

  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: alertsData, isLoading, refetch } = trpc.wazuh.getAlerts.useQuery(
    { limit: 50 },
    { refetchInterval: autoRefresh ? 5000 : false }
  );

  const alerts: WazuhAlert[] = (alertsData && 'alerts' in alertsData ? alertsData.alerts : alertsData) || [];

  // Filter and process alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const level = alert.severity;
      const agentId = alert.agent_id;
      const action = alert.action || 'unknown';
      const description = alert.rule_description.toLowerCase();

      if (filters.severity !== 'all' && level !== parseInt(filters.severity)) {
        return false;
      }
      if (filters.agent !== 'all' && agentId !== filters.agent) {
        return false;
      }
      if (filters.action !== 'all' && action !== filters.action) {
        return false;
      }
      if (filters.searchTerm && !description.includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [alerts, filters]);

  // Calculate statistics
  const stats = useMemo(() => {
    const severityCount: Record<number, number> = {};
    const agentCount: Record<string, number> = {};
    const hourlyCount: Record<string, number> = {};

    filteredAlerts.forEach((alert) => {
      const level = alert.severity;
      const agentId = alert.agent_id;
      const timestamp = new Date(alert.timestamp);
      const hour = timestamp.toISOString().slice(0, 13) + ':00';

      severityCount[level] = (severityCount[level] || 0) + 1;
      agentCount[agentId] = (agentCount[agentId] || 0) + 1;
      hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
    });

    return {
      total: filteredAlerts.length,
      critical: severityCount[6] || 0,
      high: severityCount[5] || 0,
      medium: severityCount[4] || 0,
      severityCount,
      agentCount,
      hourlyCount,
    };
  }, [filteredAlerts]);

  const chartData = useMemo(() => {
    return Object.entries(stats.hourlyCount)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-24)
      .map(([hour, count]) => ({
        time: new Date(hour).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        count,
      }));
  }, [stats.hourlyCount]);

  const severityChartData = useMemo(() => {
    return Object.entries(stats.severityCount)
      .map(([level, count]) => ({
        name: SEVERITY_LABELS[parseInt(level)] || 'Unknown',
        value: count,
        color: SEVERITY_COLORS[parseInt(level)] || '#6b7280',
      }))
      .filter((item) => item.value > 0);
  }, [stats.severityCount]);

  const uniqueAgents = useMemo(() => {
    return Array.from(new Set(alerts.map((a) => a.agent_id)));
  }, [alerts]);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(alerts.map((a) => a.action || 'unknown')));
  }, [alerts]);

  const handleExport = useCallback(() => {
    const csv = [
      ['Timestamp', 'Agent', 'Rule', 'Level', 'Description', 'Action', 'Source IP', 'Dest IP'],
      ...filteredAlerts.map((alert) => [
        alert.timestamp,
        alert.agent_name,
        alert.rule_id,
        alert.severity,
        alert.rule_description,
        alert.action || 'N/A',
        alert.source_ip || 'N/A',
        alert.destination_ip || 'N/A',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wazuh-alerts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }, [filteredAlerts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin">
          <RefreshCw className="w-8 h-8 text-cyan-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Alerts Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time Wazuh security event monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          <Button size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">Last 50 alerts</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-red-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-400">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{stats.critical}</div>
            <p className="text-xs text-gray-500 mt-1">Severity Level 6</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-orange-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-400">High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{stats.high}</div>
            <p className="text-xs text-gray-500 mt-1">Severity Level 5</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-yellow-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-400">Medium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">{stats.medium}</div>
            <p className="text-xs text-gray-500 mt-1">Severity Level 4</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Alert Timeline (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Search alerts..."
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters({ ...filters, searchTerm: e.target.value })
              }
              className="bg-slate-800 border-slate-700 text-white"
            />

            <Select value={filters.severity} onValueChange={(value) =>
              setFilters({ ...filters, severity: value })
            }>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="6">Critical</SelectItem>
                <SelectItem value="5">High</SelectItem>
                <SelectItem value="4">Medium</SelectItem>
                <SelectItem value="3">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.agent} onValueChange={(value) =>
              setFilters({ ...filters, agent: value })
            }>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Agents</SelectItem>
                {uniqueAgents.map((agent) => (
                  <SelectItem key={agent} value={agent}>
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.action} onValueChange={(value) =>
              setFilters({ ...filters, action: value })
            }>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  severity: 'all',
                  agent: 'all',
                  action: 'all',
                  searchTerm: '',
                  dateRange: '24h',
                })
              }
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Alerts ({filteredAlerts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Timestamp</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Agent</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Rule</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Severity</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Description</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.slice(0, 20).map((alert) => (
                  <tr key={alert.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-gray-300">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-gray-300">{alert.agent_name}</td>
                    <td className="py-3 px-4 text-gray-300">{alert.rule_id}</td>
                    <td className="py-3 px-4">
                      <Badge
                        style={{
                          backgroundColor: SEVERITY_COLORS[alert.severity],
                          color: '#fff',
                        }}
                      >
                        {SEVERITY_LABELS[alert.severity]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-300 max-w-xs truncate">
                      {alert.rule_description}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {alert.action || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
