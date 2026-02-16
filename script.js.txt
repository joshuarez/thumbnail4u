document.getElementById("generateBtn").addEventListener("click", async () => {
  const prompt = document.getElementById("promptInput").value;
  const imageInput = document.getElementById("imageUpload");

  let base64Image = null;

  if (imageInput.files[0]) {
    base64Image = await toBase64(imageInput.files[0]);
  }

  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: prompt,
      imageBase64: base64Image
    })
  });

  const data = await response.json();

  // Display Image
  const img = document.createElement("img");
  img.src = `data:image/png;base64,${data.image}`;
  img.className = "w-full rounded-xl";
  document.getElementById("thumbnailPreview").innerHTML = "";
  document.getElementById("thumbnailPreview").appendChild(img);

  // Display Text
  document.getElementById("textOutput").innerText = data.text;
});

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = error => reject(error);
  });
}
