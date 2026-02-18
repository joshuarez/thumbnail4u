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

    // ===== GENERATE TITLES + DESCRIPTION + TAGS =====
    const textResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content: "You are a YouTube growth expert. Respond ONLY in valid JSON."
          },
          {
            role: "user",
            content: `
Generate:
- 3 viral YouTube titles
- 1 engaging YouTube description
- SEO tags (comma separated)

For this topic:
${prompt}

Return in this exact JSON format:

{
  "titles": ["title1", "title2", "title3"],
  "description": "description text",
  "tags": "tag1, tag2, tag3"
}
`
          }
        ]
      })
    });

    const textData = await textResponse.json();

    if (!textData.choices) {
      throw new Error("Text generation failed");
    }

    let parsedText;

    try {
      parsedText = JSON.parse(textData.choices[0].message.content);
    } catch (err) {
      throw new Error("AI returned invalid JSON");
    }

    // ===== GENERATE THUMBNAIL IMAGE =====
    const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: `Create a high contrast, bold, clickable YouTube thumbnail (1280x720) for: ${prompt}`,
        size: "1280x720"
      })
    });

    const imageData = await imageResponse.json();

    if (!imageData.data || !imageData.data[0]) {
      throw new Error("Image generation failed");
    }

    const imageBase64 = imageData.data[0].b64_json;

    // ===== RETURN CLEAN STRUCTURED DATA =====
    return res.status(200).json({
      image: imageBase64,
      titles: parsedText.titles,
      description: parsedText.description,
      tags: parsedText.tags
    });

  } catch (error) {
    console.error("OpenAI error:", error);
    return res.status(500).json({ error: "AI generation failed" });
  }
};
