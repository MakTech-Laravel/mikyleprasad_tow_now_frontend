import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Icon } from './icon';
import type { ComponentProps } from 'react';

// Automatically inherit all props from the Button component
interface BackProps extends ComponentProps<typeof Button> {
  icon?: React.ReactNode;
  iconClassName?: string;
  iconPosition?: 'left' | 'right';
}

export function Back({
  children,
  className,
  icon,
  iconClassName,
  iconPosition = 'left',
  ...props
}: BackProps) {
  const isLeft = iconPosition === 'left';
  const DefaultIcon = isLeft ? ArrowLeft : ArrowRight;

  return (
    <Button
      // By spreading ...props here, all native button attributes are inherited
      className={cn('flex items-center gap-2 px-0 hover:no-underline', className)}
      {...props}
    >
      {/* 1. Left Icon */}
      {isLeft && (icon ?? <Icon iconNode={DefaultIcon} className={cn('size-4', iconClassName)} />)}

      {children}

      {/* 2. Right Icon */}
      {!isLeft && (icon ?? <Icon iconNode={DefaultIcon} className={cn('size-4', iconClassName)} />)}
    </Button>
  );
}

Back.displayName = 'Back';
