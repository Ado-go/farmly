import {
  HistoryAction,
  OrderItemStatus,
  OrderStatus,
  OrderType,
  PaymentMethod,
  ProductCategory,
  PrismaClient,
} from "@prisma/client";
import type { Event, Product, User } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = <T>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

const pickRandomSubset = <T>(collection: T[], min: number, max: number) => {
  if (!collection.length || max <= 0) {
    return [];
  }

  const actualMax = Math.min(collection.length, max);
  const actualMin = Math.min(min, actualMax);
  const takeCount = randomInt(actualMin, actualMax);

  return shuffle(collection).slice(0, takeCount);
};

const randomAddress = () => ({
  city: cities[randomInt(0, cities.length - 1)],
  street: `${streets[randomInt(0, streets.length - 1)]} ${randomInt(1, 120)}`,
  region: regions[randomInt(0, regions.length - 1)],
  postalCode: `0${randomInt(1000, 9999)}`,
});

type FarmProductRecord = {
  farmer: User;
  product: Product;
  price: number;
};

type EventProductRecord = {
  event: Event;
  seller: User;
  product: Product;
};

type OrderItemSeed = {
  product: Product;
  sellerName: string;
  price: number;
  quantity: number;
};

const paymentOptions = [
  PaymentMethod.CASH,
  PaymentMethod.CARD,
  PaymentMethod.BANK_TRANSFER,
];

const orderStatuses = [
  OrderStatus.PENDING,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELED,
];

const farmerNames = [
  "Ján Novák",
  "Mária Kováčová",
  "Peter Horváth",
  "Anna Bieliková",
  "Tomáš Šimko",
  "Lucia Farkašová",
  "Marek Urban",
];

const customerNames = [
  "Eva Novotná",
  "Lukáš Krajčír",
  "Petra Malá",
  "Martin Dvořák",
  "Simona Farkašová",
];

const cities = ["Bratislava", "Košice", "Nitra", "Trnava", "Žilina"];
const streets = ["Hlavná", "Ulica 5", "Kvetinová", "Ružová", "Oranžová"];
const regions = [
  "Bratislavský",
  "Košický",
  "Nitriansky",
  "Trnavský",
  "Žilinský",
];

const farmNamePool = [
  "Levanduľový dvor",
  "Slnečný háj",
  "Dubový statok",
  "Bylinkový grúň",
  "Potočný dvor",
  "Horský sad",
  "Dolina chutí",
  "Modrý potok",
];

const eventTitleTemplates = [
  (city: string) => "Banskobystrický jarmok",
  (city: string) => `Farmársky deň v ${city}`,
  (city: string) => `Gurmánsky trh ${city}`,
  (city: string) => `Festival úrody ${city}`,
  (city: string) => `Remeselná sobota ${city}`,
  (city: string) => `${city} trh regionálnych chutí`,
  (city: string) => `Sezónny farmfest ${city}`,
];

type ProductTemplate = { name: string; category: ProductCategory };

const productTemplates: ProductTemplate[] = [
  { name: "Jahody", category: ProductCategory.Fruits },
  { name: "Maliny", category: ProductCategory.Fruits },
  { name: "Mrkva", category: ProductCategory.Vegetables },
  { name: "Cibuľa", category: ProductCategory.Vegetables },
  { name: "Jablká", category: ProductCategory.Fruits },
  { name: "Hrášok", category: ProductCategory.Vegetables },
  { name: "Bazalka", category: ProductCategory.Other },
  { name: "Rozmarín", category: ProductCategory.Other },
  { name: "Hrušky", category: ProductCategory.Fruits },
  { name: "Paradajky", category: ProductCategory.Vegetables },
  { name: "Paprika", category: ProductCategory.Vegetables },
  { name: "Špenát", category: ProductCategory.Vegetables },
  { name: "Kozí syr", category: ProductCategory.Dairy },
  { name: "Med", category: ProductCategory.Other },
];

