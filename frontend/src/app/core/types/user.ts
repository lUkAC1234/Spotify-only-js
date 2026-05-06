export interface User {
    id: number;
    email: string;
    username: string;
    displayName: string;
    avatar: string | null;
    isStaff: boolean;
    dateJoined: string;
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
