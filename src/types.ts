export interface ClassObj {
    id: string,
    name: string
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
}