const pickFarmName = (city: string) =>
  `${farmNamePool[randomInt(0, farmNamePool.length - 1)]} (${city})`;

const pickEventTitle = (city: string) =>
  eventTitleTemplates[randomInt(0, eventTitleTemplates.length - 1)](city);

const reviewComments = [
  "Výborná kvalita a rýchle doručenie!",
  "Veľmi chutné produkty, určite objednám znova.",
  "Trochu drahšie, ale oplatí sa.",
  "Farmár bol veľmi ochotný.",
  "Skvelá skúsenosť, odporúčam!",
];

// ------------------ CLEAR DATABASE ------------------
async function clearDatabase() {
  console.log("🧹 Clearing database...");

  await prisma.review.deleteMany({});
  await prisma.eventParticipant.deleteMany({});
  await prisma.eventProduct.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.orderHistory.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.farmProduct.deleteMany({});
  await prisma.farmImage.deleteMany({});
  await prisma.farm.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.offer.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("✅ Database cleared successfully.");
}

async function createOrderWithItems({
  buyer,
  items,
  orderType = OrderType.STANDARD,
  event,
}: {
  buyer: User;
  items: OrderItemSeed[];
  orderType?: OrderType;
  event?: Event;
}) {
  if (!items.length) return;

  const address = randomAddress();
  const status =
    orderType === OrderType.PREORDER
      ? OrderStatus.PENDING
      : orderStatuses[randomInt(0, orderStatuses.length - 1)];
  const totalPrice = parseFloat(
    items
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2)
  );

  const order = await prisma.order.create({
    data: {
      buyerId: buyer.id,
      orderType,
      contactName: buyer.name,
      contactPhone: buyer.phone ?? "+421900000000",
      deliveryCity: address.city,
      deliveryStreet: address.street,
      deliveryPostalCode: address.postalCode,
      deliveryCountry: "Slovensko",
      eventId: event?.id ?? null,
      isDelivered: status === OrderStatus.COMPLETED,
      isPaid: status === OrderStatus.COMPLETED || Math.random() > 0.4,
      paymentMethod: paymentOptions[randomInt(0, paymentOptions.length - 1)],
      totalPrice,
      status,
    },
  });

  const itemStatus =
    status === OrderStatus.CANCELED
      ? OrderItemStatus.CANCELED
      : OrderItemStatus.ACTIVE;

  for (const item of items) {
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.price,
        sellerName: item.sellerName,
        productName: item.product.name,
        status: itemStatus,
      },
    });
  }

  await prisma.orderHistory.create({
    data: {
      action: HistoryAction.ORDER_CREATED,
      message:
        orderType === OrderType.PREORDER
          ? `Predobjednávka pre ${items.length} položky bola vytvorená.`
          : `Objednávka so ${items.length} položkami bola vytvorená.`,
      orderId: order.id,
      userId: buyer.id,
    },
  });

  if (status === OrderStatus.CANCELED) {
    await prisma.orderHistory.create({
      data: {
        action: HistoryAction.ORDER_CANCELED,
        message: "Objednávka bola zrušená systémom.",
        orderId: order.id,
      },
    });
  } else if (status === OrderStatus.COMPLETED) {
    await prisma.orderHistory.create({
      data: {
        action: HistoryAction.ORDER_UPDATED,
        message: "Objednávka bola úspešne doručená zákazníkovi.",
        orderId: order.id,
      },
    });
  }
}

