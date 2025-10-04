// Consistent button styles across the application

export const buttonStyles = {
  // Primary action buttons
  primary: "px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105",
  
  // Secondary action buttons
  secondary: "px-6 py-3 border border-neutral-300 text-neutral-700 rounded-xl font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200",
  
  // Success/Accept buttons
  success: "px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105",
  
  // Icon buttons
  icon: "px-4 py-3 border border-neutral-300 text-neutral-700 rounded-xl font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200",
  
  // Small buttons
  small: "px-4 py-2 text-sm",
  
  // Large buttons
  large: "px-8 py-4 text-lg",
  
  // Full width
  fullWidth: "w-full flex items-center justify-center"
};

export const cardStyles = {
  // Standard card
  standard: "bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-200",
  
  // Featured card
  featured: "bg-white rounded-2xl border-2 border-blue-400 shadow-lg ring-2 ring-blue-100",
  
  // Interactive card
  interactive: "bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
};

export const layoutStyles = {
  // Page container
  pageContainer: "min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white",
  
  // Content container
  contentContainer: "max-w-6xl mx-auto p-4 sm:p-6 lg:p-8",
  
  // Wide content container
  wideContainer: "max-w-7xl mx-auto p-4 sm:p-6 lg:p-8",
  
  // Header
  header: "sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200/50"
};