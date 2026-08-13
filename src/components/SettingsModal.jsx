import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../api.js';

export function SettingsModal({ open, onClose }) {
  const [bgUrl, setBgUrl] = useState('');
  const [dim, setDim] = useState(20);
  const fileInputRef = useRef(null);

  useEffect(() => {
    apiFetch('/api/settings/background')
      .then((r) => r.json())
      .then(({ url }) => { if (url) setBgUrl(url); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!bgUrl) {
      document.body.style.backgroundImage = '';
      document.body.classList.remove('has-bg');
      return;
    }
    document.body.style.backgroundImage = `url(${bgUrl})`;
    document.body.style.setProperty('--bg-dim', dim / 100);
    document.body.classList.add('has-bg');
  }, [bgUrl, dim]);

  const uploadBackground = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    const res = await apiFetch('/api/settings/background', { method: 'POST', body: formData });
    if (!res.ok) { alert('Upload failed'); return; }
    const { url } = await res.json();
    setBgUrl(url);
  };

  const removeBackground = async () => {
    await apiFetch('/api/settings/background', { method: 'DELETE' });
    setBgUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>Personalize</h2>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label>Background photo</label>
          {!!bgUrl && (
            <div style={{ display: 'block', marginBottom: 10 }}>
              <img src={bgUrl} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8 }} />
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadBackground} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 18px' }} onClick={() => fileInputRef.current?.click()}>Choose photo</button>
            {!!bgUrl && <button className="btn btn-danger" style={{ width: 'auto', padding: '8px 18px' }} onClick={removeBackground}>Remove</button>}
          </div>
        </div>
        {!!bgUrl && (
          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Dim {dim}%</label>
            <input type="range" min="0" max="60" value={dim} style={{ width: '100%', marginTop: 6 }} onChange={(e) => setDim(Number(e.target.value))} />
          </div>
        )}
      </div>
    </div>
  );
}
