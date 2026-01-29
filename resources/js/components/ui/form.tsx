import * as React from "react"
import { cn } from "@/lib/utils"

// Form context for validation and state management
interface FormContextValue {
  errors: Record<string, string>
  touched: Record<string, boolean>
  values: Record<string, unknown>
  isSubmitting: boolean
  setFieldValue: (name: string, value: unknown) => void
  setFieldTouched: (name: string, touched: boolean) => void
  setFieldError: (name: string, error: string) => void
  validateField: (name: string) => void
  handleSubmit: (e: React.FormEvent) => void
}

const FormContext = React.createContext<FormContextValue | null>(null)

function useFormContext() {
  const context = React.useContext(FormContext)
  if (!context) {
    throw new Error("Form components must be used within a Form")
  }
  return context
}

// Form component
interface FormProps extends React.ComponentProps<"form"> {
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>
  initialValues?: Record<string, unknown>
  validationSchema?: Record<string, (value: unknown) => string | undefined>
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

function Form({
  children,
  onSubmit,
  initialValues = {},
  validationSchema = {},
  validateOnChange = true,
  validateOnBlur = true,
  className,
  ...props
}: FormProps) {
  const [values, setValues] = React.useState(initialValues)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const setFieldValue = React.useCallback((name: string, value: unknown) => {
    setValues(prev => ({ ...prev, [name]: value }))
    if (validateOnChange && touched[name]) {
      validateField(name)
    }
  }, [validateOnChange, touched])

  const setFieldTouched = React.useCallback((name: string, touched: boolean) => {
    setTouched(prev => ({ ...prev, [name]: touched }))
    if (validateOnBlur && touched) {
      validateField(name)
    }
  }, [validateOnBlur])

  const setFieldError = React.useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [])

  const validateField = React.useCallback((name: string) => {
    const validator = validationSchema[name]
    if (validator) {
      const error = validator(values[name])
      setFieldError(name, error || '')
    }
  }, [values, validationSchema, setFieldError])

  const validateForm = React.useCallback(() => {
    const newErrors: Record<string, string> = {}
    Object.keys(validationSchema).forEach(name => {
      const error = validationSchema[name](values[name])
      if (error) {
        newErrors[name] = error
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [values, validationSchema])

  const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    const allFields = Object.keys(validationSchema)
    const newTouched = allFields.reduce((acc, field) => {
      acc[field] = true
      return acc
    }, {} as Record<string, boolean>)
    setTouched(newTouched)

    // Validate form
    const isValid = validateForm()
    if (!isValid) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validationSchema, validateForm, onSubmit])

  const contextValue = React.useMemo(() => ({
    errors,
    touched,
    values,
    isSubmitting,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    validateField,
    handleSubmit,
  }), [errors, touched, values, isSubmitting, setFieldValue, setFieldTouched, setFieldError, validateField, handleSubmit])

  return (
    <FormContext.Provider value={contextValue}>
      <form
        data-slot="form"
        className={cn("space-y-6", className)}
        onSubmit={handleSubmit}
        {...props}
      >
        {children}
      </form>
    </FormContext.Provider>
  )
}

// FormField component
interface FormFieldProps extends React.ComponentProps<"div"> {
  name: string
  label?: string
  required?: boolean
  helpText?: string
}

function FormField({
  name,
  label,
  required = false,
  helpText,
  children,
  className,
  ...props
}: FormFieldProps) {
  const { errors, touched, values } = useFormContext()
  const hasError = touched[name] && errors[name]
  const value = values[name]

  return (
    <div
      data-slot="form-field"
      className={cn("space-y-2", className)}
      {...props}
    >
      {label && (
        <label
          htmlFor={name}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            required && "after:content-['*'] after:ml-1 after:text-red-500"
          )}
        >
          {label}
        </label>
      )}
      
      <div className="space-y-1">
        {children}
        
        {hasError && (
          <p className="text-sm text-destructive" role="alert">
            {errors[name]}
          </p>
        )}
        
        {helpText && !hasError && (
          <p className="text-sm text-muted-foreground">
            {helpText}
          </p>
        )}
      </div>
    </div>
  )
}

// FormInput component
interface FormInputProps extends React.ComponentProps<"input"> {
  name: string
  label?: string
  helpText?: string
  required?: boolean
}

function FormInput({
  name,
  label,
  helpText,
  required = false,
  className,
  onChange,
  onBlur,
  ...props
}: FormInputProps) {
  const { setFieldValue, setFieldTouched, errors, touched, values } = useFormContext()
  const hasError = touched[name] && errors[name]
  const value = values[name] || ''

  return (
    <FormField
      name={name}
      label={label}
      required={required}
      helpText={helpText}
      className={className}
    >
      <input
        data-slot="form-input"
        id={name}
        name={name}
        value={value}
        onChange={(e) => {
          setFieldValue(name, e.target.value)
          onChange?.(e)
        }}
        onBlur={(e) => {
          setFieldTouched(name, true)
          onBlur?.(e)
        }}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          hasError && "border-destructive focus-visible:ring-destructive/20",
          className
        )}
        {...props}
      />
    </FormField>
  )
}

