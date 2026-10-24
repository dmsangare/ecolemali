-- DEC-9 : ajout du champ is_stale pour marquage "à recalculer"
ALTER TABLE "report_cards" ADD COLUMN "is_stale" BOOLEAN NOT NULL DEFAULT false;
