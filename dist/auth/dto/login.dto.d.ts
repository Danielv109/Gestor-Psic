export declare class LoginDto {
    email: string;
    password: string;
}
export declare class LoginResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        globalRole: string;
    };
}
