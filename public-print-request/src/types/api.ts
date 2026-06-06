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

export interface PublicCostCalculation {
    id: number;
    created: string;
    print_time_hours?: number;
    labor_time_hours?: number;
    filament_weight_g?: number;
    material_cost?: number;
    energy_cost?: number;
    energy_cost_per_kwh?: number;
    depreciation_cost?: number;
    labor_cost?: number;
    labor_cost_per_hour?: number;
    consumables_cost?: number;
    failure_rate?: number;
    markup_rate?: number;
    base_price?: number;
    uplifted_price?: number;
    final_price?: number;
    paid?: boolean;
    currency?: string;
    item_names?: string;
    notes?: string;
    print_request_id?: number;
    printer?: {
        id: number;
        name: string;
    };
    filament?: {
        id: number;
        name?: string | null;
        material?: string | null;
        vendor?: {
            id: number;
            name: string;
        } | null;
    };
}

export interface PublicPrintRequestListItem {
    public_id: string;
    title: string;
    status: PrintRequestStatus;
    created_at: string;
    updated_at?: string | null;
    wanted_date?: string | null;
    final_price?: number | null;
    currency?: string | null;
}

export interface PublicCostCalculationListItem {
    cost_calculation_id: number;
    public_id: string;
    title: string;
    item_names?: string | null;
    created: string;
    final_price?: number | null;
    currency?: string | null;
    paid: boolean;
}

export interface PublicFormDataResponse {
    delivery_types: DeliveryType[];
    priorities: Priority[];
    filaments: FilamentInfo[];
    session: {
        requester_name?: string | null;
        requester_name_locked: boolean;
    };
    active_requests: PublicPrintRequestListItem[];
    billing_items: PublicCostCalculationListItem[];
    outstanding_balance: number;
    outstanding_currency?: string | null;
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
    cost_calculation?: PublicCostCalculation | null;
}
