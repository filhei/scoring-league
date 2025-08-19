export function getRemoveButtonStyles(isDarkMode: boolean, isAbsolute: boolean = false) {
  const baseStyles = "opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
  const positionStyles = isAbsolute ? "absolute top-1/2 right-0 -translate-y-1/2" : "p-1 rounded"
  const colorStyles = isDarkMode 
    ? 'text-gray-300 hover:text-gray-100' 
    : 'text-gray-600 hover:text-gray-800'
  const backgroundStyles = !isAbsolute && isDarkMode 
    ? 'hover:bg-gray-600' 
    : !isAbsolute 
      ? 'hover:bg-gray-200' 
      : ''
  
  return `${baseStyles} ${positionStyles} ${colorStyles} ${backgroundStyles}`.trim()
} 