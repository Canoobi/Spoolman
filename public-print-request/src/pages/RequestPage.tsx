import { useEffect, useState } from "react";
import { Alert, Button, Space, Typography } from "antd";
import { Link } from "react-router-dom";
import axios from "axios";
import { AppLayout } from "../components/AppLayout";
import { PageCard } from "../components/PageCard";
import { RequestForm } from "../components/RequestForm";
import { getFormData, createPrintRequest } from "../api/printRequest";
import type {
    PublicFormDataResponse,
    PublicPrintRequestPayload,
    PublicPrintRequestResponse,
} from "../types/api";
import { buildStatusUrl } from "../utils/format";

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
            window.scrollTo({ top: 0, behavior: "smooth" });
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
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {createdRequest && (
                    <PageCard title="Auftrag erfolgreich erstellt">
                        <Typography.Paragraph>
                            Dein Auftrag wurde gespeichert.
                        </Typography.Paragraph>

                        <div className="success-link-box">
                            <Typography.Text strong>Statuslink:</Typography.Text>
                            <div style={{ marginTop: 8, wordBreak: "break-all" }}>
                                <a
                                    href={buildStatusUrl(createdRequest.public_id)}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {buildStatusUrl(createdRequest.public_id)}
                                </a>
                            </div>
                        </div>

                        <div style={{ marginTop: 16 }}>
                            <Link to={`/status/${createdRequest.public_id}`}>
                                <Button type="primary">Zur Statusseite</Button>
                            </Link>
                        </div>
                    </PageCard>
                )}

                {loading && <Alert type="info" showIcon message="Formulardaten werden geladen ..." />}

                {!loading && error && !formData && (
                    <Alert type="error" showIcon message={error} />
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
