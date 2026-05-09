/**
 * Trigger a small haptic vibration for mobile devices
 */
export const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') => {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    if (navigator.vibrate) {
      switch (style) {
        case 'light': navigator.vibrate(15); break;
        case 'medium': navigator.vibrate(30); break;
        case 'heavy': navigator.vibrate(60); break;
        case 'success': navigator.vibrate([15, 30, 15]); break;
        case 'warning': navigator.vibrate([30, 50]); break;
        case 'error': navigator.vibrate([60, 100, 60]); break;
      }
    } else {
      // Fallback for iOS/Safari: Dispatch a visual haptic event
      window.dispatchEvent(new CustomEvent('visual-haptic', { detail: { style } }));
    }
  }
};

/**
 * Export an array of objects to CSV
 */
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const val = row[header];
      return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
