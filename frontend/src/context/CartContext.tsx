import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface CartItem {
  productId: number;
  productName: string;
  sellerName: string;
  unitPrice: number;
  quantity: number;
  stock?: number | null;
}

type CartType = "STANDARD" | "PREORDER";

interface CartState {
  type: CartType | null;
  eventId?: number | null;
  items: CartItem[];
}

interface PendingAddition {
  item: CartItem;
  type: CartType;
  eventId: number | null;
}

interface CartContextType {
  cart: CartItem[];
  cartType: CartType | null;
  eventId: number | null;
  addToCart: (item: CartItem, type: CartType, eventId?: number) => boolean;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const [state, setState] = useState<CartState>(() => {
    if (typeof window === "undefined")
      return { type: null, items: [], eventId: null };

    const stored = localStorage.getItem("cartState");
    return stored
      ? JSON.parse(stored)
      : { type: null, items: [], eventId: null };
  });
  const [pendingAddition, setPendingAddition] = useState<PendingAddition | null>(
    null
  );
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("cartState", JSON.stringify(state));
  }, [state]);

  const clampQuantity = (quantity: number, stock?: number | null) => {
    const safeQuantity = Number.isFinite(quantity)
      ? Math.floor(quantity)
      : 1;
    const normalized = Math.max(1, safeQuantity);

    if (stock === null || stock === undefined) return normalized;

    const maxAllowed = Math.max(0, stock);
    if (maxAllowed === 0) return 0;

    return Math.min(normalized, maxAllowed);
  };

  const requestCartReplacement = (
    item: CartItem,
    type: CartType,
    eventId?: number
  ) => {
    setPendingAddition({
      item,
      type,
      eventId: eventId ?? null,
    });
    setIsConflictDialogOpen(true);
  };

  const addToCart = (item: CartItem, type: CartType, eventId?: number) => {
    let added = false;

    setState((prev) => {
      const isSwitchingType = prev.type && prev.type !== type;
      const isSwitchingEvent =
        type === "PREORDER" && prev.eventId && prev.eventId !== eventId;

      if (isSwitchingType || isSwitchingEvent) {
        requestCartReplacement(item, type, eventId);
        return prev;
      }

      const existing = prev.items.find((i) => i.productId === item.productId);

      const resolvedStock = item.stock ?? existing?.stock ?? null;

      if (
        resolvedStock !== null &&
        resolvedStock !== undefined &&
        resolvedStock <= 0
      ) {
        return prev;
      }

      if (existing) {
        const newQuantity = clampQuantity(
          existing.quantity + item.quantity,
          resolvedStock
        );

        if (newQuantity === existing.quantity) {
          return prev;
        }

        added = true;
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.productId === item.productId
              ? {
                  ...i,
                  quantity: newQuantity,
                  stock: resolvedStock ?? i.stock ?? null,
                }
              : i
          ),
        };
      }

      const normalizedQuantity = clampQuantity(item.quantity, resolvedStock);

      if (normalizedQuantity === 0) {
        return prev;
      }

      added = true;
      return {
        ...prev,
        type,
        eventId: type === "PREORDER" ? (eventId ?? null) : null,
        items: [
          ...prev.items,
          { ...item, quantity: normalizedQuantity, stock: resolvedStock },
        ],
      };
    });

    return added;
  };

  const removeFromCart = (productId: number) => {
    setState((prev) => {
      const updatedItems = prev.items.filter((i) => i.productId !== productId);
      const isEmpty = updatedItems.length === 0;

      return {
        ...prev,
        type: isEmpty ? null : prev.type,
        eventId: isEmpty ? null : prev.eventId,
        items: updatedItems,
      };
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) => {
        if (i.productId !== productId) return i;

        const normalized = clampQuantity(quantity, i.stock);
        if (normalized === 0) return i;

        return { ...i, quantity: normalized };
      }),
    }));
  };

  const clearCart = () => setState({ type: null, items: [], eventId: null });

  const handleCancelCartReplacement = () => {
    setIsConflictDialogOpen(false);
    setPendingAddition(null);
  };

  const handleConfirmCartReplacement = () => {
    if (!pendingAddition) return;
    setState({
      type: pendingAddition.type,
      eventId:
        pendingAddition.type === "PREORDER"
          ? pendingAddition.eventId ?? null
          : null,
      items: [pendingAddition.item],
    });
    setPendingAddition(null);
    setIsConflictDialogOpen(false);
  };

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
        updateQuantity,
        clearCart,
        totalPrice,
      }}
    >
      {children}
      <Dialog
        open={isConflictDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCancelCartReplacement();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cart.conflictTitle")}</DialogTitle>
            <DialogDescription>
              {t("cart.conflictDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelCartReplacement}>
              {t("cart.conflictCancel")}
            </Button>
            <Button onClick={handleConfirmCartReplacement}>
              {t("cart.conflictConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