async function main() {
  await clearDatabase();

  console.log("🌱 Seeding new data...");

  const farmers: User[] = [];
  const customers: User[] = [];
  const allProducts: Product[] = [];
  const farmProductRecords: FarmProductRecord[] = [];
  const eventProductRecords: EventProductRecord[] = [];
  const eventsData: { event: Event; participants: User[] }[] = [];

  // ------------------ USERS ------------------
  const numFarmers = randomInt(5, 8);
  for (let i = 0; i < numFarmers; i++) {
    const password = await argon2.hash("heslo123");
    const address = randomAddress();
    const farmer = await prisma.user.create({
      data: {
        email: `farmer${i + 1}@example.com`,
        password,
        name: farmerNames[i % farmerNames.length],
        phone: `+421900${100000 + i}`,
        role: "FARMER",
        address: address.street,
        postalCode: address.postalCode,
        city: address.city,
        country: "Slovensko",
      },
    });
    farmers.push(farmer);
  }

  for (let i = 0; i < customerNames.length; i++) {
    const password = await argon2.hash("heslo123");
    const address = randomAddress();
    const customer = await prisma.user.create({
      data: {
        email: `customer${i + 1}@example.com`,
        password,
        name: customerNames[i],
        phone: `+421910${100000 + i}`,
        role: "CUSTOMER",
        address: address.street,
        postalCode: address.postalCode,
        city: address.city,
        country: "Slovensko",
      },
    });
    customers.push(customer);
  }

  // ------------------- FARMS + FARM PRODUCTS -------------------
  console.log("🌾 Creating farms and farm products...");
  for (const farmer of farmers) {
    const numFarms = randomInt(1, 3);

    for (let j = 0; j < numFarms; j++) {
      const cityIndex = randomInt(0, cities.length - 1);
      const farmName = pickFarmName(cities[cityIndex]);

      const farm = await prisma.farm.create({
        data: {
          name: farmName,
          description: "Rodinná farma s rôznymi produktami.",
          city: cities[cityIndex],
          street: streets[randomInt(0, streets.length - 1)],
          region: regions[randomInt(0, regions.length - 1)],
          postalCode: `0${randomInt(1000, 9999)}`,
          country: "Slovensko",
          farmerId: farmer.id,
        },
      });

      const numProducts = randomInt(3, 6);
      const chosenTemplates = pickRandomSubset(
        productTemplates,
        numProducts,
        numProducts
      );

      for (const template of chosenTemplates) {
        const product = await prisma.product.create({
          data: {
            name: template.name,
            category: template.category,
            description: `Čerstvé ${template.name.toLowerCase()} z ${farm.name}.`,
            basePrice: parseFloat((randomInt(100, 800) / 100).toFixed(2)),
          },
        });

        const farmProduct = await prisma.farmProduct.create({
          data: {
            farmId: farm.id,
            price: parseFloat((randomInt(150, 1200) / 100).toFixed(2)),
            stock: randomInt(5, 50),
            productId: product.id,
          },
        });

        farmProductRecords.push({
          farmer,
          product,
          price: farmProduct.price,
        });
        allProducts.push(product);
      }
    }
  }

  // ------------------- EVENTS -------------------
  console.log("📅 Creating events...");
  for (const farmer of farmers) {
    const numEvents = randomInt(1, 2);

    for (let i = 0; i < numEvents; i++) {
      const cityIndex = randomInt(0, cities.length - 1);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + randomInt(-5, 20));
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + randomInt(4, 24));

      const eventTitle = pickEventTitle(cities[cityIndex]);
      const event = await prisma.event.create({
        data: {
          title: eventTitle,
          description: "Udalosť pre farmárov a priateľov farmy.",
          startDate,
          endDate,
          city: cities[cityIndex],
          street: streets[randomInt(0, streets.length - 1)],
          region: regions[randomInt(0, regions.length - 1)],
          postalCode: `0${randomInt(1000, 9999)}`,
          country: "Slovensko",
          organizerId: farmer.id,
        },
      });

      const otherFarmers = farmers.filter((f) => f.id !== farmer.id);
      const chosenFarmers = pickRandomSubset(
        otherFarmers,
        1,
        Math.min(4, otherFarmers.length || 1)
      );
      const participantMap = new Map<number, User>();
      participantMap.set(farmer.id, farmer);
      for (const participant of chosenFarmers) {
        participantMap.set(participant.id, participant);
      }
      const participants = Array.from(participantMap.values());

      for (const participant of participants) {
        await prisma.eventParticipant.create({
          data: { eventId: event.id, userId: participant.id },
        });
      }

      const numProducts = randomInt(2, 5);
      const chosenTemplates = pickRandomSubset(
        productTemplates,
        numProducts,
        numProducts
      );

      for (const template of chosenTemplates) {
        const seller =
          participants[randomInt(0, participants.length - 1)] ?? farmer;
        const product = await prisma.product.create({
          data: {
            name: template.name,
            category: template.category,
            description: `Produkt predávaný počas ${event.title}.`,
            basePrice: parseFloat((randomInt(100, 800) / 100).toFixed(2)),
          },
        });

        const eventProduct = await prisma.eventProduct.create({
          data: {
            eventId: event.id,
            userId: seller.id,
            productId: product.id,
          },
        });

        eventProductRecords.push({
          event,
          seller,
          product,
        });
        allProducts.push(product);
      }

      eventsData.push({ event, participants });
    }
  }

  // ------------------- OFFERS -------------------
  console.log("💼 Creating offers...");
  for (const farmer of farmers) {
    const ownedProducts = farmProductRecords.filter(
      (record) => record.farmer.id === farmer.id
    );
    if (!ownedProducts.length) continue;

    const numOffers = randomInt(1, Math.min(2, ownedProducts.length));
    const offersSelection = shuffle(ownedProducts).slice(0, numOffers);

    for (const record of offersSelection) {
      await prisma.offer.create({
        data: {
          title: `${record.product.name} - akciová ponuka`,
          description: "Limitovaná ponuka priamo od farmára.",
          category: record.product.category,
          price: parseFloat((record.price * 0.9).toFixed(2)),
          userId: farmer.id,
          productId: record.product.id,
        },
      });
    }
  }

  // ------------------- ORDERS -------------------
  if (farmProductRecords.length && customers.length) {
    console.log("🛒 Creating standard orders...");
    for (const customer of customers) {
      const maxItems = Math.min(3, farmProductRecords.length);
      const selection = shuffle(farmProductRecords).slice(
        0,
        randomInt(1, maxItems)
      );
      const items: OrderItemSeed[] = selection.map((record) => ({
        product: record.product,
        sellerName: record.farmer.name,
        price: parseFloat(
          (record.price * (0.9 + Math.random() * 0.3)).toFixed(2)
        ),
        quantity: randomInt(1, 4),
      }));

      await createOrderWithItems({ buyer: customer, items });
    }
  }

  // ------------------- PREORDERS FOR EVENTS -------------------
  if (eventProductRecords.length && customers.length) {
    console.log("📦 Creating preorders tied to events...");
    for (const { event } of eventsData) {
      const eventProducts = eventProductRecords.filter(
        (record) => record.event.id === event.id
      );
      if (!eventProducts.length) continue;

      const buyer = customers[randomInt(0, customers.length - 1)];
      const maxItems = Math.min(2, eventProducts.length);
      const chosenProducts = shuffle(eventProducts).slice(
        0,
        randomInt(1, maxItems)
      );
      const items: OrderItemSeed[] = chosenProducts.map((record) => ({
        product: record.product,
        sellerName: record.seller.name,
        price: parseFloat(
          (
            (record.product.basePrice ?? 5) *
            (1 + Math.random() * 0.2)
          ).toFixed(2)
        ),
        quantity: randomInt(1, 2),
      }));

      await createOrderWithItems({
        buyer,
        items,
        orderType: OrderType.PREORDER,
        event,
      });
    }
  }

  // ------------------ REVIEWS ------------------
  console.log("⭐ Creating reviews...");
  for (const prod of allProducts) {
    for (let i = 0; i < randomInt(1, 3); i++) {
      const reviewer = customers[randomInt(0, customers.length - 1)];
      await prisma.review.create({
        data: {
          comment: reviewComments[randomInt(0, reviewComments.length - 1)],
          rating: randomInt(3, 5),
          userId: reviewer.id,
          productId: prod.id,
        },
      });
    }
  }

  console.log("🌾 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
