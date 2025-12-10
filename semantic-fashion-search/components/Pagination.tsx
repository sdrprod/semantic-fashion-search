'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const pageSizeOptions = [10, 25, 50];

  return (
    <div className="pagination">
      <div className="pagination-info">
        <label htmlFor="page-size">Results per page:</label>
        <select
          id="page-size"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="page-size-select"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="pagination-controls">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="pagination-button"
          aria-label="Previous page"
        >
          Previous
        </button>

        <span className="pagination-status">
          Page {currentPage} of {totalPages || 1}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="pagination-button"
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  );
}
