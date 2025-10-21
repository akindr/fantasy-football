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

type TeamPoints = {
    team_points: {
        coverage_type: string;
        season: string;
        total: string;
    };
    team_projected_points: {
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
            type: 'Win' | 'Loss';
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
            type: 'Win' | 'Loss';
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
                streak = { type: 'Win' as 'Win' | 'Loss', value: 0 };

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

export type TeamManager = {
    id: string;
    name: string;
    fantasyScore: number;
    fantasyTier: string;
};

export type TransformedMatchup = {
    id: string;
    team1: {
        name: string;
        logo: string;
        points: number;
        pointsProjected: number;
        id: string;
        players: TransformedPlayer[];
        manager: TeamManager;
    };
    team2: {
        name: string;
        logo: string;
        points: number;
        pointsProjected: number;
        id: string;
        players: TransformedPlayer[];
        manager: TeamManager;
    };
};

// Types for Yahoo roster data structure
type YahooPlayer = {
    player: Array<Array<any> | { selected_position: Array<any> } | { is_editable: number }>;
};

type YahooRosterData = {
    [key: string]: YahooPlayer;
} & {
    count: number;
};

type YahooRosterResponse = {
    fantasy_content: {
        team: Array<Array<unknown> | { roster: { [key: string]: { players: YahooRosterData } } }>;
    };
};

export type TransformedPlayer = {
    playerId: string;
    name: string;
    position: string;
    headshotUrl: string;
    team: string;
    teamAbbr: string;
    injuryStatus?: string;
    uniformNumber?: string;
    isStarter?: boolean;
    selectedPosition: string;
    stats?: TransformedPlayerStats;
};

export type TransformedPlayerStats = {
    stats?: Array<{
        statId: string;
        value: string;
    }>;
    points: number;
};

export function transformRoster(data: YahooRosterResponse): TransformedPlayer[] {
    const rosterData = data.fantasy_content.team[1];
    // Extract players from roster
    const players: TransformedPlayer[] = [];

    if (rosterData && typeof rosterData === 'object' && 'roster' in rosterData) {
        const roster = rosterData.roster;
        if (roster && roster['0'] && roster['0'].players) {
            const playersData = roster['0'].players;

            for (let i = 0; i < playersData.count; i++) {
                const playerData = playersData[i.toString()];
                if (!playerData || !playerData.player) continue;

                const playerInfo = playerData.player[0];
                const selectedPositionInfo = playerData.player[1];

                if (!Array.isArray(playerInfo)) continue;

                let playerId = '';
                let name = '';
                let position = '';
                let headshotUrl = '';
                let team = '';
                let teamAbbr = '';
                let uniformNumber = '';

                // Extract player information from the array
                for (const item of playerInfo) {
                    if (item.player_id) {
                        playerId = item.player_id;
                    }
                    if (item.name && item.name.full) {
                        name = item.name.full;
                    }
                    if (item.display_position) {
                        position = item.display_position;
                    }
                    if (item.headshot && item.headshot.url) {
                        headshotUrl = item.headshot.url;
                    }
                    if (item.editorial_team_full_name) {
                        team = item.editorial_team_full_name;
                    }
                    if (item.editorial_team_abbr) {
                        teamAbbr = item.editorial_team_abbr;
                    }
                    if (item.uniform_number) {
                        uniformNumber = item.uniform_number;
                    }
                }

                // Extract selected position for this week
                let selectedPosition = position;
                if (
                    selectedPositionInfo &&
                    typeof selectedPositionInfo === 'object' &&
                    'selected_position' in selectedPositionInfo
                ) {
                    const posArray = selectedPositionInfo.selected_position;
                    for (const posItem of posArray) {
                        if (posItem.position) {
                            selectedPosition = posItem.position;

                            break;
                        }
                    }
                }

                players.push({
                    headshotUrl,
                    isStarter: selectedPosition !== 'BN',
                    name,
                    playerId,
                    position,
                    selectedPosition,
                    team,
                    teamAbbr,
                    uniformNumber,
                });
            }
        }
    }

    return players;
}

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
        const team1PointsProjected = parseFloat(
            (team1Data[1] as TeamPoints)?.team_projected_points?.total || '0'
        );
        // const manager = index 23, managers, manager, guid
        const team1Manager = (team1Data[0] as Array<any>)?.[23]?.managers[0]?.manager;

        // Team 2 information - following the Python array indexing
        const team2Name = (team2Data[0] as any)?.[2]?.name || '';
        const team2Logo = (team2Data[0] as any)?.[5]?.team_logos?.[0]?.team_logo?.url || '';
        const team2ID = (team2Data[0] as any)?.[1]?.team_id || '';
        const team2Points = parseFloat((team2Data[1] as TeamPoints)?.team_points?.total || '0');
        const team2PointsProjected = parseFloat(
            (team2Data[1] as TeamPoints)?.team_projected_points?.total || '0'
        );
        const team2Manager = (team2Data[0] as Array<any>)?.[23]?.managers[0]?.manager;

        transformedMatchups.push({
            id: `${team1Manager.guid}-vs-${team2Manager.guid}`,
            team1: {
                name: team1Name,
                logo: team1Logo,
                points: team1Points,
                pointsProjected: team1PointsProjected,
                id: team1ID,
                players: [],
                manager: {
                    id: team1Manager?.guid || '',
                    name: team1Manager?.nickname || '',
                    fantasyScore: parseInt(team1Manager?.felo_score || '0'),
                    fantasyTier: team1Manager?.felo_tier || '',
                },
            },
            team2: {
                name: team2Name,
                logo: team2Logo,
                points: team2Points,
                pointsProjected: team2PointsProjected,
                id: team2ID,
                players: [],
                manager: {
                    id: team2Manager?.guid || '',
                    name: team2Manager?.nickname || '',
                    fantasyScore: parseInt(team2Manager?.felo_score || '0'),
                    fantasyTier: team2Manager?.felo_tier || '',
                },
            },
        });
    }

    return transformedMatchups;
}

