import React from 'react';
import { cn } from '../../lib/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'subtle';
}

export function Card({ className, variant = 'surface', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'border border-[#E5E1D8] rounded-xl transition-all',
        variant === 'surface' ? 'bg-[#FFFEFA]' : 'bg-[#F7F5F0]',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('p-5 pb-3 flex flex-col space-y-1', className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'font-serif text-lg font-normal text-[#25251F] tracking-tight',
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-xs sm:text-sm text-[#77766E]', className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pt-0', className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'p-5 pt-3 border-t border-[#E5E1D8]/60 flex items-center',
        className
      )}
      {...props}
    />
  );
}

