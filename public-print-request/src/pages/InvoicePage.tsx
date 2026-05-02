import {useEffect, useMemo, useState} from "react";
import {Link, useParams} from "react-router-dom";
import {Alert, Button, Divider, Space, Typography} from "antd";
import axios from "axios";
import {AppLayout} from "../components/AppLayout";
import {PageCard} from "../components/PageCard";
import {getPrintRequest} from "../api/printRequest";
import type {PublicCostCalculation, PublicPrintRequestResponse} from "../types/api";
import {formatDateTime} from "../utils/format";

function formatCurrency(value?: number | null, currency?: string | null): string {
    if (value == null) return "—";

    try {
        return new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: currency || "EUR",
        }).format(value);
    } catch {
        return `${value.toFixed(2)} ${currency || ""}`.trim();
    }
}

function formatPercent(value?: number): string {
    if (value == null) return "—";
    return new Intl.NumberFormat("de-DE", {
        style: "percent",
        maximumFractionDigits: 2,
    }).format(value);
}

function buildFilamentLabel(cost: PublicCostCalculation): string {
    const vendor = cost.filament?.vendor?.name;
    const material = cost.filament?.material;
    const name = cost.filament?.name;
    return [vendor, material, name].filter(Boolean).join(" - ") || "—";
}

export function InvoicePage() {
    const {publicId} = useParams<{ publicId: string }>();

    const [request, setRequest] = useState<PublicPrintRequestResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cost = request?.cost_calculation ?? null;
    const filamentLabel = useMemo(() => (cost ? buildFilamentLabel(cost) : "—"), [cost]);

    useEffect(() => {
        const run = async () => {
            if (!publicId) {
                setError("Keine public_id angegeben.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const data = await getPrintRequest(publicId);
                setRequest(data);
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    if (err.response?.status === 401) {
                        setError("Nicht angemeldet. Bitte zuerst Passwort eingeben.");
                    } else if (err.response?.status === 403) {
                        setError("Dieser Auftrag gehört nicht zu deinem Benutzerkonto.");
                    } else if (err.response?.status === 404) {
                        setError("Auftrag nicht gefunden.");
                    } else {
                        const detail =
                            typeof err.response?.data?.detail === "string"
                                ? err.response.data.detail
                                : null;
                        setError(detail ?? "Rechnung konnte nicht geladen werden.");
                    }
                } else {
                    setError("Rechnung konnte nicht geladen werden.");
                }
            } finally {
                setLoading(false);
            }
        };

        void run();
    }, [publicId]);

    return (
        <AppLayout
            title="Rechnung zum 3D-Druckauftrag"
            subtitle="Diese Seite kann direkt gedruckt oder als PDF gespeichert werden."
        >
            <Space direction="vertical" size={16} style={{width: "100%"}}>
                {loading && <Alert type="info" showIcon message="Rechnung wird geladen ..."/>}
                {error && <Alert type="error" showIcon message={error}/>}

                {!loading && request && !cost && (
                    <Alert type="info" showIcon message="Für diesen Auftrag ist noch keine Rechnung verfügbar."/>
                )}

                {!loading && request && cost && (
                    <>
                        <PageCard
                            title={`Rechnung für Auftrag #${cost.print_request_id ?? "—"}`}
                            extra={<Button onClick={() => window.print()}>Als PDF speichern / drucken</Button>}
                        >
                            <Typography.Title level={4} style={{marginTop: 0}}>
                                {cost.item_names || request.title}
                            </Typography.Title>
                            <Typography.Paragraph type="secondary">
                                Erstellt am {formatDateTime(cost.created)}
                            </Typography.Paragraph>

                            <div><strong>Auftraggeber:</strong> {request.requester_name}</div>
                            <div><strong>Kontakt:</strong> {request.requester_contact || "—"}</div>
                            <div><strong>Drucker:</strong> {cost.printer?.name || "—"}</div>
                            <div><strong>Filament:</strong> {filamentLabel}</div>
                            <div><strong>Druckzeit:</strong> {cost.print_time_hours != null ? `${cost.print_time_hours} h` : "—"}</div>
                            <div><strong>Arbeitszeit:</strong> {cost.labor_time_hours != null ? `${cost.labor_time_hours} h` : "—"}</div>
                            <div><strong>Filamentgewicht:</strong> {cost.filament_weight_g != null ? `${cost.filament_weight_g} g` : "—"}</div>

                            <Divider/>

                            <div><strong>Material:</strong> {formatCurrency(cost.material_cost, cost.currency)}</div>
                            <div><strong>Energie:</strong> {formatCurrency(cost.energy_cost, cost.currency)}</div>
                            <div><strong>Abschreibung:</strong> {formatCurrency(cost.depreciation_cost, cost.currency)}</div>
                            <div><strong>Arbeitskosten:</strong> {formatCurrency(cost.labor_cost, cost.currency)}</div>
                            <div><strong>Verbrauchsmaterial:</strong> {formatCurrency(cost.consumables_cost, cost.currency)}</div>
                            <div><strong>Fehlerrate:</strong> {formatPercent(cost.failure_rate)}</div>
                            <div><strong>Aufschlag:</strong> {formatPercent(cost.markup_rate)}</div>

                            <Divider/>

                            <div><strong>Basispreis:</strong> {formatCurrency(cost.base_price, cost.currency)}</div>
                            <div><strong>Kalkulierter Preis:</strong> {formatCurrency(cost.uplifted_price, cost.currency)}</div>
                            <div><strong>Gesamtpreis:</strong> {formatCurrency(cost.final_price, cost.currency)}</div>

                            {cost.notes && (
                                <>
                                    <Divider/>
                                    <Typography.Paragraph>
                                        <strong>Notizen:</strong><br/>
                                        {cost.notes}
                                    </Typography.Paragraph>
                                </>
                            )}
                        </PageCard>

                        <Link to={`/request/status/${request.public_id}`}>
                            <Button>Zurück zur Statusseite</Button>
                        </Link>
                    </>
                )}
            </Space>
        </AppLayout>
    );
}
