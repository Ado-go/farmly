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

type DatePickerProps = {
  label?: string;
  date?: Date;
  onSelect: (date: Date | undefined) => void;
  showTime?: boolean;
};

export default function DatePicker({
  label,
  date,
  onSelect,
  showTime = false,
}: DatePickerProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col w-full">
      {label && <label className="text-sm font-medium mb-1">{label}</label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-start text-left font-normal"
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
