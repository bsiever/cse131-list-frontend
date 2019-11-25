export type ClassObj = {
    id: string,
    className: string
}

export enum ErrorTypes {
    General,
    InvalidInput,
    InvalidLogin,
    InvalidToken,
    InvalidPermissions,
    UserDoesNotExist,
    ClassDoesNotExist,
    InvalidDatabaseRequest,
    UserNotInClass,
    UsernameAlreadyExists,
    ConnectionNotInSession,
    SessionDoesNotExist,
    UserAlreadyInClass
}

export interface User {
    id: string,
    fullName: string,
    username: string,
    permissionLevel: PermissionLevel
}

export interface SessionObj {
    id: string,
    sessionName: string,
    lists: {[s: string]: string} //Maps id to name
}

export enum PermissionLevel {
    Student,
    TA,
    Professor
}