-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "editCode" TEXT NOT NULL,
    "name" TEXT,
    "eventDate" TIMESTAMP(3),
    "eventLocation" TEXT,
    "phase" TEXT NOT NULL DEFAULT 'DRAFT',
    "teamSelectionMode" TEXT NOT NULL DEFAULT 'SELF_SELECT',
    "maxTeams" INTEGER NOT NULL DEFAULT 6,
    "maxPlayersPerTeam" INTEGER NOT NULL DEFAULT 6,
    "allowWalkIns" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "hostSocketId" TEXT,
    "hostConnected" BOOLEAN NOT NULL DEFAULT false,
    "hostDisconnectedAt" TIMESTAMP(3),
    "displaySocketId" TEXT,
    "displayConnected" BOOLEAN NOT NULL DEFAULT false,
    "currentRoundNumber" INTEGER NOT NULL DEFAULT 0,
    "totalRounds" INTEGER NOT NULL DEFAULT 8,
    "timerState" TEXT,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "pausedAt" TIMESTAMP(3),
    "pausedReason" TEXT,
    "gameState" TEXT,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "endedAt" TIMESTAMP(3),
    "endedReason" TEXT,
    "winnerId" TEXT,
    "finalStats" TEXT,
    "previousGameId" TEXT,
    "gameNumber" INTEGER NOT NULL DEFAULT 1,
    "hostUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "name" TEXT DEFAULT 'Team',
    "emoji" TEXT,
    "logoUrl" TEXT,
    "logoType" TEXT,
    "logoPrompt" TEXT,
    "aiAttemptsUsed" INTEGER NOT NULL DEFAULT 0,
    "maxAiAttempts" INTEGER NOT NULL DEFAULT 3,
    "currentSize" INTEGER NOT NULL DEFAULT 0,
    "maxSize" INTEGER NOT NULL DEFAULT 6,
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "totalWingsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalWingsAttempted" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL DEFAULT 'HOST',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "teamId" TEXT,
    "name" TEXT NOT NULL,
    "photoUrl" TEXT,
    "socketId" TEXT,
    "sessionId" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "hasDevice" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "disconnectedAt" TIMESTAMP(3),
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedVia" TEXT NOT NULL DEFAULT 'PHONE',
    "wingsCompleted" INTEGER NOT NULL DEFAULT 0,
    "wingsAttempted" INTEGER NOT NULL DEFAULT 0,
    "expectedGuestId" TEXT,
    "teamChangeRequested" BOOLEAN NOT NULL DEFAULT false,
    "requestedTeamId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpectedGuest" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "teamId" TEXT,
    "name" TEXT NOT NULL,
    "photoUrl" TEXT,
    "claimedById" TEXT,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpectedGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "sauceName" TEXT,
    "sauceScovilles" INTEGER,
    "sauceNotes" TEXT,
    "gameType" TEXT,
    "gameSelectionMode" TEXT NOT NULL DEFAULT 'PRE_SET',
    "gameConfig" TEXT,
    "phase" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundResult" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "wingPoints" INTEGER NOT NULL DEFAULT 0,
    "gamePoints" INTEGER NOT NULL DEFAULT 0,
    "bonusPoints" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "placement" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoundResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WingResult" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "markedBy" TEXT NOT NULL DEFAULT 'HOST',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WingResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "gameType" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "votedFor" TEXT NOT NULL,
    "votedVia" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameHistory" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "gameNumber" INTEGER NOT NULL,
    "winnerId" TEXT NOT NULL,
    "winnerName" TEXT NOT NULL,
    "winnerScore" INTEGER NOT NULL,
    "finalScores" TEXT NOT NULL,
    "stats" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Room_editCode_key" ON "Room"("editCode");

-- CreateIndex
CREATE UNIQUE INDEX "Player_sessionId_key" ON "Player"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_expectedGuestId_key" ON "Player"("expectedGuestId");

-- CreateIndex
CREATE UNIQUE INDEX "Round_roomId_roundNumber_key" ON "Round"("roomId", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RoundResult_roundId_teamId_key" ON "RoundResult"("roundId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "WingResult_roundId_playerId_key" ON "WingResult"("roundId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_roomId_roundNumber_playerId_key" ON "Vote"("roomId", "roundNumber", "playerId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_expectedGuestId_fkey" FOREIGN KEY ("expectedGuestId") REFERENCES "ExpectedGuest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpectedGuest" ADD CONSTRAINT "ExpectedGuest_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpectedGuest" ADD CONSTRAINT "ExpectedGuest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundResult" ADD CONSTRAINT "RoundResult_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundResult" ADD CONSTRAINT "RoundResult_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WingResult" ADD CONSTRAINT "WingResult_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WingResult" ADD CONSTRAINT "WingResult_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameHistory" ADD CONSTRAINT "GameHistory_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
