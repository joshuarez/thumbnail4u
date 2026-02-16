// /api/generate.js
import fetch from "node-fetch"; // Only needed if using Node <18

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, imageBase64 } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    // --- 1️⃣ Generate Titles, Description, Tags ---
    const textResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a YouTube SEO assistant. Generate 3 viral titles, a description, and tags for a video."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8
      })
    });

    const textData = await textResponse.json();
    const textOutput = textData.choices[0].message.content;

    // --- 2️⃣ Generate Thumbnail Image ---
    // Use image edit if provided, otherwise generate from prompt
    const imagePayload = {
      model: "gpt-image-1",
      prompt: `Create a YouTube thumbnail (1280x720) based on: ${prompt}`,
      size: "1280x720"
    };

    if (imageBase64) {
      imagePayload.image = imageBase64;
      imagePayload.prompt = `Enhance this image for a YouTube thumbnail (1280x720) according to: ${prompt}`;
    }

    const imageResponse = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(imagePayload)
    });

    const imageData = await imageResponse.json();

    const imageB64 = imageData.data[0].b64_json;

    // --- 3️⃣ Return everything to frontend ---
    res.status(200).json({
      text: textOutput,
      image: imageB64
    });

  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ error: "AI generation failed" });
  }
}
