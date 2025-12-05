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

  const isFarmer = user?.role === "FARMER";

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList
          className={`grid ${isFarmer ? "grid-cols-3" : "grid-cols-2"} w-full`}
        >
          <TabsTrigger value="profile">
            {t("profilePage.tabProfile")}
          </TabsTrigger>
          <TabsTrigger value="purchases">
            {t("profilePage.tabPurchases")}
          </TabsTrigger>

          {isFarmer && (
            <TabsTrigger value="sales">
              {t("profilePage.tabSalesCombined")}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="purchases">
          <OrdersTab />
        </TabsContent>

        {isFarmer && (
          <TabsContent value="sales">
            <SalesTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
