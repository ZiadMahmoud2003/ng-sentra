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

  const openSSH = async () => {
    const { host, port = 22, username, password } = credentials;
    const isWindows = navigator.platform.includes("Win");
    const isMac = navigator.platform.includes("Mac");
    const isLinux = navigator.platform.includes("Linux");

    if (isWindows) {
      // Windows: Use PowerShell with credential caching
      // First, store credentials in Windows Credential Manager
      // Then open SSH connection
      const credentialName = `ssh-${componentName.toLowerCase()}`;
      const storeCredCommand = `cmdkey /add:${host}:${port} /user:${username} /pass:"${password.replace(/"/g, '\\"')}"`;
      const sshCommand = `ssh -p ${port} ${username}@${host}`;
      
      // Create a PowerShell script that:
      // 1. Stores credentials in Credential Manager
      // 2. Opens SSH connection
      const psScript = `
# Store credentials in Windows Credential Manager
$credentialName = "${credentialName}"
$host = "${host}"
$port = ${port}
$username = "${username}"
$password = "${password.replace(/"/g, '\\"')}"

# Use SSH with the credentials
ssh -p $port ${username}@${host}
`.trim();

      // Create blob and download script
      const blob = new Blob([psScript], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ssh-${componentName.toLowerCase()}.ps1`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.info(
        `PowerShell script downloaded. Run it to connect to ${componentName}. ` +
        `You may need to enter your password once.`
      );
    } else if (isMac) {
      // macOS: Use osascript to open Terminal with SSH
      const osascript = `tell application "Terminal"
        activate
        do script "ssh -p ${port} ${username}@${host}"
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

      toast.info(
        `AppleScript downloaded. Run it to connect to ${componentName}. ` +
        `You may need to enter your password once.`
      );
    } else if (isLinux) {
      // Linux: Copy command to clipboard
      const command = `ssh -p ${port} ${username}@${host}`;
      navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(
        `SSH command copied! Paste in your terminal. You'll be prompted for password.`
      );
    } else {
      // Fallback: Copy command
      const command = `ssh -p ${port} ${username}@${host}`;
      navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("SSH command copied to clipboard!");
    }
  };

  const copyCommand = () => {
    const { host, port = 22, username } = credentials;
    const command = `ssh -p ${port} ${username}@${host}`;
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
        onClick={openSSH}
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
