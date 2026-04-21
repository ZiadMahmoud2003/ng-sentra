import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Terminal, Copy, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OpenSSHButtonProps {
  componentId: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function OpenSSHButton({ componentId, variant = "default", size = "default" }: OpenSSHButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: credentials, isLoading } = trpc.ssh.credentials.getByComponent.useQuery(
    { componentId },
    { enabled: !!componentId }
  );

  const generateSSHCommand = () => {
    if (!credentials) {
      setError("SSH credentials not configured for this component");
      return null;
    }

    const { host, port, username, password } = credentials;
    // Generate sshpass command for automated login
    const sshCommand = `sshpass -p '${password}' ssh -p ${port} ${username}@${host}`;
    return sshCommand;
  };

  const handleOpenSSH = () => {
    const sshCommand = generateSSHCommand();
    if (!sshCommand) return;

    // Copy command to clipboard
    navigator.clipboard.writeText(sshCommand).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Open user's default terminal/SSH client
      // For Windows: open PowerShell with the command
      if (navigator.platform.includes("Win")) {
        const psCommand = `powershell -Command "${sshCommand}"`;
        // Create a hidden form to trigger download (workaround for opening terminal)
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "data:text/plain," + encodeURIComponent(psCommand);
        form.target = "_blank";
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      } else if (navigator.platform.includes("Mac")) {
        // For macOS: open Terminal with the command
        const osascript = `osascript -e 'tell application "Terminal" to do script "${sshCommand}"'`;
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "data:text/plain," + encodeURIComponent(osascript);
        form.target = "_blank";
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      } else {
        // For Linux: open terminal with the command
        const command = `x-terminal-emulator -e "${sshCommand}"`;
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "data:text/plain," + encodeURIComponent(command);
        form.target = "_blank";
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      }
    });
  };

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

  return (
    <div className="space-y-2">
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenSSH}
        className="gap-2"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied!
          </>
        ) : (
          <>
            <Terminal className="h-4 w-4" />
            Open SSH
          </>
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {copied && (
        <div className="text-xs text-muted-foreground">
          SSH command copied to clipboard. Paste it in your terminal to connect.
        </div>
      )}
    </div>
  );
}
