# Roleta do time

Roleta em formato de tambor de revólver para definir a vez de cada pessoa do time. A lista de nomes, a posição atual e o histórico ficam salvos no servidor, então todo mundo que abrir o site vê o mesmo estado.

## Funcionalidades

- Cadastro e remoção de nomes (vários de uma vez, separados por vírgula)
- A cada giro, a vez passa para o próximo nome da fila
- Fila mostrando quem está na vez e quem vem em seguida
- Aba de histórico com quem girou, para quem passou a vez e quando
- O nome de quem gira é pedido em um modal e guardado no `sessionStorage`
- Atualização automática a cada 4 segundos para todos os usuários
- Layout responsivo, para celular e desktop

## Tecnologias

- HTML, CSS e JavaScript puros (`public/index.html`)
- Função serverless da Vercel (`api/roulette.js`)
- Upstash Redis para guardar o estado

## Como publicar na Vercel

1. Importe o repositório na Vercel (Framework Preset: **Other**).
2. Em **Storage** / Marketplace, adicione o **Upstash Redis** ao projeto. As variáveis de ambiente são criadas automaticamente.
3. Faça um novo deploy.

## Estrutura

```
├── api/roulette.js     # backend: GET estado, POST add / remove / spin
├── public/index.html   # interface
└── package.json
```
