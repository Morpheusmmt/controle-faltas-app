import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRouter from "./routes/user.js";
import subjectRouter from "./routes/subject.js";
dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/subjects", subjectRouter);

export default app;
