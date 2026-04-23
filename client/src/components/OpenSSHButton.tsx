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
      // Windows: Use SSH with key file (password field contains key path)
      // Format: ssh -i "C:\Users\ZIAD\.ssh\id_rsa" -p 2222 ziad@192.168.1.14
      const keyPath = password; // In this case, password field stores the key path
      const sshCommand = `ssh -i "${keyPath}" -p ${port} ${username}@${host}`;
      
      // Create PowerShell script that opens terminal and runs SSH
      const psScript = `
Start-Process powershell -ArgumentList "-NoExit", "-Command", "${sshCommand.replace(/"/g, '\\"')}"
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
        `It will automatically open SSH with your key.`
      );
    } else if (isMac) {
      // macOS: Use osascript to open Terminal with SSH
      const keyPath = password;
      const sshCommand = `ssh -i "${keyPath}" -p ${port} ${username}@${host}`;
      
      const osascript = `tell application "Terminal"
        activate
        do script "${sshCommand}"
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
        `It will automatically open SSH with your key.`
      );
    } else {
      // Linux: Copy command to clipboard
      const keyPath = password;
      const command = `ssh -i "${keyPath}" -p ${port} ${username}@${host}`;
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
