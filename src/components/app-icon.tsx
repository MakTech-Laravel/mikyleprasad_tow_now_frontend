import { Button, type ButtonProps } from '@/components/ui/button';
import { type ComponentType } from 'react';
import { Truck, type LucideProps } from 'lucide-react';
import { Icon } from './icon';
import { cn } from '@/lib/utils';

interface AppIconProps {
  iconNode?: ComponentType<LucideProps>;
  className?: string;
  buttonClassName?: string;
  buttonProps?: ButtonProps;
  buttonVariant?: ButtonProps['variant'];
  buttonSize?: ButtonProps['size'];
  [key: string]: unknown;
}

export default function AppIcon({
  iconNode: IconComponent = Truck,
  className,
  buttonClassName,
  buttonProps,
  buttonVariant = 'default',
  buttonSize = 'icon',
  ...props
}: AppIconProps) {
  return (
    <Button
      size={buttonSize}
      variant={buttonVariant}
      className={cn('cursor-pointer rounded-lg', buttonClassName)}
      {...buttonProps}
    >
      <Icon iconNode={IconComponent} className={cn('size-6', className)} {...props} />
    </Button>
  );
}
