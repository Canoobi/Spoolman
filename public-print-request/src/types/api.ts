export type DeliveryType = "Abholung" | "Versand" | "Andere Vereinbarung";
export type Priority = "niedrig" | "normal" | "hoch";

export type PrintRequestStatus =
    | "Angefragt"
    | "In Klärung"
    | "Offen"
    | "In Bearbeitung"
    | "Hergestellt"
    | "Abgeschlossen"
    | "Abgelehnt";

export interface FilamentInfo {
    id: number;
    display_name: string;
    color_hex?: string | null;
}

export interface PublicFormDataResponse {
    delivery_types: DeliveryType[];
    priorities: Priority[];
    filaments: FilamentInfo[];
}

export interface PublicPrintRequestPayload {
    requester_name: string;
    requester_contact?: string;
    delivery_type?: DeliveryType;
    delivery_details?: string;
    title: string;
    description: string;
    makerworld_url?: string;
    additional_links_text?: string;
    wanted_date?: string | null;
    priority?: Priority;
    other_filament_requested: boolean;
    other_filament_description?: string;
    color_assignment?: string;
    comment?: string;
    filament_ids: number[];
}

export interface PublicPrintRequestResponse extends PublicPrintRequestPayload {
    public_id: string;
    created_at: string;
    updated_at?: string | null;
    status: PrintRequestStatus;
    accepted_at?: string | null;
    rejected_at?: string | null;
    completed_at?: string | null;
    rejection_reason?: string | null;
    filaments: FilamentInfo[];
}