// FormSelect component
interface FormSelectProps extends React.ComponentProps<"select"> {
  name: string
  label?: string
  helpText?: string
  required?: boolean
  options: Array<{ value: string | number; label: string }>
}

function FormSelect({
  name,
  label,
  helpText,
  required = false,
  options,
  className,
  onChange,
  onBlur,
  ...props
}: FormSelectProps) {
  const { setFieldValue, setFieldTouched, errors, touched, values } = useFormContext()
  const hasError = touched[name] && errors[name]
  const value = values[name] || ''

  return (
    <FormField
      name={name}
      label={label}
      required={required}
      helpText={helpText}
      className={className}
    >
      <select
        data-slot="form-select"
        id={name}
        name={name}
        value={value}
        onChange={(e) => {
          setFieldValue(name, e.target.value)
          onChange?.(e)
        }}
        onBlur={(e) => {
          setFieldTouched(name, true)
          onBlur?.(e)
        }}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background",
          hasError && "border-destructive focus:ring-destructive/20",
          className
        )}
        {...props}
      >
        <option value="" disabled>
          Select an option
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  )
}

// FormTextarea component
interface FormTextareaProps extends React.ComponentProps<"textarea"> {
  name: string
  label?: string
  helpText?: string
  required?: boolean
}

function FormTextarea({
  name,
  label,
  helpText,
  required = false,
  className,
  onChange,
  onBlur,
  ...props
}: FormTextareaProps) {
  const { setFieldValue, setFieldTouched, errors, touched, values } = useFormContext()
  const hasError = touched[name] && errors[name]
  const value = values[name] || ''

  return (
    <FormField
      name={name}
      label={label}
      required={required}
      helpText={helpText}
      className={className}
    >
      <textarea
        data-slot="form-textarea"
        id={name}
        name={name}
        value={value}
        onChange={(e) => {
          setFieldValue(name, e.target.value)
          onChange?.(e)
        }}
        onBlur={(e) => {
          setFieldTouched(name, true)
          onBlur?.(e)
        }}
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          hasError && "border-destructive focus-visible:ring-destructive/20",
          className
        )}
        {...props}
      />
    </FormField>
  )
}

// FormCheckbox component
interface FormCheckboxProps extends React.ComponentProps<"input"> {
  name: string
  label: string
  helpText?: string
}

function FormCheckbox({
  name,
  label,
  helpText,
  className,
  onChange,
  onBlur,
  ...props
}: FormCheckboxProps) {
  const { setFieldValue, setFieldTouched, errors, touched, values } = useFormContext()
  const hasError = touched[name] && errors[name]
  const checked = values[name] || false

  return (
    <FormField
      name={name}
      label={label}
      helpText={helpText}
      className={cn("flex items-start space-x-2", className)}
    >
      <input
        data-slot="form-checkbox"
        id={name}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          setFieldValue(name, e.target.checked)
          onChange?.(e)
        }}
        onBlur={(e) => {
          setFieldTouched(name, true)
          onBlur?.(e)
        }}
        className={cn(
          "mt-1 h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          hasError && "border-destructive focus:ring-destructive/20",
          className
        )}
        {...props}
      />
      <label htmlFor={name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
    </FormField>
  )
}

// FormSubmitButton component
interface FormSubmitButtonProps extends React.ComponentProps<"button"> {
  isLoading?: boolean
  loadingText?: string
}

function FormSubmitButton({
  children,
  isLoading = false,
  loadingText = "Submitting...",
  className,
  disabled,
  ...props
}: FormSubmitButtonProps) {
  const { isSubmitting } = useFormContext()

  return (
    <button
      data-slot="form-submit-button"
      type="submit"
      disabled={disabled || isSubmitting || isLoading}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2",
        className
      )}
      {...props}
    >
      {(isSubmitting || isLoading) && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {(isSubmitting || isLoading) ? loadingText : children}
    </button>
  )
}

// Validation helpers
export const validationHelpers = {
  required: (message = "This field is required") => (value: unknown) =>
    !value || (typeof value === 'string' && value.trim() === "") ? message : undefined,
  
  email: (message = "Please enter a valid email address") => (value: unknown) =>
    value && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? message : undefined,
  
  minLength: (min: number, message?: string) => (value: unknown) =>
    value && typeof value === 'string' && value.length < min
      ? message || `Must be at least ${min} characters`
      : undefined,
  
  maxLength: (max: number, message?: string) => (value: unknown) =>
    value && typeof value === 'string' && value.length > max
      ? message || `Must be no more than ${max} characters`
      : undefined,
  
  number: (message = "Must be a valid number") => (value: unknown) =>
    value && typeof value === 'string' && isNaN(Number(value)) ? message : undefined,
  
  min: (min: number, message?: string) => (value: unknown) =>
    value && typeof value === 'number' && value < min
      ? message || `Must be at least ${min}`
      : undefined,
  
  max: (max: number, message?: string) => (value: unknown) =>
    value && typeof value === 'number' && value > max
      ? message || `Must be no more than ${max}`
      : undefined,
  
  pattern: (regex: RegExp, message = "Invalid format") => (value: unknown) =>
    value && typeof value === 'string' && !regex.test(value) ? message : undefined,
}

export {
  Form,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormCheckbox,
  FormSubmitButton,
  useFormContext,
}