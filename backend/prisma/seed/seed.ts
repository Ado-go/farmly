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

const productTemplates = [
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
  await prisma.farmProduct.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.farm.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("✅ Old data cleared.");

  console.log("🌱 Seeding new data...");

  const farmers = [];
  const customers = [];

  // ------------------- FARMERS -------------------
  const numFarmers = randomInt(5, 8);
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

  // ------------------- FARMS + FARM PRODUCTS -------------------
  const allProducts = [];

  for (const farmer of farmers) {
    const numFarms = randomInt(1, 3);

    for (let j = 0; j < numFarms; j++) {
      const cityIndex = randomInt(0, cities.length - 1);
      const farmName = `${cities[cityIndex]} Farma ${j + 1}`;

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
      const chosenTemplates = [...productTemplates]
        .sort(() => Math.random() - 0.5)
        .slice(0, numProducts);

      for (const template of chosenTemplates) {
        const farmProduct = await prisma.farmProduct.create({
          data: {
            farm: { connect: { id: farm.id } }, // 👈 toto je podstatná zmena
            price: parseFloat((randomInt(150, 1200) / 100).toFixed(2)),
            stock: randomInt(5, 50),
            product: {
              create: {
                name: template.name,
                category: template.category,
                description: `Čerstvé ${template.name.toLowerCase()} priamo z farmy ${
                  farm.name
                }.`,
                basePrice: parseFloat((randomInt(100, 800) / 100).toFixed(2)),
              },
            },
          },
          include: { product: true },
        });

        allProducts.push(farmProduct.product);
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
      startDate.setDate(startDate.getDate() + randomInt(3, 20));
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + randomInt(4, 24));

      const event = await prisma.event.create({
        data: {
          title: `Farmársky deň ${i + 1} - ${farmer.name.split(" ")[0]}`,
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

      // ďalší farmári ako účastníci
      const otherFarmers = farmers.filter((f) => f.id !== farmer.id);
      const chosenFarmers = [...otherFarmers]
        .sort(() => Math.random() - 0.5)
        .slice(0, randomInt(2, 5));

      for (const participant of chosenFarmers) {
        await prisma.eventParticipant.create({
          data: { eventId: event.id, userId: participant.id },
        });
      }

      // produkty patriace k eventu
      const numProducts = randomInt(1, 3);
      const chosenTemplates = [...productTemplates]
        .sort(() => Math.random() - 0.5)
        .slice(0, numProducts);

      for (const template of chosenTemplates) {
        const eventProduct = await prisma.eventProduct.create({
          data: {
            event: { connect: { id: event.id } }, // 👈 dôležitá zmena
            product: {
              create: {
                name: template.name,
                category: template.category,
                description: `Produkt prezentovaný na udalosti ${event.title}.`,
                basePrice: parseFloat((randomInt(100, 800) / 100).toFixed(2)),
              },
            },
          },
          include: { product: true },
        });

        allProducts.push(eventProduct.product);
      }
    }
  }

  // ------------------- REVIEWS -------------------
  console.log("⭐ Creating reviews...");
  for (const prod of allProducts) {
    const numReviews = randomInt(1, 3);
    for (let i = 0; i < numReviews; i++) {
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
