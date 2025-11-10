import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";

import ProfileTab from "@/components/profileTabs/ProfileTab";
import OrdersTab from "@/components/profileTabs/OrdersTab";
import SalesTab from "@/components/profileTabs/SalesTab";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList
          className={`grid ${
            user?.role === "FARMER" ? "grid-cols-3" : "grid-cols-2"
          } w-full`}
        >
          <TabsTrigger value="profile">
            {t("profilePage.tabProfile")}
          </TabsTrigger>
          <TabsTrigger value="orders">{t("profilePage.tabOrders")}</TabsTrigger>
          {user?.role === "FARMER" && (
            <TabsTrigger value="sales">{t("profilePage.tabSales")}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>

        {user?.role === "FARMER" && (
          <TabsContent value="sales">
            <SalesTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
