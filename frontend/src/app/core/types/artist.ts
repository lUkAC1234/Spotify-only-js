export interface Artist {
    id: number;
    source: string;
    sourceId: string;
    name: string;
    slug: string;
    image: string | null;
    bio: string | null;
    country: string | null;
    monthlyListeners: number;
}
