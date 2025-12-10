import { useState, useEffect, useRef } from "react";
import { ImageCarousel } from "@/components/ImageCarousel";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export type UploadedImage = {
  url: string;
  publicId?: string;
  optimizedUrl?: string;
  isNew?: boolean;
  file?: File;
};

interface ImageUploaderProps {
  value?: UploadedImage[];
  onChange: (imgs: UploadedImage[]) => void;
  editable?: boolean;
  height?: string;
}

export function ImageUploader({
  value = [],
  onChange,
  editable = true,
  height = "h-48",
}: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setImages(value);
  }, [value]);

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const addFiles = (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    setImages((prev) => {
      const newImages = imageFiles.map((file) => ({
        url: URL.createObjectURL(file),
        file,
        isNew: true,
      }));

      const all = [...prev, ...newImages];
      onChange(all);
      return all;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    addFiles(Array.from(e.target.files));
    resetInput();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length > 0) addFiles(dropped);
    resetInput();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDelete = (idx: number) => {
    const updated = images.filter((_, i) => i !== idx);
    setImages(updated);
    onChange(updated);
  };

  const uploadHeight = images.length > 0 ? "h-28" : height;

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <ImageCarousel
          images={images}
          onDelete={editable ? handleDelete : undefined}
          editable={editable}
          height={height}
          emptyLabel="Bez obrázka"
        />
      )}

      {editable && (
        <div
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          role="button"
          tabIndex={0}
          className={cn(
            "flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed cursor-pointer transition-colors bg-white/70 focus:outline-none focus:ring-2 focus:ring-primary/30",
            isDragging
              ? "border-primary/60 bg-primary/5 text-primary"
              : "border-gray-300 hover:border-gray-400",
            uploadHeight
          )}
        >
          <div className="flex flex-col items-center gap-1 text-gray-600">
            <Upload className="mb-1 h-7 w-7" />
            <span className="text-xs font-medium">
              {t("product.uploadImage")}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {t("product.uploadImageHint")}
            </span>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
}
