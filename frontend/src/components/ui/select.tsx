import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const selectVariants = cva(
  "flex h-10 w-full items-center justify-between rounded-[var(--erp-radius-control)] border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        outline: "border-slate-300 bg-white",
        ghost: "border-transparent bg-transparent focus-visible:ring-0",
      },
      size: {
        sm: "h-8 px-2 text-xs",
        default: "h-10 px-3 py-2 text-sm",
        lg: "h-11 px-4 py-2 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "size">,
    VariantProps<typeof selectVariants> {
  onValueChange?: (value: string) => void;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", variant, size, onValueChange, onChange, ...props }, ref) => {
    // Support a Radix-style composition used across the app where callers
    // place <SelectTrigger>, <SelectContent>, and <SelectItem> as children.
    // For compilation compatibility, extract any <SelectItem> elements from
    // a <SelectContent> child and render them as native <option> elements.
    const children = (props as any).children;

    const items: { value?: string; label?: React.ReactNode }[] = [];

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const typeName = (child.type as any)?.displayName;
      if (typeName === "SelectContent") {
        React.Children.forEach((child.props as any)?.children, (item) => {
          if (!React.isValidElement(item)) return;
          if ((item.type as any)?.displayName === "SelectItem") {
            items.push({ value: (item.props as any)?.value, label: (item.props as any)?.children });
          }
        });
      }
    });

    const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
      onChange?.(e);
      onValueChange?.(e.target.value);
    };

    return (
      <select
        className={cn(selectVariants({ variant, size, className }))}
        ref={ref}
        onChange={handleChange}
        {...props}
      >
        {items.length > 0
          ? items.map((it) => (
              <option key={String(it.value) || String(it.label)} value={it.value}>
                {it.label}
              </option>
            ))
          : props.children}
      </select>
    );
  }
);
Select.displayName = "Select";

const SelectTrigger = ({ children, ..._props }: any) => null;
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ children, ..._props }: any) => null;
SelectValue.displayName = "SelectValue";

const SelectContent = ({ children, ..._props }: any) => null;
SelectContent.displayName = "SelectContent";

const SelectItem = ({ children, value, ..._props }: any) => null;
SelectItem.displayName = "SelectItem";

const SelectGroup = ({ children, ..._props }: any) => null;
SelectGroup.displayName = "SelectGroup";

const SelectSeparator = ({ children, ..._props }: any) => null;
SelectSeparator.displayName = "SelectSeparator";

const SelectScrollUpButton = ({ children, ..._props }: any) => null;
SelectScrollUpButton.displayName = "SelectScrollUpButton";

const SelectScrollDownButton = ({ children, ..._props }: any) => null;
SelectScrollDownButton.displayName = "SelectScrollDownButton";

export {
  Select,
  selectVariants,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
