export interface YahooStandingsResponse {
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
}

interface TeamInfo {
    team_key: string;
    team_id: string;
    name: string;
    team_logos: Array<{
        team_logo: {
            size: string;
            url: string;
        };
    }>;
}

interface TeamPoints {
    team_points: {
        coverage_type: string;
        season: string;
        total: string;
    };
}

interface TeamStandings {
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
}
export interface TransformedStandings {
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
}

export function transformStandings(data: YahooStandingsResponse): TransformedStandings {
    console.log('transformStandings', data);
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
