import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle } from "lucide-react"

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isRequired?: boolean;
  isFilled?: boolean;
  showSuccess?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, isRequired, isFilled, showSuccess, value, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || "");
    
    React.useEffect(() => {
      setInternalValue(value || "");
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInternalValue(e.target.value);
      if (props.onChange) {
        props.onChange(e);
      }
    };

    const hasValue = (value !== undefined ? Boolean(value) : Boolean(internalValue));
    const fieldState = showSuccess ? 'success' : hasValue ? 'filled' : 'empty';

    return (
      <div className="relative">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
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
          <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-[hsl(var(--form-success-border))]" />
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
