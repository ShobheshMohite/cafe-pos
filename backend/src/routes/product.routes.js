import express from "express";
import prisma from "../prisma.js";

const router = express.Router();

/**
 * Add product (admin / initial setup)
 */
router.post("/", async (req, res) => {
  const { name, price } = req.body;

  const product = await prisma.product.create({
    data: { name, price }
  });

  res.json(product);
});

/**
 * Get active menu
 */
router.get("/", async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true }
  });

  res.json(products);
});

export default router;
