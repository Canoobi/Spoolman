export type PrintRequestStatus =
    | "Angefragt"
    | "In Klärung"
    | "Offen"
    | "In Bearbeitung"
    | "Hergestellt"
    | "Abgeschlossen"
    | "Abgelehnt";

export interface PrintRequestFilamentInfo {
    id: number;
    display_name: string;
}

export interface PrintRequestRecord {
    id: number;
    public_id: string;

    created_at: string;
    updated_at?: string | null;

    requester_name: string;
    requester_contact?: string | null;

    delivery_type?: string | null;
    delivery_details?: string | null;

    title: string;
    description: string;

    makerworld_url?: string | null;
    additional_links_text?: string | null;

    wanted_date?: string | null;
    priority?: string | null;

    other_filament_requested: boolean;
    other_filament_description?: string | null;

    color_assignment?: string | null;
    comment?: string | null;

    status: PrintRequestStatus;

    accepted_at?: string | null;
    rejected_at?: string | null;
    completed_at?: string | null;

    rejection_reason?: string | null;
    internal_notes?: string | null;

    filaments: PrintRequestFilamentInfo[];
}

export interface PrintRequestInternalPatch {
    requester_name?: string;
    requester_contact?: string | null;

    delivery_type?: string | null;
    delivery_details?: string | null;

    title?: string;
    description?: string;

    makerworld_url?: string | null;
    additional_links_text?: string | null;

    wanted_date?: string | null;
    priority?: string | null;

    other_filament_requested?: boolean;
    other_filament_description?: string | null;

    color_assignment?: string | null;
    comment?: string | null;

    filament_ids?: number[];

    status?: PrintRequestStatus;
    internal_notes?: string | null;
    rejection_reason?: string | null;
}

export const PRINT_REQUEST_STATUSES: PrintRequestStatus[] = [
    "Angefragt",
    "In Klärung",
    "Offen",
    "In Bearbeitung",
    "Hergestellt",
    "Abgeschlossen",
    "Abgelehnt",
];
