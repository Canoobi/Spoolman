import {Edit, useForm} from "@refinedev/antd";
import {HttpError, IResourceComponentsProps, useTranslate} from "@refinedev/core";
import {Form, Input, InputNumber} from "antd";
import DatePicker from "antd/es/date-picker";
import TextArea from "antd/es/input/TextArea";
import dayjs from "dayjs";
import {getCurrencySymbol, useCurrency} from "../../utils/settings";
import {IPrinter} from "./model";

export const PrinterEdit: React.FC<IResourceComponentsProps> = () => {
    const t = useTranslate();
    const currency = useCurrency();
    const currencySymbol = getCurrencySymbol(undefined, currency);

    const {formProps, saveButtonProps} = useForm<IPrinter, HttpError, IPrinter, IPrinter>({
        liveMode: "manual",
    });

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <Form.Item label={t("printer.fields.id")} name={["id"]} rules={[{required: true}]}>
                    <Input readOnly disabled/>
                </Form.Item>
                <Form.Item
                    label={t("printer.fields.registered")}
                    name={["registered"]}
                    rules={[{required: true}]}
                    getValueProps={(value) => ({
                        value: value ? dayjs(value) : undefined,
                    })}
                >
                    <DatePicker disabled showTime format="YYYY-MM-DD HH:mm:ss"/>
                </Form.Item>
                <Form.Item
                    label={t("printer.fields.name")}
                    name={["name"]}
                    rules={[
                        {
                            required: true,
                            message: t("notifications.validationError", {error: t("printer.validation.name")}),
                        },
                    ]}
                >
                    <Input maxLength={128}/>
                </Form.Item>
                <Form.Item
                    label={t("printer.fields.power_watts")}
                    name={["power_watts"]}
                    tooltip={t("printer.fields_help.power_watts")}
                    rules={[
                        {
                            required: false,
                            type: "number",
                            min: 0,
                        },
                    ]}
                >
                    <InputNumber addonAfter="W" precision={1} style={{width: "100%"}}/>
                </Form.Item>
                <Form.Item
                    label={t("printer.fields.depreciation_cost_per_hour")}
                    name={["depreciation_cost_per_hour"]}
                    tooltip={t("printer.fields_help.depreciation_cost_per_hour")}
                    rules={[
                        {
                            required: false,
                            type: "number",
                            min: 0,
                        },
                    ]}
                >
                    <InputNumber addonAfter={`${currencySymbol}/h`} precision={2} style={{width: "100%"}}/>
                </Form.Item>
                <Form.Item label={t("printer.fields.comment")} name={["comment"]}>
                    <TextArea maxLength={1024}/>
                </Form.Item>
            </Form>
        </Edit>
    );
};

export default PrinterEdit;
