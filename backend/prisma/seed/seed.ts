import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

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

const productNames = [
  { name: "Jahody", category: "Ovocie" },
  { name: "Mrkva", category: "Zelenina" },
  { name: "Cibuľa", category: "Zelenina" },
  { name: "Jablká", category: "Ovocie" },
  { name: "Hrášok", category: "Zelenina" },
  { name: "Bazalka", category: "Bylinky" },
  { name: "Rozmarín", category: "Bylinky" },
  { name: "Hrušky", category: "Ovocie" },
  { name: "Paradajky", category: "Zelenina" },
  { name: "Paprika", category: "Zelenina" },
  { name: "Špenát", category: "Zelenina" },
];

const reviewComments = [
  "Výborná kvalita a rýchle doručenie!",
  "Veľmi chutné produkty, určite objednám znova.",
  "Trochu drahšie, ale oplatí sa.",
  "Farmár bol veľmi ochotný.",
  "Skvelá skúsenosť, odporúčam!",
];

async function main() {
  console.log("🧹 Clearing old data...");
  await prisma.review.deleteMany({});
  await prisma.eventParticipant.deleteMany({});
  await prisma.eventProduct.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.farm.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("✅ Old data cleared.");

  console.log("🌱 Seeding new data...");

  const farmers = [];
  const customers = [];

  // ------------------- FARMERS -------------------
  const numFarmers = randomInt(5, 10);
  for (let i = 0; i < numFarmers; i++) {
    const name = farmerNames[i % farmerNames.length];
    const email = `farmer${i + 1}@example.com`;
    const password = await argon2.hash("heslo123");

    const farmer = await prisma.user.create({
      data: {
        name,
        email,
        phone: `+421900${100000 + i}`,
        role: "FARMER",
        password,
      },
    });
    farmers.push(farmer);
  }

  // ------------------- CUSTOMERS -------------------
  for (let i = 0; i < customerNames.length; i++) {
    const name = customerNames[i];
    const email = `customer${i + 1}@example.com`;
    const password = await argon2.hash("heslo123");

    const customer = await prisma.user.create({
      data: {
        name,
        email,
        phone: `+421910${100000 + i}`,
        role: "CUSTOMER",
        password,
      },
    });
    customers.push(customer);
  }

  // ------------------- FARMS AND PRODUCTS -------------------
  const allProducts: { id: number }[] = [];

  for (const farmer of farmers) {
    const numFarms = randomInt(1, 3); // 1–3 farms per farmer

    for (let j = 0; j < numFarms; j++) {
      const cityIndex = randomInt(0, cities.length - 1);
      const farmName = `${cities[cityIndex]} Farma ${j + 1}`;

      const numProducts = randomInt(2, 5); // 2–5 products per farm
      const products = [];

      for (let k = 0; k < numProducts; k++) {
        const prodIndex = randomInt(0, productNames.length - 1);
        const prod = productNames[prodIndex];
        products.push({
          name: prod.name,
          category: prod.category,
          description: `Čerstvé ${prod.name.toLowerCase()} priamo z farmy.`,
          price: parseFloat((randomInt(100, 1000) / 100).toFixed(2)),
        });
      }

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
          products: { create: products },
        },
        include: { products: true },
      });

      allProducts.push(...farm.products);
    }
  }

  // ------------------- EVENTS -------------------
  console.log("📅 Creating events...");
  for (const farmer of farmers) {
    const numEvents = randomInt(1, 3);

    for (let i = 0; i < numEvents; i++) {
      const cityIndex = randomInt(0, cities.length - 1);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + randomInt(3, 20));
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + randomInt(4, 24));

      const event = await prisma.event.create({
        data: {
          title: `Farmársky deň ${i + 1} - ${farmer.name.split(" ")[0]}`,
          description: "Udalosť pre zákazníkov a priateľov farmy.",
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

      // pridaj náhodných účastníkov
      const numParticipants = randomInt(2, 6);
      const chosenCustomers = [...customers]
        .sort(() => Math.random() - 0.5)
        .slice(0, numParticipants);

      for (const cust of chosenCustomers) {
        await prisma.eventParticipant.create({
          data: { eventId: event.id, userId: cust.id },
        });
      }

      // priraď náhodné produkty
      const numLinkedProducts = randomInt(1, 3);
      const chosenProducts = [...allProducts]
        .sort(() => Math.random() - 0.5)
        .slice(0, numLinkedProducts);

      for (const prod of chosenProducts) {
        await prisma.eventProduct.create({
          data: { eventId: event.id, productId: prod.id },
        });
      }
    }
  }

  // ------------------- REVIEWS -------------------
  for (const product of allProducts) {
    const numReviews = randomInt(1, 3);
    for (let i = 0; i < numReviews; i++) {
      const reviewer = customers[randomInt(0, customers.length - 1)];
      await prisma.review.create({
        data: {
          comment: reviewComments[randomInt(0, reviewComments.length - 1)],
          rating: randomInt(3, 5),
          userId: reviewer.id,
          productId: product.id,
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
