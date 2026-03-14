import dayjs from "dayjs";
import type {PrintRequestRecord} from "../types/printRequest";

type Translate = (key: string) => string;

function formatDate(value?: string | null): string {
    if (!value) return "—";
    return dayjs(value).format("DD.MM.YYYY");
}

export function buildCostingNotesFromPrintRequest(record: PrintRequestRecord, t: Translate): string {
    const filaments =
        record.filaments && record.filaments.length > 0
            ? record.filaments.map((f) => f.display_name).join(", ")
            : "—";

    const sections = [
        {
            label: t("cost.print_request_notes.description"),
            value: record.description || "—",
        },
        {
            label: t("cost.print_request_notes.delivery_date"),
            value: formatDate(record.wanted_date),
        },
        {
            label: t("cost.print_request_notes.makerworld_link"),
            value: record.makerworld_url || "—",
        },
        {
            label: t("cost.print_request_notes.additional_links"),
            value: record.additional_links_text || "—",
        },
        {
            label: t("cost.print_request_notes.filaments"),
            value: filaments,
        },
        {
            label: t("cost.print_request_notes.color_assignment"),
            value: record.color_assignment || "—",
        },
        {
            label: t("cost.print_request_notes.comment"),
            value: record.comment || "—",
        },
    ];

    return sections
        .map((section) => `${section.label}:\n${section.value}`)
        .join("\n\n");
}
