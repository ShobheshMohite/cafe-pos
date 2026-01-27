import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 🔴 VERY IMPORTANT DELETE ORDER (FK SAFE)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();

  const categories = [
    { name: "Signature Teas", order: 1 },
    { name: "Hot Chocolates", order: 2 },
    { name: "Classic Hot Coffee", order: 3 },
    { name: "Hot Specials", order: 4 },
    { name: "Iced Tea & Latte", order: 5 },
    { name: "Iced Brew Delights", order: 6 },
    { name: "Premium Shakes", order: 7 },
    { name: "Fries & Sides", order: 8 },
    { name: "Snacks (Veg)", order: 9 },
    { name: "Snacks (Non-Veg)", order: 10 },
    { name: "Pizza (Veg)", order: 11 },
    { name: "Pasta (Veg)", order: 12 },
    { name: "Pasta (Non-Veg)", order: 13 },
    { name: "Maggi Meals", order: 14 },
    { name: "Momos (Veg)", order: 15 },
    { name: "Momos (Non-Veg)", order: 16 },
    { name: "Sandwich (Veg)", order: 17 },
    { name: "Burgers (Veg)", order: 18 },
    { name: "Burgers (Non-Veg)", order: 19 },
    { name: "Desserts", order: 20 },
    { name: "Extras", order: 21 },
  ];

  const categoryMap = {};

  for (const c of categories) {
    const cat = await prisma.category.create({
      data: { name: c.name, sortOrder: c.order },
    });
    categoryMap[c.name] = cat.id;
  }

  const items = [
    // SIGNATURE TEAS
    ["Brewtopia Masala Tea", 20, true, "Signature Teas"],
    ["Lemon Tea", 29, true, "Signature Teas"],
    ["Black Tea", 29, true, "Signature Teas"],

    // HOT CHOCOLATES
    ["Hot Chocolate", 49, true, "Hot Chocolates"],
    ["Irish Hot Chocolate", 69, true, "Hot Chocolates"],
    ["Vanilla Hot Chocolate", 69, true, "Hot Chocolates"],
    ["Caramel Hot Chocolate", 69, true, "Hot Chocolates"],
    ["Hazelnut Hot Chocolate", 79, true, "Hot Chocolates"],

    // CLASSIC HOT COFFEE
    ["Hot Coffee", 39, true, "Classic Hot Coffee"],
    ["Black Coffee", 29, true, "Classic Hot Coffee"],
    ["Americano Coffee", 49, true, "Classic Hot Coffee"],
    ["Espresso 30ml", 49, true, "Classic Hot Coffee"],
    ["Hazelnut Cappuccino", 69, true, "Classic Hot Coffee"],

    // HOT SPECIALS
    ["Chocolate Hot Coffee", 69, true, "Hot Specials"],
    ["Irish Hot Coffee", 69, true, "Hot Specials"],
    ["Vanilla Hot Coffee", 69, true, "Hot Specials"],
    ["Hazelnut Hot Coffee", 79, true, "Hot Specials"],
    ["Brewtopia Special", 99, true, "Hot Specials"],

    // ICED TEA & LATTE
    ["Lemon Iced Tea", 49, true, "Iced Tea & Latte"],
    ["Peach Iced Tea", 49, true, "Iced Tea & Latte"],
    ["Iced Latte", 59, true, "Iced Tea & Latte"],
    ["Hazelnut Latte", 69, true, "Iced Tea & Latte"],
    ["Chocolate Latte", 79, true, "Iced Tea & Latte"],

    // ICED BREW DELIGHTS
    ["Cold Coffee", 69, true, "Iced Brew Delights"],
    ["Cold Coffee w/ Crush", 79, true, "Iced Brew Delights"],
    ["Brownie Cold Coffee", 89, true, "Iced Brew Delights"],
    ["Hazelnut Cold Coffee", 79, true, "Iced Brew Delights"],
    ["Irish Cold Coffee", 79, true, "Iced Brew Delights"],
    ["Vanilla Cold Coffee", 79, true, "Iced Brew Delights"],
    ["Chocolate Cold Coffee", 79, true, "Iced Brew Delights"],
    ["Nutella Cold Coffee", 89, true, "Iced Brew Delights"],
    ["Brewtopia Special Coffee", 99, true, "Iced Brew Delights"],

    // PREMIUM SHAKES
    ["Chocolate Shake", 99, true, "Premium Shakes"],
    ["Strawberry Munch Shake", 109, true, "Premium Shakes"],
    ["Oreo Shake", 119, true, "Premium Shakes"],
    ["KitKat Shake", 119, true, "Premium Shakes"],
    ["Nutella Shake", 119, true, "Premium Shakes"],
    ["Date Mango Shake", 139, true, "Premium Shakes"],
    ["Wild Brownie Shake", 149, true, "Premium Shakes"],
    ["Virgin Pina Colada", 139, true, "Premium Shakes"],

    // FRIES
    ["French Fries", 89, true, "Fries & Sides"],
    ["Peri-Peri Fries", 99, true, "Fries & Sides"],
    ["Cheese Fries", 109, true, "Fries & Sides"],

    // SNACKS
    ["Cheese Corn Balls", 129, true, "Snacks (Veg)"],
    ["Nachos with Salsa", 119, true, "Snacks (Veg)"],
    ["Nachos & Cream Cheese", 149, true, "Snacks (Veg)"],
    ["Chicken Popcorn", 149, false, "Snacks (Non-Veg)"],
    ["Fried Chicken w/ Fries", 159, false, "Snacks (Non-Veg)"],
    ["Chicken BBQ Wings", 229, false, "Snacks (Non-Veg)"],

    // PIZZA
    ["Margherita Pizza", 129, true, "Pizza (Veg)"],
    ["Sweetcorn Pizza", 139, true, "Pizza (Veg)"],
    ["Veg Pizza", 139, true, "Pizza (Veg)"],
    ["Paneer BBQ Pizza", 149, true, "Pizza (Veg)"],
    ["Paneer Peri Peri Pizza", 149, true, "Pizza (Veg)"],
    ["Brewtopia Special Pizza", 199, true, "Pizza (Veg)"],

    // PASTA
    ["White Sauce Pasta (Veg)", 139, true, "Pasta (Veg)"],
    ["Red Sauce Pasta (Veg)", 149, true, "Pasta (Veg)"],
    ["White Sauce Pasta (Chicken)", 159, false, "Pasta (Non-Veg)"],
    ["Red Sauce Pasta (Chicken)", 169, false, "Pasta (Non-Veg)"],

    // MAGGI
    ["Plain Maggi", 89, true, "Maggi Meals"],
    ["Cheese Maggi", 99, true, "Maggi Meals"],
    ["Spicy Garlic Maggi", 99, true, "Maggi Meals"],
    ["Corn Cheese Maggi", 109, true, "Maggi Meals"],

    // MOMOS
    ["Veg Fried Momos", 109, true, "Momos (Veg)"],
    ["Veg Peri Peri Momos", 109, true, "Momos (Veg)"],
    ["Veg Cheese Momos", 119, true, "Momos (Veg)"],
    ["Veg Kurkure Momos", 149, true, "Momos (Veg)"],
    ["Chicken Fried Momos", 129, false, "Momos (Non-Veg)"],
    ["Chicken Peri Peri Momos", 129, false, "Momos (Non-Veg)"],
    ["Chicken Cheese Momos", 139, false, "Momos (Non-Veg)"],
    ["Chicken Kurkure Momos", 159, false, "Momos (Non-Veg)"],

    // SANDWICH
    ["Bread Butter Toast", 49, true, "Sandwich (Veg)"],
    ["Cheese Chilly Toast", 79, true, "Sandwich (Veg)"],
    ["Veg Cheese", 89, true, "Sandwich (Veg)"],
    ["Veg Cheese Grilled", 99, true, "Sandwich (Veg)"],
    ["Chocolate Grilled", 99, true, "Sandwich (Veg)"],
    ["Special Veg Club", 129, true, "Sandwich (Veg)"],

    // BURGERS
    ["Veg Burger", 99, true, "Burgers (Veg)"],
    ["Veg Maharaja Burger", 109, true, "Burgers (Veg)"],
    ["Chicken Cheese Burger", 129, false, "Burgers (Non-Veg)"],
    ["Crispy Chicken Burger", 149, false, "Burgers (Non-Veg)"],

    // DESSERTS
    ["Caramel Custard", 99, true, "Desserts"],
    ["Brownie with Chocolate", 129, true, "Desserts"],

    // EXTRAS
    ["Cheese", 10, true, "Extras"],
    ["Schezwan Chutney", 10, true, "Extras"],
  ];

  for (const [name, price, isVeg, category] of items) {
    await prisma.menuItem.create({
      data: {
        name,
        price,
        isVeg,
        isActive: true,
        categoryId: categoryMap[category],
      },
    });
  }

  console.log("✅ Brewtopia FULL menu seeded successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
