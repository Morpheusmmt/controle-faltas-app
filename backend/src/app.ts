import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRouter from "./routes/user";
import subjectRouter from "./routes/subject";
dotenv.config();

const app = express();

app.use(cors({
  origin: "https://controle-faltas-app.vercel.app",
  credentials: true,
}));
app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/subjects", subjectRouter);

export default app;
