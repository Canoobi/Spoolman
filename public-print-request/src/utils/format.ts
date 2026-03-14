import dayjs from "dayjs";

export function formatDateTime(value?: string | null): string {
    if (!value) return "—";
    return dayjs(value).format("DD.MM.YYYY HH:mm");
}

export function formatDate(value?: string | null): string {
    if (!value) return "—";
    return dayjs(value).format("DD.MM.YYYY");
}

export function buildStatusUrl(publicId: string): string {
    return `${window.location.origin}/status/${publicId}`;
}

export function normalizeTextareaUrls(value?: string): string | undefined {
    if (!value) return undefined;
    return value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n");
}
