import React, { useRef, useState } from 'react';
import { FileUp } from 'lucide-react';
import { api } from '../services/api.js';

// Arquivos enviados ao Storage ficam como <uuid>-<nome>; mostra só o nome
// original. Links externos (YouTube, por exemplo) aparecem como estão.
const displayName = (url) => {
  if (!url.includes('/storage/v1/object/public/')) return url;
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop()).replace(/^[0-9a-f-]{36}-/, '');
  } catch {
    return url;
  }
};

// Campo que aceita um link colado ou um arquivo escolhido no computador. O
// arquivo é enviado ao Supabase Storage e o campo recebe o link público.
const FileUrlField = ({ label, kind, courseId, value, onChange, accept, maxSizeMb, placeholder, hint, onUploadingChange }) => {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const isUploading = progress !== null;

  const setUploading = (uploading) => {
    setProgress(uploading ? 0 : null);
    onUploadingChange?.(uploading);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError('');
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`O arquivo deve ter no máximo ${maxSizeMb} MB.`);
      return;
    }

    setUploading(true);
    try {
      onChange(await api.uploadCourseFile(courseId, kind, file, setProgress));
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="material-picker">
        <input type="url" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} disabled={isUploading} />
        <button type="button" className="btn" onClick={() => inputRef.current?.click()} disabled={isUploading}>
          <FileUp size={16} aria-hidden="true" /> {isUploading ? `Enviando ${progress}%` : 'Escolher arquivo'}
        </button>
        <input ref={inputRef} type="file" accept={accept} onChange={handleFileChange} hidden />
      </div>
      {isUploading && (
        <div className="upload-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${progress}%` }} />
        </div>
      )}
      {value && !isUploading && (
        <p className="material-current">
          Arquivo: <a href={value} target="_blank" rel="noopener noreferrer">{displayName(value)}</a>
          <button type="button" onClick={() => onChange('')}>Remover</button>
        </p>
      )}
      {error && <p className="editor-feedback error">{error}</p>}
      {hint && <small className="material-hint">{hint}</small>}
    </div>
  );
};

export default FileUrlField;
