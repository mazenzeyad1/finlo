export interface ActiveUserData {
    userId: string;
    sessionId: string;
}
export declare const ActiveUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
