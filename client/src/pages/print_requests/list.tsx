import React from "react";
import { List, ShowButton, useTable } from "@refinedev/antd";
import { Space, Table, Typography } from "antd";
import type { PrintRequestRecord } from "../../types/printRequest";
import {
    formatDate,
    formatDateTime,
    renderPrintRequestStatus,
} from "../../utils/printRequest";

export const PrintRequestList: React.FC = () => {
    const { tableProps } = useTable<PrintRequestRecord>({
        resource: "print-request",
        syncWithLocation: true,
    });

    return (
        <List title="Druckaufträge">
            <Table {...tableProps} rowKey="id">
                <Table.Column<PrintRequestRecord>
                    dataIndex="created_at"
                    title="Erstellt"
                    render={(value) => formatDateTime(value)}
                    sorter
                />

                <Table.Column<PrintRequestRecord>
                    dataIndex="title"
                    title="Titel"
                    render={(value) => <Typography.Text strong>{value}</Typography.Text>}
                />

                <Table.Column<PrintRequestRecord>
                    dataIndex="requester_name"
                    title="Auftraggeber"
                />

                <Table.Column<PrintRequestRecord>
                    dataIndex="delivery_type"
                    title="Lieferwunsch"
                    render={(value) => value || "—"}
                />

                <Table.Column<PrintRequestRecord>
                    dataIndex="wanted_date"
                    title="Termin"
                    render={(value) => formatDate(value)}
                />

                <Table.Column<PrintRequestRecord>
                    dataIndex="priority"
                    title="Priorität"
                    render={(value) => value || "—"}
                />

                <Table.Column<PrintRequestRecord>
                    dataIndex="status"
                    title="Status"
                    render={(value) => renderPrintRequestStatus(value)}
                />

                <Table.Column<PrintRequestRecord>
                    title="Aktionen"
                    render={(_, record) => (
                        <Space>
                            <ShowButton hideText recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
