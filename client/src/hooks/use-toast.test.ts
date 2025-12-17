import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from './use-toast';

interface State {
  toasts: Array<{
    id: string;
    title?: React.ReactNode;
    description?: React.ReactNode;
    open?: boolean;
    [key: string]: unknown;
  }>;
}

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
    expect(typeof result.current.toast).toBe('function');
    expect(typeof result.current.dismiss).toBe('function');
  });

  it('should add a toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Test Toast' });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Test Toast');
    expect(result.current.toasts[0].open).toBe(true);
  });

  it('should dismiss a toast', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      const toastResult = result.current.toast({ title: 'Test Toast' });
      toastId = toastResult.id;
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.dismiss(toastId!);
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it('should dismiss all toasts when no id provided', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Toast 1' });
      result.current.toast({ title: 'Toast 2' });
    });

    // TOAST_LIMIT is 1, so only the latest toast is kept
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Toast 2');

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.toasts.every((t) => !t.open)).toBe(true);
  });

  it('should update a toast', () => {
    const { result } = renderHook(() => useToast());

    let toastResult: ReturnType<typeof toast>;
    act(() => {
      toastResult = result.current.toast({ title: 'Test Toast' });
    });

    act(() => {
      toastResult!.update({ title: 'Updated Toast' });
    });

    expect(result.current.toasts[0].title).toBe('Updated Toast');
  });

  it('should limit toasts to TOAST_LIMIT', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Toast 1' });
      result.current.toast({ title: 'Toast 2' });
      result.current.toast({ title: 'Toast 3' });
    });

    // TOAST_LIMIT is 1, so only the latest should be kept
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Toast 3');
  });

  it('should handle toast onOpenChange', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Test Toast' });
    });

    const toastItem = result.current.toasts[0];
    expect(toastItem.open).toBe(true);

    act(() => {
      toastItem.onOpenChange?.(false);
    });

    expect(result.current.toasts[0].open).toBe(false);
  });
});

describe('toast reducer', () => {
  it('should handle ADD_TOAST action', () => {
    const state: State = { toasts: [] };
    const action = {
      type: 'ADD_TOAST' as const,
      toast: {
        id: '1',
        title: 'Test',
        open: true,
      },
    };

    const newState = reducer(state, action);
    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0].title).toBe('Test');
  });

  it('should handle UPDATE_TOAST action', () => {
    const state: State = {
      toasts: [
        { id: '1', title: 'Original', open: true },
        { id: '2', title: 'Other', open: true },
      ],
    };
    const action = {
      type: 'UPDATE_TOAST' as const,
      toast: { id: '1', title: 'Updated' },
    };

    const newState = reducer(state, action);
    expect(newState.toasts[0].title).toBe('Updated');
    expect(newState.toasts[1].title).toBe('Other');
  });

  it('should handle DISMISS_TOAST action with toastId', () => {
    const state: State = {
      toasts: [
        { id: '1', title: 'Toast 1', open: true },
        { id: '2', title: 'Toast 2', open: true },
      ],
    };
    const action = {
      type: 'DISMISS_TOAST' as const,
      toastId: '1',
    };

    const newState = reducer(state, action);
    expect(newState.toasts[0].open).toBe(false);
    expect(newState.toasts[1].open).toBe(true);
  });

  it('should handle DISMISS_TOAST action without toastId', () => {
    const state: State = {
      toasts: [
        { id: '1', title: 'Toast 1', open: true },
        { id: '2', title: 'Toast 2', open: true },
      ],
    };
    const action = {
      type: 'DISMISS_TOAST' as const,
    };

    const newState = reducer(state, action);
    expect(newState.toasts.every((t) => !t.open)).toBe(true);
  });

  it('should handle REMOVE_TOAST action with toastId', () => {
    const state: State = {
      toasts: [
        { id: '1', title: 'Toast 1', open: true },
        { id: '2', title: 'Toast 2', open: true },
      ],
    };
    const action = {
      type: 'REMOVE_TOAST' as const,
      toastId: '1',
    };

    const newState = reducer(state, action);
    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0].id).toBe('2');
  });

  it('should handle REMOVE_TOAST action without toastId', () => {
    const state: State = {
      toasts: [
        { id: '1', title: 'Toast 1', open: true },
        { id: '2', title: 'Toast 2', open: true },
      ],
    };
    const action = {
      type: 'REMOVE_TOAST' as const,
    };

    const newState = reducer(state, action);
    expect(newState.toasts).toHaveLength(0);
  });
});
