// Mobile responsive utility classes
export const mobileStyles = {
  // Container styles
  container: "px-4 sm:px-6 lg:px-8",
  maxWidth: "max-w-7xl mx-auto",
  
  // Typography
  h1: "text-2xl sm:text-3xl lg:text-4xl font-bold",
  h2: "text-xl sm:text-2xl lg:text-3xl font-semibold", 
  h3: "text-lg sm:text-xl lg:text-2xl font-medium",
  body: "text-sm sm:text-base",
  
  // Grid layouts
  grid2: "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6",
  grid3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6",
  grid4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6",
  
  // Flexbox layouts
  flexStack: "flex flex-col space-y-4",
  flexRow: "flex flex-col sm:flex-row items-start sm:items-center gap-4",
  
  // Buttons
  button: "px-4 py-2 sm:px-6 sm:py-3",
  buttonSm: "px-3 py-2 text-sm",
  
  // Cards and components
  card: "rounded-lg sm:rounded-xl p-4 sm:p-6",
  cardLg: "rounded-lg sm:rounded-xl p-6 sm:p-8",
  
  // Navigation
  nav: "fixed bottom-0 left-0 right-0 bg-white border-t sm:relative sm:bottom-auto sm:border-0",
  navItem: "flex-1 text-center py-2 sm:py-0",
  
  // Spacing
  section: "py-8 sm:py-12 lg:py-16",
  spacing: "space-y-6 sm:space-y-8",
  spacingLg: "space-y-8 sm:space-y-12",
  
  // Images and media
  aspectRatio: "aspect-video sm:aspect-[4/3] lg:aspect-video",
  imageRound: "w-12 h-12 sm:w-16 sm:h-16 rounded-full",
  
  // Responsive visibility
  hideOnMobile: "hidden sm:block",
  showOnMobile: "block sm:hidden",
  
  // Form elements
  input: "w-full px-3 py-2 sm:px-4 sm:py-3",
  textarea: "w-full px-3 py-2 sm:px-4 sm:py-3 min-h-[100px] sm:min-h-[120px]",

  // Touch-friendly sizing
  touchMin: 'min-h-[44px] min-w-[44px]', // Minimum touch target size
  touchComfortable: 'min-h-[48px] min-w-[48px]',
  touchLarge: 'min-h-[56px] min-w-[56px]'
};

// Breakpoint utilities
export const breakpoints = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Mobile-first media query helper
export const mediaQuery = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`
};