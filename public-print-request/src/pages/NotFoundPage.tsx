import { Button, Result } from "antd";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";

export function NotFoundPage() {
    return (
        <AppLayout title="Seite nicht gefunden">
            <Result
                status="404"
                title="404"
                subTitle="Die angeforderte Seite existiert nicht."
                extra={
                    <Link to="/">
                        <Button type="primary">Zur Startseite</Button>
                    </Link>
                }
            />
        </AppLayout>
    );
}
