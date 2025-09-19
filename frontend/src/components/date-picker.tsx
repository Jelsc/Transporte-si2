"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }

  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

interface DatePickerProps {
  value?: Date | null
  onChange?: (date: Date | null) => void
  placeholder?: string
  label?: string
  id?: string
  disabled?: boolean
  required?: boolean
  className?: string
  minDate?: Date
  maxDate?: Date
  disableDate?: (date: Date) => boolean
  // Rango de años para el selector (si no se proveen, se derivan de min/max o 1900..hoy+50)
  fromYear?: number
  toYear?: number
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  label,
  id,
  disabled = false,
  required = false,
  className = "",
  minDate,
  maxDate,
  disableDate,
  fromYear,
  toYear,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(value || undefined)
  const [month, setMonth] = React.useState<Date | undefined>(date)
  const [inputValue, setInputValue] = React.useState(formatDate(date))

  // Sincronizar con el valor externo
  React.useEffect(() => {
    setDate(value || undefined)
    setInputValue(formatDate(value || undefined))
    setMonth(value || undefined)
  }, [value])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    setInputValue(formatDate(selectedDate))
    setOpen(false)
    onChange?.(selectedDate || null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = new Date(e.target.value)
    setInputValue(e.target.value)
    
    if (isValidDate(inputDate)) {
      setDate(inputDate)
      setMonth(inputDate)
      onChange?.(inputDate)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
    }
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {label && (
        <Label htmlFor={id} className="px-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="relative flex gap-2">
        <Input
          id={id}
          value={inputValue}
          placeholder={placeholder}
          className="bg-background pr-10"
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
              disabled={disabled}
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Seleccionar fecha</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              // Limita el rango del dropdown de años para permitir selección futura
              fromYear={fromYear ?? (minDate ? minDate.getFullYear() : 1900)}
              toYear={toYear ?? (maxDate ? maxDate.getFullYear() : new Date().getFullYear() + 50)}
              // También definimos límites de navegación cuando corresponda
              {...(minDate ? { fromDate: minDate } as const : {})}
              {...(maxDate ? { toDate: maxDate } as const : {})}
              month={month || new Date()}
              onMonthChange={setMonth}
              onSelect={handleDateSelect}
              disabled={(d) => {
                const min = minDate ?? new Date("1900-01-01")
                const isBeforeMin = d < min
                const isAfterMax = maxDate ? d > maxDate : false
                const isCustomDisabled = disableDate ? disableDate(d) : false
                return isBeforeMin || isAfterMax || isCustomDisabled
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
