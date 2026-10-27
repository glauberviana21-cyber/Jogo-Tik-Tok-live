const { WebcastPushConnection } = require('tiktok-live-connector');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

let conexaoJogo = null;
let tiktokConnection = null;

wss.on('connection', (ws) => {
  console.log('✅ Jogo conectado ao servidor na nuvem!');
  conexaoJogo = ws;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'connect' && data.username) {
        conectarTikTok(data.username);
      }
    } catch (e) {
      console.error('Erro:', e);
    }
  });
});

function conectarTikTok(username) {
  if (tiktokConnection) {
    try { tiktokConnection.disconnect(); } catch(e){}
  }

  tiktokConnection = new WebcastPushConnection(username);

  tiktokConnection.connect().then(state => {
    if (conexaoJogo && conexaoJogo.readyState === WebSocket.OPEN) {
      conexaoJogo.send(JSON.stringify({ type: 'status', connected: true }));
    }
  }).catch(err => {
    if (conexaoJogo && conexaoJogo.readyState === WebSocket.OPEN) {
      conexaoJogo.send(JSON.stringify({ type: 'status', connected: false }));
    }
  });

  tiktokConnection.on('chat', data => {
    const msg = data.comment.trim();
    if (['1', '2', '3', '4', '5'].includes(msg)) {
      if (conexaoJogo && conexaoJogo.readyState === WebSocket.OPEN) {
        conexaoJogo.send(JSON.stringify({ type: 'vote', teamIndex: parseInt(msg) - 1 }));
      }
    }
  });
}
