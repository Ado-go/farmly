import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { ImageCarousel } from "@/components/ImageCarousel";

export type UploadedImage = {
  url: string;
  optimizedUrl?: string;
  publicId?: string;
};

export function ImageUploader({
  onUploaded,
  buttonLabel = "Nahrať obrázky",
  showPreview = true,
  editable = true,
}: {
  onUploaded: (imgs: UploadedImage[]) => void;
  buttonLabel?: string;
  showPreview?: boolean;
  editable?: boolean;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return (await apiFetch("/upload", {
        method: "POST",
        body: formData,
      })) as UploadedImage;
    },
    onSuccess: (data) => {
      onUploaded([data]);
      setPreviews((prev) => [...prev, data]);
      toast.success("Obrázok nahraný");
    },
    onError: () => toast.error("Nepodarilo sa nahrať obrázok"),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    setFiles(filesArray);
    setIsUploading(true);

    for (const file of filesArray) {
      await mutation.mutateAsync(file);
    }

    setIsUploading(false);
  };

  const handleDelete = (idx: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{buttonLabel}</label>
      <input
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      {isUploading && <p className="text-sm text-gray-500">Nahrávam...</p>}
      {showPreview && previews.length > 0 && (
        <ImageCarousel
          images={previews}
          onDelete={handleDelete}
          editable={editable}
          height="h-40"
        />
      )}
    </div>
  );
}
