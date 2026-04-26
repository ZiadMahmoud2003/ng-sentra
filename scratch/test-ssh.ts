import { getSSHConfig } from "../server/ssh-service";
import { Client } from "ssh2";

async function main() {
  const sshConfig = await getSSHConfig();
  console.log("SSH Config:", sshConfig ? "Found" : "Not Found");
  if (!sshConfig) return;

  console.log("Connecting...");
  const conn = new Client();
  conn.on("ready", () => {
    console.log("Ready!");
    conn.exec("systemctl is-active ngsentra-ai", (err, stream) => {
      if (err) throw err;
      stream.on('data', (data) => console.log('STDOUT: ' + data));
      stream.stderr.on('data', (data) => console.log('STDERR: ' + data));
      stream.on('close', () => conn.end());
    });
  }).on("error", (err) => {
    console.log("Connection Error:", err);
  }).connect({
    host: sshConfig.host,
    port: sshConfig.port,
    username: sshConfig.user,
    password: sshConfig.password,
    readyTimeout: 6000,
  });
}

main().catch(console.error);
