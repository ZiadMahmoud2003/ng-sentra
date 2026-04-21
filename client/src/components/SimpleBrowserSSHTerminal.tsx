import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "xterm-addon-fit";
import "@xterm/xterm/css/xterm.css";
import { AlertCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimpleBrowserSSHTerminalProps {
  host: string;
  user: string;
  password: string;
  filePath?: string;
}

export default function SimpleBrowserSSHTerminal({
  host,
  user,
  password,
  filePath,
}: SimpleBrowserSSHTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const [copied, setCopied] = useState(false);

  const sshCommand = `ssh ${user}@${host}`;
  const scpCommand = `scp ${user}@${host}:${filePath} ./`;

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const term = new Terminal({
      cols: 120,
      rows: 30,
      theme: {
        background: "#0f0f1e",
        foreground: "#e0e0e0",
        cursor: "#00ff00",
        black: "#1a1a2e",
        red: "#ff4444",
        green: "#44ff44",
        yellow: "#ffff44",
        blue: "#4444ff",
        magenta: "#ff44ff",
        cyan: "#44ffff",
        white: "#ffffff",
      },
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      fontSize: 13,
      lineHeight: 1.2,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    terminalInstance.current = term;

    // Display SSH connection instructions
    term.write("\r\n");
    term.write("╔════════════════════════════════════════════════════════════════════════════════╗\r\n");
    term.write("║                    SSH Terminal Connection Instructions                        ║\r\n");
    term.write("╚════════════════════════════════════════════════════════════════════════════════╝\r\n\r\n");

    term.write(`\x1b[1;36mSSH Connection Details:\x1b[0m\r\n`);
    term.write(`  Host:     ${host}\r\n`);
    term.write(`  User:     ${user}\r\n`);
    term.write(`  Port:     22\r\n\r\n`);

    term.write(`\x1b[1;36mConnection Command:\x1b[0m\r\n`);
    term.write(`  \x1b[1;33m${sshCommand}\x1b[0m\r\n\r\n`);

    if (filePath) {
      term.write(`\x1b[1;36mFile to Edit:\x1b[0m\r\n`);
      term.write(`  \x1b[1;33m${filePath}\x1b[0m\r\n\r\n`);
      term.write(`\x1b[1;36mEdit Commands:\x1b[0m\r\n`);
      term.write(`  nano ${filePath}\r\n`);
      term.write(`  vi ${filePath}\r\n\r\n`);
    }

    term.write(`\x1b[1;36mDownload File (SCP):\x1b[0m\r\n`);
    term.write(`  \x1b[1;33m${scpCommand}\x1b[0m\r\n\r\n`);

    term.write(`\x1b[1;36mInstructions:\x1b[0m\r\n`);
    term.write(`  1. Copy the SSH command above\r\n`);
    term.write(`  2. Open your terminal/PowerShell\r\n`);
    term.write(`  3. Paste and execute the command\r\n`);
    term.write(`  4. Enter the SSH password when prompted\r\n`);
    term.write(`  5. You'll have full terminal access\r\n\r\n`);

    term.write(`\x1b[1;32m✓ Ready to connect!\x1b[0m\r\n`);
    term.write(`\x1b[2mThis is a reference terminal. SSH connections must be made from your local machine.\x1b[0m\r\n\r\n`);

    // Resize handler
    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch (e) {
        console.error("Failed to fit terminal:", e);
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
    };
  }, [host, user, filePath]);

  const handleCopyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-black rounded-lg border border-border overflow-hidden">
      {/* Quick Copy Buttons */}
      <div className="bg-muted/50 border-b border-border p-2 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleCopyCommand(sshCommand)}
          className="text-xs"
        >
          <Copy className="w-3 h-3 mr-1" />
          Copy SSH Command
        </Button>
        {filePath && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopyCommand(scpCommand)}
            className="text-xs"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy SCP Command
          </Button>
        )}
        <div className="flex-1" />
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Reference terminal - use your local SSH client
        </div>
      </div>

      {/* Terminal Display */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-hidden"
        style={{ minHeight: "400px" }}
      />
    </div>
  );
}
