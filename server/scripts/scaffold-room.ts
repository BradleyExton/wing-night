import prisma from '../src/lib/prisma.js';
import { generateEditCode, generateRoomCode } from '../src/lib/roomCodes.js';

const DEFAULT_SAUCE_LINEUP = [
  { round: 1, name: "Frank's RedHot", scoville: 450 },
  { round: 2, name: 'Cholula', scoville: 1000 },
  { round: 3, name: 'Tabasco', scoville: 2500 },
  { round: 4, name: 'Sriracha', scoville: 2200 },
  { round: 5, name: 'Crystal', scoville: 4000 },
  { round: 6, name: 'El Yucateco', scoville: 8910 },
  { round: 7, name: "Dave's Insanity", scoville: 180000 },
  { round: 8, name: 'The Last Dab', scoville: 2000000 },
];

const VALID_PHASES = new Set([
  'DRAFT',
  'LOBBY',
  'TEAM_SETUP',
  'GAME_INTRO',
  'ROUND_INTRO',
  'EATING_PHASE',
  'GAME_PHASE',
  'ROUND_RESULTS',
  'GAME_END',
]);

const ROUND_PHASES = new Set([
  'ROUND_INTRO',
  'EATING_PHASE',
  'GAME_PHASE',
  'ROUND_RESULTS',
  'GAME_END',
]);

type Args = {
  teams: number;
  playersPerTeam: number;
  rounds: number;
  phase: string;
  name: string;
};

function printHelp() {
  console.log(`\nUsage: tsx scripts/scaffold-room.ts [options]\n\nOptions:\n  --teams, -t <n>           Number of teams (default: 2)\n  --players, -p <n>         Players per team (default: 4)\n  --rounds, -r <n>          Total rounds (default: 8)\n  --phase <PHASE>           Starting phase (default: TEAM_SETUP)\n  --name <string>           Room name (default: "Smoke Test")\n  --help, -h                Show help\n\nExamples:\n  tsx scripts/scaffold-room.ts\n  tsx scripts/scaffold-room.ts --teams 3 --players 2 --phase ROUND_INTRO\n`);
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    teams: 2,
    playersPerTeam: 4,
    rounds: 8,
    phase: 'TEAM_SETUP',
    name: 'Smoke Test',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }

    if (arg === '--teams' || arg === '-t') {
      const value = Number(argv[i + 1]);
      if (!Number.isFinite(value) || value < 1) {
        throw new Error('Invalid --teams value');
      }
      args.teams = Math.floor(value);
      i += 1;
      continue;
    }

    if (arg === '--players' || arg === '-p') {
      const value = Number(argv[i + 1]);
      if (!Number.isFinite(value) || value < 0) {
        throw new Error('Invalid --players value');
      }
      args.playersPerTeam = Math.floor(value);
      i += 1;
      continue;
    }

    if (arg === '--rounds' || arg === '-r') {
      const value = Number(argv[i + 1]);
      if (!Number.isFinite(value) || value < 1) {
        throw new Error('Invalid --rounds value');
      }
      args.rounds = Math.floor(value);
      i += 1;
      continue;
    }

    if (arg === '--phase') {
      const value = String(argv[i + 1] || '').trim().toUpperCase();
      if (!VALID_PHASES.has(value)) {
        throw new Error(`Invalid --phase value: ${value || '(empty)'}`);
      }
      args.phase = value;
      i += 1;
      continue;
    }

    if (arg === '--name') {
      const value = String(argv[i + 1] || '').trim();
      if (!value) {
        throw new Error('Invalid --name value');
      }
      args.name = value;
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function buildRounds(totalRounds: number) {
  return Array.from({ length: totalRounds }, (_, index) => {
    const roundNumber = index + 1;
    const preset = DEFAULT_SAUCE_LINEUP[index];
    return {
      roundNumber,
      sauceName: preset?.name || `Sauce ${roundNumber}`,
      sauceScovilles: preset?.scoville ?? 0,
    };
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const code = await generateRoomCode();
  const editCode = generateEditCode();

  const currentRoundNumber = ROUND_PHASES.has(args.phase) ? 1 : 0;

  const room = await prisma.room.create({
    data: {
      code,
      editCode,
      name: args.name,
      phase: args.phase,
      maxTeams: args.teams,
      maxPlayersPerTeam: args.playersPerTeam,
      totalRounds: args.rounds,
      currentRoundNumber,
      rounds: {
        create: buildRounds(args.rounds),
      },
    },
  });

  const teams = await Promise.all(
    Array.from({ length: args.teams }, (_, index) => {
      const teamNumber = index + 1;
      return prisma.team.create({
        data: {
          roomId: room.id,
          name: `Team ${teamNumber}`,
          maxSize: args.playersPerTeam,
          createdBy: 'SEED',
        },
      });
    })
  );

  for (const team of teams) {
    const players = Array.from({ length: args.playersPerTeam }, (_, index) => ({
      roomId: room.id,
      teamId: team.id,
      name: `${team.name} Player ${index + 1}`,
      hasDevice: true,
      isConnected: false,
      joinedVia: 'SEED',
      lastSeenAt: new Date(),
    }));

    if (players.length > 0) {
      await prisma.player.createMany({ data: players });
    }

    await prisma.team.update({
      where: { id: team.id },
      data: { currentSize: players.length },
    });
  }

  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  console.log('\nScaffolded room');
  console.log(`Room code:   ${room.code}`);
  console.log(`Edit code:   ${room.editCode}`);
  console.log(`Phase:       ${args.phase}`);
  console.log(`Teams:       ${args.teams}`);
  console.log(`Players/team:${args.playersPerTeam}`);
  console.log('\nURLs');
  console.log(`Host:    ${baseUrl}/host/${room.code}`);
  console.log(`Player:  ${baseUrl}/play/${room.code}`);
  console.log(`Display: ${baseUrl}/display/${room.code}`);
  console.log(`Edit:    ${baseUrl}/edit/${room.editCode}`);
  console.log('');
}

main()
  .catch((error) => {
    console.error('Failed to scaffold room:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
