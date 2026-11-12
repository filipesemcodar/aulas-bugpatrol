// npm run desfazer -- <commit> → volta produção para uma versão que já esteve no ar.
// Sempre com o commit explícito (o "anterior" que o npm run publicar imprimiu).
// Dispara o workflow "Desfazer publicação" e confere a versão servida. Não desfaz mudança no banco.
import { execFileSync } from "node:child_process";
import { dispararEAcompanhar } from "./gh-workflow.mjs";

const versao = process.argv[2];
if (!versao || !/^[0-9a-f]{40}$/.test(versao)) {
  console.error("Uso: npm run desfazer -- <commit completo de 40 caracteres>");
  process.exit(1);
}

const r = await dispararEAcompanhar("desfazer-publicacao.yml", { versao });
const agora = JSON.parse(execFileSync("node", ["scripts/versao-no-ar.mjs"], { encoding: "utf8" })).versao;
const ok = r.ok && agora === versao;
console.log(JSON.stringify({ ok, voltouPara: versao, noAr: agora, url: r.url }));
process.exit(ok ? 0 : 1);
