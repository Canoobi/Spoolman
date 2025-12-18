import {Create, useForm} from "@refinedev/antd";
import {HttpError, IResourceComponentsProps, useTranslate} from "@refinedev/core";
import {Button, Form, Input, InputNumber} from "antd";
import TextArea from "antd/es/input/TextArea";
import {getCurrencySymbol, useCurrency} from "../../utils/settings";
import {IPrinter} from "./model";

interface CreateOrCloneProps {
    mode?: "create" | "clone";
}

export const PrinterCreate: React.FC<IResourceComponentsProps & CreateOrCloneProps> = (props) => {
    const t = useTranslate();
    const currency = useCurrency();
    const currencySymbol = getCurrencySymbol(undefined, currency);

    const {form, formProps, formLoading, onFinish, redirect} = useForm<IPrinter, HttpError, IPrinter>();

    const handleSubmit = async (redirectTo: "list" | "create") => {
        const values = await form.validateFields();
        await onFinish(values);
        redirect(redirectTo, (values as IPrinter).id);
    };

    return (
        <Create
            title={props.mode === "clone" ? t("printer.titles.clone") : t("printer.titles.create")}
            isLoading={formLoading}
            footerButtons={() => (
                <>
                    <Button type="primary" onClick={() => handleSubmit("list")}>
                        {t("buttons.save")}
                    </Button>
                    <Button type="primary" onClick={() => handleSubmit("create")}>
                        {t("buttons.saveAndAdd")}
                    </Button>
                </>
            )}
        >
            <Form {...formProps} layout="vertical">
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
                <Form.Item
                    label={t("printer.fields.comment")}
                    name={["comment"]}
                    rules={[
                        {
                            required: false,
                        },
                    ]}
                >
                    <TextArea maxLength={1024}/>
                </Form.Item>
            </Form>
        </Create>
    );
};

export default PrinterCreate;
