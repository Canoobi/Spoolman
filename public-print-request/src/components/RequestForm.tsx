import { useMemo } from "react";
import dayjs from "dayjs";
import {
    Alert,
    Button,
    Card,
    Checkbox,
    Col,
    DatePicker,
    Form,
    Input,
    Row,
    Select,
    Space,
    Typography,
} from "antd";
import type {
    PublicFormDataResponse,
    PublicPrintRequestPayload,
    PublicPrintRequestResponse,
} from "../types/api";

const { TextArea } = Input;

type Props = {
    formData: PublicFormDataResponse;
    initialValues?: PublicPrintRequestResponse | null;
    submitText: string;
    loading?: boolean;
    error?: string | null;
    onSubmit: (payload: PublicPrintRequestPayload) => Promise<void> | void;
};

type FormValues = {
    requester_name: string;
    requester_contact?: string;
    delivery_type?: string;
    delivery_details?: string;
    title: string;
    description: string;
    makerworld_url?: string;
    additional_links_text?: string;
    wanted_date?: dayjs.Dayjs;
    priority?: string;
    other_filament_requested: boolean;
    other_filament_description?: string;
    color_assignment?: string;
    comment?: string;
    filament_ids: number[];
};

export function RequestForm({
                                formData,
                                initialValues,
                                submitText,
                                loading,
                                error,
                                onSubmit,
                            }: Props) {
    const [form] = Form.useForm<FormValues>();

    const mappedInitialValues = useMemo<FormValues | undefined>(() => {
        if (!initialValues) return undefined;

        return {
            requester_name: initialValues.requester_name,
            requester_contact: initialValues.requester_contact,
            delivery_type: initialValues.delivery_type,
            delivery_details: initialValues.delivery_details,
            title: initialValues.title,
            description: initialValues.description,
            makerworld_url: initialValues.makerworld_url,
            additional_links_text: initialValues.additional_links_text,
            wanted_date: initialValues.wanted_date
                ? dayjs(initialValues.wanted_date)
                : undefined,
            priority: initialValues.priority,
            other_filament_requested: initialValues.other_filament_requested,
            other_filament_description: initialValues.other_filament_description,
            color_assignment: initialValues.color_assignment,
            comment: initialValues.comment,
            filament_ids: initialValues.filaments.map((f) => f.id),
        };
    }, [initialValues]);

    const otherFilamentRequested = Form.useWatch("other_filament_requested", form);
    const selectedFilaments = Form.useWatch("filament_ids", form) ?? [];

    const handleFinish = async (values: FormValues) => {
        const payload: PublicPrintRequestPayload = {
            requester_name: values.requester_name.trim(),
            requester_contact: values.requester_contact?.trim() || undefined,
            delivery_type: values.delivery_type as PublicPrintRequestPayload["delivery_type"],
            delivery_details: values.delivery_details?.trim() || undefined,
            title: values.title.trim(),
            description: values.description.trim(),
            makerworld_url: values.makerworld_url?.trim() || undefined,
            additional_links_text: values.additional_links_text?.trim() || undefined,
            wanted_date: values.wanted_date ? values.wanted_date.startOf("day").format("YYYY-MM-DDTHH:mm:ss") : null,
            priority: values.priority as PublicPrintRequestPayload["priority"],
            other_filament_requested: Boolean(values.other_filament_requested),
            other_filament_description:
                values.other_filament_description?.trim() || undefined,
            color_assignment: values.color_assignment?.trim() || undefined,
            comment: values.comment?.trim() || undefined,
            filament_ids: values.filament_ids ?? [],
        };

        await onSubmit(payload);
    };

    return (
        <Form<FormValues>
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={mappedInitialValues ?? { other_filament_requested: false, filament_ids: [] }}
        >
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {error && <Alert type="error" message={error} showIcon />}

                <Card bordered={false}>
                    <Typography.Title level={4} className="section-title">
                        Auftraggeber
                    </Typography.Title>

                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="requester_name"
                                label="Name des Auftraggebers"
                                rules={[{ required: true, message: "Bitte Namen eingeben." }]}
                            >
                                <Input placeholder="Max Mustermann" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                name="requester_contact"
                                label="Kontaktinformation"
                                tooltip="Optional, aber sinnvoll."
                            >
                                <Input placeholder="E-Mail, Telefon, Discord, ... " />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item name="delivery_type" label="Lieferwunsch">
                                <Select
                                    allowClear
                                    options={formData.delivery_types.map((value) => ({
                                        label: value,
                                        value,
                                    }))}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item name="delivery_details" label="Lieferbeschreibung">
                                <Input placeholder="z. B. Versandadresse oder Abholhinweis" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                <Card bordered={false}>
                    <Typography.Title level={4} className="section-title">
                        Auftrag
                    </Typography.Title>

                    <Form.Item
                        name="title"
                        label="Titel des Auftrags"
                        rules={[{ required: true, message: "Bitte Titel eingeben." }]}
                    >
                        <Input placeholder="z. B. Halterung für Sensorboard" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Beschreibung des Auftrags"
                        rules={[{ required: true, message: "Bitte Beschreibung eingeben." }]}
                        extra="Beschreibe Zweck, mechanische Anforderungen, Passungen und besondere Eigenschaften."
                    >
                        <TextArea rows={6} />
                    </Form.Item>
                </Card>

                <Card bordered={false}>
                    <Typography.Title level={4} className="section-title">
                        Links
                    </Typography.Title>

                    <Form.Item name="makerworld_url" label="MakerWorld Link">
                        <Input placeholder="https://makerworld.com/..." />
                    </Form.Item>

                    <Form.Item
                        name="additional_links_text"
                        label="Weitere Links"
                        extra="Mehrere Links bitte jeweils in eine neue Zeile schreiben."
                    >
                        <TextArea
                            rows={4}
                            placeholder={`https://printables.com/...\nhttps://github.com/...`}
                        />
                    </Form.Item>
                </Card>

                <Card bordered={false}>
                    <Typography.Title level={4} className="section-title">
                        Filamente
                    </Typography.Title>

                    <Form.Item
                        name="filament_ids"
                        label="Vorhandene Filamente"
                        rules={[
                            {
                                validator: async (_, value: number[] | undefined) => {
                                    const checked = form.getFieldValue("other_filament_requested");
                                    if ((value && value.length > 0) || checked) return;
                                    throw new Error(
                                        "Bitte mindestens ein Filament wählen oder 'Anderes Filament' aktivieren."
                                    );
                                },
                            },
                        ]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Filamente auswählen"
                            optionFilterProp="label"
                            options={formData.filaments.map((filament) => ({
                                label: filament.display_name,
                                value: filament.id,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item name="other_filament_requested" valuePropName="checked">
                        <Checkbox>Anderes Filament</Checkbox>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, curr) =>
                            prev.other_filament_requested !== curr.other_filament_requested
                        }
                    >
                        {() =>
                            form.getFieldValue("other_filament_requested") ? (
                                <Form.Item
                                    name="other_filament_description"
                                    label="Beschreibung anderes Filament"
                                    rules={[
                                        {
                                            required: true,
                                            message: "Bitte gewünschtes Filament beschreiben.",
                                        },
                                    ]}
                                >
                                    <TextArea
                                        rows={3}
                                        placeholder="z. B. PETG transparent oder TPU in Schwarz"
                                    />
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>

                    {!otherFilamentRequested && selectedFilaments.length === 0 && (
                        <Alert
                            type="warning"
                            showIcon
                            message="Es muss mindestens ein Filament gewählt werden oder 'Anderes Filament' aktiviert sein."
                        />
                    )}
                </Card>

                <Card bordered={false}>
                    <Typography.Title level={4} className="section-title">
                        Farbzuweisung
                    </Typography.Title>

                    <Form.Item name="color_assignment" label="Farbzuweisung">
                        <TextArea
                            rows={3}
                            placeholder={`Gehäuse: Schwarz\nKnöpfe: Rot\nBeschriftung: Weiß`}
                        />
                    </Form.Item>
                </Card>

                <Card bordered={false}>
                    <Typography.Title level={4} className="section-title">
                        Termin und Priorität
                    </Typography.Title>

                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item name="wanted_date" label="Gewünschter Termin">
                                <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item name="priority" label="Priorität">
                                <Select
                                    allowClear
                                    options={formData.priorities.map((value) => ({
                                        label: value,
                                        value,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                <Card bordered={false}>
                    <Typography.Title level={4} className="section-title">
                        Kommentar
                    </Typography.Title>

                    <Form.Item name="comment" label="Zusätzliche Informationen">
                        <TextArea rows={4} />
                    </Form.Item>
                </Card>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button type="primary" htmlType="submit" loading={loading} size="large">
                        {submitText}
                    </Button>
                </div>
            </Space>
        </Form>
    );
}
