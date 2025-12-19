import {DeleteOutlined, EditOutlined, PlusOutlined} from "@ant-design/icons";
import {List, useSelect, useTable} from "@refinedev/antd";
import {
    CrudFilter,
    CrudFilters,
    IResourceComponentsProps,
    useCreate,
    useDelete,
    useInvalidate,
    useUpdate,
    useTranslate
} from "@refinedev/core";
import {
    Alert,
    Button,
    Card,
    Col,
    Descriptions,
    Divider,
    Form,
    Input,
    InputNumber,
    Popconfirm,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Typography,
} from "antd";
import {DefaultOptionType} from "antd/es/select";
import dayjs from "dayjs";
import {useEffect, useMemo, useRef, useState} from "react";
import {IFilament} from "../filaments/model";
import {IPrinter} from "../printers/model";
import {ICostCalculation} from "./model";
import {useGetSettings} from "../../utils/querySettings";
import {removeUndefined} from "../../utils/filtering";
import {getCurrencySymbol, useCurrency, useCurrencyFormatter} from "../../utils/settings";

const {Title, Paragraph} = Typography;

interface Breakdown {
    material: number;
    energy: number;
    depreciation: number;
    labor: number;
    consumables: number;
    base: number;
    uplifted: number;
    final: number;
}

export const CostingPage: React.FC<IResourceComponentsProps> = () => {
    const t = useTranslate();
    const currency = useCurrency();
    const settings = useGetSettings();
    const invalidate = useInvalidate();
    const currencySymbol = useMemo(() => getCurrencySymbol(undefined, currency), [currency]);
    const formatter = useCurrencyFormatter();

    const [form] = Form.useForm();
    const [message, setMessage] = useState<string | null>(null);
    const [editingCalculation, setEditingCalculation] = useState<ICostCalculation | null>(null);
    const [isFinalPriceManuallySet, setIsFinalPriceManuallySet] = useState(false);
    const isUpdatingFinalPriceRef = useRef(false);
    const [breakdown, setBreakdown] = useState<Breakdown>({
        material: 0,
        energy: 0,
        depreciation: 0,
        labor: 0,
        consumables: 0,
        base: 0,
        uplifted: 0,
        final: 0,
    });

    const defaultEnergy = useMemo(() => Number(JSON.parse(settings.data?.energy_cost_per_kwh.value ?? "0")), [settings]);
    const defaultLabor = useMemo(() => Number(JSON.parse(settings.data?.labor_cost_per_hour.value ?? "0")), [settings]);
    const defaultFailure = useMemo(() => Number(JSON.parse(settings.data?.failure_rate.value ?? "0")), [settings]);
    const defaultMarkup = useMemo(() => Number(JSON.parse(settings.data?.markup_default_rate.value ?? "0")), [settings]);
    const defaultConsumables = useMemo(() => {
        try {
            const raw = settings.data?.consumables_default.value;
            const parsed = raw ? JSON.parse(raw) : [];
            if (Array.isArray(parsed)) {
                return parsed
                    .map((val) => {
                        if (typeof val === "number") {
                            return val;
                        }
                        if (typeof val === "object" && val !== null && "cost" in val) {
                            const cost = (val as { cost?: number }).cost;
                            return typeof cost === "number" ? cost : 0;
                        }
                        return 0;
                    })
                    .reduce((sum, v) => sum + v, 0);
            }
            return 0;
        } catch (e) {
            console.warn("Failed to parse consumables defaults", e);
            return 0;
        }
    }, [settings]);

    const {selectProps: printerSelectProps, queryResult: printerQuery} = useSelect<IPrinter>({
        resource: "printer",
        optionLabel: "name",
        optionValue: "id",
        pagination: {
            pageSize: 200,
        },
    });
    const {selectProps: filamentSelectProps, queryResult: filamentQuery} = useSelect<IFilament>({
        resource: "filament",
        optionLabel: "name",
        optionValue: "id",
        pagination: {
            pageSize: 200,
        },
    });

    const printers = (printerQuery.data?.data as IPrinter[] | undefined) ?? [];
    const filaments = (filamentQuery.data?.data as IFilament[] | undefined) ?? [];
    const filamentTypeOptions = useMemo<(DefaultOptionType & { filamentIds: number[]; averagePrice?: number })[]>(
        () => {
            const types = new Map<
                string,
                {
                    label: string;
                    value: number;
                    filamentIds: number[];
                    totalPrice: number;
                    priceCount: number;
                    averagePrice?: number;
                }
            >();

            filaments.forEach((filament) => {
                const vendorLabel = filament.vendor?.name ?? "Unknown vendor";
                const materialLabel = (filament.material ?? "Unknown material").trim() || "Unknown material";
                const key = `${vendorLabel.toLowerCase()}|${materialLabel.toLowerCase()}`;
                const label = `${vendorLabel} - ${materialLabel}`;
                const price = typeof filament.price === "number" ? filament.price : undefined;

                const existing = types.get(key);
                if (existing) {
                    existing.filamentIds.push(filament.id);
                    if (price !== undefined) {
                        existing.totalPrice += price;
                        existing.priceCount += 1;
                    }
                    return;
                }

                types.set(key, {
                    label,
                    value: filament.id,
                    filamentIds: [filament.id],
                    totalPrice: price ?? 0,
                    priceCount: price !== undefined ? 1 : 0,
                });
            });

            const options = Array.from(types.values()).map((type) => ({
                label: type.label,
                value: type.value,
                filamentIds: type.filamentIds,
                averagePrice: type.priceCount > 0 ? type.totalPrice / type.priceCount : undefined,
            }));

            return options.sort((a, b) => a.label.localeCompare(b.label, undefined, {sensitivity: "base"}));
        },
        [filaments]
    );
    const filamentGroupById = useMemo(() => {
        const map = new Map<number, { averagePrice?: number }>();
        filamentTypeOptions.forEach((type) => {
            type.filamentIds.forEach((id) => {
                map.set(id, {averagePrice: type.averagePrice});
            });
        });
        return map;
    }, [filamentTypeOptions]);

    const {mutate: createCalculation, isLoading: isSaving} = useCreate<ICostCalculation>();
    const {mutate: updateCalculation, isLoading: isUpdating} = useUpdate<ICostCalculation>();
    const {mutate: deleteCalculation, isLoading: isDeleting} = useDelete<ICostCalculation>();

    const recompute = () => {
        const values = form.getFieldsValue(true);
        const printer = printers.find((p) => p.id === values.printer_id);
        const filament = filaments.find((f) => f.id === values.filament_id);
        const filamentGroup = filamentGroupById.get(values.filament_id);

        const printHours = Number(values.print_time_hours ?? 0);
        const laborHours = Number(values.labor_time_hours ?? 0);
        const weight = Number(values.filament_weight_g ?? 0);
        const energyRate = values.energy_cost_per_kwh ?? defaultEnergy;
        const laborRate = values.labor_cost_per_hour ?? defaultLabor;
        const consumablesCost = values.consumables_cost ?? defaultConsumables;
        const failureRate = values.failure_rate ?? defaultFailure;
        const markupRate = values.markup_rate ?? defaultMarkup;

        const materialPrice = filamentGroup?.averagePrice ?? filament?.price ?? 0;
        const materialCost =
            filament && filament.weight
                ? (weight / filament.weight) * materialPrice
                : 0;
        const energyCost = ((printer?.power_watts ?? 0) / 1000) * printHours * energyRate;
        const depreciationCost = (printer?.depreciation_cost_per_hour ?? 0) * printHours;
        const laborCost = laborHours * laborRate;
        const base = materialCost + energyCost + depreciationCost + laborCost + consumablesCost;
        const uplifted = base * (1 + failureRate) * (1 + markupRate);
        const shouldUpdateFinalPrice = !isFinalPriceManuallySet || values.final_price === undefined;
        const computedFinalPrice = uplifted;
        const finalPrice = shouldUpdateFinalPrice ? computedFinalPrice : values.final_price ?? computedFinalPrice;

        if (shouldUpdateFinalPrice && values.final_price !== computedFinalPrice) {
            isUpdatingFinalPriceRef.current = true;
            form.setFieldsValue({final_price: computedFinalPrice});
            isUpdatingFinalPriceRef.current = false;
        }
        setBreakdown({
            material: materialCost,
            energy: energyCost,
            depreciation: depreciationCost,
            labor: laborCost,
            consumables: consumablesCost,
            base,
            uplifted,
            final: finalPrice,
        });
    };

    useEffect(() => {
        if (settings.data) {
            form.setFieldsValue({
                energy_cost_per_kwh: defaultEnergy,
                labor_cost_per_hour: defaultLabor,
                failure_rate: defaultFailure,
                markup_rate: defaultMarkup,
                consumables_cost: defaultConsumables,
            });
            recompute();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings.data]);

    useEffect(() => {
        recompute();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [printers.length, filaments.length]);

    const handleSubmit = async () => {
        const values = await form.validateFields();
        recompute();
        const payload = {
            printer_id: values.printer_id,
            filament_id: values.filament_id,
            print_time_hours: values.print_time_hours,
            labor_time_hours: values.labor_time_hours,
            filament_weight_g: values.filament_weight_g,
            material_cost: breakdown.material,
            energy_cost: breakdown.energy,
            depreciation_cost: breakdown.depreciation,
            labor_cost: breakdown.labor,
            consumables_cost: breakdown.consumables,
            failure_rate: values.failure_rate ?? defaultFailure,
            markup_rate: values.markup_rate ?? defaultMarkup,
            base_price: breakdown.base,
            uplifted_price: breakdown.uplifted,
            final_price: breakdown.final,
            currency: currency,
            notes: values.notes,
        };

        if (editingCalculation) {
            updateCalculation(
                {
                    resource: "cost",
                    id: editingCalculation.id,
                    values: payload,
                },
                {
                    onSuccess: () => {
                        setMessage(t("notifications.editSuccess", {resource: t("cost.title")}));
                        invalidate({
                            resource: "cost",
                            invalidates: ["list"],
                        });
                        setEditingCalculation(null);
                    },
                }
            );
            return;
        }

        createCalculation(
            {
                resource: "cost",
                values: payload,
            },
            {
                onSuccess: () => {
                    setMessage(t("notifications.createSuccess", {resource: t("cost.title")}));
                    invalidate({
                        resource: "cost",
                        invalidates: ["list"],
                    });
                },
            }
        );
    };

    const handleEdit = (calculation: ICostCalculation) => {
        setEditingCalculation(calculation);
        setMessage(null);
        setIsFinalPriceManuallySet(calculation.final_price !== undefined && calculation.final_price !== null);
        form.setFieldsValue({
            printer_id: calculation.printer?.id,
            filament_id: calculation.filament?.id,
            print_time_hours: calculation.print_time_hours,
            labor_time_hours: calculation.labor_time_hours,
            filament_weight_g: calculation.filament_weight_g,
            energy_cost_per_kwh: calculation.energy_cost ?? defaultEnergy,
            labor_cost_per_hour: calculation.labor_cost ?? defaultLabor,
            consumables_cost: calculation.consumables_cost ?? defaultConsumables,
            failure_rate: calculation.failure_rate ?? defaultFailure,
            markup_rate: calculation.markup_rate ?? defaultMarkup,
            final_price: calculation.final_price,
            notes: calculation.notes,
        });
        setBreakdown({
            material: calculation.material_cost ?? 0,
            energy: calculation.energy_cost ?? 0,
            depreciation: calculation.depreciation_cost ?? 0,
            labor: calculation.labor_cost ?? 0,
            consumables: calculation.consumables_cost ?? 0,
            base: calculation.base_price ?? 0,
            uplifted: calculation.uplifted_price ?? 0,
            final: calculation.final_price ?? 0,
        });
    };

    const resetEditing = () => {
        setEditingCalculation(null);
        setMessage(null);
        setIsFinalPriceManuallySet(false);
        form.resetFields();
        form.setFieldsValue({
            energy_cost_per_kwh: defaultEnergy,
            labor_cost_per_hour: defaultLabor,
            failure_rate: defaultFailure,
            markup_rate: defaultMarkup,
            consumables_cost: defaultConsumables,
        });
        setBreakdown({
            material: 0,
            energy: 0,
            depreciation: 0,
            labor: 0,
            consumables: 0,
            base: 0,
            uplifted: 0,
            final: 0,
        });
    };

    const handleDelete = (calculation: ICostCalculation) => {
        deleteCalculation(
            {
                resource: "cost",
                id: calculation.id,
            },
            {
                onSuccess: () => {
                    invalidate({
                        resource: "cost",
                        invalidates: ["list"],
                    });
                    setMessage(t("notifications.deleteSuccess", {resource: t("cost.title")}));
                    if (editingCalculation?.id === calculation.id) {
                        resetEditing();
                    }
                },
            }
        );
    };

    const {
        tableProps,
        sorters,
        setSorters,
        filters,
        setFilters,
        current,
        pageSize,
        setCurrent,
    } = useTable<ICostCalculation>({
        resource: "cost",
        syncWithLocation: false,
        pagination: {
            mode: "server",
        },
        sorters: {
            mode: "server",
            initial: [{field: "created", order: "desc"}],
        },
        filters: {
            mode: "server",
        },
        liveMode: "manual",
        onLiveEvent(event) {
            if (event.type === "created" || event.type === "deleted" || event.type === "updated") {
                invalidate({
                    resource: "cost",
                    invalidates: ["list"],
                });
            }
        },
    });

    const currentFilters = (filters as CrudFilters) ?? [];
    const selectedPrinterFilters =
        ((currentFilters.find((filter) => "field" in filter && filter.field === "printer_id") as CrudFilter | undefined)
            ?.value as number[] | undefined) ?? [];
    const selectedFilamentFilters =
        ((currentFilters.find((filter) => "field" in filter && filter.field === "filament_id") as CrudFilter | undefined)
            ?.value as number[] | undefined) ?? [];

    const handleFilterChange = (printerIds: number[], filamentIds: number[]) => {
        const newFilters: CrudFilter[] = [];
        if (printerIds.length > 0) {
            newFilters.push({
                field: "printer_id",
                operator: "in",
                value: printerIds,
            });
        }
        if (filamentIds.length > 0) {
            newFilters.push({
                field: "filament_id",
                operator: "in",
                value: filamentIds,
            });
        }
        setFilters(newFilters, "replace");
        setCurrent(1);
    };

    if (tableProps.pagination) {
        tableProps.pagination.showSizeChanger = true;
    }

    return (
        <Space direction="vertical" size="large" style={{width: "100%"}}>
            <Card>
                <Title level={3}>{t("cost.title")}</Title>
                <Paragraph type="secondary">{t("cost.description")}</Paragraph>
                <Form
                    form={form}
                    layout="vertical"
                    onValuesChange={(changedValues) => {
                        if (
                            Object.prototype.hasOwnProperty.call(changedValues, "final_price") &&
                            !isUpdatingFinalPriceRef.current
                        ) {
                            const newValue = changedValues.final_price;
                            setIsFinalPriceManuallySet(newValue !== undefined && newValue !== null);
                        }
                        recompute();
                    }}
                >
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                            <Form.Item label={t("cost.fields.printer_id")} name="printer_id" rules={[{required: true}]}>
                                <Select
                                    {...printerSelectProps}
                                    loading={printerSelectProps.loading}
                                    placeholder={t("cost.placeholders.printer")}
                                    showSearch
                                    optionFilterProp="label"
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label={t("cost.fields.filament_id")} name="filament_id"
                                       rules={[{required: true}]}>
                                <Select
                                    options={filamentTypeOptions}
                                    loading={filamentSelectProps.loading}
                                    placeholder={t("cost.placeholders.filament")}
                                    showSearch
                                    optionFilterProp="label"
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                            <Form.Item label={t("cost.fields.filament_weight_g")} name="filament_weight_g"
                                       rules={[{type: "number", min: 0}]}>
                                <InputNumber style={{width: "100%"}} addonAfter="g"/>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label={t("cost.fields.print_time_hours")} name="print_time_hours"
                                       rules={[{type: "number", min: 0}]}>
                                <InputNumber style={{width: "100%"}} addonAfter="h"/>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label={t("cost.fields.labor_time_hours")} name="labor_time_hours"
                                       rules={[{type: "number", min: 0}]}>
                                <InputNumber style={{width: "100%"}} addonAfter="h"/>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label={t("cost.fields.energy_cost_per_kwh")}
                                name="energy_cost_per_kwh"
                                tooltip={t("cost.tooltips.energy_cost_per_kwh")}
                                rules={[{type: "number", min: 0}]}
                            >
                                <InputNumber style={{width: "100%"}} addonBefore={currencySymbol} addonAfter="/kWh"/>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label={t("cost.fields.labor_cost_per_hour")}
                                name="labor_cost_per_hour"
                                tooltip={t("cost.tooltips.labor_cost_per_hour")}
                                rules={[{type: "number", min: 0}]}
                            >
                                <InputNumber style={{width: "100%"}} addonBefore={currencySymbol} addonAfter="/h"/>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label={t("cost.fields.consumables_cost")}
                                name="consumables_cost"
                                tooltip={t("cost.tooltips.consumables_cost")}
                                rules={[{type: "number", min: 0}]}
                            >
                                <InputNumber style={{width: "100%"}} addonBefore={currencySymbol}/>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label={t("cost.fields.failure_rate")}
                                name="failure_rate"
                                rules={[{type: "number", min: 0}]}
                            >
                                <InputNumber<number>
                                    min={0}
                                    max={10}
                                    style={{width: "100%"}}
                                    addonAfter="%"
                                    formatter={(value) => `${Number(value ?? 0) * 100}`}
                                    parser={(value) => Number(value ?? 0) / 100}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label={t("cost.fields.markup_rate")}
                                name="markup_rate"
                                rules={[{type: "number", min: 0}]}
                            >
                                <InputNumber<number>
                                    min={0}
                                    max={10}
                                    style={{width: "100%"}}
                                    addonAfter="%"
                                    formatter={(value) => `${Number(value ?? 0) * 100}`}
                                    parser={(value) => Number(value ?? 0) / 100}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item
                                label={t("cost.fields.final_price")}
                                name="final_price"
                                tooltip={t("cost.tooltips.final_price")}
                                rules={[{type: "number", min: 0}]}
                            >
                                <InputNumber style={{width: "100%"}} addonBefore={currencySymbol}/>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label={t("cost.fields.notes")} name="notes">
                        <Input.TextArea rows={3}/>
                    </Form.Item>
                    <Divider/>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={12}>
                            <Card title={t("cost.breakdown.title")}>
                                <Descriptions column={1} bordered size="small">
                                    <Descriptions.Item label={t("cost.breakdown.material")}>
                                        {formatter.format(breakdown.material)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t("cost.breakdown.energy")}>
                                        {formatter.format(breakdown.energy)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t("cost.breakdown.depreciation")}>
                                        {formatter.format(breakdown.depreciation)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t("cost.breakdown.labor")}>
                                        {formatter.format(breakdown.labor)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t("cost.breakdown.consumables")}>
                                        {formatter.format(breakdown.consumables)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t("cost.breakdown.base")}>
                                        <Tag color="default">{formatter.format(breakdown.base)}</Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t("cost.breakdown.uplifted")}>
                                        <Tag color="blue">{formatter.format(breakdown.uplifted)}</Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label={t("cost.breakdown.final")}>
                                        <Tag color="green">{formatter.format(breakdown.final)}</Tag>
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        </Col>
                        <Col xs={24} lg={12}>
                            <Space direction="vertical" style={{width: "100%"}}>
                                <Alert
                                    type="info"
                                    message={t("cost.notes.using_settings", {
                                        currency: currency,
                                        currencySymbol: currencySymbol,
                                    })}
                                />
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined/>}
                                    loading={isSaving || isUpdating}
                                    onClick={handleSubmit}
                                >
                                    {editingCalculation
                                        ? t("cost.actions.update_calculation")
                                        : t("cost.actions.save_calculation")}
                                </Button>
                                {editingCalculation && (
                                    <Button onClick={resetEditing}>{t("cost.actions.cancel_edit")}</Button>
                                )}
                                {message && <Alert type="success" message={message} showIcon/>}
                            </Space>
                        </Col>
                    </Row>
                </Form>
            </Card>

            <List
                title={t("cost.history.title")}
                headerButtons={null}
                canCreate={false}
            >
                <Space style={{marginBottom: 16}}>
                    <Select<number[]>
                        mode="multiple"
                        placeholder={t("cost.history.filter_printers")}
                        options={printerSelectProps.options}
                        value={selectedPrinterFilters as number[]}
                        onChange={(values) => handleFilterChange(values, selectedFilamentFilters as number[])}
                        style={{minWidth: 240}}
                        allowClear
                    />
                    <Select<number[]>
                        mode="multiple"
                        placeholder={t("cost.history.filter_filaments")}
                        options={filamentTypeOptions}
                        value={selectedFilamentFilters as number[]}
                        onChange={(values) => handleFilterChange(selectedPrinterFilters as number[], values)}
                        style={{minWidth: 240}}
                        allowClear
                    />
                    <Button
                        onClick={() => {
                            setSorters([{field: "created", order: "desc"}]);
                            setFilters([], "replace");
                            setCurrent(1);
                        }}
                    >
                        {t("buttons.clearFilters")}
                    </Button>
                </Space>
                <Table<ICostCalculation>
                    {...tableProps}
                    rowKey="id"
                    dataSource={tableProps.dataSource}
                    columns={removeUndefined([
                        {
                            title: t("cost.fields.created"),
                            dataIndex: "created",
                            sorter: true,
                            render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm"),
                        },
                        {
                            title: t("cost.fields.printer"),
                            dataIndex: ["printer", "name"],
                            render: (_value: string, record) => record.printer?.name ?? "-",
                        },
                        {
                            title: t("cost.fields.filament"),
                            dataIndex: ["filament", "name"],
                            render: (_value: string, record) => {
                                const vendor = record.filament?.vendor?.name;
                                const material = record.filament?.material;

                                if (!vendor && !material) {
                                    return "-";
                                }

                                return [vendor, material].filter(Boolean).join(" - ");
                            },                        },
                        {
                            title: t("cost.fields.base_price"),
                            dataIndex: "base_price",
                            sorter: true,
                            render: (value?: number) => formatter.format(value ?? 0),
                        },
                        {
                            title: t("cost.fields.uplifted_price"),
                            dataIndex: "uplifted_price",
                            sorter: true,
                            render: (value?: number) => formatter.format(value ?? 0),
                        },
                        {
                            title: t("cost.fields.final_price"),
                            dataIndex: "final_price",
                            sorter: true,
                            render: (value?: number) => formatter.format(value ?? 0),
                        },
                        {
                            title: t("cost.fields.notes"),
                            dataIndex: "notes",
                            render: (value?: string) => value ?? "",
                        },
                        {
                            title: t("table.actions"),
                            dataIndex: "actions",
                            render: (_value, record) => (
                                <Space>
                                    <Button size="small" icon={<EditOutlined/>} onClick={() => handleEdit(record)}>
                                        {t("buttons.edit")}
                                    </Button>
                                    <Popconfirm
                                        title={t("cost.actions.delete_calculation")}
                                        okText={t("buttons.delete")}
                                        cancelText={t("buttons.cancel")}
                                        placement="left"
                                        onConfirm={() => handleDelete(record)}
                                    >
                                        <Button size="small" icon={<DeleteOutlined/>} loading={isDeleting} danger>
                                            {t("buttons.delete")}
                                        </Button>
                                    </Popconfirm>
                                </Space>
                            ),
                        },
                    ])}
                />
            </List>
        </Space>
    );
};

export default CostingPage;
