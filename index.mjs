import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

// تشغيل الواجهة من المجلد الحالي
app.use(express.static('./')); 

app.get('/', (req, res) => {
    res.send('<h1>سيرفر شات غزال يعمل بنجاح!</h1><p>إذا كنت ترى هذه الرسالة، فالسيرفر متصل.</p>');
});

wss.on('connection', (ws) => {
    console.log('متصل جديد');
    ws.on('message', (message) => {
        wss.clients.forEach(client => {
            if (client.readyState === 1) client.send(message.toString());
        });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`السيرفر يعمل الآن على المنفذ ${PORT}`);
});
