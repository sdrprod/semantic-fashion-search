'use client';

import { useState, useRef, DragEvent } from 'react';
import { X, Upload } from 'lucide-react';

interface ImageUploadProps {
  onImagesChange: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function ImageUpload({ onImagesChange, maxFiles = 3, disabled = false }: ImageUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: Only JPG and PNG files are allowed`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File too large (max 5MB)`;
    }
    return null;
  };

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    setError(null);

    const fileArray = Array.from(newFiles);
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    if (files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`);
      return;
    }

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      validFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          if (newPreviews.length === validFiles.length) {
            setPreviews([...previews, ...newPreviews]);
          }
        }
      };
      reader.readAsDataURL(file);
    }

    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);
    onImagesChange(updatedFiles);
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
    onImagesChange(updatedFiles);
    setError(null);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="image-upload-container">
      <div
        className={`image-upload-zone ${dragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
          style={{ display: 'none' }}
        />
        <Upload size={32} />
        <p>{files.length === 0 ? 'Click or drag images here' : `${files.length}/${maxFiles} images`}</p>
        <p className="hint">JPG/PNG, max 5MB each</p>
      </div>

      {error && <div className="upload-error">{error}</div>}

      {previews.length > 0 && (
        <div className="preview-grid">
          {previews.map((preview, i) => (
            <div key={i} className="preview-item">
              <img src={preview} alt={`Preview ${i + 1}`} />
              <button onClick={() => removeFile(i)} disabled={disabled}>
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
