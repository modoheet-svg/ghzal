import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 3000;

// تشغيل ملفات الواجهة من المجلد الرئيسي
app.use(express.static('./')); 

app.get('/', (req, res) => {
    res.send('<h1>سيرفر شات غزال يعمل الآن!</h1>');
});

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        wss.clients.forEach(client => {
            if (client.readyState === 1) client.send(message.toString());
        });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);
});
