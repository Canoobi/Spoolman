import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {Alert, Button, Form, Input, Typography} from "antd";
import {LockOutlined} from "@ant-design/icons";
import {AppLayout} from "../components/AppLayout.tsx";
import {PageCard} from "../components/PageCard.tsx";
import {login} from "../api/auth.ts";
import axios from "axios";

type LoginValues = {
    password: string;
};

export function LoginPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onFinish = async (values: LoginValues) => {
        setLoading(true);
        setError(null);

        try {
            await login(values.password);
            navigate("/request");
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
                    Diese Seite ist nicht öffentlich frei nutzbar. Der Zugriff erfolgt über ein gemeinsames Passwort.
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
