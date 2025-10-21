import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const auth = (req: any, res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization;
  if (!bearer) return res.status(403).json({ error: "Token necessário" });
  const token = bearer.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
};
