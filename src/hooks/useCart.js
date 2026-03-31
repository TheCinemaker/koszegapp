import { useState, useCallback, useMemo } from 'react';

export function useCart() {
    const [items, setItems] = useState([]);

    const addItem = useCallback((menuItem) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === menuItem.id);
            if (existing) {
                return prev.map(i =>
                    i.id === menuItem.id
                        ? { ...i, ...menuItem, quantity: i.quantity + 1 }
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

    const total = useMemo(() => {
        return items.reduce((sum, item) => {
            const price = item.price || 0;
            const qty = item.quantity || 0;
            const rule = item.flashRule;

            if (rule && rule.type === 'percent') {
                const discount = (rule.value || 0) / 100;
                return sum + Math.round(price * (1 - discount) * qty);
            }

            if (rule && rule.type === 'bogo') {
                const paidQty = qty - Math.floor(qty / 2);
                return sum + (price * paidQty);
            }

            return sum + (price * qty);
        }, 0);
    }, [items]);

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
