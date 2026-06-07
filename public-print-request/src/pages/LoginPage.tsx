import {useState} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {Alert, Button, Form, Input, Typography} from "antd";
import {LockOutlined} from "@ant-design/icons";
import {AppLayout} from "../components/AppLayout.tsx";
import {PageCard} from "../components/PageCard.tsx";
import {login} from "../api/auth.ts";
import {getPrintRequest} from "../api/printRequest.ts";
import axios from "axios";

type LoginValues = {
    password: string;
};

const DEFAULT_REDIRECT_PATH = "/request";
const STATUS_REF_PATTERN = /^\/?request\/status\/([^/]+)(\/invoice)?$/;
const PUBLIC_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

function parseRedirectRef(ref: string | null): { publicId: string; targetPath: string } | null {
    const trimmedRef = ref?.trim();
    if (!trimmedRef) return null;

    const pathOnlyRef = trimmedRef.split(/[?#]/, 1)[0];
    const statusMatch = pathOnlyRef.match(STATUS_REF_PATTERN);
    if (statusMatch) {
        const publicId = statusMatch[1];
        return {
            publicId,
            targetPath: `/request/status/${publicId}${statusMatch[2] ?? ""}`,
        };
    }

    if (!PUBLIC_ID_PATTERN.test(pathOnlyRef)) return null;

    return {
        publicId: pathOnlyRef,
        targetPath: `/request/status/${pathOnlyRef}`,
    };
}

export function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onFinish = async (values: LoginValues) => {
        setLoading(true);
        setError(null);

        try {
            await login(values.password);
            const redirectRef = parseRedirectRef(searchParams.get("ref"));

            if (redirectRef) {
                try {
                    await getPrintRequest(redirectRef.publicId);
                    navigate(redirectRef.targetPath, {replace: true});
                    return;
                } catch {
                    navigate(DEFAULT_REDIRECT_PATH, {replace: true});
                    return;
                }
            }

            navigate(DEFAULT_REDIRECT_PATH, {replace: true});
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                setError("Passwort falsch oder Zugriff nicht erlaubt.");
            } else {
                setError("Anmeldung fehlgeschlagen. Backend nicht erreichbar oder Fehler in der Konfiguration.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout
            title="3D-Druckauftrag"
            subtitle="Bitte Passwort eingeben, um Formular und Statusseiten zu öffnen."
        >
            <PageCard title="Zugriffsschutz">
                <Typography.Paragraph>
                    Diese Seite ist nicht öffentlich frei nutzbar. Der Zugriff erfolgt ausschließlich über ein Passwort.
                </Typography.Paragraph>

                {error && (
                    <Alert
                        type="error"
                        showIcon
                        message={error}
                        style={{marginBottom: 16}}
                    />
                )}

                <Form<LoginValues> layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        label="Passwort"
                        name="password"
                        rules={[{required: true, message: "Bitte Passwort eingeben."}]}
                    >
                        <Input.Password
                            prefix={<LockOutlined/>}
                            placeholder="Passwort"
                            autoFocus
                        />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" loading={loading}>
                        Weiter
                    </Button>
                </Form>
            </PageCard>
        </AppLayout>
    );
}
