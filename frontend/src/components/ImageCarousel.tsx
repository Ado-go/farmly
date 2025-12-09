import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export function ImageCarousel({
  images,
  onDelete,
  editable = false,
  height = "h-56",
  emptyLabel = "Bez obrázka",
}: {
  images: { url: string }[];
  onDelete?: (idx: number) => void;
  editable?: boolean;
  height?: string;
  emptyLabel?: string;
}) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  useEffect(() => {
    if (previewIndex === null) return;
    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewIndex(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewIndex]);

  if (!images?.length) {
    return (
      <div
        className={cn(
          "w-full bg-gray-200 rounded flex items-center justify-center text-gray-500",
          height
        )}
      >
        {emptyLabel}
      </div>
    );
  }

  const openPreview = (index: number) => setPreviewIndex(index);
  const closePreview = () => setPreviewIndex(null);

  return (
    <div className="relative">
      <Carousel>
        <CarouselContent className="pb-2">
          {images.map((img, i) => (
            <CarouselItem key={i}>
              <div
                className={cn(
                  "relative flex items-center justify-center overflow-hidden rounded-lg bg-gray-100",
                  height,
                  "max-h-[70vh]"
                )}
              >
                <img
                  src={img.url}
                  className="max-h-full max-w-full object-contain transition duration-200 hover:scale-[1.02] cursor-zoom-in"
                  alt={`image-${i}`}
                  onClick={() => openPreview(i)}
                />

                {editable && (
                  <button
                    type="button"
                    onClick={() => onDelete?.(i)}
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-700 text-sm rounded-full w-6 h-6 flex items-center justify-center shadow"
                    title="Odstrániť obrázok"
                  >
                    ✕
                  </button>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious
          type="button"
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-700 rounded-full shadow w-8 h-8 flex items-center justify-center"
        />
        <CarouselNext
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-700 rounded-full shadow w-8 h-8 flex items-center justify-center"
        />
      </Carousel>

      {previewIndex !== null && images[previewIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={closePreview}
        >
          <button
            type="button"
            className="absolute right-6 top-6 rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-gray-700 shadow hover:bg-white"
            onClick={closePreview}
          >
            Zavrieť
          </button>
          <div
            className="max-h-[90vh] max-w-[90vw] rounded-xl bg-white/5 p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[previewIndex].url}
              alt={`image-full-${previewIndex}`}
              className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
