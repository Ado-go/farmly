import { createFileRoute } from "@tanstack/react-router";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const { cart, removeFromCart, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (cart.length === 0) {
    return (
      <p className="p-4 text-center text-gray-600">{t("cartPage.emptyCart")}</p>
    );
  }

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
          <Button onClick={() => navigate({ to: "/checkout" })}>
            {t("cartPage.continueCheckout")}
          </Button>
        </div>
      </div>
    </div>
  );
}
