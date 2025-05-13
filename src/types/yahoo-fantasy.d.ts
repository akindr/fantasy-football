declare module 'yahoo-fantasy' {
    export default class YahooFantasy {
        constructor(clientId: string, clientSecret: string);
        setUserToken(token: string): void;
        
        user: {
            game_leagues(sport: string): Promise<any[]>;
        };
        
        league: {
            meta(leagueKey: string): Promise<{
                name: string;
                league_id: string;
                num_teams: number;
                current_week: number;
            }>;
            teams(leagueKey: string): Promise<Array<{
                name: string;
                team_key: string;
                team_id: string;
                is_owned_by_current_login: boolean;
                points: number;
                standings: {
                    outcome_totals: {
                        wins: number;
                        losses: number;
                        ties: number;
                    };
                };
            }>>;
        };
    }
} 