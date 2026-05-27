import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';

import InputError from './input-error';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

export interface InputPasswordProps extends React.ComponentPropsWithoutRef<typeof Input> {
  label?: string;
  containerClassName?: string;
  error?: string;
}

const InputPassword = React.forwardRef<HTMLInputElement, InputPasswordProps>(
  ({ id, label, placeholder, className, containerClassName, error, type: _passwordType, ...props }, ref) => {
    void _passwordType;
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className={cn(label || error ? 'space-y-1.5' : undefined, containerClassName)}>
        {label ? (
          <label htmlFor={id} className="text-sm font-medium text-foreground">
            {label}
          </label>
        ) : null}
        <div className="relative">
          <Input
            {...props}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            id={id}
            placeholder={placeholder}
            className={cn('rounded-xl bg-background px-3 py-6 pr-11', className)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-muted-foreground hover:text-foreground focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {error ? <InputError message={error} /> : null}
      </div>
    );
  },
);

InputPassword.displayName = 'InputPassword';

export default InputPassword;
