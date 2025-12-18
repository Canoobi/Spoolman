import {EditOutlined, EyeOutlined, FilterOutlined} from "@ant-design/icons";
import {List, useTable} from "@refinedev/antd";
import {IResourceComponentsProps, useInvalidate, useNavigation, useTranslate} from "@refinedev/core";
import {Button, Dropdown, Table} from "antd";
import {useCallback, useMemo, useState} from "react";
import {useNavigate} from "react-router";
import {ActionsColumn, DateColumn, NumberColumn, RichColumn, SortedColumn,} from "../../components/column";
import {useLiveify} from "../../components/liveify";
import {removeUndefined} from "../../utils/filtering";
import {TableState, useInitialTableState, useStoreInitialState} from "../../utils/saveload";
import {getCurrencySymbol, useCurrency} from "../../utils/settings";
import {IPrinter} from "./model";

const namespace = "printerList";

const allColumns: (keyof IPrinter & string)[] = [
    "id",
    "name",
    "registered",
    "power_watts",
    "depreciation_cost_per_hour",
    "comment",
];

export const PrinterList: React.FC<IResourceComponentsProps> = () => {
    const t = useTranslate();
    const invalidate = useInvalidate();
    const navigate = useNavigate();
    const currency = useCurrency();
    const currencySymbol = getCurrencySymbol(undefined, currency);

    const initialState = useInitialTableState(namespace);

    const {tableProps, sorters, setSorters, filters, setFilters, current, pageSize, setCurrent} = useTable<IPrinter>({
        syncWithLocation: false,
        pagination: {
            mode: "server",
            current: initialState.pagination.current,
            pageSize: initialState.pagination.pageSize,
        },
        sorters: {
            mode: "server",
            initial: initialState.sorters,
        },
        filters: {
            mode: "server",
            initial: initialState.filters,
        },
        liveMode: "manual",
        onLiveEvent(event) {
            if (event.type === "created" || event.type === "deleted") {
                invalidate({
                    resource: "printer",
                    invalidates: ["list"],
                });
            }
        },
    });

    const [showColumns, setShowColumns] = useState<string[]>(initialState.showColumns ?? allColumns);

    const tableState: TableState = {
        sorters,
        filters,
        pagination: {current, pageSize},
        showColumns,
    };
    useStoreInitialState(namespace, tableState);

    const queryDataSource: IPrinter[] = useMemo(() => {
        return (tableProps.dataSource || []).map((record) => ({...record}));
    }, [tableProps.dataSource]);
    const dataSource = useLiveify(
        "printer",
        queryDataSource,
        useCallback((record: IPrinter) => record, [])
    );

    if (tableProps.pagination) {
        tableProps.pagination.showSizeChanger = true;
    }

    const {editUrl, showUrl} = useNavigation();
    const actions = (record: IPrinter) => [
        {name: t("buttons.show"), icon: <EyeOutlined/>, link: showUrl("printer", record.id)},
        {name: t("buttons.edit"), icon: <EditOutlined/>, link: editUrl("printer", record.id)},
    ];

    const commonProps = {
        t,
        navigate,
        actions,
        dataSource,
        tableState,
        sorter: true,
    };

    return (
        <List
            headerButtons={({defaultButtons}) => (
                <>
                    <Button
                        type="primary"
                        icon={<FilterOutlined/>}
                        onClick={() => {
                            setFilters([], "replace");
                            setSorters([{field: "id", order: "asc"}]);
                            setCurrent(1);
                        }}
                    >
                        {t("buttons.clearFilters")}
                    </Button>
                    <Dropdown
                        trigger={["click"]}
                        menu={{
                            items: allColumns.map((column_id) => ({
                                key: column_id,
                                label: t(`printer.fields.${column_id}`),
                            })),
                            selectedKeys: showColumns,
                            selectable: true,
                            multiple: true,
                            onDeselect: (keys) => {
                                setShowColumns(keys.selectedKeys);
                            },
                            onSelect: (keys) => {
                                setShowColumns(keys.selectedKeys);
                            },
                        }}
                    >
                        <Button type="primary" icon={<EditOutlined/>}>
                            {t("buttons.hideColumns")}
                        </Button>
                    </Dropdown>
                    {defaultButtons}
                </>
            )}
        >
            <Table
                {...tableProps}
                sticky
                tableLayout="auto"
                scroll={{x: "max-content"}}
                dataSource={dataSource}
                rowKey="id"
                columns={removeUndefined([
                    SortedColumn({
                        ...commonProps,
                        id: "id",
                        i18ncat: "printer",
                        width: 70,
                    }),
                    SortedColumn({
                        ...commonProps,
                        id: "name",
                        i18ncat: "printer",
                    }),
                    DateColumn({
                        ...commonProps,
                        id: "registered",
                        i18ncat: "printer",
                        width: 200,
                    }),
                    NumberColumn({
                        ...commonProps,
                        id: "power_watts",
                        i18ncat: "printer",
                        unit: "W",
                        maxDecimals: 1,
                        width: 160,
                    }),
                    NumberColumn({
                        ...commonProps,
                        id: "depreciation_cost_per_hour",
                        i18ncat: "printer",
                        unit: `${currencySymbol}/h`,
                        maxDecimals: 2,
                        width: 200,
                    }),
                    RichColumn({
                        ...commonProps,
                        id: "comment",
                        i18ncat: "printer",
                    }),
                    ActionsColumn<IPrinter>(t("table.actions"), actions),
                ])}
            />
        </List>
    );
};

export default PrinterList;
