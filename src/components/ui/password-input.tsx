"use client";

import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { fieldClass } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { label, error, className, id, autoComplete = "current-password", ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="block space-y-1 text-sm">
      <label htmlFor={inputId} className="font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={inputId}
          ref={ref}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className={cn(fieldClass, "pr-11", className)}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center rounded-r-xl text-muted-foreground hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>
      {error ? <span className="block text-xs text-danger">{error}</span> : null}
    </div>
  );
});
