import { Router } from "express";
import { auth } from "../middlewares/authMiddleware";
import { addAbsence, getAbsencesBySubject, deleteAbsence } from "../controllers/AbsenceController";
import prisma from "../prisma";

const router = Router();

const calculateTotalClasses = (totalWorkloadHours: number, classDurationHours: number): number => {
    if (classDurationHours <= 0) return 0;
    return Math.floor(totalWorkloadHours / classDurationHours);
};
router.post("/", auth, async (req: any, res) => {
  const { name, type, totalWorkloadHours, classDurationHours } = req.body;
  
  if (!name || !totalWorkloadHours || !classDurationHours) {
    return res.status(400).json({ error: "Dados incompletos." });
  }

  try {
    const subject = await prisma.subject.create({
      data: { 
        name, 
        type, 
        totalWorkloadHours: Number(totalWorkloadHours),
        classDurationHours: Number(classDurationHours),
        userId: req.user.id 
      },
    });
    return res.status(201).json(subject);
  } catch (error: any) {
    if (error.code === 'P2002') {
        return res.status(409).json({ error: "Cadeira com este nome já existe." });
    }
    console.error("Erro ao criar subject:", error);
    return res.status(500).json({ error: "Falha ao criar cadeira no banco de dados." });
  }
});

router.put("/:id", auth, async (req: any, res) => {
  const { id } = req.params;
  const { name, type, totalWorkloadHours, classDurationHours } = req.body;
  
  if (!name || !totalWorkloadHours || !classDurationHours) {
    return res.status(400).json({ error: "Dados incompletos para edição." });
  }

  try {
    const subject = await prisma.subject.findUnique({ where: { id: Number(id) } });

    if (!subject || subject.userId !== req.user.id) {
      return res.status(404).json({ error: "Cadeira não encontrada ou sem permissão." });
    }

    const updatedSubject = await prisma.subject.update({
      where: { id: Number(id) },
      data: {
        name,
        type,
        totalWorkloadHours: Number(totalWorkloadHours),
        classDurationHours: Number(classDurationHours),
      },
    });
    return res.json(updatedSubject);
  } catch (error) {
    console.error("Erro ao editar subject:", error);
    return res.status(500).json({ error: "Erro interno ao editar a cadeira." });
  }
});

router.get("/", auth, async (req: any, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      where: { userId: req.user.id },
    });
    
     const subjectsWithCalculations = subjects.map(s => ({
        ...s,
        totalClasses: calculateTotalClasses(s.totalWorkloadHours, s.classDurationHours),
    }));

    return res.json(subjectsWithCalculations);
  } catch (error) {
    console.error("Erro ao buscar cadeiras:", error);
    return res.status(500).json({ error: "Erro ao buscar cadeiras." });
  }
});

router.delete("/:id", auth, async (req: any, res) => {
  const { id } = req.params;
  try {
    const subject = await prisma.subject.findUnique({ where: { id: Number(id) } });

    if (!subject || subject.userId !== req.user.id) {
      return res.status(404).json({ error: "Cadeira não encontrada ou sem permissão." });
    }
    await prisma.absenceRecord.deleteMany({ where: { subjectId: Number(id) } }); 

    await prisma.subject.delete({ where: { id: Number(id) } });
    
    return res.status(200).json({ message: "Cadeira excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar subject:", error);
    return res.status(500).json({ error: "Erro ao excluir a cadeira." });
  }
});

router.put("/:id/faltas", auth, async (req, res) => {
    const { id } = req.params;
    const { absences } = req.body;
    try {
        const updated = await prisma.subject.update({
            where: { id: Number(id) },
            data: { absences },
        });
        return res.json(updated);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao atualizar faltas." });
    }
});

router.get("/:id/absences", auth, getAbsencesBySubject);    
router.post("/:id/absences", auth, addAbsence);             
router.delete("/:subjectId/absences/:recordId", auth, deleteAbsence); 

export default router;