export function openSettings() {
  document.getElementById('settingsModal').style.display = 'flex';
}

export function closeSettings() {
  document.getElementById('settingsModal').style.display = 'none';
}

export async function loadBackground() {
  try {
    const res = await fetch('/api/settings/background');
    const { url } = await res.json();
    if (url) applyBackground(url);
  } catch (e) { /* no background set */ }
}

export function applyBackground(url) {
  const dim = parseInt(document.getElementById('bgDimSlider').value, 10);
  document.body.style.backgroundImage = `url(${url})`;
  document.body.style.setProperty('--bg-dim', dim / 100);
  document.body.classList.add('has-bg');
  const preview = document.getElementById('bgPreview');
  const img = document.getElementById('bgPreviewImg');
  img.src = url;
  preview.style.display = 'block';
  document.getElementById('bgRemoveBtn').style.display = '';
  document.getElementById('bgDimGroup').style.display = '';
}

export async function uploadBackground(input) {
  if (!input.files || !input.files[0]) return;
  const formData = new FormData();
  formData.append('image', input.files[0]);
  const res = await fetch('/api/settings/background', { method: 'POST', body: formData });
  if (!res.ok) { alert('Upload failed'); return; }
  const { url } = await res.json();
  applyBackground(url);
}

export async function removeBackground() {
  await fetch('/api/settings/background', { method: 'DELETE' });
  document.body.style.backgroundImage = '';
  document.body.classList.remove('has-bg');
  document.getElementById('bgPreview').style.display = 'none';
  document.getElementById('bgPreviewImg').src = '';
  document.getElementById('bgRemoveBtn').style.display = 'none';
  document.getElementById('bgDimGroup').style.display = 'none';
  document.getElementById('bgInput').value = '';
}

export function onDimChange(value) {
  document.getElementById('bgDimValue').textContent = value;
  document.body.style.setProperty('--bg-dim', value / 100);
}
