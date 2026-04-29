'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

type Toast = {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
};

type ToastContextValue = {
    showToast: (toast: Omit<Toast, 'id'>) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { ...toast, id }]);

        setTimeout(() => removeToast(id), 3500);
    }, [removeToast]);

    const contextValue = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}

            <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-lg ${toast.type === 'success'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                : toast.type === 'error'
                                    ? 'border-rose-200 bg-rose-50 text-rose-900'
                                    : 'border-blue-200 bg-blue-50 text-blue-900'
                            }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold">{toast.title}</p>
                                {toast.message && <p className="mt-1 text-xs opacity-90">{toast.message}</p>}
                            </div>
                            <button
                                type="button"
                                onClick={() => removeToast(toast.id)}
                                className="rounded px-2 py-1 text-xs font-medium opacity-70 hover:opacity-100"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
