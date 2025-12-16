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

type EventParticipantSeed = {
  user: User;
  stallName: string;
};

type OrderItemSeed = {
  product: Product;
  sellerName: string;
  farmerId: number;
  stallName?: string | null;
  price: number;
  quantity: number;
};

const paymentOptions = [PaymentMethod.CASH, PaymentMethod.CARD];

const orderStatuses = [
  OrderStatus.PENDING,
  OrderStatus.COMPLETED,
  OrderStatus.ONWAY,
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
  "Bratislavský kraj",
  "Trnavský kraj",
  "Trenčiansky kraj",
  "Nitriansky kraj",
  "Žilinský kraj",
  "Banskobystrický kraj",
  "Prešovský kraj",
  "Košický kraj",
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

const stallAdjectives = [
  "Rodinný",
  "Sezónny",
  "Farmársky",
  "Tradičný",
  "Regionálny",
  "Lokálny",
  "Domáci",
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

type DescriptionLength = "none" | "short" | "medium" | "long";
type DescriptionsByLength = Record<
  Exclude<DescriptionLength, "none">,
  string[]
>;

const descriptionLibrary: Record<
  "farm" | "product" | "event" | "offer",
  DescriptionsByLength
> = {
  farm: {
    short: [
      "Malá rodinná farma so sezónnou ponukou.",
      "Pestujeme bez chémie a s ohľadom na pôdu.",
      "Čerstvé produkty priamo z dvora.",
    ],
    medium: [
      "Rodinná farma, ktorá sa stará o pôdu aj zvieratá s rešpektom k prírode.",
      "Zameriavame sa na poctivé ovocie a zeleninu pestovanú v menších šaržiach.",
      "Z farmy posielame iba to, čo by sme dali vlastnej rodine.",
    ],
    long: [
      "Rodinná farma založená na trpezlivosti, ručnej práci a udržateľnom hospodárení, kde pestujeme sezónne plodiny bez zbytočnej chémie.",
      "Obhospodarujeme menšie polia a sady na okraji dediny, staráme sa o pôdu prirodzenými postupmi a zdieľame úrodu so susedmi aj zákazníkmi.",
      "Na farme spájame tradičné postupy s modernými nápadmi, pestujeme rozmanité plodiny a radi sa delíme o to najlepšie, čo kraj dá.",
    ],
  },
  product: {
    short: [
      "Sezónny produkt v limitovanom množstve.",
      "Poctivo dopestované za čerstva zbalené.",
      "Ideálne na každodenné varenie.",
    ],
    medium: [
      "Pestované v malých dávkach, zbierané ručne a spracované v deň objednávky.",
      "Bez zbytočnej chémie, aby zostala prirodzená chuť a vôňa.",
      "Produkty držíme v malých šaržiach, aby sme udržali kvalitu a čerstvosť.",
    ],
    long: [
      "Pestované s dôrazom na šetrné postupy, aby si zachovalo prirodzenú sladkosť aj sviežosť, či už ho použijete čerstvé alebo na zaváranie.",
      "Vhodné na varenie, pečenie aj čerstvú konzumáciu, s dôrazom na plnú chuť a arómu, ktoré vznikajú pri pomalom dozrievaní.",
      "Ručne zbierané a triedené, aby sa k vám dostali len najlepšie kusy, ktoré vydržia dlhšie a potešia aj náročnejších gurmánov.",
    ],
  },
  event: {
    short: [
      "Menšie stretnutie s farmárskymi stánkami.",
      "Degustácia produktov priamo od výrobcov.",
      "Trh so sprievodným programom pre rodiny.",
    ],
    medium: [
      "Podujatie spája lokálnych farmárov, ochutnávky a príjemnú atmosféru pre návštevníkov.",
      "Stretnutie ľudí, ktorí majú radi poctivé jedlo, regionálne špeciality a priateľské rozhovory.",
      "Čakajú vás ukážky pestovania, dielničky aj možnosť nakúpiť čerstvé produkty.",
    ],
    long: [
      "Celodenný festival, ktorý prepája farmárov, kuchárov a nadšencov poctivého jedla, s množstvom stánkov a sprievodných aktivít.",
      "Priestor na spoznávanie nových chutí, rozhovory s pestovateľmi a degustácie, ktoré ukážu, čo všetko sa dá vypestovať v našom regióne.",
      "Podujatie vytvára komunitnú atmosféru, kde sa stretávajú rodiny, priatelia aj odborníci, aby oslávili sezónnu úrodu a lokálnu gastronómiu.",
    ],
  },
  offer: {
    short: [
      "Krátkodobná akcia na obľúbený produkt.",
      "Zvýhodnená cena pre verných zákazníkov.",
      "Limitovaná ponuka do vypredania zásob.",
    ],
    medium: [
      "Zľava na obmedzený počet kusov, vhodná na rýchly nákup čerstvých produktov.",
      "Ponuka pre tých, ktorí chcú ochutnať naše výrobky za zvýhodnených podmienok.",
      "Akciový balíček pripravený priamo na tento týždeň.",
    ],
    long: [
      "Výhodná ponuka pripravená na podporu sezónnej úrody, platná do vypredania zásob alebo konca mesiaca.",
      "Zľava určená pre zákazníkov, ktorí chcú vyskúšať viac druhov produktov a spoznať náš spôsob pestovania.",
      "Akcia spája čerstvosť, férovú cenu a transparentný pôvod, aby ste mohli nakúpiť s istotou kvality.",
    ],
  },
};

const randomDescription = (type: keyof typeof descriptionLibrary) => {
  const lengths: DescriptionLength[] = ["none", "short", "medium", "long"];
  const length = lengths[randomInt(0, lengths.length - 1)];
  if (length === "none") return null;

  const options = descriptionLibrary[type][length];
  return options[randomInt(0, options.length - 1)];
};

const pickFarmName = (city: string) =>
  `${farmNamePool[randomInt(0, farmNamePool.length - 1)]} (${city})`;

const pickEventTitle = (city: string) =>
  eventTitleTemplates[randomInt(0, eventTitleTemplates.length - 1)](city);

const buildStallName = (participant: User) => {
  const firstName = participant.name.split(" ")[0] || "Farmár";
  const adjective =
    stallAdjectives[randomInt(0, stallAdjectives.length - 1)];
  const suffix = randomInt(1, 99);
  return `${adjective} stánok ${firstName} #${suffix}`;
};

type EventTiming = "past" | "ongoing" | "future";

const buildEventDates = (timing: EventTiming) => {
  const now = new Date();

  if (timing === "past") {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - randomInt(7, 20));
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + randomInt(4, 24));
    return { startDate, endDate };
  }

  if (timing === "ongoing") {
    const startDate = new Date(now);
    startDate.setHours(startDate.getHours() - randomInt(1, 12));
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + randomInt(16, 48));
    return { startDate, endDate };
  }

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + randomInt(3, 20));
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + randomInt(4, 24));
  return { startDate, endDate };
};

