<script>
const canvas = document.getElementById("thumbnailCanvas");
const ctx = canvas.getContext("2d");
let uploadedImage = null;

// ===== DARK MODE =====
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", document.documentElement.classList.contains("dark"));
});
if(localStorage.getItem("theme") === "true") {
  document.documentElement.classList.add("dark");
}

// ===== IMAGE UPLOAD (OPTIONAL NOW) =====
document.getElementById("imageUpload").addEventListener("change", function(e){
  const reader = new FileReader();
  reader.onload = function(event){
    uploadedImage = new Image();
    uploadedImage.src = event.target.result;
  };
  if(e.target.files[0]){
    reader.readAsDataURL(e.target.files[0]);
  }
});

// ===== GENERATE BUTTON =====
document.getElementById("generateBtn").addEventListener("click", async function(){

  const prompt = document.getElementById("promptInput").value.trim();
  if(!prompt){
    alert("Please enter a prompt.");
    return;
  }

  // Loading state
  this.textContent = "Generating...";
  this.disabled = true;

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    if(!response.ok) throw new Error(data.error || "Generation failed");

    // === DRAW IMAGE ===
    const aiImage = new Image();
    aiImage.onload = function(){
      ctx.clearRect(0,0,canvas.width,canvas.height);

      if(uploadedImage){
        drawImageToCanvas(uploadedImage);
      } else {
        drawImageToCanvas(aiImage);
      }

      addWatermark();
    };

    aiImage.src = `data:image/png;base64,${data.image}`;

    // === UPDATE TEXT CONTENT ===
    updateTextContent(data);

  } catch(error){
    alert(error.message);
  }

  this.textContent = "Generate Thumbnail";
  this.disabled = false;
});

// ===== DRAW IMAGE FIT =====
function drawImageToCanvas(img){
  const ratio = Math.min(canvas.width/img.width, canvas.height/img.height);
  const newWidth = img.width * ratio;
  const newHeight = img.height * ratio;
  const x = (canvas.width - newWidth)/2;
  const y = (canvas.height - newHeight)/2;
  ctx.drawImage(img, x, y, newWidth, newHeight);
}

// ===== WATERMARK =====
function addWatermark(){
  ctx.font = "36px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("Thumbnail4U Free", canvas.width - 320, 60);
}

// ===== UPDATE TITLES / DESCRIPTION / TAGS FROM AI =====
function updateTextContent(data){

  const titlesList = document.getElementById("titlesList");
  titlesList.innerHTML = "";

  if(data.titles){
    data.titles.forEach(title => {
      const li = document.createElement("li");
      li.textContent = title;
      li.className = "p-3 rounded-lg bg-gray-200 dark:bg-slate-800";
      titlesList.appendChild(li);
    });
  }

  document.getElementById("descriptionOutput").textContent =
    data.description || "";

  document.getElementById("tagsOutput").textContent =
    data.tags || "";
}

// ===== DOWNLOAD =====
document.getElementById("downloadBtn").addEventListener("click", function(){
  const link = document.createElement("a");
  link.download = "thumbnail.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
</script>
