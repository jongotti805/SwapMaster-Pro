import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  children: React.ReactNode
}

interface TooltipTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

interface TooltipContentProps {
  children: React.ReactNode
  className?: string
}

const TooltipProvider: React.FC<TooltipProps & { delayDuration?: number }> = ({ children }) => {
  return <>{children}</>;
};

const Tooltip: React.FC<TooltipProps> = ({ children }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === TooltipTrigger) {
            return React.cloneElement(child as React.ReactElement<any>, { isVisible });
          }
          if (child.type === TooltipContent) {
            return React.cloneElement(child as React.ReactElement<any>, { isVisible });
          }
        }
        return child;
      })}
    </div>
  );
};

const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  TooltipTriggerProps & { isVisible?: boolean }
>(({ children, className, asChild, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    const childProps = {
      ...props,
      className: cn(className, (children as any).props?.className)
    };
    return React.cloneElement(children as any, childProps);
  }
  
  return (
    <div ref={ref} className={cn("cursor-pointer", className)} {...props}>
      {children}
    </div>
  );
});
TooltipTrigger.displayName = "TooltipTrigger";

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  TooltipContentProps & { isVisible?: boolean; side?: string; align?: string; hidden?: boolean }
>(({ children, className, isVisible, side, align, hidden, ...props }, ref) => {
  if (!isVisible || hidden) return null;
  
  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 px-3 py-1.5 text-sm text-white bg-gray-900 border border-gray-700 rounded-md shadow-lg -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    >
      {children}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
    </div>
  );
});
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

