import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Terminal, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface OpenSSHButtonProps {
  componentId: number;
  componentName?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function OpenSSHButton({
  componentId,
  componentName = "Component",
  variant = "default",
  size = "default",
}: OpenSSHButtonProps) {
  const [copied, setCopied] = useState(false);
  const { data: credentials, isLoading } = trpc.ssh.credentials.getByComponent.useQuery(
    { componentId },
    { enabled: !!componentId }
  );

  if (isLoading) {
    return (
      <Button variant={variant} size={size} disabled>
        <Terminal className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  if (!credentials) {
    return (
      <Button variant={variant} size={size} disabled title="SSH credentials not configured">
        <Terminal className="h-4 w-4 mr-2" />
        No SSH
      </Button>
    );
  }

  const generateSSHCommand = () => {
    const { host, port = 22, username, password } = credentials;
    // Use sshpass to auto-fill password
    return `sshpass -p "${password}" ssh -p ${port} ${username}@${host}`;
  };

  const openTerminal = () => {
    const command = generateSSHCommand();
    
    // Detect platform
    const isWindows = navigator.platform.includes("Win");
    const isMac = navigator.platform.includes("Mac");
    
    if (isWindows) {
      // Windows: Create and execute a PowerShell script
      const psCommand = `Start-Process powershell -ArgumentList "-NoExit", "-Command", "${command.replace(/"/g, '\\"')}"`;
      
      // Use a data URI to trigger download of a .ps1 file
      const encodedCommand = encodeURIComponent(psCommand);
      const blob = new Blob([psCommand], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ssh-${componentName.toLowerCase()}.ps1`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.info(`PowerShell script downloaded. Run it to open SSH terminal to ${componentName}`);
    } else if (isMac) {
      // macOS: Use osascript to open Terminal
      const osascript = `tell application "Terminal"
        activate
        do script "${command}"
      end tell`;
      
      const blob = new Blob([osascript], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ssh-${componentName.toLowerCase()}.scpt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.info(`AppleScript downloaded. Run it to open SSH terminal to ${componentName}`);
    } else {
      // Linux: Copy command to clipboard
      navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(`SSH command copied! Paste in your terminal to connect to ${componentName}`);
    }
  };

  const copyCommand = () => {
    const command = generateSSHCommand();
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("SSH command copied to clipboard!");
  };

  return (
    <div className="flex gap-2">
      <Button
        variant={variant}
        size={size}
        onClick={openTerminal}
        className="gap-2"
        title={`Open SSH terminal to ${componentName}`}
      >
        <Terminal className="h-4 w-4" />
        Open SSH
      </Button>
      <Button
        variant="outline"
        size={size}
        onClick={copyCommand}
        className="gap-2"
        title="Copy SSH command to clipboard"
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
