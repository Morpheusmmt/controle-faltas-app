import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";

const router = Router();
const prisma = new PrismaClient();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, password: hashed } });
    res.json(user);
  } catch {
    res.status(400).json({ error: "Email já cadastrado" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: "Credenciais inválidas" });
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: "1d" });
  res.json({ token });
});

export default router;
