import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title = "No content here yet",
  description = "Start creating content to populate this page.",
  ctaText = "Create New",
  ctaLink = "/entry/new",
  icon
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="text-gray-300 dark:text-gray-600 mb-6">
          {icon}
        </div>
      )}
      <h2 className="text-xl md:text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
        {title}
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
        {description}
      </p>
      <Link to={ctaLink} className="btn btn-primary inline-flex items-center">
        <Plus size={16} className="mr-2" />
        {ctaText}
      </Link>
    </div>
  );
}
