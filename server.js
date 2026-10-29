const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const players = new Map();

app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (_req, res) => res.send('OK'));

io.on('connection', socket => {
  players.set(socket.id, { id: socket.id, x: 0, y: 0.4, z: 2, rot: 0, color: 0xff4e91 });
  socket.emit('players', Array.from(players.values()));
  socket.broadcast.emit('players', Array.from(players.values()));

  socket.on('move', data => {
    if (!data || !Number.isFinite(data.x) || !Number.isFinite(data.y) || !Number.isFinite(data.z)) return;
    const p = players.get(socket.id);
    if (!p) return;
    p.x = Math.max(-8, Math.min(8, data.x));
    p.y = Math.max(-12, Math.min(20, data.y));
    p.z = Math.max(-140, Math.min(20, data.z));
    p.rot = Number.isFinite(data.rot) ? data.rot : 0;
    io.emit('playerMoved', p);
  });

  socket.on('disconnect', () => {
    players.delete(socket.id);
    io.emit('playerLeft', socket.id);
    io.emit('players', Array.from(players.values()));
  });
});

const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => console.log(`Game server running on ${port}`));
