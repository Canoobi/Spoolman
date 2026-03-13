import { api } from "./client";

export async function login(password: string): Promise<void> {
    await api.post("/print-request/public/login", { password });
}

export async function logout(): Promise<void> {
    await api.post("/print-request/public/logout");
}
