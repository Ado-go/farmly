import { Card } from "@/components/ui/card";
import { Store } from "lucide-react";

type ProductHeroProps = {
  heading: string;
  productName: string;
  farmName?: string | null;
};

export function ProductHero({
  heading,
  productName,
  farmName,
}: ProductHeroProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-white to-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-primary shadow-sm">
            <Store className="h-4 w-4" />
            {heading}
          </div>
          <h1 className="text-3xl font-bold">{productName}</h1>
          {farmName ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Store className="h-4 w-4 text-primary" />
              <span>{farmName}</span>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
