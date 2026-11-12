// npm run publicar → publica em produção o que está na main do GitHub.
// Não publica da sua máquina: dispara o workflow "Publicar produção" e acompanha até o fim.
// Imprime {"ok", "versao", "anterior", "url"}: "anterior" é a versão para a qual desfazer, se precisar.
import { execFileSync } from "node:child_process";
import { dispararEAcompanhar, gh } from "./gh-workflow.mjs";

const noAr = () => JSON.parse(execFileSync("node", ["scripts/versao-no-ar.mjs"], { encoding: "utf8" }));

const anterior = noAr().versao;
const versao = gh(["api", "repos/{owner}/{repo}/commits/main", "-q", ".sha"]);
if (versao === anterior) {
  console.log(JSON.stringify({ ok: true, versao, anterior, nota: "essa versão já está no ar; nada a publicar" }));
  process.exit(0);
}

const r = await dispararEAcompanhar("publicar-producao.yml", { versao });
const agora = noAr().versao;
const ok = r.ok && agora === versao;
console.log(JSON.stringify({ ok, versao, anterior, noAr: agora, url: r.url }));
process.exit(ok ? 0 : 1);
