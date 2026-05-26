'use client';

import { useCallback, useState } from 'react';
import { useToast } from '@/app/components/shared/ToastProvider';

interface AsyncActionOptions {
  successTitle?: string;
  successMessage?: string;
  errorTitle?: string;
}

export function useAsyncAction() {
  const { notify } = useToast();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const run = useCallback(async <T,>(
    key: string,
    action: () => Promise<T>,
    options: AsyncActionOptions = {}
  ) => {
    setPendingKey(key);
    try {
      const result = await action();
      if (options.successTitle) {
        notify({
          variant: 'success',
          title: options.successTitle,
          message: options.successMessage,
        });
      }
      return result;
    } catch (error) {
      notify({
        variant: 'error',
        title: options.errorTitle || 'Thao tác không thành công',
        message: error instanceof Error ? error.message : 'Vui lòng thử lại hoặc liên hệ quản trị viên.',
      });
      throw error;
    } finally {
      setPendingKey(null);
    }
  }, [notify]);

  return {
    pendingKey,
    run,
  };
}
