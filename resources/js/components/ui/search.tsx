import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "./input"
import { Button } from "./button"
import { Search, Filter, X, Calendar, Stethoscope } from "lucide-react"
import { Checkbox } from "./checkbox"
import { Label } from "./label"

interface SearchFilterProps extends React.ComponentProps<"div"> {
  placeholder?: string
  onSearch: (query: string) => void
  debounceMs?: number
  className?: string
}

function SearchInput({
  placeholder = "Search...",
  onSearch,
  debounceMs = 300,
  className,
  ...props
}: SearchFilterProps) {
  const [query, setQuery] = React.useState("")
  const [isSearching, setIsSearching] = React.useState(false)

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== "") {
        setIsSearching(true)
        onSearch(query)
        // Simulate loading
        setTimeout(() => setIsSearching(false), 200)
      } else {
        onSearch("")
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, onSearch, debounceMs])

  const clearSearch = () => {
    setQuery("")
    onSearch("")
  }

  return (
    <div className={cn("relative flex items-center", className)} {...props}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 pr-10"
      />
      {query && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
          onClick={clearSearch}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {isSearching && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        </div>
      )}
    </div>
  )
}

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterProps extends React.ComponentProps<"div"> {
  title?: string
  options: FilterOption[]
  selected: string[]
  onToggle: (value: string) => void
  onClear?: () => void
  className?: string
}

