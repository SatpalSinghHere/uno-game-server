-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "clockwise" BOOLEAN NOT NULL,
    "whoseTurn" INTEGER NOT NULL,
    "discardCard" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "roomId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "socketId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "deck" JSONB NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_id_key" ON "Room"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Player_socketId_key" ON "Player"("socketId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_email_key" ON "Player"("email");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
