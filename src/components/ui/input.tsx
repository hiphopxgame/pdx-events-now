import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle } from "lucide-react"

interface InputProps extends React.ComponentProps<"input"> {
  isRequired?: boolean;
  isFilled?: boolean;
  showSuccess?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, isRequired, isFilled, showSuccess, value, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || "");
    
    React.useEffect(() => {
      setInternalValue(value || "");
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      if (props.onChange) {
        props.onChange(e);
      }
    };

    const hasValue = (value !== undefined ? Boolean(value) : Boolean(internalValue));
    const fieldState = showSuccess ? 'success' : hasValue ? 'filled' : 'empty';
    
    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200",
            // Form state styling
            fieldState === 'filled' && "form-field-filled border-2",
            fieldState === 'empty' && "form-field-empty",
            fieldState === 'success' && "form-field-success border-2",
            isRequired && !hasValue && "form-field-required",
            className
          )}
          ref={ref}
          value={value !== undefined ? value : internalValue}
          onChange={handleChange}
          {...props}
        />
        {showSuccess && hasValue && (
          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-form-success-border" />
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }