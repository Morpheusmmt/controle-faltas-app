-- CreateTable
CREATE TABLE "AbsenceRecord" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "subjectId" INTEGER NOT NULL,

    CONSTRAINT "AbsenceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AbsenceRecord_date_subjectId_key" ON "AbsenceRecord"("date", "subjectId");

-- AddForeignKey
ALTER TABLE "AbsenceRecord" ADD CONSTRAINT "AbsenceRecord_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
