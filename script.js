const generateBtn = document.getElementById("generateBtn");

if (generateBtn) {
  generateBtn.addEventListener("click", async () => {
    const promptInput = document.getElementById("promptInput");
    const imageInput = document.getElementById("imageUpload");
    const statusOutput = document.getElementById("textOutput");

    const prompt = promptInput?.value?.trim() || "";
    if (!prompt) {
      if (statusOutput) statusOutput.innerText = "Please enter a prompt first.";
      return;
    }

    let base64Image = null;

    if (imageInput?.files?.[0]) {
      base64Image = await toBase64(imageInput.files[0]);
    }

    try {
      const response = await fetch("./api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, imageBase64: base64Image })
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (statusOutput) {
        statusOutput.innerText = data.text || data.message || "Generated successfully.";
      }
    } catch (error) {
      if (statusOutput) {
        statusOutput.innerText = "Could not reach ./api/generate. Make sure your API route is deployed.";
      }
      console.error(error);
    }
  });
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = error => reject(error);
  });
}
