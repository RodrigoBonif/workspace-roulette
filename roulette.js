import { Redis } from '@upstash/redis';

// Lê KV_REST_API_URL / KV_REST_API_TOKEN (ou UPSTASH_REDIS_REST_*),
// variáveis criadas automaticamente ao conectar o Upstash Redis ao projeto na Vercel.
const redis = Redis.fromEnv();

const KEY = 'roulette:state';
const MAX_NAMES = 40;
const MAX_HISTORY = 100;
const MAX_LEN = 30;

async function load() {
  const s = await redis.get(KEY);
  if (!s || typeof s !== 'object') return { names: [], current: -1, history: [] };
  return {
    names: Array.isArray(s.names) ? s.names : [],
    current: Number.isInteger(s.current) ? s.current : -1,
    history: Array.isArray(s.history) ? s.history : [],
  };
}

async function save(state) {
  await redis.set(KEY, state);
  return state;
}

const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_LEN);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      return res.status(200).json(await load());
    }
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido.' });
    }

    const body = req.body || {};
    const state = await load();

    switch (body.action) {
      case 'add': {
        const incoming = Array.isArray(body.names) ? body.names : [body.name];
        let added = 0;
        for (const raw of incoming) {
          const name = clean(raw);
          if (!name) continue;
          if (state.names.length >= MAX_NAMES) break;
          if (state.names.some((n) => n.toLowerCase() === name.toLowerCase())) continue;
          state.names.push(name);
          added++;
        }
        if (!added) {
          return res.status(400).json({ error: 'Nome vazio, repetido ou limite de nomes atingido.' });
        }
        return res.status(200).json(await save(state));
      }

      case 'remove': {
        const i = body.index;
        if (!Number.isInteger(i) || i < 0 || i >= state.names.length) {
          return res.status(400).json({ error: 'Nome não encontrado.' });
        }
        state.names.splice(i, 1);
        if (!state.names.length) state.current = -1;
        else if (i < state.current) state.current -= 1;
        else if (i === state.current) state.current = i - 1; // o próximo giro cai em quem ocupou essa posição
        return res.status(200).json(await save(state));
      }

      case 'spin': {
        const by = clean(body.by);
        if (!by) return res.status(400).json({ error: 'Informe seu nome para girar.' });
        if (!state.names.length) {
          return res.status(400).json({ error: 'Adicione nomes antes de girar.' });
        }
        state.current = (state.current + 1) % state.names.length;
        state.history.unshift({ by, name: state.names[state.current], at: Date.now() });
        state.history = state.history.slice(0, MAX_HISTORY);
        return res.status(200).json(await save(state));
      }

      default:
        return res.status(400).json({ error: 'Ação inválida.' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro no servidor.' });
  }
}
