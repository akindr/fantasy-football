import { TransformedMatchup } from './data-mappers';

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
    matchupHighlights: string;
};

export type Award = {
    matchup: TransformedMatchup;
    award: AwardData;
};
