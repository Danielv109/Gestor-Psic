export declare const THROTTLE_ERROR_MESSAGE = "Demasiadas solicitudes, intenta m\u00E1s tarde";
export declare const throttlerConfig: {
    throttlers: {
        name: string;
        ttl: number;
        limit: number;
    }[];
    errorMessage: string;
};
