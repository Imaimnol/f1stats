CREATE TABLE "RacePrediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "raceId" TEXT NOT NULL,
    "firstDriverId" TEXT NOT NULL,
    "secondDriverId" TEXT NOT NULL,
    "thirdDriverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RacePrediction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RacePrediction_userId_raceId_key"
ON "RacePrediction"("userId", "raceId");

CREATE INDEX "RacePrediction_raceId_idx"
ON "RacePrediction"("raceId");

ALTER TABLE "RacePrediction"
ADD CONSTRAINT "RacePrediction_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RacePrediction"
ADD CONSTRAINT "RacePrediction_raceId_fkey"
FOREIGN KEY ("raceId") REFERENCES "Race"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RacePrediction"
ADD CONSTRAINT "RacePrediction_firstDriverId_fkey"
FOREIGN KEY ("firstDriverId") REFERENCES "Driver"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RacePrediction"
ADD CONSTRAINT "RacePrediction_secondDriverId_fkey"
FOREIGN KEY ("secondDriverId") REFERENCES "Driver"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RacePrediction"
ADD CONSTRAINT "RacePrediction_thirdDriverId_fkey"
FOREIGN KEY ("thirdDriverId") REFERENCES "Driver"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
