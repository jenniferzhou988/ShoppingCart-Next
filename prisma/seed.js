/* eslint-disable @typescript-eslint/no-require-imports */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const roles = ["USER", "ADMIN"];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeded roles: ${roles.join(", ")}`);

  const billingTypes = [
    { billingTypeName: "Paypal", comment: "PayPal payment method" },
    { billingTypeName: "CreditCard", comment: "Credit card payment" },
    { billingTypeName: "MasterCard", comment: "MasterCard payment" },
    { billingTypeName: "Debit", comment: "Debit card payment" }
  ];

  for (const billingType of billingTypes) {
    await prisma.billingType.upsert({
      where: { billingTypeName: billingType.billingTypeName },
      update: {},
      create: billingType,
    });
  }
  console.log(`Seeded billing types: ${billingTypes.map(bt => bt.billingTypeName).join(", ")}`);

  const orderStatuses = ["Ordered", "Shipping", "Received"];

  for (const status of orderStatuses) {
    await prisma.orderStatus.upsert({
      where: { orderStatus: status },
      update: {},
      create: { orderStatus: status },
    });
  }
  console.log(`Seeded order statuses: ${orderStatuses.join(", ")}`);

  const productCategories = [
    { productCategoryName: "Women", description: "Women's clothing and accessories" },
    { productCategoryName: "Men", description: "Men's clothing and accessories" },
    { productCategoryName: "Kids", description: "Children's clothing and toys" },
    { productCategoryName: "Home", description: "Home decor and furnishings" },
    { productCategoryName: "Electronics", description: "Electronic devices and gadgets" },
    { productCategoryName: "Kitchen", description: "Kitchen appliances and tools" },
    { productCategoryName: "Garden", description: "Garden and outdoor products" },
    { productCategoryName: "Backyard", description: "Backyard furniture and equipment" },
    { productCategoryName: "Furniture", description: "Furniture for all rooms" },
    { productCategoryName: "Books", description: "Books and reading materials" },
    { productCategoryName: "Music", description: "Musical instruments and audio equipment" },
    { productCategoryName: "New Arrivals", description: "Recently added products" },
    { productCategoryName: "Best Sellers", description: "Best selling products" }
  ];

  for (const category of productCategories) {
    await prisma.productCategory.upsert({
      where: { productCategoryName: category.productCategoryName },
      update: {},
      create: category,
    });
  }
  console.log(`Seeded product categories: ${productCategories.map(pc => pc.productCategoryName).join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
