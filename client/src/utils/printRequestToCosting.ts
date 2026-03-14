import dayjs from "dayjs";
import type { PrintRequestRecord } from "../types/printRequest";

function formatDate(value?: string | null): string {
    if (!value) return "—";
    return dayjs(value).format("DD.MM.YYYY");
}

export function buildCostingNotesFromPrintRequest(record: PrintRequestRecord): string {
    const filaments =
        record.filaments && record.filaments.length > 0
            ? record.filaments.map((f) => f.display_name).join(", ")
            : "—";

    const sections = [
        {
            label: "Beschreibung",
            value: record.description || "—",
        },
        {
            label: "Lieferdatum",
            value: formatDate(record.wanted_date),
        },
        {
            label: "MakerWorld Link",
            value: record.makerworld_url || "—",
        },
        {
            label: "Weitere Links",
            value: record.additional_links_text || "—",
        },
        {
            label: "Filamente",
            value: filaments,
        },
        {
            label: "Farbzuweisung",
            value: record.color_assignment || "—",
        },
        {
            label: "Kommentar",
            value: record.comment || "—",
        },
    ];

    return sections
        .map((section) => `${section.label}:\n${section.value}`)
        .join("\n\n");
}
