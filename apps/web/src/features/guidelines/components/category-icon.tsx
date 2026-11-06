'use client';

import React from 'react';
import {
  Megaphone,
  Target,
  Layers,
  Ban,
  Image as ImageIcon,
} from 'lucide-react';

interface CategoryIconProps {
  iconName: 'megaphone' | 'target' | 'layers' | 'restrictions' | 'visual' | string;
  className?: string;
}

export function CategoryIcon({ iconName, className = 'w-5 h-5' }: CategoryIconProps) {
  switch (iconName) {
    case 'megaphone':
    case 'tone-voice':
      return <Megaphone className={className} />;
    case 'target':
    case 'messaging':
      return <Target className={className} />;
    case 'layers':
    case 'claims-evidence':
      return <Layers className={className} />;
    case 'restrictions':
      return <Ban className={className} />;
    case 'visual':
    case 'visual-assets':
      return <ImageIcon className={className} />;
    default:
      return <Megaphone className={className} />;
  }
}

