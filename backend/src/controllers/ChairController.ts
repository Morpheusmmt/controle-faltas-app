import { Request, Response } from 'express';
import { prisma } from '../app.js';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

const MAX_ABSENCE_PERCENTAGE = 0.25;

export const createChair = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId; 
  const { name, totalWorkloadHours, classDurationHours, durationType } = req.body;

  if (!userId || !name || !totalWorkloadHours || !classDurationHours) {
    return res.status(400).json({ error: 'Dados incompletos. Nome, Carga Horária Total e Duração da Aula são obrigatórios.' });
  }

  try {
    const maxAbsencesHoursLimit = totalWorkloadHours * MAX_ABSENCE_PERCENTAGE;

    const newChair = await prisma.chair.create({
      data: {
        userId,
        name,
        totalWorkloadHours,
        classDurationHours,
        durationType: durationType || 'Semestre', 
        maxAbsencesHoursLimit, 
      },
    });

    return res.status(201).json({ 
      message: 'Cadeira cadastrada com sucesso!', 
      chair: newChair 
    });

  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Você já possui uma cadeira com este nome.' });
    }
    console.error('Erro ao cadastrar cadeira:', error);
    return res.status(500).json({ error: 'Erro interno ao cadastrar cadeira.' });
  }
};

export const getChairs = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  try {
    const chairs = await prisma.chair.findMany({
      where: { userId },
      include: {
        absences: true, 
      },
      orderBy: {
        createdAt: 'asc', 
      }
    });
    
    const chairsWithStatus = chairs.map(chair => {
      const totalHoursMissed = chair.absences.reduce((sum, absence) => sum + absence.hoursMissed, 0);

      const remainingAbsenceHours = chair.maxAbsencesHoursLimit - totalHoursMissed;
      const riskStatus = totalHoursMissed >= chair.maxAbsencesHoursLimit * 0.75 
                         ? 'ALTO RISCO' 
                         : totalHoursMissed >= chair.maxAbsencesHoursLimit * 0.5 
                         ? 'RISCO MODERADO' 
                         : 'BAIXO RISCO';

      return {
        ...chair,
        totalHoursMissed,
        remainingAbsenceHours,
        riskStatus,
      };
    });

    return res.status(200).json(chairsWithStatus);

  } catch (error) {
    console.error('Erro ao buscar cadeiras:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar cadeiras.' });
  }
};

export const deleteChair = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { chairId } = req.params;

  try {
    const chair = await prisma.chair.findUnique({ where: { id: chairId } });

    if (!chair || chair.userId !== userId) {
      return res.status(404).json({ error: 'Cadeira não encontrada ou você não tem permissão.' });
    }

    await prisma.absence.deleteMany({
      where: { chairId },
    });
    await prisma.chair.delete({
      where: { id: chairId },
    });

    return res.status(200).json({ message: 'Cadeira e seus registros de falta excluídos com sucesso.' });

  } catch (error) {
    console.error('Erro ao excluir cadeira:', error);
    return res.status(500).json({ error: 'Erro interno ao excluir cadeira.' });
  }
};