// api/generate.js

const OpenAI = require("openai");

function parseRequestBody(body) {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch (_error) {
      return {};
    }
  }
  return body;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = parseRequestBody(req.body);
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
  }

  const client = new OpenAI({ apiKey });

  try {
    const textCompletion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "youtube_package",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              titles: {
                type: "array",
                minItems: 3,
                maxItems: 3,
                items: { type: "string" },
              },
              description: { type: "string" },
              tags: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["titles", "description", "tags"],
          },
          strict: true,
        },
      },
      messages: [
        {
          role: "system",
          content:
            "You are a YouTube growth expert. Return exactly 3 high-converting titles, one compelling description, and SEO tags.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
    });

    const rawText = textCompletion?.choices?.[0]?.message?.content;
    if (!rawText) {
      return res.status(502).json({ error: "Invalid text generation response" });
    }

    let structuredText;
    try {
      structuredText = JSON.parse(rawText);
    } catch (_error) {
      return res.status(502).json({ error: "Failed to parse generated JSON output" });
    }

    const imageResult = await client.images.generate({
      model: "gpt-image-1",
      prompt: `Create a high contrast, clickable YouTube thumbnail for: ${prompt}`,
      size: "1024x1024",
    });

    const imageBase64 = imageResult?.data?.[0]?.b64_json;
    if (!imageBase64) {
      return res.status(502).json({ error: "Invalid image generation response" });
    }

    return res.status(200).json({
      text: JSON.stringify(structuredText, null, 2),
      image: imageBase64,
    });
  } catch (error) {
    const status = error?.status && Number.isInteger(error.status) ? error.status : 500;
    const message = error?.error?.message || error?.message || "AI generation failed";

    console.error("OpenAI error:", error);
    return res.status(status).json({ error: message });
  }
};
