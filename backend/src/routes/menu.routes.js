import express from "express";
import prisma from "../prisma.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get full menu with categories
router.get(
  "/",
  (req, res, next) => {
    console.log("MENU ROUTE HIT");
    next();
  },
  auth,
  async (req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
    });
    res.json(categories);
  },
);

// ADD NEW MENU ITEM (with optional new category)
router.post("/", auth, async (req, res) => {
  try {
    const { name, price, isVeg, categoryName } = req.body;

    if (!name || !price || !categoryName) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // find or create category
    let category = await prisma.category.findUnique({
      where: { name: categoryName },
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName },
      });
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        price: Number(price),
        isVeg: Boolean(isVeg),
        categoryId: category.id,
      },
    });

    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add menu item" });
  }
});

// GET ONLY CATEGORIES (for dropdown)
router.get("/categories", auth, async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  res.json(categories);
});

export default router;
