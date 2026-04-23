import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";
import { BrowserSSHTerminal } from "./BrowserSSHTerminal";

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
  const [showTerminal, setShowTerminal] = useState(false);
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

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowTerminal(true)}
        className="gap-2"
      >
        <Terminal className="h-4 w-4" />
        Open SSH
      </Button>

      {showTerminal && (
        <BrowserSSHTerminal
          componentId={componentId}
          componentName={componentName}
          onClose={() => setShowTerminal(false)}
        />
      )}
    </>
  );
}
