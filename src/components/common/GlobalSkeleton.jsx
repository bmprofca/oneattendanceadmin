import React from 'react';

const GlobalSkeleton = () => {
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden animate-pulse">
      {/* Navbar Skeleton */}
      <header className="h-16 shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="w-32 h-6 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Skeleton (hidden on small screens, visible on md+) */}
        <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 shrink-0">
          <div className="space-y-4">
            <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
          {/* Header Row */}
          <div className="flex justify-between items-center mb-8">
            <div className="w-1/3 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>

          {/* Top Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
                <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-md mt-4"></div>
              </div>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl h-80 p-6">
              <div className="w-1/4 h-6 bg-gray-200 dark:bg-gray-700 rounded-md mb-6"></div>
              <div className="space-y-4">
                <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              </div>
            </div>
            
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl h-80 p-6">
              <div className="w-1/2 h-6 bg-gray-200 dark:bg-gray-700 rounded-md mb-6"></div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                    <div className="w-2/3 h-3 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                    <div className="w-2/3 h-3 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GlobalSkeleton;
