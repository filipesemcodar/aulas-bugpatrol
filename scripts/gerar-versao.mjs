// Grava dist/version.json com o commit que foi construído.
// É por esse arquivo que se confere qual versão está no ar (npm run versao:no-ar).
// A mesma string (commit completo) é a release do Sentry e a tag da versão no Cloudflare.
import { execSync } from "node:child_process";
import { writeFileSync, existsSync } from "node:fs";

function commitAtual() {
  // VERSAO vem do workflow de publicar (o commit exato publicado); fora dele, o commit atual.
  if (process.env.VERSAO) return process.env.VERSAO;
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "desconhecido";
  }
}

if (!existsSync("dist")) {
  console.error("gerar-versao: a pasta dist/ não existe. Rode depois do vite build.");
  process.exit(1);
}

const versao = commitAtual();
writeFileSync(
  "dist/version.json",
  JSON.stringify({ versao, curta: versao.slice(0, 7), construidoEm: new Date().toISOString() }) + "\n",
);
console.log(`dist/version.json → ${versao.slice(0, 7)}`);
