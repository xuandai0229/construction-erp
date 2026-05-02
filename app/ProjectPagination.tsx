'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (count: number) => void;
}

export default function ProjectPagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxVisible; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="px-6 py-4 bg-[#1e293b] border-t border-[#334155] flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-4">
        <span className="text-[#94a3b8] text-sm">
          Hiển thị {startItem} đến {endItem} trong tổng số {totalItems} dự án
        </span>

        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value={10}>10 / trang</option>
          <option value={20}>20 / trang</option>
          <option value={50}>50 / trang</option>
          <option value={100}>100 / trang</option>
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#64748b] hover:text-[#e2e8f0] hover:border-[#475569] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Trang trước"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {pageNumbers.map((page, index) =>
          page === '...' ? (
            <span key={`dots-${index}`} className="px-2 py-2 text-[#64748b]">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#0f172a] border border-[#334155] text-[#cbd5e1] hover:border-blue-500 hover:text-[#e2e8f0]'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#64748b] hover:text-[#e2e8f0] hover:border-[#475569] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Trang sau"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
