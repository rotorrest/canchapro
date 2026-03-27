import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export default function DatePicker({ value, onChange, placeholder = "Seleccionar fecha", className }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            !value && "text-gray-400",
            className
          )}
        >
          <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
          {value ? format(value, "d MMM yyyy", { locale: es }) : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          locale={es}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
