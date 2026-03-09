import {useEffect, useMemo, useState} from "react";
import {Button, Card, Select, Space, Table, Tag, Typography} from "antd";
import {getAPIURL} from "../../utils/url";

interface PrintRequestItem {
    id: number;
    title: string;
    description: string;
    requester_name?: string;
    due_date?: string;
    status: string;
    filament_labels: string[];
    color_assignment?: string;
    comment?: string;
    makerworld_link?: string;
    delivery_notes?: string;
    links: {url: string; label?: string}[];
}

const statuses = [
    {label: "Angefragt", value: "requested"},
    {label: "In Klärung", value: "in_clarification"},
    {label: "Offen", value: "open"},
    {label: "In Bearbeitung", value: "in_progress"},
    {label: "Hergestellt", value: "manufactured"},
    {label: "Abgeschlossen", value: "completed"},
    {label: "Abgelehnt", value: "rejected"},
];

export default function PrintRequestsPage() {
    const [data, setData] = useState<PrintRequestItem[]>([]);
    const [loading, setLoading] = useState(false);

    const statusLabel = useMemo(() => Object.fromEntries(statuses.map((s) => [s.value, s.label])), []);

    const load = async () => {
        setLoading(true);
        const res = await fetch(`${getAPIURL()}/v1/print-request`);
        const items = await res.json();
        setData(items);
        setLoading(false);
    };

    useEffect(() => {
        load().catch(console.error);
    }, []);

    const updateStatus = async (id: number, status: string) => {
        await fetch(`${getAPIURL()}/v1/print-request/${id}/status`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({status}),
        });
        await load();
    };

    return (
        <Card title="Aufträge" extra={<Button onClick={() => load()}>Aktualisieren</Button>}>
            <Table
                loading={loading}
                rowKey="id"
                dataSource={data}
                expandable={{
                    expandedRowRender: (row) => (
                        <Space direction="vertical">
                            <Typography.Text>{row.description}</Typography.Text>
                            {row.filament_labels.length > 0 && <Typography.Text>Filamente: {row.filament_labels.join(", ")}</Typography.Text>}
                            {row.color_assignment && <Typography.Text>Farbzuweisung: {row.color_assignment}</Typography.Text>}
                            {row.comment && <Typography.Text>Kommentar: {row.comment}</Typography.Text>}
                        </Space>
                    ),
                }}
                columns={[
                    {title: "ID", dataIndex: "id", width: 80},
                    {title: "Titel", dataIndex: "title"},
                    {title: "Auftraggeber", dataIndex: "requester_name"},
                    {
                        title: "Status",
                        dataIndex: "status",
                        render: (status: string) => <Tag>{statusLabel[status] ?? status}</Tag>,
                    },
                    {title: "Liefertermin", dataIndex: "due_date"},
                    {
                        title: "Aktionen",
                        render: (_, row) => (
                            <Select
                                value={row.status}
                                style={{minWidth: 170}}
                                options={statuses}
                                onChange={(value) => updateStatus(row.id, value).catch(console.error)}
                            />
                        ),
                    },
                ]}
            />
        </Card>
    );
}
