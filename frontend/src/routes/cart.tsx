import { createFileRoute } from "@tanstack/react-router";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const {
    cart,
    removeFromCart,
    totalPrice,
    clearCart,
    cartType,
    updateQuantity,
  } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (cart.length === 0) {
    return (
      <p className="p-4 text-center text-gray-600">{t("cartPage.emptyCart")}</p>
    );
  }

  const goToCheckout = () => {
    if (cartType === "PREORDER") {
      navigate({ to: "/checkout-preorder" });
    } else {
      navigate({ to: "/checkout" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">{t("cartPage.yourCart")}</h1>

      <ul className="divide-y divide-gray-200">
        {cart.map((item) => (
          <li
            key={item.productId}
            className="py-4 flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{item.productName}</p>
              <p className="text-sm text-gray-500">{item.sellerName}</p>
              <p className="text-sm">
                {item.unitPrice} € × {item.quantity}
              </p>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <span className="text-xs uppercase tracking-wide text-gray-500">
                  {t("cartPage.quantity")}
                </span>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  className="w-20 h-8"
                  onChange={(e) => {
                    const value = e.target.valueAsNumber;
                    if (Number.isNaN(value)) return;
                    updateQuantity(item.productId, value);
                  }}
                />
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => removeFromCart(item.productId)}
            >
              {t("cartPage.remove")}
            </Button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex justify-between items-center border-t pt-4">
        <p className="text-lg font-semibold">
          {t("cartPage.total")} {totalPrice.toFixed(2)} €
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={clearCart}>
            {t("cartPage.clear")}
          </Button>
          <Button onClick={goToCheckout}>
            {t("cartPage.continueCheckout")}
          </Button>
        </div>
      </div>
    </div>
  );
}
