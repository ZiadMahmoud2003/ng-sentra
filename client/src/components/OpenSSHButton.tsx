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

  const openSSH = () => {
    const { host, port = 22, username, password } = credentials;
    
    // Create SSH URI - this can be handled by SSH client or custom protocol handler
    // Format: ssh://username:password@host:port
    // Note: Some SSH clients support this format
    const sshUri = `ssh://${username}@${host}:${port}`;
    
    // Try to open with SSH protocol handler
    // This requires the user to have registered an SSH protocol handler
    // For Windows, this could be PuTTY, OpenSSH, or other SSH clients
    
    try {
      // Attempt 1: Use SSH URI protocol (if registered)
      window.location.href = sshUri;
      
      // Fallback after 2 seconds: Show copy-to-clipboard option
      setTimeout(() => {
        const command = `ssh -p ${port} ${username}@${host}`;
        navigator.clipboard.writeText(command);
        toast.info(
          `SSH command copied to clipboard: ${command}\n` +
          `Paste in your terminal and enter password: ${password}`
        );
      }, 2000);
    } catch (error) {
      console.error("Failed to open SSH URI:", error);
      const command = `ssh -p ${port} ${username}@${host}`;
      navigator.clipboard.writeText(command);
      toast.error("SSH protocol handler not found. Command copied to clipboard.");
    }
  };

  const copyCommand = () => {
    const { host, port = 22, username, password } = credentials;
    const command = `ssh -p ${port} ${username}@${host}`;
    const fullInfo = `Command: ${command}\nPassword: ${password}`;
    navigator.clipboard.writeText(fullInfo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("SSH command and password copied to clipboard!");
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
        title="Copy SSH command and password to clipboard"
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
