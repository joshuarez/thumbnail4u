document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("generator-form");
  const promptInput = document.getElementById("prompt");
  const resultBox = document.getElementById("result");
  const loading = document.getElementById("loading");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const prompt = promptInput.value.trim();

    if (!prompt) {
      alert("Please enter a prompt.");
      return;
    }

    loading.style.display = "block";
    resultBox.innerHTML = "";

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: prompt })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate.");
      }

      resultBox.innerHTML = `
        <div class="ai-result">
          <img src="data:image/png;base64,${data.image}" class="generated-thumbnail"/>
          <div class="generated-text">
            <h3>AI Titles:</h3>
            <pre>${data.text}</pre>
          </div>
        </div>
      `;

    } catch (err) {
      resultBox.innerHTML = `<p class="error">Error: ${err.message}</p>`;
    }

    loading.style.display = "none";
  });

});
