import React, {useMemo, useState} from "react";
import {List, ShowButton, useTable} from "@refinedev/antd";
import {Space, Table, Typography} from "antd";
import type {PrintRequestRecord, PrintRequestStatus} from "../../types/printRequest";
import {PRINT_REQUEST_STATUSES} from "../../types/printRequest";
import {formatDate, formatDateTime, renderPrintRequestStatus,} from "../../utils/printRequest";

export const PrintRequestList: React.FC = () => {
    const [visibleStatuses, setVisibleStatuses] = useState<PrintRequestStatus[]>(PRINT_REQUEST_STATUSES);

    const {tableProps} = useTable<PrintRequestRecord>({
        resource: "print-request",
        syncWithLocation: true,
        pagination: {
            mode: "server",
            current: 1,
            pageSize: 20,
        },
    });

    const dataSource = useMemo(() => {
        const records = tableProps.dataSource || [];
        return records.filter((record) => visibleStatuses.includes(record.status));
    }, [tableProps.dataSource, visibleStatuses]);

    if (tableProps.pagination) {
        tableProps.pagination.showSizeChanger = true;
    }

    const originalOnChange = tableProps.onChange;
    tableProps.onChange = (pagination, filters, sorter, extra) => {
        const statusFilter = filters.status;
        if (statusFilter !== undefined) {
            if (Array.isArray(statusFilter) && statusFilter.length > 0) {
                setVisibleStatuses(statusFilter as PrintRequestStatus[]);
            } else {
                setVisibleStatuses(PRINT_REQUEST_STATUSES);
            }
        }

        const nextFilters = {...filters};
        delete nextFilters.status;
        originalOnChange?.(pagination, nextFilters, sorter, extra);
    };

    return (
        <List title="Druckaufträge">
            <Table {...tableProps} rowKey="id" dataSource={dataSource}>
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
                    sorter={(a, b) => a.status.localeCompare(b.status, "de")}
                    filters={PRINT_REQUEST_STATUSES.map((status) => ({
                        text: status,
                        value: status,
                    }))}
                    filteredValue={visibleStatuses}
                    render={(value) => renderPrintRequestStatus(value)}
                />

                <Table.Column<PrintRequestRecord>
                    title="Aktionen"
                    render={(_, record) => (
                        <Space>
                            <ShowButton hideText recordItemId={record.id}/>
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
