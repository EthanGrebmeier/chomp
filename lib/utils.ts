import { ClassValue, clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react-native';
import { nanoid } from 'nanoid';
import { cssInterop } from 'nativewind';
import React from 'react';
import { SvgProps } from 'react-native-svg';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const generateId = () => {
  return nanoid(12);
};

type SvgIcon = React.ComponentType<SvgProps>;

export function iconWithClassName(icon: LucideIcon | SvgIcon) {
  cssInterop(icon, {
    className: {
      target: 'style',
      nativeStyleToProp: {
        color: true,
        opacity: true,
      },
    },
  });
}
