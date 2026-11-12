// Dispara um workflow do GitHub Actions, acha a execução criada e acompanha até o fim.
import { execFileSync, spawnSync } from "node:child_process";

export function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

export async function dispararEAcompanhar(workflow, campos = {}) {
  const antes = new Date().toISOString();
  const args = ["workflow", "run", workflow, "--ref", "main"];
  for (const [k, v] of Object.entries(campos)) args.push("-f", `${k}=${v}`);
  gh(args);

  let execucao;
  for (let i = 0; i < 24 && !execucao; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const lista = JSON.parse(gh(["run", "list", "--workflow", workflow, "--event", "workflow_dispatch", "--limit", "5",
      "--json", "databaseId,createdAt,url,status"]));
    execucao = lista.find((r) => r.createdAt >= antes.slice(0, 19));
  }
  if (!execucao) throw new Error(`não achei a execução de ${workflow} que acabei de disparar`);
  console.error(`Acompanhando ${workflow}: ${execucao.url}`);

  const r = spawnSync("gh", ["run", "watch", String(execucao.databaseId), "--exit-status", "--interval", "10"], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  return { ok: r.status === 0, url: execucao.url, id: execucao.databaseId };
}
