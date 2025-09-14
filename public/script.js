const imageInput = document.getElementById('imageInput');
const nameInput = document.getElementById('nameInput');
const generateBtn = document.getElementById('generateBtn');
const preview = document.getElementById('preview');
const placeholder = document.getElementById('placeholder');
const statusEl = document.getElementById('status');
const resultSection = document.getElementById('resultSection');
const resultImg = document.getElementById('resultImg');
const downloadBtn = document.getElementById('downloadBtn');

function updateButtonState() {
  const hasImage = !!imageInput.files[0];
  const hasName = nameInput.value.trim().length > 0;
  generateBtn.disabled = !(hasImage && hasName);
}

imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    preview.src = e.target.result;
    preview.classList.remove('hidden');
    placeholder.classList.add('hidden');
  };
  reader.readAsDataURL(file);
  updateButtonState();
});

nameInput.addEventListener('input', updateButtonState);

generateBtn.addEventListener('click', async () => {
  const file = imageInput.files[0];
  const name = nameInput.value.trim();
  if (!file || !name) return;

  const formData = new FormData();
  formData.append('image', file);
  formData.append('name', name);

  resultSection.classList.add('hidden');
  statusEl.textContent = 'Generating your action figure…';
  generateBtn.disabled = true;

  try {
    const resp = await fetch('/api/generate', {
      method: 'POST',
      body: formData,
    });

    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.error || 'Failed to generate image');
    }

    const mimeType = data.mimeType || 'image/png';
    const base64 = data.imageBase64;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    resultImg.src = dataUrl;
    downloadBtn.href = dataUrl;
    resultSection.classList.remove('hidden');
    statusEl.textContent = data.mock ? 'Mock image returned (set GOOGLE_API_KEY to enable generation).' : '';
  } catch (err) {
    console.error(err);
    statusEl.textContent = err.message || 'Something went wrong.';
  } finally {
    generateBtn.disabled = false;
  }
});

