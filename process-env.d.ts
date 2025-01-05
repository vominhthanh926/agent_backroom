declare global {
    namespace NodeJS {
        interface ProcessEnv {
            [key: string]: string | undefined;
            NEXT_PUBLIC_BACKEND_URL: string;
            MONGODB_URI: string;
        }
    }
}
export {}