const reviewComments = [
  "Výborná kvalita a rýchle doručenie!",
  "Veľmi chutné produkty, určite objednám znova.",
  "Trochu drahšie, ale oplatí sa.",
  "Farmár bol veľmi ochotný.",
  "Skvelá skúsenosť, odporúčam!",
];

const recomputeProductRating = async (productId: number) => {
  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: { rating: agg._avg.rating ?? 0 },
  });
};

const recomputeAllProductRatings = async () => {
  const products = await prisma.product.findMany({ select: { id: true } });
  await Promise.all(products.map((p) => recomputeProductRating(p.id)));
};

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

  const isPreorder = orderType === OrderType.PREORDER;
  const address =
    isPreorder && event
      ? {
          city: event.city,
          street: event.street,
          postalCode: event.postalCode,
        }
      : randomAddress();
  const status = isPreorder
    ? OrderStatus.PENDING
    : orderStatuses[randomInt(0, orderStatuses.length - 1)];
  const totalPrice = parseFloat(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
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
      isPaid: isPreorder
        ? false
        : status === OrderStatus.COMPLETED
        ? true
        : Math.random() > 0.4,
      paymentMethod: isPreorder
        ? PaymentMethod.CASH
        : paymentOptions[randomInt(0, paymentOptions.length - 1)],
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
        farmerId: item.farmerId,
        quantity: item.quantity,
        unitPrice: item.price,
        sellerName: item.sellerName,
        productName: item.product.name,
        stallName: item.stallName ?? null,
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
  const eventsData: { event: Event; participants: EventParticipantSeed[] }[] =
    [];

  // ------------------ USERS ------------------
  const numFarmers = randomInt(5, 8);
  for (let i = 0; i < numFarmers; i++) {
    const password = await argon2.hash("Heslo123");
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
    const password = await argon2.hash("Heslo123");
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
          description: randomDescription("farm"),
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
        const isAvailable = Math.random() > 0.15;
        const product = await prisma.product.create({
          data: {
            name: template.name,
            category: template.category,
            description: randomDescription("product") ?? "",
            basePrice: parseFloat((randomInt(100, 800) / 100).toFixed(2)),
          },
        });

        const farmProduct = await prisma.farmProduct.create({
          data: {
            farmId: farm.id,
            price: parseFloat((randomInt(150, 1200) / 100).toFixed(2)),
            stock: randomInt(5, 50),
            isAvailable,
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
    const eventTimings: EventTiming[] = ["past", "ongoing", "future"];
    const extraEvents = randomInt(0, 1);
    for (let i = 0; i < extraEvents; i++) {
      eventTimings.push("future");
    }

    for (const timing of eventTimings) {
      const cityIndex = randomInt(0, cities.length - 1);
      const { startDate, endDate } = buildEventDates(timing);

      const eventTitle = pickEventTitle(cities[cityIndex]);
      const event = await prisma.event.create({
        data: {
          title: eventTitle,
          description: randomDescription("event"),
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
      const participants: EventParticipantSeed[] = [];

      for (const participant of participantMap.values()) {
        const stallName = buildStallName(participant);
        await prisma.eventParticipant.create({
          data: {
            eventId: event.id,
            userId: participant.id,
            stallName,
          },
        });
        participants.push({ user: participant, stallName });
      }

      const numProducts = randomInt(2, 5);
      const chosenTemplates = pickRandomSubset(
        productTemplates,
        numProducts,
        numProducts
      );

      for (const template of chosenTemplates) {
        const sellerEntry =
          participants[randomInt(0, participants.length - 1)] ??
          participants[0];
        const seller = sellerEntry?.user ?? farmer;
        const price = parseFloat((randomInt(100, 800) / 100).toFixed(2));
        const stock = randomInt(10, 60);
        const product = await prisma.product.create({
          data: {
            name: template.name,
            category: template.category,
            description: randomDescription("product") ?? "",
            basePrice: price,
          },
        });

        const eventProduct = await prisma.eventProduct.create({
          data: {
            eventId: event.id,
            userId: seller.id,
            productId: product.id,
            price,
            stock,
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
      const offerPrice = parseFloat((record.price * 0.9).toFixed(2));

      await prisma.product.update({
        where: { id: record.product.id },
        data: { basePrice: offerPrice },
      });
      record.product.basePrice = offerPrice;

      await prisma.offer.create({
        data: {
          title: `${record.product.name} - akciová ponuka`,
          description: randomDescription("offer"),
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
        farmerId: record.farmer.id,
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
    for (const { event, participants } of eventsData) {
      const eventProducts = eventProductRecords.filter(
        (record) => record.event.id === event.id
      );
      if (!eventProducts.length) continue;

      const stallMap = new Map<number, string | null>(
        participants.map((p) => [p.user.id, p.stallName])
      );

      const buyer = customers[randomInt(0, customers.length - 1)];
      const maxItems = Math.min(2, eventProducts.length);
      const chosenProducts = shuffle(eventProducts).slice(
        0,
        randomInt(1, maxItems)
      );
      const items: OrderItemSeed[] = chosenProducts.map((record) => ({
        product: record.product,
        sellerName: record.seller.name,
        farmerId: record.seller.id,
        stallName: stallMap.get(record.seller.id) ?? null,
        price: parseFloat(
          ((record.product.basePrice ?? 5) * (1 + Math.random() * 0.2)).toFixed(
            2
          )
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
  const productsWithReviews = new Set<number>();

  // Farm products: each gets 0-12 reviews; other products remain without reviews
  const farmProductIds = new Set(
    farmProductRecords.map((record) => record.product.id)
  );
  for (const record of farmProductRecords) {
    const reviewCount = randomInt(0, 12);
    for (let i = 0; i < reviewCount; i++) {
      const reviewer = customers[randomInt(0, customers.length - 1)];
      await prisma.review.create({
        data: {
          comment: reviewComments[randomInt(0, reviewComments.length - 1)],
          rating: randomInt(3, 5),
          userId: reviewer.id,
          productId: record.product.id,
        },
      });
    }
    if (reviewCount > 0) {
      productsWithReviews.add(record.product.id);
    }
  }

  // Recompute stored rating for products that received reviews
  await Promise.all(
    Array.from(productsWithReviews).map((productId) =>
      recomputeProductRating(productId)
    )
  );

  // Safety net: ensure every product (even without new reviews) has rating set
  await recomputeAllProductRatings();

  console.log("🌾 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
