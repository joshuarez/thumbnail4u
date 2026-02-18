// api/generate.js

const https = require("https");

function postToOpenAI(path, payload, apiKey) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.openai.com",
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          let json;
          try {
            json = JSON.parse(body || "{}");
          } catch (error) {
            return reject(new Error(`Invalid JSON from OpenAI (${path})`));
          }

          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode || 500,
            data: json,
          });
        });
      }
    );

    req.on("error", reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
  }

  try {
    const textResponse = await postToOpenAI(
      "/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a YouTube growth expert. Generate 3 viral titles, a compelling description, and SEO tags.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
      },
      apiKey
    );

    if (!textResponse.ok) {
      return res.status(textResponse.status).json({
        error: textResponse.data?.error?.message || "Failed to generate text",
      });
    }

    const textOutput = textResponse.data?.choices?.[0]?.message?.content;
    if (!textOutput) {
      return res.status(502).json({ error: "Invalid text generation response" });
    }

    const imageResponse = await postToOpenAI(
      "/v1/images/generations",
      {
        model: "gpt-image-1",
        prompt: `Create a high contrast, clickable YouTube thumbnail for: ${prompt}`,
        size: "1024x1024",
      },
      apiKey
    );

    if (!imageResponse.ok) {
      return res.status(imageResponse.status).json({
        error: imageResponse.data?.error?.message || "Failed to generate image",
      });
    }

    const imageBase64 = imageResponse.data?.data?.[0]?.b64_json;
    if (!imageBase64) {
      return res.status(502).json({ error: "Invalid image generation response" });
    }

    return res.status(200).json({
      text: textOutput,
      image: imageBase64,
    });
  } catch (error) {
    console.error("OpenAI error:", error);
    return res.status(500).json({
      error: "AI generation failed",
      details: error.message,
    });
  }
};
