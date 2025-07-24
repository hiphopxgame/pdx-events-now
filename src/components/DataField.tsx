import React from 'react';
import { cn } from '@/lib/utils';

interface DataFieldProps {
  label: string;
  value: string | null | undefined;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  isLink?: boolean;
  onClick?: () => void;
}

export const DataField: React.FC<DataFieldProps> = ({ 
  label, 
  value, 
  placeholder = "Not provided", 
  className,
  icon,
  isLink = false,
  onClick
}) => {
  const hasData = value && value.trim() !== '';
  
  return (
    <div className={cn("flex items-center", className)}>
      {icon && (
        <span className={cn(
          "mr-3 flex-shrink-0",
          hasData ? "text-primary" : "text-muted-foreground"
        )}>
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground">{label}:</span>
        <div className={cn(
          "ml-2 inline-block",
          hasData ? (
            isLink 
              ? "text-primary hover:text-primary/80 cursor-pointer underline-offset-2 hover:underline font-medium" 
              : "text-foreground font-medium"
          ) : "text-muted-foreground italic"
        )}>
          {hasData ? (
            isLink && onClick ? (
              <button onClick={onClick} className="text-left">
                {value}
              </button>
            ) : (
              value
            )
          ) : (
            <span className="bg-muted/50 px-2 py-1 rounded text-xs border border-muted">
              {placeholder}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};