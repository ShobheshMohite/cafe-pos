import express from "express";
import prisma from "../prisma.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/**
 * ============================
 * CREATE NEW ORDER
 * ============================
 */
router.post("/",async (req, res) => {
  try {
    const { items, tableNo } = req.body;

    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      });

      if (!menuItem) {
        return res.status(400).json({ error: "Invalid menu item" });
      }

      const itemTotal = menuItem.price * item.quantity;
      total += itemTotal;

      orderItems.push({
        menuItemId: menuItem.id,
        quantity: item.quantity,
        price: menuItem.price, // snapshot price
      });
    }

    const order = await prisma.order.create({
      data: {
        tableNo: Number(tableNo),
        total,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
    });

    req.app.get("io").emit("new-order", order);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

/**
 * ============================
 * UPDATE ORDER (ONLY IF UNPAID)
 * ============================
 */
router.put("/:id",auth, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { items, tableNo } = req.body;

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (existingOrder.paid) {
      return res.status(400).json({ error: "Paid order cannot be updated" });
    }

    // Remove old items
    await prisma.orderItem.deleteMany({
      where: { orderId },
    });

    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId }, // ✅ FIXED
      });

      if (!menuItem) {
        return res.status(400).json({ error: "Invalid menu item" });
      }

      const itemTotal = menuItem.price * item.quantity;
      total += itemTotal;

      orderItems.push({
        menuItemId: menuItem.id,
        quantity: item.quantity,
        price: menuItem.price,
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        tableNo: Number(tableNo),
        total,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
    });

    req.app.get("io").emit("order-updated", updatedOrder);
    res.json(updatedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update order" });
  }
});

/**
 * ============================
 * GET SINGLE ORDER (BILL)
 * ============================
 */
router.get("/:id",auth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

/**
 * ============================
 * MARK ORDER AS PAID
 * ============================
 */
router.put("/:id/pay",auth, async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { paid: true },
    });

    req.app.get("io").emit("order-paid", order);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark order as paid" });
  }
});

export default router;
