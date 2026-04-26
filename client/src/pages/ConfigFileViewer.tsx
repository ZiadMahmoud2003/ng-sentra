import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft, Copy, Check, AlertTriangle, FileText, Terminal, Code, Loader2, X
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import WebTerminal from "@/components/WebTerminal";

const configPaths: Record<string, { path: string; description: string }> = {
  filebeat: {
    path: "/etc/filebeat/filebeat.yml",
    description: "Filebeat configuration file for log shipping",
  },
  ufw: {
    path: "/etc/ufw/ufw.conf",
    description: "UFW firewall configuration",
  },
  snort: {
    path: "/etc/snort/snort.conf",
    description: "Snort IDS configuration file",
  },
};

export default function ConfigFileViewer() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);
  const [useEmbeddedTerminal, setUseEmbeddedTerminal] = useState(true);

  const { data: components } = trpc.components.list.useQuery();
  const { data: settings } = trpc.settings.list.useQuery();
  const { data: configData, isLoading: isLoadingConfig } = trpc.ssh.readConfig.useQuery(
    { filePath: configPaths[slug]?.path ?? "" },
    { enabled: !!configPaths[slug] }
  );

  const component = components?.find(c => c.slug === slug);
  const configInfo = configPaths[slug];

  // Get SSH credentials from settings (for display only)
  const sshSettings = settings?.reduce((acc: any, s: any) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  const sshHost = sshSettings?.ssh_host ?? "192.168.1.14";
  const sshUser = sshSettings?.ssh_user ?? "ubuntu";

  const sshCommand = component?.customCommand
    ? `ssh -t ${sshUser}@${sshHost} "${component.customCommand}"`
    : `ssh ${sshUser}@${sshHost}`;
  const scpCommand = `scp ${sshUser}@${sshHost}:${configInfo?.path} ./`;

  const handleCopyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    toast.success("Command copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!component || !configInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Config file not found.</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/components")}>
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Components
          </Button>
        </div>
      </div>
    );
  }

  if (useEmbeddedTerminal) {
    return (
      <div className="w-full h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">{component.name} - Config Editor</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUseEmbeddedTerminal(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Terminal */}
        <div className="flex-1 overflow-hidden p-4">
          <WebTerminal componentSlug={slug} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/components")}
        className="text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to Components
      </Button>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{component.name} Configuration</h1>
        </div>
        <p className="text-sm text-muted-foreground">{configInfo.description}</p>
      </div>

      {/* SSH Connection Info */}
      <Card className="border-l-4 border-l-cyan-500 bg-cyan-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            SSH Connection Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-mono text-muted-foreground">SSH Host</span>
              <p className="font-mono text-sm text-foreground mt-1">{sshHost}</p>
            </div>
            <div>
              <span className="text-xs font-mono text-muted-foreground">SSH User</span>
              <p className="font-mono text-sm text-foreground mt-1">{sshUser}</p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono text-muted-foreground">Config File Path</span>
            <div className="flex items-center gap-2 bg-muted/30 border border-border rounded px-3 py-2">
              <code className="font-mono text-xs text-primary flex-1">{configInfo.path}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyCommand(configInfo.path)}
                className="h-6 px-2"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SSH Commands */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="w-4 h-4" />
            SSH Commands
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* SSH Connect */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Connect via SSH</span>
              <Badge variant="outline">Terminal</Badge>
            </div>
            <div className="flex items-center gap-2 bg-muted/30 border border-border rounded px-3 py-2 font-mono text-xs">
              <span className="text-primary flex-1">{sshCommand}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyCommand(sshCommand)}
                className="h-6 px-2"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Copy this command and run it in your terminal to connect to the SOC server.
            </p>
          </div>

          {/* SCP Download */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Download Config File</span>
              <Badge variant="outline">Download</Badge>
            </div>
            <div className="flex items-center gap-2 bg-muted/30 border border-border rounded px-3 py-2 font-mono text-xs">
              <span className="text-primary flex-1">{scpCommand}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyCommand(scpCommand)}
                className="h-6 px-2"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Copy this command and run it on your local machine to download the config file.
            </p>
          </div>

          {/* Edit Instructions */}
          <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
            <p className="text-xs text-blue-300/80">
              <strong>To edit the config file:</strong> Click "Open Terminal" below to launch an interactive SSH terminal, where you can type <code>nano {configInfo.path}</code>. Or download it using the SCP command above, edit it locally, then upload it back using:
            </p>
            <div className="mt-2 flex items-center gap-2 bg-muted/30 border border-border rounded px-3 py-2 font-mono text-xs">
              <span className="text-primary flex-1">scp ./{slug}.conf {sshUser}@{sshHost}:{configInfo.path}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyCommand(`scp ./${slug}.conf ${sshUser}@${sshHost}:${configInfo.path}`)}
                className="h-6 px-2"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                onClick={() => handleCopyCommand(sshCommand)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copy SSH
              </Button>
              <Button
                onClick={() => setUseEmbeddedTerminal(true)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Terminal className="w-3.5 h-3.5 mr-1.5" />
                Open Terminal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Config File Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Current Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingConfig ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">Loading config file...</span>
            </div>
          ) : configData?.success ? (
            <div className="bg-muted/30 border border-border rounded p-4 overflow-auto max-h-96">
              <pre className="font-mono text-xs text-foreground whitespace-pre-wrap break-words">
                {configData.content}
              </pre>
            </div>
          ) : (
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-300">Unable to Load Configuration</p>
                <p className="text-xs text-muted-foreground">
                  {configData?.error ?? "Could not read the config file from the server. Make sure SSH credentials are configured in System Settings."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
