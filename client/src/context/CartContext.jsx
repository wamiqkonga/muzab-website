import React, { createContext, useContext, useReducer, useMemo } from 'react';

const CartContext = createContext(null);

const GST_RATE = 0.18;

function calcTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const gst = parseFloat((subtotal * GST_RATE).toFixed(2));
  const grandTotal = parseFloat((subtotal + gst).toFixed(2));
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal: parseFloat(subtotal.toFixed(2)), gst, grandTotal, itemCount };
}

const initialState = {
  items: [],
  subtotal: 0,
  gst: 0,
  grandTotal: 0,
  itemCount: 0,
};

function cartReducer(state, action) {
  let items;
  switch (action.type) {
    case 'SET_CART':
      items = action.items;
      return { items, ...calcTotals(items) };

    case 'ADD_ITEM': {
      const existing = state.items.find(
        (i) => i.productId === action.item.productId && i.variantLabel === action.item.variantLabel
      );
      if (existing) {
        items = state.items.map((i) =>
          i.productId === action.item.productId && i.variantLabel === action.item.variantLabel
            ? { ...i, quantity: i.quantity + (action.item.quantity ?? 1) }
            : i
        );
      } else {
        items = [...state.items, { ...action.item, quantity: action.item.quantity ?? 1 }];
      }
      return { items, ...calcTotals(items) };
    }

    case 'UPDATE_ITEM':
      items = state.items.map((i) =>
        i.productId === action.productId && i.variantLabel === action.variantLabel
          ? { ...i, quantity: action.quantity }
          : i
      ).filter((i) => i.quantity > 0);
      return { items, ...calcTotals(items) };

    case 'REMOVE_ITEM':
      items = state.items.filter(
        (i) => !(i.productId === action.productId && i.variantLabel === action.variantLabel)
      );
      return { items, ...calcTotals(items) };

    case 'CLEAR_CART':
      return initialState;

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = (item) => dispatch({ type: 'ADD_ITEM', item });
  const updateItem = (productId, variantLabel, quantity) =>
    dispatch({ type: 'UPDATE_ITEM', productId, variantLabel, quantity });
  const removeItem = (productId, variantLabel) =>
    dispatch({ type: 'REMOVE_ITEM', productId, variantLabel });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });
  const setCart = (items) => dispatch({ type: 'SET_CART', items });

  const value = useMemo(
    () => ({ ...state, addItem, updateItem, removeItem, clearCart, setCart }),
    [state]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export default CartContext;
