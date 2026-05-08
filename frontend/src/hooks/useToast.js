import { useCallback, useState } from 'react';

export default function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((notification) => {
    setToast(notification);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
}
