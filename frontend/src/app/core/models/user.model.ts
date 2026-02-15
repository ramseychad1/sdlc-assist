export interface User {
    id: string;
    username: string;
    displayName: string;
    role: 'ADMIN' | 'PRODUCT_MANAGER' | 'VIEWER';
}

export interface LoginRequest {
    username: string;
    password: string;
}
