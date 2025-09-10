import { logger } from './services/logger.ts';

export type YahooStandingsResponse = {
    fantasy_content: {
        league: Array<{
            league_key?: string;
            league_id?: string;
            name?: string;
            standings?: Array<{
                teams: {
                    [key: string]: {
                        team: Array<Array<any>>;
                    };
                } & {
                    count: number;
                };
            }>;
        }>;
    };
};

type TeamInfo = {
    team_key: string;
    team_id: string;
    name: string;
    team_logos: Array<{
        team_logo: {
            size: string;
            url: string;
        };
    }>;
};

type TeamPoints = {
    team_points: {
        coverage_type: string;
        season: string;
        total: string;
    };
};

type TeamStandings = {
    team_standings: {
        rank: number;
        playoff_seed: string;
        outcome_totals: {
            wins: string;
            losses: string;
            ties: number;
            percentage: string;
        };
        streak: {
            type: 'win' | 'loss';
            value: string;
        };
        points_for: string;
        points_against: number;
    };
};
export type TransformedStandings = {
    leagueName: string;
    teams: Array<{
        teamId: string;
        name: string;
        logoUrl: string;
        manager: string;
        rank: number;
        wins: number;
        losses: number;
        pointsFor: number;
        pointsAgainst: number;
        streak: {
            type: 'win' | 'loss';
            value: number;
        };
    }>;
};

export function transformStandings(data: YahooStandingsResponse): TransformedStandings {
    const leagueInfo = data.fantasy_content.league[0];
    const standingsInfo = data.fantasy_content.league[1];

    if (!standingsInfo.standings?.[0]?.teams) {
        throw new Error('Invalid standings data structure');
    }

    const teams = standingsInfo.standings[0].teams;
    const transformedTeams = Object.entries(teams)
        .filter(([key]) => key !== 'count')
        .map(([_, teamData]) => {
            // Index 0 has team key, team id, logo, and manager. We need to search in this array for these objects
            const teamArray = (teamData as { team: Array<Array<any> | TeamStandings> }).team;
            let teamId = '',
                teamName = '',
                teamLogo = '',
                teamManager = '';

            const teamInfo = teamArray[0];
            if (Array.isArray(teamInfo)) {
                for (const item of teamInfo) {
                    if (item.team_id) {
                        teamId = item.team_id;
                    }
                    if (item.name) {
                        teamName = item.name;
                    }
                    if (item.team_logos) {
                        teamLogo = item.team_logos[0].team_logo.url;
                    }
                    if (item.managers) {
                        teamManager = item.managers[0].manager.nickname;
                    }
                }
            }

            // Index 2 has the standings including points for, against, and streak, ranking, playoff seed
            const teamStandings = teamArray[2] as TeamStandings;

            let rank = 0,
                wins = 0,
                losses = 0,
                pointsFor = 0,
                pointsAgainst = 0,
                streak = { type: 'win' as 'win' | 'loss', value: 0 };

            if (teamStandings.team_standings) {
                const standings = teamStandings.team_standings;
                rank = standings.rank;
                wins = parseInt(standings.outcome_totals.wins);
                losses = parseInt(standings.outcome_totals.losses);
                pointsFor = parseFloat(standings.points_for);
                pointsAgainst = standings.points_against;
                streak = {
                    type: standings.streak.type,
                    value: parseInt(standings.streak.value),
                };
            }

            return {
                teamId,
                name: teamName,
                logoUrl: teamLogo,
                manager: teamManager,
                rank,
                wins,
                losses,
                pointsFor,
                pointsAgainst,
                streak,
            };
        });

    return {
        leagueName: leagueInfo.name || '',
        teams: transformedTeams,
    };
}

// Types for Yahoo matchups data structure
type YahooMatchupTeam = {
    team: Array<Array<any> | TeamPoints>;
};

type YahooMatchup = {
    matchup: Array<{
        teams: {
            [key: string]: YahooMatchupTeam;
        };
    }>;
};

type YahooMatchupsData = {
    [key: string]: YahooMatchup;
} & {
    count: number;
};

type YahooScoreboardResponse = {
    fantasy_content: {
        league: Array<{
            scoreboard?: Array<{
                matchups?: YahooMatchupsData;
            }>;
        }>;
    };
};

export type TransformedMatchup = {
    team1: {
        name: string;
        logo: string;
        points: number;
        id: string;
    };
    team2: {
        name: string;
        logo: string;
        points: number;
        id: string;
    };
};

export function transformMatchups(data: YahooScoreboardResponse): TransformedMatchup[] {
    const matchups = data?.fantasy_content?.league[1]?.scoreboard?.[0]?.matchups;

    if (!matchups || !matchups.count) {
        return [];
    }

    const transformedMatchups: TransformedMatchup[] = [];

    for (let matchupId = 0; matchupId < matchups.count; matchupId++) {
        const matchup = matchups[matchupId.toString()]?.matchup?.[0]?.teams;

        if (!matchup) {
            continue;
        }

        const team1Data = matchup['0']?.team;
        const team2Data = matchup['1']?.team;

        if (!team1Data || !team2Data) {
            continue;
        }

        // Team 1 information - following the Python array indexing
        const team1Name = (team1Data[0] as any)?.[2]?.name || '';
        const team1Logo = (team1Data[0] as any)?.[5]?.team_logos?.[0]?.team_logo?.url || '';
        const team1ID = (team1Data[0] as any)?.[1]?.team_id || '';
        const team1Points = parseFloat((team1Data[1] as TeamPoints)?.team_points?.total || '0');

        // Team 2 information - following the Python array indexing
        const team2Name = (team2Data[0] as any)?.[2]?.name || '';
        const team2Logo = (team2Data[0] as any)?.[5]?.team_logos?.[0]?.team_logo?.url || '';
        const team2ID = (team2Data[0] as any)?.[1]?.team_id || '';
        const team2Points = parseFloat((team2Data[1] as TeamPoints)?.team_points?.total || '0');

        transformedMatchups.push({
            team1: {
                name: team1Name,
                logo: team1Logo,
                points: team1Points,
                id: team1ID,
            },
            team2: {
                name: team2Name,
                logo: team2Logo,
                points: team2Points,
                id: team2ID,
            },
        });
    }

    return transformedMatchups;
}
