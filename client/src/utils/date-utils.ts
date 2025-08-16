// Date utility functions for proper date handling
export function formatDateForInput(date: string | Date): string {
  if (!date) return new Date().toISOString().split('T')[0];
  
  try {
    if (typeof date === 'string') {
      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      // Convert from other formats
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return parsedDate.toISOString().split('T')[0];
    }
    
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    }
    
    return new Date().toISOString().split('T')[0];
  } catch (error) {
    return new Date().toISOString().split('T')[0];
  }
}

export function formatDateForDisplay(date: string | Date): string {
  try {
    if (!date) return 'Invalid Date';
    
    // Handle date string properly without timezone issues
    let dateObj: Date;
    if (typeof date === 'string') {
      // If it's already in YYYY-MM-DD format, parse it as local date
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-').map(Number);
        dateObj = new Date(year, month - 1, day); // month is 0-indexed
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

export function isValidDate(date: string | Date): boolean {
  try {
    if (!date) return false;
    let dateObj: Date;
    if (typeof date === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-').map(Number);
        dateObj = new Date(year, month - 1, day);
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    return !isNaN(dateObj.getTime());
  } catch (error) {
    return false;
  }
}

export function parseDate(dateString: string): Date | null {
  try {
    if (!dateString) return null;
    // Parse date string as local date to avoid timezone issues
    let date: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateString);
    }
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
}