export interface SpotifyTrack {
    id: string;
    name: string;
    uri: string;
    artists: {
        name: string;
    }[];
    album: {
        name: string;
        images: {
            url: string;
            height: number;
            width: number;
        }[];
    };
}