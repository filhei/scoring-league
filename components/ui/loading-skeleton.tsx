export function LoadingSkeleton() {
  return (
    <div className="flex justify-center items-center p-8">
      <div 
        className="animate-spin rounded-full h-8 w-8 border-b-2" 
        style={{ borderBottomColor: 'var(--accent-blue)' }}
      ></div>
    </div>
  )
}

export function GameLoadingSkeleton() {
  return (
    <div className="flex justify-center items-center py-16">
      <div 
        className="animate-spin rounded-full h-12 w-12 border-b-2" 
        style={{ borderBottomColor: 'var(--accent-blue)' }}
      ></div>
    </div>
  )
} 