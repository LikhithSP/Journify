
/**
 * Loading spinner component for the dashboard
 */
export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12">
      <div className="animate-pulse-slow">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your journal...</p>
    </div>
  );
}

/**
 * Error state component for the dashboard
 */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12">
      <div className="text-red-600 dark:text-red-400 mb-4">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-lg font-medium mb-2">Oops! Something went wrong</p>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="btn btn-primary"
      >
        Try Again
      </button>
    </div>
  );
}

/**
 * Dashboard skeleton component for loading states
 */
export function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Search bar skeleton */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
        <div className="relative w-full md:w-96 mb-4 md:mb-0">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md w-full"></div>
        </div>
      </div>
      
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md w-40"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md w-28"></div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-4 flex items-center">
            <div className="rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse h-12 w-12 mr-4"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-20 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-10"></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Card skeleton */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card">
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-3/4"></div>
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full"></div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-2/3"></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-24"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}