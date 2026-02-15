export interface BootstrapUserDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    licenseNumber?: string;
}
export interface BootstrapResult {
    success: boolean;
    message: string;
    user: {
        id: string;
        email: string;
        globalRole: string;
    };
    bootstrapCompletedAt: Date;
}
export declare const BOOTSTRAP_COMPLETED_KEY = "BOOTSTRAP_COMPLETED";
