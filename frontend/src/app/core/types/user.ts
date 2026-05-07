export interface User {
    id: number;
    email: string;
    username: string;
    displayName: string;
    avatar: string | null;
    bio: string;
    isStaff: boolean;
    dateJoined: string;
    isProfilePublic: boolean;
    isListeningPublic: boolean;
    isRecentHistoryPublic: boolean;
}

export interface PublicUser {
    id: number;
    username: string;
    displayName: string;
    bio: string;
    avatar: string | null;
    followersCount: number;
    followingCount: number;
    isProfilePublic: boolean;
    isListeningPublic: boolean;
    isFollowing: boolean;
    isSelf: boolean;
    joinedAt: string;
}

export interface AuthCredentials {
    identifier: string;
    password: string;
}

export interface RegisterPayload {
    email: string;
    username: string;
    password: string;
    displayName?: string;
}

export interface PrivacyPatch {
    isProfilePublic?: boolean;
    isListeningPublic?: boolean;
    isRecentHistoryPublic?: boolean;
}
