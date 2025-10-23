import { TransformedMatchup, TransformedPlayer, TransformedStandings } from './data-mappers';
import { TeamSummaryData, HeadToHeadSummaryData } from './types';

/**
 * Computes the average over/under performance for a team across multiple weeks
 */
export function calculateAvgOverUnderPerformance(
    teamMatchups: Array<{ points: number; pointsProjected: number }>
): number {
    if (teamMatchups.length === 0) return 0;

    const totalOverUnder = teamMatchups.reduce(
        (sum, matchup) => sum + (matchup.points - matchup.pointsProjected),
        0
    );

    return totalOverUnder / teamMatchups.length;
}

/**
 * Computes positional averages from a team's lineup across multiple weeks
 */
export function calculatePositionalAverages(weeklyLineups: TransformedPlayer[][]): {
    QB: number;
    RB: number;
    WR: number;
    TE: number;
    'W/R/T': number;
    K: number;
    DST: number;
} {
    const positionalTotals = {
        QB: { total: 0, count: 0 },
        RB: { total: 0, count: 0 },
        WR: { total: 0, count: 0 },
        TE: { total: 0, count: 0 },
        'W/R/T': { total: 0, count: 0 },
        K: { total: 0, count: 0 },
        DST: { total: 0, count: 0 },
    };

    for (const lineup of weeklyLineups) {
        for (const player of lineup) {
            if (!player.isStarter || !player.stats?.points) continue;

            const position = player.selectedPosition as keyof typeof positionalTotals;
            if (position in positionalTotals) {
                positionalTotals[position].total += player.stats.points;
                positionalTotals[position].count += 1;
            }
        }
    }

    return {
        QB:
            positionalTotals.QB.count > 0
                ? positionalTotals.QB.total / positionalTotals.QB.count
                : 0,
        RB:
            positionalTotals.RB.count > 0
                ? positionalTotals.RB.total / positionalTotals.RB.count
                : 0,
        WR:
            positionalTotals.WR.count > 0
                ? positionalTotals.WR.total / positionalTotals.WR.count
                : 0,
        TE:
            positionalTotals.TE.count > 0
                ? positionalTotals.TE.total / positionalTotals.TE.count
                : 0,
        'W/R/T':
            positionalTotals['W/R/T'].count > 0
                ? positionalTotals['W/R/T'].total / positionalTotals['W/R/T'].count
                : 0,
        K: positionalTotals.K.count > 0 ? positionalTotals.K.total / positionalTotals.K.count : 0,
        DST:
            positionalTotals.DST.count > 0
                ? positionalTotals.DST.total / positionalTotals.DST.count
                : 0,
    };
}

/**
 * Extracts the last N scores from a team's matchup history
 */
export function getLastNScores(
    allMatchups: TransformedMatchup[],
    teamId: string,
    n: number
): number[] {
    const scores: number[] = [];

    // Sort matchups by descending week (most recent first) and take last n
    for (const matchup of allMatchups) {
        if (matchup.team1.id === teamId) {
            scores.push(matchup.team1.points);
        } else if (matchup.team2.id === teamId) {
            scores.push(matchup.team2.points);
        }
    }

    // Return the last n scores (most recent weeks)
    return scores.slice(Math.max(0, scores.length - n));
}

/**
 * Computes team summary data for a given team
 */
