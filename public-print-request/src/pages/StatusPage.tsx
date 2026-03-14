import {useEffect, useMemo, useState} from "react";
import {Link, useParams} from "react-router-dom";
import {Alert, Button, Divider, Space, Typography,} from "antd";
import axios from "axios";
import {AppLayout} from "../components/AppLayout";
import {PageCard} from "../components/PageCard";
import {RequestForm} from "../components/RequestForm";
import {ReadonlyFieldGrid} from "../components/ReadonlyFieldGrid";
import {StatusTag} from "../components/StatusTag";
import {getFormData, getPrintRequest, updatePrintRequest} from "../api/printRequest";
import type {PublicFormDataResponse, PublicPrintRequestPayload, PublicPrintRequestResponse,} from "../types/api";
import {EDITABLE_STATUSES} from "../utils/constants";
import {formatDate, formatDateTime} from "../utils/format";

export function StatusPage() {
    const {publicId} = useParams<{ publicId: string }>();

    const [request, setRequest] = useState<PublicPrintRequestResponse | null>(null);
    const [formData, setFormData] = useState<PublicFormDataResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

    const isEditable = useMemo(() => {
        if (!request) return false;
        return EDITABLE_STATUSES.includes(request.status);
    }, [request]);

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
                const [requestResult, formDataResult] = await Promise.all([
                    getPrintRequest(publicId),
                    getFormData(),
                ]);

                setRequest(requestResult);
                setFormData(formDataResult);
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    if (err.response?.status === 401) {
                        setError("Nicht angemeldet. Bitte zuerst Passwort eingeben.");
                    } else if (err.response?.status === 404) {
                        setError("Auftrag nicht gefunden.");
                    } else {
                        const detail =
                            typeof err.response?.data?.detail === "string"
                                ? err.response.data.detail
                                : null;
                        setError(detail ?? "Statusseite konnte nicht geladen werden.");
                    }
                } else {
                    setError("Statusseite konnte nicht geladen werden.");
                }
            } finally {
                setLoading(false);
            }
        };

        void run();
    }, [publicId]);

    const handleUpdate = async (payload: PublicPrintRequestPayload) => {
        if (!publicId) return;

        setSubmitLoading(true);
        setError(null);
        setSaveSuccess(null);

        try {
            const updated = await updatePrintRequest(publicId, payload);
            setRequest(updated);
            setSaveSuccess("Änderungen wurden gespeichert.");
            window.scrollTo({top: 0, behavior: "smooth"});
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const detail =
                    typeof err.response?.data?.detail === "string"
                        ? err.response.data.detail
                        : null;
                setError(detail ?? "Änderungen konnten nicht gespeichert werden.");
            } else {
                setError("Änderungen konnten nicht gespeichert werden.");
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <AppLayout
            title="Status eines 3D-Druckauftrags"
            subtitle="Hier kannst du den aktuellen Bearbeitungsstand sehen. Solange der Auftrag noch nicht fertig oder abgelehnt ist, können die öffentlichen Felder angepasst werden."
        >
            <Space direction="vertical" size={16} style={{width: "100%"}}>
                {loading && <Alert type="info" showIcon message="Auftrag wird geladen ..."/>}
                {error && (
                    <Alert
                        type="error"
                        showIcon
                        message={error}
                        action={
                            error.includes("Nicht angemeldet") ? (
                                <Link to="/">
                                    <Button type="primary" size="small">
                                        Zur Anmeldung
                                    </Button>
                                </Link>
                            ) : undefined
                        }
                    />
                )}
                {saveSuccess && <Alert type="success" showIcon message={saveSuccess}/>}

                {!loading && request && (
                    <>
                        <PageCard
                            title="Aktueller Status"
                            extra={<StatusTag status={request.status}/>}
                        >
                            <ReadonlyFieldGrid
                                entries={[
                                    {label: "Titel", value: request.title || "—"},
                                    {label: "Gewünschter Termin", value: formatDate(request.wanted_date)},
                                    {label: "Erstellt am", value: formatDateTime(request.created_at)},
                                    {label: "Zuletzt geändert", value: formatDateTime(request.updated_at)},
                                    {label: "Angenommen am", value: formatDateTime(request.accepted_at)},
                                    {label: "Abgelehnt am", value: formatDateTime(request.rejected_at)},
                                    {label: "Abgeschlossen am", value: formatDateTime(request.completed_at)},
                                    {label: "Ablehnungsgrund", value: request.rejection_reason || "—"},
                                ]}
                            />
                        </PageCard>

                        <PageCard title="Auftragsübersicht">
                            <ReadonlyFieldGrid
                                entries={[
                                    {label: "Auftraggeber", value: request.requester_name || "—"},
                                    {label: "Kontakt", value: request.requester_contact || "—"},
                                    {label: "Lieferwunsch", value: request.delivery_type || "—"},
                                    {label: "Lieferdetails", value: request.delivery_details || "—"},
                                    {label: "Beschreibung", value: request.description || "—"},
                                    {label: "MakerWorld Link", value: request.makerworld_url || "—"},
                                    {
                                        label: "Weitere Links",
                                        value: request.additional_links_text || "—",
                                    },
                                    {
                                        label: "Filamente",
                                        value:
                                            request.filaments.length > 0
                                                ? request.filaments.map((f) => f.display_name).join(", ")
                                                : "—",
                                    },
                                    {
                                        label: "Anderes Filament",
                                        value: request.other_filament_requested
                                            ? request.other_filament_description || "Ja"
                                            : "Nein",
                                    },
                                    {label: "Farbzuweisung", value: request.color_assignment || "—"},
                                    {label: "Priorität", value: request.priority || "—"},
                                    {label: "Kommentar", value: request.comment || "—"},
                                ]}
                            />
                        </PageCard>

                        <PageCard title="Änderungen durch Auftraggeber">
                            {isEditable && formData ? (
                                <>
                                    <Typography.Paragraph>
                                        Der Auftrag kann aktuell noch geändert werden.
                                    </Typography.Paragraph>
                                    <Divider/>
                                    <RequestForm
                                        formData={formData}
                                        initialValues={request}
                                        submitText="Änderungen speichern"
                                        loading={submitLoading}
                                        error={null}
                                        onSubmit={handleUpdate}
                                    />
                                </>
                            ) : (
                                <Alert
                                    type="info"
                                    showIcon
                                    message="Dieser Auftrag ist nicht mehr öffentlich bearbeitbar."
                                />
                            )}
                        </PageCard>
                    </>
                )}
            </Space>
        </AppLayout>
    );
}
