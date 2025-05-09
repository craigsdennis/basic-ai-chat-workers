import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

app.get('/api/', async(c) => {
    return c.json({name: "Hono"});
});

export default app;