export function computeTeamSummaryData(
    teamId: string,
    teamName: string,
    standings: TransformedStandings,
    allMatchupsThisSeason: TransformedMatchup[],
    teamLineup: TransformedPlayer[]
): TeamSummaryData {
    const teamStandings = standings.teams.find(t => t.teamId === teamId);

    console.log('Team standings', JSON.stringify(teamStandings, null, 2));

    if (!teamStandings) {
        throw new Error(`Team ${teamId} not found in standings`);
    }

    // Find all matchups for this team
    const teamMatchups = allMatchupsThisSeason.filter(m => {
        return m.team1.id === teamId || m.team2.id === teamId;
    });

    // Calculate average points and projections
    const pointsData = teamMatchups.map(matchup => ({
        points: matchup.team1.id === teamId ? matchup.team1.points : matchup.team2.points,
        pointsProjected:
            matchup.team1.id === teamId
                ? matchup.team1.pointsProjected
                : matchup.team2.pointsProjected,
    }));

    const averagePoints =
        pointsData.length > 0
            ? pointsData.reduce((sum, p) => sum + p.points, 0) / pointsData.length
            : 0;

    const averageProjection =
        pointsData.length > 0
            ? pointsData.reduce((sum, p) => sum + p.pointsProjected, 0) / pointsData.length
            : 0;

    const avgOverUnderPerformance = calculateAvgOverUnderPerformance(pointsData);

    // Get last 4 scores
    const lastFourScores = getLastNScores(teamMatchups, teamId, 4);

    // Get weekly lineups to calculate positional averages
    const weeklyLineups = teamMatchups.map(matchup =>
        matchup.team1.id === teamId ? matchup.team1.players : matchup.team2.players
    );

    const positionalAverages = calculatePositionalAverages(weeklyLineups);

    // Get team-specific data from a recent matchup (for moves, trades, budget)
    const latestMatchup = teamMatchups[teamMatchups.length - 1];
    const latestTeamData =
        latestMatchup.team1.id === teamId ? latestMatchup.team1 : latestMatchup.team2;

    return {
        name: teamName,
        wins: teamStandings.wins,
        losses: teamStandings.losses,
        ties: teamStandings.ties,
        currentStreak:
            teamStandings.streak.type.toLowerCase() === 'win'
                ? `W${teamStandings.streak.value}`
                : `L${teamStandings.streak.value}`,
        averagePoints,
        averageProjection,
        numberOfMoves: latestTeamData.numberOfMoves,
        remainingBudget: latestTeamData.waiverBudget,
        numberOfTrades: latestTeamData.numberOfTrades,
        avgOverUnderPerformance,
        lastFourScores,
        positionalAverages,
        players: teamLineup,
    };
}

/**
 * Computes league-wide context data
 */
export function computeLeagueContext(
    standings: TransformedStandings,
    allMatchupsThisSeason: TransformedMatchup[]
): {
    leagueAveragePoints: number;
    highestScore: number;
    bestRecord: string;
    worstRecord: string;
    leagueAvgOverUnderPerformance: number;
} {
    // League average points
    const totalPoints = standings.teams.reduce((sum, team) => sum + team.pointsFor, 0);
    const leagueAveragePoints = totalPoints / standings.teams.length;

    // Highest single-week score
    let highestScore = 0;
    for (const matchup of allMatchupsThisSeason) {
        highestScore = Math.max(highestScore, matchup.team1.points, matchup.team2.points);
    }

    // Best and worst records
    const sortedByWins = [...standings.teams].sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (a.losses !== b.losses) return a.losses - b.losses;
        return b.ties - a.ties;
    });

    const bestTeam = sortedByWins[0];
    const worstTeam = sortedByWins[sortedByWins.length - 1];

    const bestRecord = `${bestTeam.wins}-${bestTeam.losses}${bestTeam.ties > 0 ? `-${bestTeam.ties}` : ''}`;
    const worstRecord = `${worstTeam.wins}-${worstTeam.losses}${worstTeam.ties > 0 ? `-${worstTeam.ties}` : ''}`;

    // Calculate league average over/under performance
    const totalOverUnderDelta = allMatchupsThisSeason.reduce((sum, matchup) => {
        return (
            sum +
            (matchup.team1.points - matchup.team1.pointsProjected) +
            (matchup.team2.points - matchup.team2.pointsProjected)
        );
    }, 0);

    // matchups have two teams so you gotta account for that
    const leagueAvgOverUnderPerformance = totalOverUnderDelta / (allMatchupsThisSeason.length * 2);

    return {
        leagueAveragePoints,
        highestScore,
        bestRecord,
        worstRecord,
        leagueAvgOverUnderPerformance,
    };
}

/**
 * Main function to compute complete HeadToHeadSummaryData
 */
export function computeHeadToHeadSummary(
    team1Id: string,
    team1Name: string,
    team2Id: string,
    team2Name: string,
    currentWeek: number,
    standings: TransformedStandings,
    allMatchupsThisSeason: TransformedMatchup[],
    team1Lineup: TransformedPlayer[],
    team2Lineup: TransformedPlayer[]
): HeadToHeadSummaryData {
    const leagueContext = computeLeagueContext(standings, allMatchupsThisSeason);

    const teamA = computeTeamSummaryData(
        team1Id,
        team1Name,
        standings,
        allMatchupsThisSeason,
        team1Lineup
    );

    const teamB = computeTeamSummaryData(
        team2Id,
        team2Name,
        standings,
        allMatchupsThisSeason,
        team2Lineup
    );

    return {
        currentWeek,
        teamA,
        teamB,
        leagueAvgOverUnderPerformance: leagueContext.leagueAvgOverUnderPerformance,
        leagueContext: {
            leagueAveragePoints: leagueContext.leagueAveragePoints,
            highestScore: leagueContext.highestScore,
            bestRecord: leagueContext.bestRecord,
            worstRecord: leagueContext.worstRecord,
        },
    };
}
