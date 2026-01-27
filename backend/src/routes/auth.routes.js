import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = express.Router();

// TEMP USER (later move to DB)
const USER = {
  username: "admin",
  passwordHash: bcrypt.hashSync("admin123", 10)
};

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username !== USER.username)
    return res.status(401).json({ message: "Invalid credentials" });

  const valid = bcrypt.compareSync(password, USER.passwordHash);
  if (!valid)
    return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { username },
    process.env.JWT_SECRET || "cafepos_secret",
    { expiresIn: "12h" }
  );

  res.json({ token });
});

export default router;