export function transformPlayerStats(data: any): Map<string, TransformedPlayerStats> {
    /* 
     "fantasy_content": {
[1]     "xml:lang": "en-US",
[1]     "yahoo:uri": "/fantasy/v2/league/461.l.88883/players;player_keys=461.p.29369,461.p.33963,461.p.33967,461.p.40059,461.p.41823,461.p.34010,461.p.34447,461.p.40892,461.p.31868,461.p.33423,461.p.32704,461.p.40030,461.p.29754,461.p.100014,461.p.100002/stats;type=week;week=1",
[1]     "league": [
[1]       {
[1]         "league_key": "461.l.88883",
[1]         "league_id": "88883",
[1]         "name": "Get Schwifty",
[1]         "url": "https://football.fantasysports.yahoo.com/f1/88883",
[1]         "logo_url": "https://yahoofantasysports-res.cloudinary.com/image/upload/t_s192sq/fantasy-logos/d2e9288e07ac436a17a88f35411268f32db879de8ef57149f87e7e3f9caf7483.png",
[1]         "password": "",
[1]         "draft_status": "postdraft",
[1]         "num_teams": 12,
[1]         "edit_key": "5",
[1]         "weekly_deadline": "",
[1]         "roster_type": "week",
[1]         "league_update_timestamp": "1759301861",
[1]         "scoring_type": "head",
[1]         "league_type": "private",
[1]         "renew": "449_33497",
[1]         "renewed": "",
[1]         "felo_tier": "gold",
[1]         "is_highscore": false,
[1]         "matchup_week": 5,
[1]         "iris_group_chat_id": "",
[1]         "short_invitation_url": "https://football.fantasysports.yahoo.com/f1/88883/invitation?key=fa7e6e6bb9648938&ikey=2e96db5631e0ec48",
[1]         "allow_add_to_dl_extra_pos": 1,
[1]         "is_pro_league": "0",
[1]         "is_cash_league": "0",
[1]         "current_week": 5,
[1]         "start_week": "1",
[1]         "start_date": "2025-09-04",
[1]         "end_week": "17",
[1]         "end_date": "2025-12-29",
[1]         "is_plus_league": "0",
[1]         "game_code": "nfl",
[1]         "season": "2025"
[1]       },
[1]       {
[1]         "players": {
[1]           "0": {
[1]             "player": [
[1]               [
[1]                 {
[1]                   "player_key": "461.p.29369"
[1]                 },
[1]                 {
[1]                   "player_id": "29369"
[1]                 },
[1]                 {
[1]                   "name": {
[1]                     "full": "Dak Prescott",
[1]                     "first": "Dak",
[1]                     "last": "Prescott",
[1]                     "ascii_first": "Dak",
[1]                     "ascii_last": "Prescott"
[1]                   }
[1]                 },
[1]                 {
[1]                   "url": "https://sports.yahoo.com/nfl/players/29369"
[1]                 },
[1]                 {
[1]                   "editorial_player_key": "nfl.p.29369"
[1]                 },
[1]                 {
[1]                   "editorial_team_key": "nfl.t.6"
[1]                 },
[1]                 {
[1]                   "editorial_team_full_name": "Dallas Cowboys"
[1]                 },
[1]                 {
[1]                   "editorial_team_abbr": "Dal"
[1]                 },
[1]                 {
[1]                   "editorial_team_url": "https://sports.yahoo.com/nfl/teams/dallas/"
[1]                 },
[1]                 {
[1]                   "bye_weeks": {
[1]                     "week": "10"
[1]                   }
[1]                 },
[1]                 {
[1]                   "is_keeper": {
[1]                     "status": false,
[1]                     "cost": false,
[1]                     "kept": false
[1]                   }
[1]                 },
[1]                 {
[1]                   "uniform_number": "4"
[1]                 },
[1]                 {
[1]                   "display_position": "QB"
[1]                 },
[1]                 {
[1]                   "headshot": {
[1]                     "url": "https://s.yimg.com/iu/api/res/1.2/p5dqlaelzumqgU6GLGpA8A--~C/YXBwaWQ9eXNwb3J0cztjaD0yMzM2O2NyPTE7Y3c9MTc5MDtkeD04NTc7ZHk9MDtmaT11bGNyb3A7aD02MDtxPTEwMDt3PTQ2/https://s.yimg.com/xe/i/us/sp/v/nfl_cutout/players_l/08072025/29369.png",
[1]                     "size": "small"
[1]                   },
[1]                   "image_url": "https://s.yimg.com/iu/api/res/1.2/p5dqlaelzumqgU6GLGpA8A--~C/YXBwaWQ9eXNwb3J0cztjaD0yMzM2O2NyPTE7Y3c9MTc5MDtkeD04NTc7ZHk9MDtmaT11bGNyb3A7aD02MDtxPTEwMDt3PTQ2/https://s.yimg.com/xe/i/us/sp/v/nfl_cutout/players_l/08072025/29369.png"
[1]                 },
[1]                 {
[1]                   "is_undroppable": "0"
[1]                 },
[1]                 {
[1]                   "position_type": "O"
[1]                 },
[1]                 {
[1]                   "primary_position": "QB"
[1]                 },
[1]                 {
[1]                   "eligible_positions": [
[1]                     {
[1]                       "position": "QB"
[1]                     }
[1]                   ]
[1]                 },
[1]                 {
[1]                   "eligible_positions_to_add": []
[1]                 },
[1]                 [],
[1]                 [],
[1]                 {
[1]                   "has_player_notes": 1
[1]                 },
[1]                 [],
[1]                 {
[1]                   "player_notes_last_timestamp": 1759121149
[1]                 }
[1]               ],
[1]               {
[1]                 "player_stats": {
[1]                   "0": {
[1]                     "coverage_type": "week",
[1]                     "week": "1"
[1]                   },
[1]                   "stats": [
[1]                     {
[1]                       "stat": {
[1]                         "stat_id": "4",
[1]                         "value": "188"
[1]                       }
[1]                     },
[1]                     {
[1]                       "stat": {
[1]                         "stat_id": "5",
[1]                         "value": "0"
[1]                       }
[1]                     },
[1]                     {
[1]                       "stat": {
[1]                         "stat_id": "6",
[1]                         "value": "0"
[1]                       }
[1]                     },
[1]                     {
[1]                       "stat": {
[1]                         "stat_id": "8",
[1]                         "value": "1"
[1]                       }
[1]                     },
[1]                     {
[1]                       "stat": {
[1]                         "stat_id": "9",
[1]                         "value": "3"
[1]                       }
[1]                     },
[1]                     {
[1]                       "stat": {
[1]                         "stat_id": "10",
[1]                         "value": "0"
[1]                       }
[1]                     },
[1]                     {
[1]                       "stat": {
[1]                         "stat_id": "11",
[1]                         "value": "0"
[1]                       }
[1]                     },
[1]                     {
[1]                       "stat": {
[1]                         "stat_id": "12",
[1]                         "value": "0"
[1]                       }
[1]                     },
[1]                     {
[1]                       "stat": {
[1]                         "stat_id": "13",
[1]                         "value": "0"
[1]                       }
[1]                     },
[1]                     {
[1]                       "stat": {
[1]                         "stat_id": "15",
[1]                         "value": "0"
[1]                       }
[1]                     },
[1]                     {
[1]                       "stat": {
[1]                         "stat_id": "16",
[1]                         "value": "0"
[1]                       }
[1]                     },
[1]                     {
[1]                       "stat": {
[1]                         "stat_id": "18",
[1]                         "value": "0"
[1]                       }
[1]                     },
[1]                     {
[1]                       "stat": {
[1]                         "stat_id": "78",
[1]                         "value": "0"
[1]                       }
[1]                     },
[1]                     {
[1]                       "stat": {
[1]                         "stat_id": "57",
[1]                         "value": "0"
[1]                       }
[1]                     }
[1]                   ]
[1]                 },
[1]                 "player_points": {
[1]                   "0": {
[1]                     "coverage_type": "week",
[1]                     "week": "1"
[1]                   },
[1]                   "total": "7.82"
[1]                 }
[1]               }
[1]             ]
[1]           },
*/

    // This is a map of all players and their stats
    const playerStatsMap = new Map<string, TransformedPlayerStats>();
    const players = data.fantasy_content?.league[1]?.players;
    const playerEntries = Object.entries(players) as [string, any][];

    for (const [_, player] of playerEntries) {
        if (!player || !player.player) {
            console.warn('Invalid player data', { player, _ });
            continue;
        }
        const playerMeta = player.player[0]; // array
        let playerId;

        if (Array.isArray(playerMeta)) {
            for (const item of playerMeta) {
                if (item.player_id) {
                    playerId = item.player_id;
                }
            }
        }

        if (!playerId) {
            console.warn('Invalid player ID', { player, _ });
            continue;
        }

        // const playerStats = player.player[1].player_stats;
        const playerPoints = player.player[1].player_points.total;

        playerStatsMap.set(playerId, {
            // stats: playerStats, TODO we can decode what the stats are in the future
            points: parseFloat(playerPoints),
        });
    }

    return playerStatsMap;
}
