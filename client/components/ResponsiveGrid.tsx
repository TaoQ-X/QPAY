import React from "react";

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: "small" | "medium" | "large";
  className?: string;
}

export default function ResponsiveGrid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = "medium",
  className = "",
}: ResponsiveGridProps) {
  const gapClasses = {
    small: "gap-2 sm:gap-3 lg:gap-4",
    medium: "gap-4 sm:gap-5 lg:gap-6",
    large: "gap-6 sm:gap-7 lg:gap-8",
  };

  return (
    <div
      className={`grid grid-cols-${cols.mobile} sm:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop} ${gapClasses[gap]} ${className}`}
    >
      {children}
    </div>
  );
}

// Tailwind CSS optimization - add to global.css
export const responsiveStyles = `
  @media (max-width: 640px) {
    .mobile\\:hidden { display: none !important; }
    .mobile\\:block { display: block !important; }
  }
  
  @media (min-width: 641px) and (max-width: 1024px) {
    .tablet\\:hidden { display: none !important; }
  }
  
  @media (min-width: 1025px) {
    .desktop\\:hidden { display: none !important; }
  }
`;
