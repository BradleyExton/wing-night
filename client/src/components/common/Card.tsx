import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function Card({ children, className = '', onClick, selected }: CardProps) {
  const baseStyles = 'bg-bg-card rounded-xl p-4 border border-gray-700/50';
  const interactiveStyles = onClick
    ? 'cursor-pointer hover:border-primary/50 transition-all duration-200'
    : '';
  const selectedStyles = selected ? 'border-primary ring-2 ring-primary/30' : '';

  return (
    <div
      className={`${baseStyles} ${interactiveStyles} ${selectedStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`font-semibold text-lg mb-3 ${className}`}>
      {children}
    </div>
  );
}
