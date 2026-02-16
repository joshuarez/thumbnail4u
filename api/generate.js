module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, imageBase64 } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // Temporary test response
  res.status(200).json({
    message: "API is working!",
    prompt: prompt,
    hasImage: !!imageBase64
  });
};
