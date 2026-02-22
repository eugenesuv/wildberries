import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";

export interface ApiError {
    code: number;
    message: string;
    details?: Array<{ "@type": string }>;
}

export class ApiClient {
    private client: AxiosInstance;

    constructor(baseURL: string, serviceName: string) {
        this.client = axios.create({
            baseURL,
            headers: {
                "Content-Type": "application/json",
            },
        });

        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                // Добавляем токен авторизации, если есть
                const token = localStorage.getItem("auth_token");
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }

                return config;
            },
            (error) => Promise.reject(error),
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => {
                return response.data;
            },
            (error: AxiosError) => {
                const apiError: ApiError = {
                    code: error.response?.status || 500,
                    message: (error.response?.data as any)?.message || error.message,
                    details: (error.response?.data as any)?.details,
                };

                return Promise.reject(apiError);
            },
        );
    }

    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.client.get(url, config);
    }

    async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return this.client.post(url, data, config);
    }

    async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return this.client.put(url, data, config);
    }

    async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return this.client.patch(url, data, config);
    }

    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.client.delete(url, config);
    }
}
