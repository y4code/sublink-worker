import { Hono } from 'hono';
import { ClashConfigBuilder } from './src/ClashConfigBuilder.js';

const app = new Hono();
const port = process.env.PORT || 3000;

app.post('/', async (c) => {
    try {
        const inputString = await c.req.text();
        if (!inputString) {
            return c.text('Missing config in request body', 400);
        }

        let userAgent = c.req.header('user-agent') || 'curl/7.74.0';

        let configBuilder = new ClashConfigBuilder(inputString, userAgent);
        const config = await configBuilder.build();

        return c.text(config, 200, { 'Content-Type': 'text/yaml; charset=utf-8' });

    } catch (error) {
        console.error('Error processing request:', error);
        return c.text('Internal Server Error', 500);
    }
});

console.log(`Server is running on port ${port}`);

export default {
    port,
    fetch: app.fetch,
};