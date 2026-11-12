// npm run dados-de-exemplo -- <seu-email> <sua-senha>
// Cria na SUA empresa do CRM os dados que as aulas usam:
//   - lead "Juliana" (nome de uma palavra só) com uma mensagem recebida
//   - lead "Carlos Souza" sem nenhuma mensagem
// Use o e-mail e a senha com que você se cadastrou no CRM. Pode rodar de novo: não duplica.
// Lê VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY do .env.
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function lerEnv() {
  if (!existsSync(".env")) return;
  for (const linha of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

lerEnv();
const [email, senha] = process.argv.slice(2);
const url = process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
if (!email || !senha) {
  console.error("Uso: npm run dados-de-exemplo -- <seu-email> <sua-senha>");
  process.exit(1);
}
if (!url || !anon) {
  console.error("Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env (veja o .env.example).");
  process.exit(1);
}

const supabase = createClient(url, anon, { auth: { persistSession: false } });

const { data: login, error: erroLogin } = await supabase.auth.signInWithPassword({ email, password: senha });
if (erroLogin) {
  console.error(`Não consegui entrar com esse e-mail e senha: ${erroLogin.message}`);
  process.exit(1);
}

const { data: perfil, error: erroPerfil } = await supabase
  .from("profiles").select("organization_id").eq("id", login.user.id).single();
if (erroPerfil || !perfil) {
  console.error("Não achei a sua empresa. Você abriu o CRM e terminou o cadastro?");
  process.exit(1);
}
const org = perfil.organization_id;

const { data: colunas } = await supabase
  .from("kanban_columns").select("id, name, position").eq("organization_id", org).order("position");
if (!colunas?.length) {
  console.error("A sua empresa não tem colunas no Kanban.");
  process.exit(1);
}
const primeira = colunas[0];

const { data: leads } = await supabase.from("leads").select("id, name").eq("organization_id", org);

async function garantirLead(nome, telefone) {
  const existente = leads?.find((l) => l.name === nome);
  if (existente) return existente;
  const { data, error } = await supabase
    .from("leads")
    .insert({ organization_id: org, column_id: primeira.id, name: nome, phone: telefone, source: "manual" })
    .select("id, name").single();
  if (error) {
    console.error(`Não consegui criar o lead ${nome}: ${error.message}`);
    process.exit(1);
  }
  return data;
}

const juliana = await garantirLead("Juliana", "5511988887777");
await garantirLead("Carlos Souza", "5511977776666");

const { data: mensagens } = await supabase.from("messages").select("id").eq("lead_id", juliana.id);
if (!mensagens?.length) {
  const { error } = await supabase.from("messages").insert({
    organization_id: org,
    lead_id: juliana.id,
    direction: "inbound",
    status: "delivered",
    content: "Oi, quero saber o preço do plano.",
    is_automated: false,
  });
  if (error) {
    console.error(`Não consegui criar a mensagem: ${error.message}`);
    process.exit(1);
  }
}

console.log(`Pronto: "Juliana" (com uma mensagem) e "Carlos Souza" (sem mensagem) na coluna "${primeira.name}".`);
