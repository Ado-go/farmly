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
  const { t } = useTranslation();

  useEffect(() => {
    setImages(value);
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const newImages = files.map((file) => ({
      url: URL.createObjectURL(file),
      file,
      isNew: true,
    }));

    const all = [...images, ...newImages];
    setImages(all);
    onChange(all);

    if (inputRef.current) inputRef.current.value = "";
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
          className={cn(
            "flex items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors",
            uploadHeight
          )}
        >
          <div className="flex flex-col items-center text-gray-500">
            <Upload className="w-7 h-7 mb-1" />
            <span className="text-xs">{t("product.uploadImage")}</span>
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
