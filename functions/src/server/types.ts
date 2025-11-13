import { TransformedMatchup, TransformedPlayer } from './data-mappers';

export interface TokenData {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    expiry_server_time?: number;
}

export type AwardData = {
    week: number;
    matchupId: string;
    imageURL: string;
    team1: {
        name: string;
        logo: string;
        points: number;
    };
    team2: {
        name: string;
        logo: string;
        points: number;
    };
    title: string;
    description: string;
    blurb: string;
    funFacts: string;
};

export type Award = {
    matchup: TransformedMatchup;
    award: AwardData;
};

export type FigPrediction = {
    text: string;
    imageURL: string;
};

export type GossipCornerData = {
    week: number;
    subtitle: string;
    predictions: FigPrediction[];
    updatedAt?: string;
};

export type TeamSummaryData = {
    players: TransformedPlayer[];
    name: string;
    wins: number;
    losses: number;
    ties: number;
    currentStreak: string;
    averagePoints: number;
    averageProjection: number;
    numberOfMoves: number;
    remainingBudget: number;
    numberOfTrades: number;
    avgOverUnderPerformance: number;
    lastFourScores: number[];
    positionalAverages: {
        QB: number;
        RB: number;
        WR: number;
        TE: number;
        'W/R/T': number;
        K: number;
        DST: number;
    };
};

export type HeadToHeadSummaryData = {
    currentWeek: number;
    teamA: TeamSummaryData;
    teamB: TeamSummaryData;
    leagueAvgOverUnderPerformance: number;
    leagueContext: {
        leagueAveragePoints: number;
        highestScore: number;
        bestRecord: string;
        worstRecord: string;
    };
};
