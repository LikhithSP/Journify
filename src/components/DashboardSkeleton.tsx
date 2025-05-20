import { motion } from 'framer-motion';

export default function DashboardSkeleton() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      className="max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Search bar skeleton */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
        <div className="relative w-full md:w-96 mb-4 md:mb-0">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md w-full"></div>
        </div>
      </motion.div>
      
      {/* Header skeleton */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md w-40 mr-3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md w-16"></div>
        </div>
        <div className="flex space-x-2">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md w-10"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md w-28"></div>
        </div>
      </motion.div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <motion.div key={i} variants={itemVariants} className="card p-4 flex items-center">
            <div className="rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse h-12 w-12 mr-4"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-20 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-10"></div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Filter skeleton */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2 mb-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md w-16 mr-2"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full w-20"></div>
        ))}
      </motion.div>
      
      {/* Card skeleton */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <motion.div key={i} variants={itemVariants} className="card">
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
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}