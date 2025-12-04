import { Card } from "@/components/ui/card";
import { ImageCarousel } from "@/components/ImageCarousel";
import { useTranslation } from "react-i18next";

type FarmGalleryCardProps = {
  images: { url: string }[];
};

export function FarmGalleryCard({ images }: FarmGalleryCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="p-0 overflow-hidden border-primary/15 shadow-sm">
      {images.length > 0 ? (
        <ImageCarousel
          images={images}
          editable={false}
          height="h-72"
          emptyLabel={t("farmsPage.noImage")}
        />
      ) : (
        <div className="flex h-72 w-full items-center justify-center bg-primary/5 text-primary">
          {t("farmsPage.noImage")}
        </div>
      )}
    </Card>
  );
}
