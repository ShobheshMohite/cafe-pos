import express from "express";
import prisma from "../prisma.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/**
 * ============================
 * CREATE NEW ORDER
 * ============================
 */
router.post("/", auth, async (req, res) => {
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
router.put("/:id", auth, async (req, res) => {
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
 * GET TODAY'S ORDERS (DASHBOARD)
 * ============================
 */
router.get("/today", auth, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    res.json(orders);
  } catch (err) {
    console.error("Failed to fetch today's orders", err);
    res.status(500).json({ error: "Failed to fetch today's orders" });
  }
});

/**
 * ============================
 * GET SINGLE ORDER (BILL)
 * ============================
 */
router.get("/:id", auth, async (req, res) => {
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
router.put("/:id/pay", auth, async (req, res) => {
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

// Summary
router.get("/report/summary", auth, async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        error: "Both 'from' and 'to' dates are required (YYYY-MM-DD)",
      });
    }

    const startDate = new Date(from);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);

    // Basic summary stats
    const summary = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
      _avg: {
        total: true,
      },
    });

    // Paid vs Unpaid counts
    const paidCount = await prisma.order.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        paid: true,
      },
    });

    // Top 5 selling items
    const topItemsRaw = await prisma.orderItem.groupBy({
      by: ["menuItemId"],
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

    const topItems = await Promise.all(
      topItemsRaw.map(async (group) => {
        const menuItem = await prisma.menuItem.findUnique({
          where: { id: group.menuItemId },
          select: { name: true, price: true },
        });

        return {
          name: menuItem?.name || "Unknown Item",
          qty: group._sum.quantity || 0,
          revenue: (group._sum.quantity || 0) * (menuItem?.price || 0),
        };
      }),
    );

    res.json({
      totalSales: summary._sum.total || 0,
      orderCount: summary._count.id || 0,
      avgOrderValue: summary._avg.total || 0,
      paidCount,
      topItems,
    });
  } catch (err) {
    console.error("Report summary error:", err);
    res.status(500).json({ error: "Failed to generate report summary" });
  }
});

export default router;