function Filter({
  title = "Filter",
  options,
  selected,
  onToggle,
  onClear,
  className,
  ...props
}: FilterProps) {
  const isAllSelected = selected.length === options.length

  const toggleAll = () => {
    if (isAllSelected) {
      onClear?.()
    } else {
      onToggle("all")
    }
  }

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          {selected.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      )}
      
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all"
            checked={isAllSelected}
            onCheckedChange={toggleAll}
            className="h-4 w-4"
          />
          <Label htmlFor="select-all" className="text-sm font-medium">
            Select All
          </Label>
        </div>
        
        {options.map((option) => (
          <div key={option.value} className="flex items-center justify-between pl-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={option.value}
                checked={selected.includes(option.value)}
                onCheckedChange={() => onToggle(option.value)}
                className="h-4 w-4"
              />
              <Label htmlFor={option.value} className="text-sm">
                {option.label}
              </Label>
            </div>
            {option.count !== undefined && (
              <span className="text-xs text-muted-foreground">
                {option.count}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface DateRange {
  from?: Date
  to?: Date
}

interface DateFilterProps extends React.ComponentProps<"div"> {
  label?: string
  value?: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

function DateFilter({
  label = "Date Range",
  value = {},
  onChange,
  className,
  ...props
}: DateFilterProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          value={value.from ? value.from.toISOString().split('T')[0] : ''}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : undefined
            onChange({ ...value, from: date })
          }}
        />
        <input
          type="date"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          value={value.to ? value.to.toISOString().split('T')[0] : ''}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : undefined
            onChange({ ...value, to: date })
          }}
        />
      </div>
    </div>
  )
}

interface AdvancedSearchProps extends React.ComponentProps<"div"> {
  onSearch: (filters: SearchFilters) => void
  filters?: SearchFilters
  className?: string
}

interface SearchFilters {
  query: string
  status: string[]
  dateRange: DateRange
  departments: string[]
  doctors: string[]
}

function AdvancedSearch({
  onSearch,
  filters = {
    query: "",
    status: [],
    dateRange: {},
    departments: [],
    doctors: []
  },
  className,
  ...props
}: AdvancedSearchProps) {
  const [localFilters, setLocalFilters] = React.useState(filters)

  React.useEffect(() => {
    onSearch(localFilters)
  }, [localFilters, onSearch])

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className={cn("space-y-4", className)} {...props}>
      {/* Search Input */}
      <SearchInput
        placeholder="Search patients, appointments, records..."
        onSearch={(query) => updateFilter("query", query)}
        value={localFilters.query}
      />

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Status
              {localFilters.status.length > 0 && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                  {localFilters.status.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <Filter
              title="Appointment Status"
              options={[
                { value: "scheduled", label: "Scheduled" },
                { value: "confirmed", label: "Confirmed" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
                { value: "no-show", label: "No Show" }
              ]}
              selected={localFilters.status}
              onToggle={(value) => {
                if (value === "all") {
                  updateFilter("status", localFilters.status.length === 5 ? [] : ["scheduled", "confirmed", "completed", "cancelled", "no-show"])
                } else {
                  const newStatus = localFilters.status.includes(value)
                    ? localFilters.status.filter(s => s !== value)
                    : [...localFilters.status, value]
                  updateFilter("status", newStatus)
                }
              }}
              onClear={() => updateFilter("status", [])}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Date Range
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <DateFilter
              value={localFilters.dateRange}
              onChange={(range) => updateFilter("dateRange", range)}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Stethoscope className="mr-2 h-4 w-4" />
              Departments
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <Filter
              title="Departments"
              options={[
                { value: "cardiology", label: "Cardiology" },
                { value: "neurology", label: "Neurology" },
                { value: "orthopedics", label: "Orthopedics" },
                { value: "pediatrics", label: "Pediatrics" },
                { value: "general", label: "General Medicine" }
              ]}
              selected={localFilters.departments}
              onToggle={(value) => {
                if (value === "all") {
                  updateFilter("departments", localFilters.departments.length === 5 ? [] : ["cardiology", "neurology", "orthopedics", "pediatrics", "general"])
                } else {
                  const newDepts = localFilters.departments.includes(value)
                    ? localFilters.departments.filter(d => d !== value)
                    : [...localFilters.departments, value]
                  updateFilter("departments", newDepts)
                }
              }}
              onClear={() => updateFilter("departments", [])}
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocalFilters({
            query: "",
            status: [],
            dateRange: {},
            departments: [],
            doctors: []
          })}
        >
          <X className="mr-2 h-4 w-4" />
          Clear All
        </Button>
      </div>

      {/* Active Filters */}
      {Object.values(localFilters).some(value => 
        (Array.isArray(value) && value.length > 0) || 
        (typeof value === 'object' && value !== null && Object.keys(value).length > 0) ||
        (typeof value === 'string' && value.trim() !== '')
      ) && (
        <div className="flex flex-wrap gap-2">
          {localFilters.query && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm">
              Search: {localFilters.query}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-6 w-6 p-0"
                onClick={() => updateFilter("query", "")}
              >
                <X className="h-3 w-3" />
              </Button>
            </span>
          )}
          {localFilters.status.map(status => (
            <span key={status} className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm">
              Status: {status}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-6 w-6 p-0"
                onClick={() => updateFilter("status", localFilters.status.filter(s => s !== status))}
              >
                <X className="h-3 w-3" />
              </Button>
            </span>
          ))}
          {localFilters.departments.map(dept => (
            <span key={dept} className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm">
              Dept: {dept}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-6 w-6 p-0"
                onClick={() => updateFilter("departments", localFilters.departments.filter(d => d !== dept))}
              >
                <X className="h-3 w-3" />
              </Button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// Hook for managing search state
export function useSearch<T>(
  items: T[],
  searchFields: (keyof T)[],
  filters?: {
    status?: string[]
    dateRange?: DateRange
    departments?: string[]
  }
) {
  const [query, setQuery] = React.useState("")
  const [debouncedQuery, setDebouncedQuery] = React.useState("")

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const filteredItems = React.useMemo(() => {
    let result = items

    // Apply text search
    if (debouncedQuery.trim()) {
      const searchLower = debouncedQuery.toLowerCase()
      result = result.filter(item =>
        searchFields.some(field =>
          String(item[field]).toLowerCase().includes(searchLower)
        )
      )
    }

    // Apply filters
    if (filters?.status?.length) {
      result = result.filter(item =>
        filters.status?.includes(String(item.status))
      )
    }

    if (filters?.departments?.length) {
      result = result.filter(item =>
        filters.departments?.includes(String(item.department))
      )
    }

    if (filters?.dateRange?.from || filters?.dateRange?.to) {
      const { from, to } = filters.dateRange
      result = result.filter(item => {
        const date = new Date(String(item.date))
        if (from && date < from) return false
        if (to && date > to) return false
        return true
      })
    }

    return result
  }, [items, debouncedQuery, searchFields, filters])

  return {
    query,
    setQuery,
    filteredItems,
    resultsCount: filteredItems.length
  }
}

export {
  SearchInput,
  Filter,
  DateFilter,
  AdvancedSearch,
  type SearchFilters,
  type DateRange
}