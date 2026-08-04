import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import SelectField from './SelectField';
import { motion } from 'framer-motion';

const PageButton = ({ onClick, disabled, title, children }) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    title={title}
    whileHover={disabled ? undefined : { scale: 1.08 }}
    whileTap={disabled ? undefined : { scale: 0.93 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    className="p-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
  >
    {children}
  </motion.button>
);

const Pagination = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    onLimitChange,
    availableLimits = [10, 20, 50, 100],
    className = '',
    showInfo = true,
}) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const [jumpPage, setJumpPage] = useState('');

    const handleJump = (e) => {
        if (e.key === 'Enter') {
            const page = parseInt(jumpPage);
            if (!isNaN(page) && page >= 1 && page <= totalPages) {
                onPageChange(page);
                setJumpPage('');
            }
        }
    };

    return (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 ${className}`}
        >
            {showInfo && (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <span>
                        Showing <span className="font-medium text-gray-900 dark:text-white">{startItem}</span> to <span className="font-medium text-gray-900 dark:text-white">{endItem}</span> of <span className="font-medium text-gray-900 dark:text-white">{totalItems}</span> entries
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:inline">Rows per page:</span>
                        <SelectField
                            value={{ value: itemsPerPage, label: String(itemsPerPage) }}
                            onChange={(selectedOption) => {
                                onLimitChange(Number(selectedOption.value));
                                onPageChange(1);
                            }}
                            options={availableLimits.map(limit => ({ value: limit, label: String(limit) }))}
                            menuPlacement="auto"
                            isSearchable={false}
                            className="min-w-[80px]"
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    minHeight: '30px',
                                    height: '30px'
                                }),
                                valueContainer: (base) => ({
                                    ...base,
                                    padding: '0 8px',
                                }),
                                input: (base) => ({
                                    ...base,
                                    margin: '0',
                                    padding: '0'
                                }),
                                indicatorsContainer: (base) => ({
                                    ...base,
                                    height: '30px'
                                })
                            }}
                        />
                    </div>
                </div>
            )}
            
            <div className="flex items-center gap-1">
                <PageButton onClick={() => onPageChange(1)} disabled={currentPage === 1} title="First Page">
                    <ChevronsLeft className="w-4 h-4" />
                </PageButton>
                <PageButton onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} title="Previous Page">
                    <ChevronLeft className="w-4 h-4" />
                </PageButton>
                
                <div className="flex items-center gap-2 mx-2">
                    <span className="hidden sm:inline">Page</span>
                    <motion.span
                      key={currentPage}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      className="font-medium px-2 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md"
                    >
                        {currentPage}
                    </motion.span>
                    <span>of {totalPages}</span>
                </div>
                
                <PageButton onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} title="Next Page">
                    <ChevronRight className="w-4 h-4" />
                </PageButton>
                <PageButton onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} title="Last Page">
                    <ChevronsRight className="w-4 h-4" />
                </PageButton>
            </div>
        </motion.div>
    );
};

export default Pagination;
