import { Hono } from "hono";
import { events } from "fetch-event-stream";
import { streamText } from "hono/streaming";

const app = new Hono<{ Bindings: Env }>();

app.post("/api/chat", async (c) => {
  const payload = await c.req.json();
  const messages = [...payload.messages];
  // Prepend the systemMessage
  if (payload?.config?.systemMessage) {
    messages.unshift({ role: "system", content: payload.config.systemMessage });
  }
  const eventSourceStream = await c.env.AI.run(
    "@cf/meta/llama-4-scout-17b-16e-instruct",
    {
      messages,
      max_tokens: 8000,
      stream: true,
    }
  );
  c.header("Content-Encoding", "Identity");
  return streamText(c, async (stream) => {
    const chunks = events(new Response(eventSourceStream as BodyInit));
    for await (const chunk of chunks) {
      if (chunk.data !== undefined && chunk.data !== "[DONE]") {
        const data = JSON.parse(chunk.data);
        const token = data.response;
        if (token) {
          stream.write(token);
        }
      }
    }
  });
});

export default app;
