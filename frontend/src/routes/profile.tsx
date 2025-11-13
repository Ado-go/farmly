import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";

import ProfileTab from "@/components/profileTabs/ProfileTab";
import OrdersTab from "@/components/profileTabs/OrdersTab";
import SalesTab from "@/components/profileTabs/SalesTab";

import PreordersTab from "@/components/profileTabs/PreordersTab";
import EventSalesTab from "@/components/profileTabs/EventSalesTab";

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
          className={`grid ${isFarmer ? "grid-cols-5" : "grid-cols-3"} w-full`}
        >
          <TabsTrigger value="profile">
            {t("profilePage.tabProfile")}
          </TabsTrigger>
          <TabsTrigger value="orders">{t("profilePage.tabOrders")}</TabsTrigger>
          <TabsTrigger value="preorders">
            {t("profilePage.tabPreorders")}
          </TabsTrigger>

          {isFarmer && (
            <>
              <TabsTrigger value="sales">
                {t("profilePage.tabSales")}
              </TabsTrigger>
              <TabsTrigger value="eventSales">
                {t("profilePage.tabEventSales")}
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>
        <TabsContent value="preorders">
          <PreordersTab />
        </TabsContent>

        {isFarmer && (
          <>
            <TabsContent value="sales">
              <SalesTab />
            </TabsContent>
            <TabsContent value="eventSales">
              <EventSalesTab />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
