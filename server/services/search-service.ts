/**
 * Advanced Search & Filtering Service
 * Full-text search with advanced filtering and bulk operations
 */

export interface SearchQuery {
  text?: string;
  filters: Filter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page: number;
  limit: number;
}

export interface Filter {
  field: string;
  operator: "equals" | "contains" | "gt" | "lt" | "between" | "in" | "startsWith" | "endsWith";
  value: any;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  facets: Record<string, { value: string; count: number }[]>;
}

export class SearchService {
  private indexedData: Map<string, any[]> = new Map();

  /**
   * Index data for search
   */
  indexData(collection: string, data: any[]) {
    this.indexedData.set(collection, data);
    console.log(`[Search] Indexed ${data.length} items in ${collection}`);
  }

  /**
   * Perform search
   */
  search<T>(collection: string, query: SearchQuery): SearchResult<T> {
    const data = this.indexedData.get(collection) || [];

    let filtered = [...data];

    // Full-text search
    if (query.text) {
      const searchTerm = query.text.toLowerCase();
      filtered = filtered.filter((item) =>
        JSON.stringify(item).toLowerCase().includes(searchTerm)
      );
    }

    // Apply filters
    query.filters.forEach((filter) => {
      filtered = this.applyFilter(filtered, filter);
    });

    // Calculate facets
    const facets = this.calculateFacets(filtered);

    // Sort
    if (query.sortBy) {
      filtered.sort((a, b) => {
        const aVal = a[query.sortBy!];
        const bVal = b[query.sortBy!];

        if (typeof aVal === "string") {
          return query.sortOrder === "desc"
            ? bVal.localeCompare(aVal)
            : aVal.localeCompare(bVal);
        }

        return query.sortOrder === "desc" ? bVal - aVal : aVal - bVal;
      });
    }

    // Paginate
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit;
    const items = filtered.slice(start, end) as T[];

    return {
      items,
      total: filtered.length,
      page: query.page,
      limit: query.limit,
      hasMore: end < filtered.length,
      facets,
    };
  }

  /**
   * Apply single filter
   */
  private applyFilter(data: any[], filter: Filter): any[] {
    return data.filter((item) => {
      const value = item[filter.field];

      switch (filter.operator) {
        case "equals":
          return value === filter.value;
        case "contains":
          return String(value).includes(filter.value);
        case "gt":
          return value > filter.value;
        case "lt":
          return value < filter.value;
        case "between":
          return value >= filter.value[0] && value <= filter.value[1];
        case "in":
          return filter.value.includes(value);
        case "startsWith":
          return String(value).startsWith(filter.value);
        case "endsWith":
          return String(value).endsWith(filter.value);
        default:
          return true;
      }
    });
  }

  /**
   * Calculate facets for filtering
   */
  private calculateFacets(data: any[]): Record<string, { value: string; count: number }[]> {
    const facets: Record<string, { value: string; count: number }[]> = {};

    const commonFields = ["status", "type", "country", "currency"];

    commonFields.forEach((field) => {
      const values = new Map<string, number>();

      data.forEach((item) => {
        const val = item[field];
        if (val) {
          values.set(String(val), (values.get(String(val)) || 0) + 1);
        }
      });

      facets[field] = Array.from(values.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    });

    return facets;
  }

  /**
   * Bulk operations
   */
  bulkUpdate(collection: string, filter: Filter, updates: Record<string, any>): number {
    const data = this.indexedData.get(collection) || [];
    let updated = 0;

    data.forEach((item) => {
      if (this.matchesFilter(item, filter)) {
        Object.assign(item, updates);
        updated++;
      }
    });

    console.log(`[Search] Bulk updated ${updated} items`);
    return updated;
  }

  /**
   * Bulk delete
   */
  bulkDelete(collection: string, filter: Filter): number {
    const data = this.indexedData.get(collection) || [];
    const before = data.length;

    const filtered = data.filter((item) => !this.matchesFilter(item, filter));
    this.indexedData.set(collection, filtered);

    const deleted = before - filtered.length;
    console.log(`[Search] Bulk deleted ${deleted} items`);
    return deleted;
  }

  /**
   * Export results
   */
  export(results: any[], format: "csv" | "json" | "excel"): Buffer {
    switch (format) {
      case "csv":
        return this.exportCSV(results);
      case "json":
        return Buffer.from(JSON.stringify(results, null, 2), "utf-8");
      case "excel":
        // In production: use xlsx library
        return this.exportCSV(results);
      default:
        return Buffer.alloc(0);
    }
  }

  /**
   * Export to CSV
   */
  private exportCSV(data: any[]): Buffer {
    if (data.length === 0) return Buffer.from("");

    const headers = Object.keys(data[0]);
    let csv = headers.join(",") + "\n";

    data.forEach((row) => {
      csv += headers.map((h) => {
        const val = row[h];
        if (typeof val === "string" && val.includes(",")) {
          return `"${val}"`;
        }
        return val;
      }).join(",") + "\n";
    });

    return Buffer.from(csv, "utf-8");
  }

  /**
   * Check if item matches filter
   */
  private matchesFilter(item: any, filter: Filter): boolean {
    const value = item[filter.field];

    switch (filter.operator) {
      case "equals":
        return value === filter.value;
      case "contains":
        return String(value).includes(filter.value);
      case "gt":
        return value > filter.value;
      case "lt":
        return value < filter.value;
      default:
        return true;
    }
  }

  /**
   * Get search suggestions
   */
  getSuggestions(collection: string, prefix: string, field: string): string[] {
    const data = this.indexedData.get(collection) || [];
    const values = new Set<string>();

    data.forEach((item) => {
      const val = String(item[field] || "").toLowerCase();
      if (val.startsWith(prefix.toLowerCase())) {
        values.add(String(item[field]));
      }
    });

    return Array.from(values).slice(0, 10);
  }
}

export default SearchService;
