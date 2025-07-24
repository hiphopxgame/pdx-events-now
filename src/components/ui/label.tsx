import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200"
)

interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  isRequired?: boolean;
  isFilled?: boolean;
  showSuccess?: boolean;
  fieldValue?: any;
}

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, isRequired, isFilled, showSuccess, fieldValue, children, ...props }, ref) => {
  const hasValue = Boolean(fieldValue);
  const fieldState = showSuccess ? 'success' : hasValue ? 'filled' : 'empty';
  
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        labelVariants(),
        // Form state styling
        fieldState === 'filled' && "form-label-filled",
        fieldState === 'empty' && "form-label-empty",
        isRequired && !hasValue && "form-label-required",
        className
      )}
      {...props}
    >
      {children}
      {isRequired && !hasValue && <span className="text-[hsl(var(--form-required-border))] ml-1">*</span>}
    </LabelPrimitive.Root>
  )
})
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
