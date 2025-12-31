import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from 'date-fns';

export type FilterParams = {
  startDate?: Date;
  endDate?: Date;
  categoryId?: string; // null/undefined means All categories
};

export type TimePeriod = 'this-month' | 'last-month' | 'this-year' | 'custom';

export interface FilterState {
  period: TimePeriod;
  customStart?: string; // ISO date string
  customEnd?: string; // ISO date string
  categoryId?: string;
}

/**
 * Calculate start and end dates based on time period
 */
export function calculateDateRange(
  period: TimePeriod,
  customStart?: string,
  customEnd?: string
): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();

  switch (period) {
    case 'this-month':
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };

    case 'last-month':
      const lastMonth = subMonths(now, 1);
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth),
      };

    case 'this-year':
      return {
        startDate: startOfYear(now),
        endDate: endOfYear(now),
      };

    case 'custom':
      if (customStart && customEnd) {
        // Create new Date objects with proper time boundaries
        const start = new Date(customStart);
        const end = new Date(customEnd);
        
        // Return dates with proper time boundaries
        return {
          startDate: new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0),
          endDate: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999),
        };
      }
      // Fallback to this month if custom dates are invalid
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };

    default:
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };
  }
}

/**
 * Parse search params into FilterParams
 */
export function parseFilterParams(searchParams: URLSearchParams): FilterParams {
  const period = (searchParams.get('period') as TimePeriod) || 'this-month';
  const customStart = searchParams.get('customStart') || undefined;
  const customEnd = searchParams.get('customEnd') || undefined;
  const categoryId = searchParams.get('categoryId') || undefined;

  const { startDate, endDate } = calculateDateRange(period, customStart, customEnd);

  return {
    startDate,
    endDate,
    categoryId,
  };
}

/**
 * Build query string from filter state or URLSearchParams
 */
export function buildFilterQuery(
  stateOrParams: Partial<FilterState> | URLSearchParams
): string {
  const params = new URLSearchParams();

  if (stateOrParams instanceof URLSearchParams) {
    // Check if dates are already in the URL (from GlobalFilterBar navigation)
    const existingStartDate = stateOrParams.get('startDate');
    const existingEndDate = stateOrParams.get('endDate');

    if (existingStartDate && existingEndDate) {
      // Dates already calculated, just pass them through
      params.set('startDate', existingStartDate);
      params.set('endDate', existingEndDate);
    } else {
      // No dates in URL, calculate from period
      const period = (stateOrParams.get('period') as TimePeriod) || 'this-month';
      const customStart = stateOrParams.get('customStart') || undefined;
      const customEnd = stateOrParams.get('customEnd') || undefined;

      const { startDate, endDate } = calculateDateRange(
        period,
        customStart,
        customEnd
      );

      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
    }

    // Add category if specified
    const categoryId = stateOrParams.get('categoryId');
    if (categoryId) {
      params.set('categoryId', categoryId);
    }

    return params.toString();
  }

  // Handle FilterState object
  const state = stateOrParams;
  if (state.period) {
    const { startDate, endDate } = calculateDateRange(
      state.period,
      state.customStart,
      state.customEnd
    );
    params.set('startDate', startDate.toISOString());
    params.set('endDate', endDate.toISOString());
  }

  if (state.categoryId) {
    params.set('categoryId', state.categoryId);
  }

  return params.toString();
}

/**
 * English labels for time periods
 */
export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  'this-month': 'This Month',
  'last-month': 'Last Month',
  'this-year': 'This Year',
  custom: 'Custom Range',
};
