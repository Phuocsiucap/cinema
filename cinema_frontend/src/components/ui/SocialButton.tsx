import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface SocialButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  children: ReactNode;
}

export function SocialButton({ icon, children, className = '', ...props }: SocialButtonProps) {
  return (
    <button
      className={`
        w-full py-3 px-4 rounded-lg font-medium
        flex items-center justify-center gap-3
        bg-gray-900 border border-gray-700
        hover:bg-gray-800 text-white
        transition-all duration-200
        ${className}
      `}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

export default SocialButton;
