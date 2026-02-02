import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Types
export interface BillFiltersState {
  dateRange: { from: string; to: string }
  statuses: string[]
  patientSearch: string
  patientId: string | null
  department: string
  paymentMethod: string
  amountMin: string
  amountMax: string
}

export interface BillFiltersProps {
  filters: BillFiltersState
  onFiltersChange: (filters: BillFiltersState) => void
  departments?: Array<{ id: string; name: string }>
  paymentMethods?: Array<{ id: string; name: string }>
  statuses?: Array<{ value: string; label: string }>
  className?: string
}

// Default values
const defaultFilters: BillFiltersState = {
  dateRange: { from: "", to: "" },
  statuses: [],
  patientSearch: "",
  patientId: null,
  department: "",
  paymentMethod: "",
  amountMin: "",
  amountMax: "",
}

const defaultStatuses = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
]

const defaultPaymentMethods = [
  { id: "cash", name: "Cash" },
  { id: "card", name: "Credit/Debit Card" },
  { id: "insurance", name: "Insurance" },
  { id: "bank_transfer", name: "Bank Transfer" },
  { id: "mobile_payment", name: "Mobile Payment" },
]

export function BillFilters({
  filters,
  onFiltersChange,
  departments = [],
  paymentMethods = defaultPaymentMethods,
  statuses = defaultStatuses,
  className,
}: BillFiltersProps) {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)

  // Update individual filter
  const updateFilter = <K extends keyof BillFiltersState>(
    key: K,
    value: BillFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  // Clear all filters
  const clearAllFilters = () => {
    onFiltersChange({ ...defaultFilters })
  }

  // Check if any filters are active
  const hasActiveFilters = React.useMemo(() => {
    return (
      filters.dateRange.from !== "" ||
      filters.statuses.length > 0 ||
      filters.patientSearch !== "" ||
      filters.patientId !== null ||
      filters.department !== "" ||
      filters.paymentMethod !== "" ||
      filters.amountMin !== "" ||
      filters.amountMax !== ""
    )
  }, [filters])

  // Remove a specific status from filters
  const removeStatus = (status: string) => {
    updateFilter(
      "statuses",
      filters.statuses.filter((s) => s !== status)
    )
  }

  // Get active filter count for badge
  const activeFilterCount = React.useMemo(() => {
    let count = 0
    if (filters.dateRange.from !== "") count++
    if (filters.statuses.length > 0) count++
    if (filters.patientSearch !== "") count++
    if (filters.department !== "") count++
    if (filters.paymentMethod !== "") count++
    if (filters.amountMin !== "") count++
    if (filters.amountMax !== "") count++
    return count
  }, [filters])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Filters Row */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Date Range Filter */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Date Range
          </label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[260px] justify-start text-left font-normal",
                  !filters.dateRange.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.from ? (
                  filters.dateRange.to ? (
                    <>
                      {format(new Date(filters.dateRange.from), "MMM d, yyyy")} -{" "}
                      {format(new Date(filters.dateRange.to), "MMM d, yyyy")}
                    </>
                  ) : (
                    format(new Date(filters.dateRange.from), "MMM d, yyyy")
                  )
                ) : (
                  <span>Select date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">From</label>
                  <Input
                    type="date"
                    value={filters.dateRange.from}
                    onChange={(e) =>
                      updateFilter("dateRange", {
                        ...filters.dateRange,
                        from: e.target.value,
                      })
                    }
                    max={filters.dateRange.to || undefined}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">To</label>
                  <Input
                    type="date"
                    value={filters.dateRange.to}
                    onChange={(e) =>
                      updateFilter("dateRange", {
                        ...filters.dateRange,
                        to: e.target.value,
                      })
                    }
                    min={filters.dateRange.from || undefined}
                  />
                </div>
                {(filters.dateRange.from || filters.dateRange.to) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      updateFilter("dateRange", { from: "", to: "" })
                    }
                  >
                    Clear Date Range
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Bill Status Multi-Select */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <Select
            value={filters.statuses[0] || ""}
            onValueChange={(value) => {
              if (value && !filters.statuses.includes(value)) {
                updateFilter("statuses", [...filters.statuses, value])
              }
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Add status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem
                  key={status.value}
                  value={status.value}
                  disabled={filters.statuses.includes(status.value)}
                >
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Patient Search */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Patient
          </label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patient..."
              value={filters.patientSearch}
              onChange={(e) => updateFilter("patientSearch", e.target.value)}
              className="pl-8 w-[200px]"
            />
          </div>
        </div>

        {/* Department Filter */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Department
          </label>
          <Select
            value={filters.department}
            onValueChange={(value) => updateFilter("department", value)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment Method Filter */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Payment Method
          </label>
          <Select
            value={filters.paymentMethod}
            onValueChange={(value) => updateFilter("paymentMethod", value)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              {paymentMethods.map((method) => (
                <SelectItem key={method.id} value={method.id}>
                  {method.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount Range */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Amount Range
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.amountMin}
              onChange={(e) => updateFilter("amountMin", e.target.value)}
              className="w-[100px]"
              min="0"
            />
            <span className="text-gray-400">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={filters.amountMax}
              onChange={(e) => updateFilter("amountMax", e.target.value)}
              className="w-[100px]"
              min="0"
            />
          </div>
        </div>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Applied Filters Summary Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Active filters:
          </span>
          
          {filters.dateRange.from && (
            <Badge variant="secondary" className="gap-1">
              Date:{" "}
              {filters.dateRange.to
                ? `${format(new Date(filters.dateRange.from), "MMM d")} - ${format(new Date(filters.dateRange.to), "MMM d, yyyy")}`
                : format(new Date(filters.dateRange.from), "MMM d, yyyy")}
              <button
                onClick={() =>
                  updateFilter("dateRange", { from: "", to: "" })
                }
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.statuses.map((status) => {
            const statusInfo = statuses.find((s) => s.value === status)
            return (
              <Badge key={status} variant="secondary" className="gap-1">
                {statusInfo?.label || status}
                <button
                  onClick={() => removeStatus(status)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}

          {filters.patientSearch && (
            <Badge variant="secondary" className="gap-1">
              Patient: {filters.patientSearch}
              <button
                onClick={() => {
                  updateFilter("patientSearch", "")
                  updateFilter("patientId", null)
                }}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.department && (
            <Badge variant="secondary" className="gap-1">
              Dept: {departments.find((d) => d.id === filters.department)?.name || filters.department}
              <button
                onClick={() => updateFilter("department", "")}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.paymentMethod && (
            <Badge variant="secondary" className="gap-1">
              Payment: {paymentMethods.find((p) => p.id === filters.paymentMethod)?.name || filters.paymentMethod}
              <button
                onClick={() => updateFilter("paymentMethod", "")}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {(filters.amountMin || filters.amountMax) && (
            <Badge variant="secondary" className="gap-1">
              Amount: {filters.amountMin || "0"} - {filters.amountMax || "∞"}
              <button
                onClick={() => {
                  updateFilter("amountMin", "")
                  updateFilter("amountMax", "")
                }}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {activeFilterCount > 0 && (
            <Badge variant="outline" className="ml-auto">
              {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} applied
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

export default BillFilters
