import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  label?: string;
  date?: Date;
  onSelect: (date: Date | undefined) => void;
  showTime?: boolean;
  className?: string;
  buttonClassName?: string;
};

export default function DatePicker({
  label,
  date,
  onSelect,
  showTime = false,
  className,
  buttonClassName,
}: DatePickerProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("flex w-full flex-col", className)}>
      {label && <label className="text-sm font-medium mb-1">{label}</label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              buttonClassName
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date
              ? showTime
                ? format(date, "dd.MM.yyyy HH:mm")
                : format(date, "dd.MM.yyyy")
              : t("common.selectDate", "Vyber dátum")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
