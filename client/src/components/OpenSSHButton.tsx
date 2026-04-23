import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";
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
    
    // Detect platform
    const isWindows = navigator.platform.includes("Win");
    const isMac = navigator.platform.includes("Mac");
    
    if (isWindows) {
      // Windows: Launch PuTTY with saved session
      // The session name should match the component name (e.g., "snort", "filebeat", etc.)
      const sessionName = componentName.toLowerCase();
      
      // Create a batch script that launches PuTTY
      const batchScript = `@echo off
start putty -load "${sessionName}"
exit
`;

      // Create blob and download script
      const blob = new Blob([batchScript], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `launch-${sessionName}.bat`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.info(
        `Batch script downloaded. Run it to launch PuTTY session for ${componentName}. ` +
        `Make sure you have created a PuTTY session named "${sessionName}".`
      );
    } else if (isMac) {
      // macOS: Use osascript to launch PuTTY or SSH
      const sessionName = componentName.toLowerCase();
      const sshCommand = `ssh -p ${port} ${username}@${host}`;
      
      const osascript = `tell application "Terminal"
        activate
        do script "${sshCommand}"
      end tell`;

      const blob = new Blob([osascript], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `launch-${sessionName}.scpt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.info(
        `AppleScript downloaded. Run it to connect to ${componentName}.`
      );
    } else {
      // Linux: Copy command to clipboard
      const command = `ssh -p ${port} ${username}@${host}`;
      navigator.clipboard.writeText(command);
      toast.success(
        `SSH command copied! Paste in your terminal to connect to ${componentName}.`
      );
    }
  };

  return (
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
  );
}
