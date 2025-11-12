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

  return (
    <div className="relative">
      <Carousel>
        <CarouselContent>
          {images.map((img, i) => (
            <CarouselItem key={i}>
              <div className="relative">
                <img
                  src={img.url}
                  className={cn("w-full object-cover rounded", height)}
                  alt={`image-${i}`}
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
    </div>
  );
}
