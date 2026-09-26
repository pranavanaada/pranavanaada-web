import { useRef, useState } from 'react';
import { uploadProductImage } from '../../lib/imageUpload';

export interface ManagedImage {
  url: string;
  thumb?: string | null;
}

/**
 * Photo manager for the product form. The first photo is the main one (used on
 * cards); the rest appear in the product page gallery. Admins can add several
 * at once, make any photo the main one, reorder, and remove.
 */
export default function ImageManager({
  images,
  onChange,
  folder = 'products',
}: {
  images: ManagedImage[];
  onChange: (images: ManagedImage[]) => void;
  folder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function addFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    setError(null);
    setUploading((n) => n + list.length);
    let current = images;
    for (const file of list) {
      try {
        const uploaded = await uploadProductImage(file, file.name.replace(/\.[^.]+$/, ''), folder);
        current = [...current, uploaded];
        onChange(current);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
        {images.map((img, i) => (
          <div key={img.url} className="relative group rounded-lg overflow-hidden border border-emerald-700 bg-emerald-950 aspect-square">
            <img src={img.thumb || img.url} alt="" className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute top-1.5 left-1.5 bg-gold text-emerald-950 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                Main
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-emerald-950/85 text-xs opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="px-2 py-1.5 disabled:opacity-30 hover:text-gold" title="Move left">
                ←
              </button>
              {i !== 0 && (
                <button type="button" onClick={() => move(i, 0)} className="px-1 py-1.5 hover:text-gold" title="Make main photo">
                  ★ Main
                </button>
              )}
              <button
                type="button"
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                className="px-2 py-1.5 text-red-300 hover:text-red-400"
                title="Remove photo"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {Array.from({ length: uploading }).map((_, i) => (
          <div key={`up-${i}`} className="aspect-square rounded-lg shimmer border border-emerald-700" />
        ))}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-5 text-center text-sm transition-colors ${
          dragOver ? 'border-gold bg-gold/5 text-gold' : 'border-emerald-700 text-cream/50 hover:border-gold/60'
        }`}
      >
        {uploading ? 'Uploading…' : 'Click or drop photos here (you can pick several)'}
        <div className="text-[11px] text-cream/35 mt-1">Photos are resized and compressed automatically.</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
