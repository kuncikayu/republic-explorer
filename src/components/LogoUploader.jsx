import { useState, useRef, useEffect } from 'react';
import { UploadCloud } from 'lucide-react';
import { supabase } from '../supabase.js';

export async function uploadLogo(file, projectName, walletAddress) {
  if (!supabase) throw new Error("Supabase client not initialized.");

  const ext = file.name.split('.').pop()
  const fileName = `${walletAddress}_${projectName}_${Date.now()}.${ext}`
    .replace(/\s+/g, '_').toLowerCase()

  const { data, error } = await supabase.storage
    .from('project-logos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    })

  if (error) throw error

  const { data: urlData } = supabase.storage
    .from('project-logos')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

export default function LogoUploader({ onFileSelect, onError, currentLogoUrl, type = 'logo' }) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(currentLogoUrl || null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreview(currentLogoUrl || null);
  }, [currentLogoUrl]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      if(onError) onError('Invalid format. Supported: PNG, JPG, WEBP, SVG');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      if(onError) onError('File too large. Max size: 2MB');
      return;
    }

    setPreview(URL.createObjectURL(file));
    if(onFileSelect) onFileSelect(file);
  };

  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        background: isDragging ? 'rgba(0,255,111,0.05)' : 'rgba(255,255,255,0.02)',
        border: `1px dashed ${isDragging ? 'var(--accent-green)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: '32px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        style={{ display: 'none' }} 
        ref={fileInputRef} 
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp, image/svg+xml"
      />

      {preview ? (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src={preview} alt="Preview" style={{ width: type === 'cover' ? 240 : 80, height: type === 'cover' ? 135 : 80, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--border)' }} />
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>Click or drag a new image to replace</p>
        </div>
      ) : (
        <>
          <div style={{ width: type === 'cover' ? 84 : 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UploadCloud size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 4 }}>
              Drag & drop {type === 'cover' ? 'cover image' : 'logo'} here, or click to browse
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Supported: PNG, JPG, WEBP{type !== 'cover' && ', SVG'} &bull; Max size: 2MB
            </p>
          </div>
        </>
      )}
    </div>
  );
}
