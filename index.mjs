import express from 'express';
import { server } from './api-server/index.mjs'; // التأكد من استدعاء السيرفر الأصلي إذا كان موجوداً

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public')); // لتشغيل ملفات واجهة الشات

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});