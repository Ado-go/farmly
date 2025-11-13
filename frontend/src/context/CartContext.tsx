import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export interface CartItem {
  productId: number;
  productName: string;
  sellerName: string;
  unitPrice: number;
  quantity: number;
}

type CartType = "STANDARD" | "PREORDER";

interface CartState {
  type: CartType | null;
  eventId?: number | null;
  items: CartItem[];
}

interface CartContextType {
  cart: CartItem[];
  cartType: CartType | null;
  eventId: number | null;
  addToCart: (item: CartItem, type: CartType, eventId?: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<CartState>(() => {
    if (typeof window === "undefined")
      return { type: null, items: [], eventId: null };

    const stored = localStorage.getItem("cartState");
    return stored
      ? JSON.parse(stored)
      : { type: null, items: [], eventId: null };
  });

  useEffect(() => {
    localStorage.setItem("cartState", JSON.stringify(state));
  }, [state]);

  const addToCart = (item: CartItem, type: CartType, eventId?: number) => {
    setState((prev) => {
      if (prev.type && prev.type !== type) {
        return {
          type,
          eventId: type === "PREORDER" ? (eventId ?? null) : null,
          items: [item],
        };
      }

      if (type === "PREORDER") {
        if (prev.eventId && prev.eventId !== eventId) {
          return {
            type: "PREORDER",
            eventId: eventId ?? null,
            items: [item],
          };
        }
      }

      const existing = prev.items.find((i) => i.productId === item.productId);

      if (existing) {
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }

      return {
        ...prev,
        type,
        eventId: type === "PREORDER" ? (eventId ?? null) : null,
        items: [...prev.items, item],
      };
    });
  };

  const removeFromCart = (productId: number) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.productId !== productId),
    }));
  };

  const clearCart = () => setState({ type: null, items: [], eventId: null });

  const totalPrice = state.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart: state.items,
        cartType: state.type,
        eventId: state.eventId ?? null,
        addToCart,
        removeFromCart,
        clearCart,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
