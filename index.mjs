import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

// تشغيل الملفات من المجلد الرئيسي أو أي مجلد واجهة
app.use(express.static('./')); 

app.get('/', (req, res) => {
    res.send('<h1>سيرفر شات غزال يعمل بنجاح!</h1>');
});

wss.on('connection', (ws) => {
    console.log('عميل جديد اتصل');
    ws.on('message', (message) => {
        wss.clients.forEach(client => {
            if (client.readyState === 1) client.send(message.toString());
        });
    });
});

server.listen(PORT, () => {
    console.log(`السيرفر يعمل الآن على المنفذ ${PORT}`);
});
