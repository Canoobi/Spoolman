import {useEffect, useState} from "react";
import {Alert, Button, Divider, Space, Typography} from "antd";
import {Link} from "react-router-dom";
import axios from "axios";
import {AppLayout} from "../components/AppLayout";
import {PageCard} from "../components/PageCard";
import {RequestForm} from "../components/RequestForm";
import {createPrintRequest, getFormData} from "../api/printRequest";
import type {
    PublicFormDataResponse,
    PublicPrintRequestListItem,
    PublicPrintRequestPayload,
    PublicPrintRequestResponse,
} from "../types/api";
import {buildStatusUrl, formatDateTime} from "../utils/format";

function formatCurrency(value?: number | null, currency?: string | null): string {
    if (value == null) return "Noch nicht verfügbar";

    try {
        return new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: currency || "EUR",
        }).format(value);
    } catch {
        return `${value.toFixed(2)} ${currency || ""}`.trim();
    }
}

function buildListItemFromRequest(request: PublicPrintRequestResponse): PublicPrintRequestListItem {
    return {
        public_id: request.public_id,
        title: request.title,
        status: request.status,
        created_at: request.created_at,
        updated_at: request.updated_at,
        wanted_date: request.wanted_date,
        final_price: request.cost_calculation?.final_price ?? null,
        currency: request.cost_calculation?.currency ?? null,
    };
}

export function RequestPage() {
    const [formData, setFormData] = useState<PublicFormDataResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdRequest, setCreatedRequest] =
        useState<PublicPrintRequestResponse | null>(null);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setError(null);

            try {
                const data = await getFormData();
                setFormData(data);
            } catch (err) {
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    setError("Nicht angemeldet. Bitte zuerst Passwort eingeben.");
                } else {
                    setError("Formulardaten konnten nicht geladen werden.");
                }
            } finally {
                setLoading(false);
            }
        };

        void run();
    }, []);

    const handleSubmit = async (payload: PublicPrintRequestPayload) => {
        setSubmitLoading(true);
        setError(null);

        try {
            const result = await createPrintRequest(payload);
            setCreatedRequest(result);
            setFormData((previous) => {
                if (!previous || !previous.session.requester_name_locked) {
                    return previous;
                }

                return {
                    ...previous,
                    active_requests: [
                        buildListItemFromRequest(result),
                        ...previous.active_requests.filter((item) => item.public_id !== result.public_id),
                    ],
                };
            });
            window.scrollTo({top: 0, behavior: "smooth"});
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const detail =
                    typeof err.response?.data?.detail === "string"
                        ? err.response?.data?.detail
                        : null;

                if (err.response?.status === 401) {
                    setError("Sitzung ungültig. Bitte erneut anmelden.");
                } else {
                    setError(detail ?? "Auftrag konnte nicht erstellt werden.");
                }
            } else {
                setError("Auftrag konnte nicht erstellt werden.");
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <AppLayout
            title="3D-Druckauftrag einreichen"
            subtitle="Fülle das Formular vollständig aus. Nach erfolgreicher Erstellung erhältst du einen individuellen Statuslink."
        >
            <Space direction="vertical" size={16} style={{width: "100%"}}>
                {createdRequest && (
                    <PageCard title="Auftrag erfolgreich erstellt">
                        <Typography.Paragraph>
                            Dein Auftrag wurde gespeichert.
                        </Typography.Paragraph>

                        <div className="success-link-box">
                            <Typography.Text strong>Statuslink:</Typography.Text>
                            <div style={{marginTop: 8, wordBreak: "break-all"}}>
                                <a
                                    href={buildStatusUrl(createdRequest.public_id)}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {buildStatusUrl(createdRequest.public_id)}
                                </a>
                            </div>
                        </div>

                        <div style={{marginTop: 16}}>
                            <Link to={`/request/status/${createdRequest.public_id}`}>
                                <Button type="primary">Zur Statusseite</Button>
                            </Link>
                        </div>
                    </PageCard>
                )}

                {loading && <Alert type="info" showIcon message="Formulardaten werden geladen ..."/>}

                {!loading && error && !formData && (
                    <Alert type="error" showIcon message={error}/>
                )}

                {!loading && formData?.session.requester_name_locked && (
                    <PageCard title="Deine offenen Aufträge">
                        {formData.active_requests.length > 0 ? (
                            <Space direction="vertical" size={12} style={{width: "100%"}}>
                                {formData.active_requests.map((request) => (
                                    <div key={request.public_id}>
                                        <Typography.Text strong>{request.title}</Typography.Text>
                                        <div>Status: {request.status}</div>
                                        <div>Erstellt: {formatDateTime(request.created_at)}</div>
                                        <div>Letztes Update: {formatDateTime(request.updated_at)}</div>
                                        <div>Gesamtpreis: {formatCurrency(request.final_price, request.currency)}</div>
                                        <div style={{marginTop: 6}}>
                                            <a
                                                href={buildStatusUrl(request.public_id)}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Tracking-Link öffnen
                                            </a>
                                        </div>
                                        <Divider style={{margin: "12px 0"}}/>
                                    </div>
                                ))}
                            </Space>
                        ) : (
                            <Alert
                                type="info"
                                showIcon
                                message="Aktuell sind keine offenen Aufträge für dein Benutzerkonto vorhanden."
                            />
                        )}
                    </PageCard>
                )}

                {!loading && formData && (
                    <RequestForm
                        formData={formData}
                        submitText="Auftrag absenden"
                        loading={submitLoading}
                        error={error}
                        onSubmit={handleSubmit}
                    />
                )}
            </Space>
        </AppLayout>
    );
}
