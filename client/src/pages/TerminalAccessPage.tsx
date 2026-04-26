import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft, Copy, Check, Terminal, AlertCircle, Zap, Monitor, X
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import WebTerminal from "@/components/WebTerminal";

export default function TerminalAccessPage() {
  const [, navigate] = useLocation();
  const params = useParams();
  const slug = params?.slug;
  const isSift = slug === "digital-forensics";
  
  const [copied, setCopied] = useState(false);
  const [useEmbeddedTerminal, setUseEmbeddedTerminal] = useState(true);

  const { data: components } = trpc.components.list.useQuery();
  const component = components?.find(c => c.slug === slug);

  const { data: settings } = trpc.settings.list.useQuery();
  const { data: sshTestResult } = trpc.ssh.testConnection.useQuery();

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

  const handleCopyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    toast.success("Command copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (useEmbeddedTerminal) {
    return (
      <div className="w-full h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">{component?.name || "Terminal Access"} - SSH Terminal</h1>
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
          <WebTerminal componentSlug={slug || "df-workstation"} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
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
          <Monitor className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            {component?.name || "Terminal Access"}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {component?.description || "Access the component via SSH terminal."}
        </p>
      </div>

      {/* SSH Connection Status */}
      {sshTestResult && (
        <Card className={`border-l-4 ${sshTestResult.success ? "border-l-green-500 bg-green-500/5" : "border-l-red-500 bg-red-500/5"}`}>
          <CardContent className="pt-6 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${sshTestResult.success ? "bg-green-500" : "bg-red-500"}`} />
            <div>
              <p className="text-sm font-medium text-foreground">{sshTestResult.message}</p>
              {!sshTestResult.success && (
                <p className="text-xs text-muted-foreground mt-1">
                  Please check your SSH credentials in System Settings.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
            <span className="text-xs font-mono text-muted-foreground">Connection Command</span>
            <div className="flex items-center gap-2 bg-muted/30 border border-border rounded px-3 py-2 overflow-x-auto">
              <code className="font-mono text-xs text-primary whitespace-nowrap">{sshCommand}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyCommand(sshCommand)}
                className="h-6 px-2"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4" />
            How to Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3">
            <li className="flex gap-3">
              <Badge className="mt-0.5 flex-shrink-0">1</Badge>
              <div>
                <p className="text-sm font-medium text-foreground">Use Embedded Terminal</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click "Open Terminal" below to launch an interactive SSH terminal directly in your browser.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <Badge className="mt-0.5 flex-shrink-0">2</Badge>
              <div>
                <p className="text-sm font-medium text-foreground">Or Copy the SSH Command</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click the copy button above to copy the SSH connection command to your clipboard.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <Badge className="mt-0.5 flex-shrink-0">3</Badge>
              <div>
                <p className="text-sm font-medium text-foreground">Open Your Terminal</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Open a terminal or command prompt on your local machine (Windows: PowerShell, Mac/Linux: Terminal).
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <Badge className="mt-0.5 flex-shrink-0">4</Badge>
              <div>
                <p className="text-sm font-medium text-foreground">Paste and Execute</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Paste the SSH command and press Enter. You'll be prompted for the SSH password.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <Badge className="mt-0.5 flex-shrink-0">5</Badge>
              <div>
                <p className="text-sm font-medium text-foreground">Access the Workstation</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isSift 
                    ? "Once connected, you'll be inside the SIFT forensics Docker container as root."
                    : "Once connected, you'll have full terminal access to the workstation."}
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card className="bg-muted/30 border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Quick Reference
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p>
            <strong>SSH Port:</strong> 22 (default)
          </p>
          <p>
            <strong>Common DF Tools Available:</strong> Volatility, Autopsy, Sleuth Kit, strings, hexdump, and more.
          </p>
          <p>
            <strong>Forensic Evidence Location:</strong> Mounted volumes at <code>/evidence</code> and <code>/output</code> inside the SIFT container.
          </p>
          <p>
            <strong>Need Help?</strong> Contact your SOC administrator for access troubleshooting or tool-specific guidance.
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-4">
        <div className="flex gap-2">
          <Button
            onClick={() => handleCopyCommand(sshCommand)}
            className="flex-1 bg-primary hover:bg-primary/90"
            size="lg"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy SSH Command
          </Button>
          <Button
            onClick={() => setUseEmbeddedTerminal(true)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <Terminal className="w-4 h-4 mr-2" />
            Open Terminal
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/components")}
          size="lg"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Components
        </Button>
      </div>
    </div>
  );
}
