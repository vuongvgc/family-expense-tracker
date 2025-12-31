'use client';

import * as React from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface MoneyInputProps
  extends Omit<NumericFormatProps, 'customInput' | 'onValueChange'> {
  onValueChange?: (value: number) => void;
  className?: string;
}

/**
 * MoneyInput Component
 *
 * A currency input component for Vietnamese Dong (VND) that:
 * - Displays formatted numbers with dots as thousand separators (e.g., 1.000.000)
 * - Integrates with React Hook Form
 * - Returns raw numeric value (1000000) to the form
 *
 * Usage with React Hook Form:
 * ```tsx
 * <MoneyInput
 *   value={field.value}
 *   onValueChange={(value) => field.onChange(value)}
 * />
 * ```
 */
const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ className, onValueChange, ...props }, ref) => {
    return (
      <NumericFormat
        {...props}
        customInput={Input}
        getInputRef={ref}
        className={cn(className)}
        thousandSeparator='.'
        decimalSeparator=','
        decimalScale={0}
        allowNegative={false}
        placeholder='0'
        onValueChange={(values) => {
          if (onValueChange) {
            // Pass the raw numeric value (not the formatted string)
            onValueChange(values.floatValue || 0);
          }
        }}
      />
    );
  }
);

MoneyInput.displayName = 'MoneyInput';

export { MoneyInput };
