const jwt = require('jsonwebtoken');
const WebSocket = require('ws');

const secret = process.env.JWT_SECRET || 'test-secret';
const roomId = '507f1f77bcf86cd799439011';

function connect(name) {
  return new Promise((resolve, reject) => {
    const token = jwt.sign(
      { userId: name, username: name, sessionId: `s-${name}`, role: 'user' },
      secret,
      { expiresIn: '1h' }
    );

    const ws = new WebSocket(`ws://localhost:5000/?token=${token}`);

    ws.on('open', () => {
      ws.send(JSON.stringify({ event: 'room:join', payload: { roomId } }));
    });

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.event === 'room:joined') {
          console.log(`${name} => members=${data.payload.members ? data.payload.members.length : 0}`);
          resolve(ws);
        }
      } catch (err) {
        // ignore parse noise
      }
    });

    ws.on('error', reject);
  });
}

(async () => {
  const a = await connect('alice');
  const b = await connect('bob');
  setTimeout(() => {
    a.close();
    b.close();
    process.exit(0);
  }, 1200);
})();
