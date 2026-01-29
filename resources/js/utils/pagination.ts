/**
 * Pagination utilities for frontend performance optimization
 */

export interface PaginationParams {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedData<T> {
  data: T[];
  pagination: PaginationParams;
}

/**
 * Calculate pagination parameters
 */
export function calculatePagination(
  currentPage: number,
  itemsPerPage: number,
  totalItems: number
): PaginationParams {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return {
    page: currentPage,
    perPage: itemsPerPage,
    total: totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
  };
}

/**
 * Paginate an array of data
 */
export function paginateData<T>(
  data: T[],
  page: number,
  perPage: number
): PaginatedData<T> {
  const total = data.length;
  const pagination = calculatePagination(page, perPage, total);
  
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination,
  };
}

/**
 * Virtualization utilities for long lists
 */
export class VirtualizationManager {
  private containerHeight: number = 0;
  private itemHeight: number = 0;
  private totalItems: number = 0;
  private visibleItems: number = 0;
  private startIndex: number = 0;
  private endIndex: number = 0;

  constructor(containerHeight: number, itemHeight: number, totalItems: number) {
    this.containerHeight = containerHeight;
    this.itemHeight = itemHeight;
    this.totalItems = totalItems;
    this.calculateVisibleItems();
  }

  /**
   * Calculate visible items based on scroll position
   */
  updateScroll(scrollTop: number): { startIndex: number; endIndex: number; offset: number } {
    this.startIndex = Math.floor(scrollTop / this.itemHeight);
    this.endIndex = Math.min(
      this.startIndex + this.visibleItems + 2, // +2 for buffer
      this.totalItems
    );

    const offset = this.startIndex * this.itemHeight;

    return {
      startIndex: this.startIndex,
      endIndex: this.endIndex,
      offset,
    };
  }

  /**
   * Get virtualized data slice
   */
  getVirtualizedData<T>(data: T[]): T[] {
    return data.slice(this.startIndex, this.endIndex);
  }

  /**
   * Calculate total height for scrollbar
   */
  getTotalHeight(): number {
    return this.totalItems * this.itemHeight;
  }

  /**
   * Calculate visible items count
   */
  private calculateVisibleItems(): void {
    this.visibleItems = Math.ceil(this.containerHeight / this.itemHeight);
  }
}

/**
 * Lazy loading utilities
 */
export class LazyLoader {
  private observer: IntersectionObserver | null = null;
  private callbacks: Map<Element, () => void> = new Map();

  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const callback = this.callbacks.get(entry.target);
            if (callback) {
              callback();
              this.callbacks.delete(entry.target);
              this.observer?.unobserve(entry.target);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1,
      }
    );
  }

  /**
   * Observe an element for lazy loading
   */
  observe(element: Element, callback: () => void): void {
    this.callbacks.set(element, callback);
    this.observer?.observe(element);
  }

  /**
   * Stop observing an element
   */
  unobserve(element: Element): void {
    this.callbacks.delete(element);
    this.observer?.unobserve(element);
  }

  /**
   * Disconnect observer
   */
  disconnect(): void {
    this.observer?.disconnect();
    this.callbacks.clear();
  }
}

/**
 * Infinite scroll utilities
 */
export class InfiniteScrollManager {
  private isLoading: boolean = false;
  private hasMore: boolean = true;
  private page: number = 1;
  private container: HTMLElement | null = null;
  private loadMoreCallback: (page: number) => Promise<unknown>;

  constructor(container: HTMLElement, loadMoreCallback: (page: number) => Promise<unknown>) {
    this.container = container;
    this.loadMoreCallback = loadMoreCallback;
    
    this.setupScrollListener();
  }

  /**
   * Setup scroll listener for infinite scroll
   */
  private setupScrollListener(): void {
    if (!this.container) return;

    this.container.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = this.container!;
      
      if (scrollTop + clientHeight >= scrollHeight - 100 && !this.isLoading && this.hasMore) {
        this.loadMore();
      }
    });
  }

  /**
   * Load more data
   */
  async loadMore(): Promise<void> {
    if (this.isLoading || !this.hasMore) return;

    this.isLoading = true;
    
    try {
      const data = await this.loadMoreCallback(this.page);
      
      if (!data || (Array.isArray(data) && data.length === 0)) {
        this.hasMore = false;
      } else {
        this.page++;
      }
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Reset infinite scroll
   */
  reset(): void {
    this.page = 1;
    this.hasMore = true;
    this.isLoading = false;
  }

  /**
   * Stop infinite scroll
   */
  stop(): void {
    this.hasMore = false;
  }
}

/**
 * Debounced search utility
 */
export function createDebouncedSearch<T>(
  searchFunction: (query: string) => Promise<T[]>,
  delay: number = 300
): (query: string) => Promise<T[]> {
  let timeoutId: NodeJS.Timeout | null = null;

  return function(query: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        try {
          const result = await searchFunction(query);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
}

/**
 * Search with pagination
 */
export function searchWithPagination<T>(
  data: T[],
  query: string,
  searchFields: (keyof T)[],
  page: number,
  perPage: number
): PaginatedData<T> {
  if (!query.trim()) {
    return paginateData(data, page, perPage);
  }

  const filteredData = data.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      return value && value.toString().toLowerCase().includes(query.toLowerCase());
    });
  });

  return paginateData(filteredData, page, perPage);
}

/**
 * Batch processing utility for large datasets
 */
export class BatchProcessor {
  private batchSize: number;
  private delay: number;

  constructor(batchSize: number = 100, delay: number = 16) {
    this.batchSize = batchSize;
    this.delay = delay;
  }

  /**
   * Process data in batches
   */
  async processInBatches<T, R>(
    data: T[],
    processor: (batch: T[]) => Promise<R[]>,
    onProgress?: (processed: number, total: number) => void
  ): Promise<R[]> {
    const results: R[] = [];
    const totalBatches = Math.ceil(data.length / this.batchSize);

    for (let i = 0; i < totalBatches; i++) {
      const start = i * this.batchSize;
      const end = Math.min(start + this.batchSize, data.length);
      const batch = data.slice(start, end);

      const batchResults = await processor(batch);
      results.push(...batchResults);

      if (onProgress) {
        onProgress(i + 1, totalBatches);
      }

      // Yield control to prevent blocking the UI
      if (i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }

    return results;
  }
}

// Export default instances for common use cases
export const defaultLazyLoader = new LazyLoader();
export const defaultBatchProcessor = new BatchProcessor(100, 16);