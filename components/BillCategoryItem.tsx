
import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react'; // Import the LucideIcon type
import { BillCategory } from '../types';

interface BillCategoryItemProps {
  category: BillCategory;
  onSelectCategory: (categoryId: string) => void;
}

const BillCategoryItem: React.FC<BillCategoryItemProps> = ({ category, onSelectCategory }) => {
  // Dynamically get the icon component from LucideIcons.
  // Cast the result to LucideIcon to assure TypeScript it's a valid component.
  // Fallback to FileText if the specified iconName is not found or resolves to a non-component.
  // The 'as keyof typeof LucideIcons' ensures we are using a valid export name from lucide-react.
  const IconComponent = (LucideIcons[category.iconName as keyof typeof LucideIcons] || LucideIcons.FileText) as LucideIcon;

  return (
    <button
      onClick={() => onSelectCategory(category.id)}
      className="bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 aspect-square transition-all duration-150 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label={`Select category: ${category.name}`}
    >
      <IconComponent className="w-8 h-8 text-blue-400" /> {/* Use the resolved and typed IconComponent */}
      <span className="text-white text-xs text-center">{category.name}</span>
    </button>
  );
};

export default BillCategoryItem;
