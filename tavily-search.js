const { tavily } = require('@tavily/core');
const fs = require('fs');
const envData = fs.readFileSync('.env', 'utf-8');
const TAVILY_API_KEY = envData.match(/TAVILY_API_KEY=(.*)/)[1].trim();

if (!TAVILY_API_KEY) {
  console.error("TAVILY_API_KEY is not set in the .env file.");
  process.exit(1);
}

const client = tavily({ apiKey: TAVILY_API_KEY });

const queries = [
  "pascoa 2026 tendencias marketing digital instagram reels carrossel brasil ovos coloridos chocolate familia renovacao celebracao",
  "campanha pascoa educacao empreendedorismo comunidade digital estrategias instagram reels engajamento marcas brasileiras 2025 2026",
  "publico-alvo pascoa empreendedores profissionais motivacoes renovacao esperanca ciclo novo conexao familia crescimento pessoal brasil",
  "melhores hooks pascoa reels instagram viral ovos coloridos primavera familia celebracao renovacao espiritual narrativa emocional feminina",
  "conteudo viral pascoa comunidade online solidariedade renovacao esperanca carrossel instagram stories engajamento educacao digital 2026"
];

async function runSearches() {
  const results = {};
  for (const query of queries) {
    console.log(`Searching for: ${query}`);
    try {
      const response = await client.search(query, {
        searchDepth: "advanced",
        maxResults: 5
      });
      results[query] = response.results.map(r => ({ title: r.title, content: r.content }));
    } catch (e) {
      console.error(`Error searching for ${query}: ${e.message}`);
    }
  }

  fs.writeFileSync('tavily_results.json', JSON.stringify(results, null, 2));
  console.log('Results written to tavily_results.json');
}

runSearches();
