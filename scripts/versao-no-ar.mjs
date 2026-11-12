// Qual versão está no ar? Lê <endereço de produção>/version.json (o conteúdo servido, não o status do painel).
// Uso: node scripts/versao-no-ar.mjs                 → imprime {"versao": "<commit>", ...}
//      node scripts/versao-no-ar.mjs --esperar <sha> → espera até 3 min a versão no ar ser <sha> (sai 1 se não for)
import { readFileSync } from "node:fs";

const pacote = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const URL_PRODUCAO = (process.env.PRODUCAO_URL || pacote.homepage || "").replace(/\/$/, "");
if (!URL_PRODUCAO) {
  console.error("versao-no-ar: defina o endereço de produção em package.json (homepage) ou PRODUCAO_URL.");
  process.exit(1);
}

async function lerVersao() {
  let r, texto;
  try {
    r = await fetch(`${URL_PRODUCAO}/version.json?t=${Date.now()}`, { headers: { "cache-control": "no-cache" } });
    texto = await r.text();
  } catch (e) {
    return { versao: null, erro: `endereço não respondeu (${e.cause?.code ?? e.message})` };
  }
  try {
    return JSON.parse(texto);
  } catch {
    // A SPA devolve o index.html (200) quando o arquivo não existe: isso não é uma versão.
    return { versao: null, erro: `resposta não é JSON (HTTP ${r.status}); a versão no ar não tem version.json` };
  }
}

const i = process.argv.indexOf("--esperar");
if (i === -1) {
  console.log(JSON.stringify({ endereco: URL_PRODUCAO, ...(await lerVersao()) }));
} else {
  const esperado = process.argv[i + 1];
  const limite = Date.now() + 3 * 60_000;
  let atual;
  while (Date.now() < limite) {
    atual = await lerVersao();
    if (atual.versao === esperado) {
      console.log(JSON.stringify({ ok: true, endereco: URL_PRODUCAO, versao: esperado }));
      process.exit(0);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.error(JSON.stringify({ ok: false, esperado, noAr: atual?.versao ?? null, erro: atual?.erro }));
  process.exit(1);
}
