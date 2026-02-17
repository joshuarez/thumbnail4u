document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("generator-form");
  const promptInput = document.getElementById("prompt");
  const imageInput = document.getElementById("imageUpload");
  const resultImage = document.getElementById("result-image");
  const resultText = document.getElementById("result-text");
  const loading = document.getElementById("loading");

  let imageBase64 = null;

  // Convert uploaded image to base64
  imageInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      imageBase64 = reader.result.split(",")[1]; // Remove data:image/... prefix
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const prompt = promptInput.value.trim();

    if (!prompt) {
      alert("Please enter a prompt.");
      return;
    }

    loading.style.display = "block";
    resultImage.style.display = "none";
    resultText.innerHTML = "";

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: prompt,
          imageBase64: imageBase64
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // Display Image
      resultImage.src = `data:image/png;base64,${data.image}`;
      resultImage.style.display = "block";

      // Display Text Output
      resultText.innerHTML = `
        <h3>Generated Content:</h3>
        <pre>${data.text}</pre>
      `;

    } catch (error) {
      resultText.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    } finally {
      loading.style.display = "none";
    }
  });
});
