import { useState, useCallback, useMemo } from 'react';

export function useCart() {
    const [items, setItems] = useState([]);

    const addItem = useCallback((menuItem) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === menuItem.id);
            if (existing) {
                return prev.map(i =>
                    i.id === menuItem.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [...prev, { ...menuItem, quantity: 1 }];
        });
    }, []);

    const removeItem = useCallback((id) => {
        setItems(prev => prev.filter(i => i.id !== id));
    }, []);

    const updateQuantity = useCallback((id, delta) => {
        setItems(prev =>
            prev
                .map(item =>
                    item.id === id
                        ? { ...item, quantity: item.quantity + delta }
                        : item
                )
                .filter(item => item.quantity > 0)
        );
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const total = useMemo(() => (
        items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    ), [items]);

    const count = useMemo(() => (
        items.reduce((sum, i) => sum + i.quantity, 0)
    ), [items]);

    return {
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        count,
    };
}
