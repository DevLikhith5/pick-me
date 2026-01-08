import express from 'express';
import { serverConfig } from './config';
import { rabbitMQ } from './config/rabbit-mq.config';
import v1Router from './routers/v1/index.router';

const app = express();
app.use(express.json());

app.use('/api/v1', v1Router);

app.listen(serverConfig.PORT, async () => {
    console.log(`Server is running on http://localhost:${serverConfig.PORT}`);
    try {
        await rabbitMQ();
    } catch (err) {
        console.error("Failed to connect to RabbitMQ", err);
    }
});
