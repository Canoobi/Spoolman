import {Tag, Typography} from "antd";
import dayjs from "dayjs";
import type {PrintRequestStatus} from "../types/printRequest";

export function renderPrintRequestStatus(status: PrintRequestStatus | string) {
    switch (status) {
        case "Angefragt":
            return <Tag color="blue">{status}</Tag>;
        case "In Klärung":
            return <Tag color="gold">{status}</Tag>;
        case "Offen":
            return <Tag color="cyan">{status}</Tag>;
        case "In Bearbeitung":
            return <Tag color="processing">{status}</Tag>;
        case "Hergestellt":
            return <Tag color="purple">{status}</Tag>;
        case "Abgeschlossen":
            return <Tag color="green">{status}</Tag>;
        case "Abgelehnt":
            return <Tag color="red">{status}</Tag>;
        default:
            return <Tag>{status}</Tag>;
    }
}

export function formatDateTime(value?: string | null) {
    if (!value) return "—";
    return dayjs(value).format("DD.MM.YYYY HH:mm");
}

export function formatDate(value?: string | null) {
    if (!value) return "—";
    return dayjs(value).format("DD.MM.YYYY");
}

export function renderMultilineText(value?: string | null) {
    if (!value) return "—";

    return (
        <Typography.Paragraph style={{whiteSpace: "pre-wrap", marginBottom: 0}}>
            {value}
        </Typography.Paragraph>
    );
}
