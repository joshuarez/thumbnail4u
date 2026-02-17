// api/generate.js

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    // Generate Titles + Description + Tags
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
            content: "You are a YouTube growth expert. Generate 3 viral titles, a compelling description, and SEO tags."
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

    // Generate Thumbnail Image
    const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: `Create a high contrast, clickable 1280x720 YouTube thumbnail for: ${prompt}`,
        size: "1280x720"
      })
    });

    const imageData = await imageResponse.json();
    const imageBase64 = imageData.data[0].b64_json;

    return res.status(200).json({
      text: textOutput,
      image: imageBase64
    });

  } catch (error) {
    console.error("OpenAI error:", error);
    return res.status(500).json({ error: "AI generation failed" });
