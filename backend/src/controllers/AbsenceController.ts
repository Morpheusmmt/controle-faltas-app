import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: { id: number }; 
}

export const addAbsence = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const subjectId = Number(req.params.id);
    const { date } = req.body;

    if (!userId || !date) {
        return res.status(400).json({ error: 'Data da falta é obrigatória.' });
    }

    try {
        const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject || subject.userId !== userId) {
            return res.status(404).json({ error: 'Matéria não encontrada.' });
        }

        const newRecord = await prisma.absenceRecord.create({
            data: {
                date: new Date(date),
                subjectId,
            },
        });

        await prisma.subject.update({
            where: { id: subjectId },
            data: { absences: { increment: 1 } }
        });

        return res.status(201).json(newRecord);

    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Falta já registrada para esta data.' });
        }
        console.error('Erro ao registrar falta:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

export const getAbsencesBySubject = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const subjectId = Number(req.params.id);

    try {
        const records = await prisma.absenceRecord.findMany({
            where: {
                subjectId,
                subject: { userId: userId }
            },
            orderBy: {
                date: 'desc'
            }
        });

        return res.status(200).json(records);
    } catch (error) {
        console.error('Erro ao buscar faltas:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

export const deleteAbsence = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const recordId = Number(req.params.recordId);

    try {
        const record = await prisma.absenceRecord.findFirst({
            where: {
                id: recordId,
                subject: { userId: userId }
            }
        });

        if (!record) {
            return res.status(404).json({ error: 'Registro de falta não encontrado.' });
        }

        await prisma.absenceRecord.delete({ where: { id: recordId } });

        await prisma.subject.update({
            where: { id: record.subjectId },
            data: { absences: { decrement: 1 } }
        });

        return res.status(200).json({ message: 'Registro de falta excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar falta:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};