import React, { useMemo, useState } from "react";
import {
    Show,
    useForm,
} from "@refinedev/antd";
import { useShow, HttpError } from "@refinedev/core";
import { useCustomMutation, useInvalidate } from "@refinedev/core";
import {
    Alert,
    Button,
    Card,
    Descriptions,
    Form,
    Input,
    message,
    Modal,
    Select,
    Space,
    Typography,
} from "antd";
import type {
    PrintRequestInternalPatch,
    PrintRequestRecord,
} from "../../types/printRequest";
import { PRINT_REQUEST_STATUSES } from "../../types/printRequest";
import {
    formatDate,
    formatDateTime,
    renderMultilineText,
    renderPrintRequestStatus,
} from "../../utils/printRequest";

const { TextArea } = Input;

export const PrintRequestShow: React.FC = () => {
    const { queryResult } = useShow<PrintRequestRecord>({
        resource: "print-request",
    });

    const record = queryResult?.data?.data;
    const invalidate = useInvalidate();

    const { mutate: customMutate, isLoading: customLoading } = useCustomMutation();

    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    const {
        formProps,
        saveButtonProps,
        form,
    } = useForm<PrintRequestRecord, HttpError, PrintRequestInternalPatch>({
        resource: "print-request",
        id: record?.id,
        action: "edit",
        redirect: false,
        queryOptions: {
            enabled: !!record?.id,
        },
        onMutationSuccess: async () => {
            message.success("Änderungen gespeichert.");
            await queryResult?.refetch();
            await invalidate({
                resource: "print-request",
                invalidates: ["list", "detail"],
            });
        },
        successNotification: () => false,
    });

    const filamentDisplay = useMemo(() => {
        if (!record?.filaments?.length) return "—";
        return record.filaments.map((f) => f.display_name).join(", ");
    }, [record]);

    const doAccept = () => {
        if (!record) return;

        customMutate(
            {
                url: `/api/v1/print-request/${record.id}/accept`,
                method: "post",
                values: {},
            },
            {
                onSuccess: async () => {
                    message.success("Auftrag angenommen.");
                    await queryResult?.refetch();
                    await invalidate({
                        resource: "print-request",
                        invalidates: ["list", "detail"],
                    });
                },
                onError: () => {
                    message.error("Annehmen fehlgeschlagen.");
                },
            }
        );
    };

    const doReject = () => {
        if (!record) return;

        customMutate(
            {
                url: `/api/v1/print-request/${record.id}/reject`,
                method: "post",
                values: {
                    rejection_reason: rejectionReason?.trim() || null,
                },
            },
            {
                onSuccess: async () => {
                    message.success("Auftrag abgelehnt.");
                    setRejectOpen(false);
                    setRejectionReason("");
                    await queryResult?.refetch();
                    await invalidate({
                        resource: "print-request",
                        invalidates: ["list", "detail"],
                    });
                },
                onError: () => {
                    message.error("Ablehnen fehlgeschlagen.");
                },
            }
        );
    };

    return (
        <>
            <Show
                isLoading={queryResult?.isLoading}
                title="Druckauftrag"
                headerButtons={() => (
                    <Space>
                        <Button
                            onClick={doAccept}
                            loading={customLoading}
                            type="primary"
                        >
                            Annehmen
                        </Button>

                        <Button
                            danger
                            onClick={() => setRejectOpen(true)}
                            loading={customLoading}
                        >
                            Ablehnen
                        </Button>
                    </Space>
                )}
            >
                {!record ? (
                    <Alert type="info" showIcon message="Keine Daten geladen." />
                ) : (
                    <Space direction="vertical" size="large" style={{ width: "100%" }}>
                        <Card title="Status">
                            <Descriptions bordered column={1}>
                                <Descriptions.Item label="Status">
                                    {renderPrintRequestStatus(record.status)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Erstellt am">
                                    {formatDateTime(record.created_at)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Zuletzt geändert">
                                    {formatDateTime(record.updated_at)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Angenommen am">
                                    {formatDateTime(record.accepted_at)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Abgelehnt am">
                                    {formatDateTime(record.rejected_at)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Abgeschlossen am">
                                    {formatDateTime(record.completed_at)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Ablehnungsgrund">
                                    {renderMultilineText(record.rejection_reason)}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <Card title="Auftraggeber">
                            <Descriptions bordered column={1}>
                                <Descriptions.Item label="Name">
                                    {record.requester_name}
                                </Descriptions.Item>
                                <Descriptions.Item label="Kontakt">
                                    {record.requester_contact || "—"}
                                </Descriptions.Item>
                                <Descriptions.Item label="Lieferwunsch">
                                    {record.delivery_type || "—"}
                                </Descriptions.Item>
                                <Descriptions.Item label="Lieferdetails">
                                    {renderMultilineText(record.delivery_details)}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <Card title="Auftrag">
                            <Descriptions bordered column={1}>
                                <Descriptions.Item label="Titel">
                                    <Typography.Text strong>{record.title}</Typography.Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Beschreibung">
                                    {renderMultilineText(record.description)}
                                </Descriptions.Item>
                                <Descriptions.Item label="MakerWorld Link">
                                    {record.makerworld_url ? (
                                        <a
                                            href={record.makerworld_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {record.makerworld_url}
                                        </a>
                                    ) : (
                                        "—"
                                    )}
                                </Descriptions.Item>
                                <Descriptions.Item label="Weitere Links">
                                    {renderMultilineText(record.additional_links_text)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Filamente">
                                    {filamentDisplay}
                                </Descriptions.Item>
                                <Descriptions.Item label="Anderes Filament gewünscht">
                                    {record.other_filament_requested ? "Ja" : "Nein"}
                                </Descriptions.Item>
                                <Descriptions.Item label="Beschreibung anderes Filament">
                                    {renderMultilineText(record.other_filament_description)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Farbzuweisung">
                                    {renderMultilineText(record.color_assignment)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Kommentar">
                                    {renderMultilineText(record.comment)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Gewünschter Termin">
                                    {formatDate(record.wanted_date)}
                                </Descriptions.Item>
                                <Descriptions.Item label="Priorität">
                                    {record.priority || "—"}
                                </Descriptions.Item>
                                <Descriptions.Item label="Public ID">
                                    {record.public_id}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <Card title="Interne Bearbeitung">
                            <Form
                                {...formProps}
                                layout="vertical"
                                initialValues={{
                                    status: record.status,
                                    internal_notes: record.internal_notes,
                                    rejection_reason: record.rejection_reason,
                                }}
                            >
                                <Form.Item label="Status" name="status">
                                    <Select
                                        options={PRINT_REQUEST_STATUSES.map((status) => ({
                                            label: status,
                                            value: status,
                                        }))}
                                    />
                                </Form.Item>

                                <Form.Item label="Interne Notizen" name="internal_notes">
                                    <TextArea rows={5} />
                                </Form.Item>

                                <Form.Item label="Ablehnungsgrund" name="rejection_reason">
                                    <TextArea rows={4} />
                                </Form.Item>

                                <Button
                                    type="primary"
                                    {...saveButtonProps}
                                    onClick={() => form?.submit()}
                                >
                                    Änderungen speichern
                                </Button>
                            </Form>
                        </Card>
                    </Space>
                )}
            </Show>

            <Modal
                title="Auftrag ablehnen"
                open={rejectOpen}
                onCancel={() => setRejectOpen(false)}
                onOk={doReject}
                confirmLoading={customLoading}
            >
                <Typography.Paragraph>
                    Optionaler Ablehnungsgrund:
                </Typography.Paragraph>
                <TextArea
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Optionaler Ablehnungsgrund"
                />
            </Modal>
        </>
    );
};
