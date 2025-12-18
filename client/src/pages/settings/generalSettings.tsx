import { useTranslate } from "@refinedev/core";
import { Button, Checkbox, Form, Input, InputNumber, message } from "antd";
import TextArea from "antd/es/input/TextArea";
import { useEffect } from "react";
import { useGetSettings, useSetSetting } from "../../utils/querySettings";

export function GeneralSettings() {
  const settings = useGetSettings();
  const setBaseUrl = useSetSetting("base_url");
  const setCurrency = useSetSetting("currency");
  const setRoundPrices = useSetSetting("round_prices");
  const setEnergyCost = useSetSetting("energy_cost_per_kwh");
  const setLaborCost = useSetSetting("labor_cost_per_hour");
  const setFailureRate = useSetSetting("failure_rate");
  const setMarkupDefault = useSetSetting("markup_default_rate");
  const setConsumablesDefault = useSetSetting<string[]>("consumables_default");
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const t = useTranslate();

  // Set initial form values
  useEffect(() => {
    if (settings.data) {
      form.setFieldsValue({
        currency: JSON.parse(settings.data.currency.value),
        base_url: JSON.parse(settings.data.base_url.value),
        round_prices: JSON.parse(settings.data.round_prices.value),
        energy_cost_per_kwh: JSON.parse(settings.data.energy_cost_per_kwh.value ?? "0"),
        labor_cost_per_hour: JSON.parse(settings.data.labor_cost_per_hour.value ?? "0"),
        failure_rate: JSON.parse(settings.data.failure_rate.value ?? "0"),
        markup_default_rate: JSON.parse(settings.data.markup_default_rate.value ?? "0"),
        consumables_default: settings.data.consumables_default.value,
      });
    }
  }, [settings.data, form]);

  // Popup message if setSetting is successful
  useEffect(() => {
    if (
      setCurrency.isSuccess ||
      setBaseUrl.isSuccess ||
      setRoundPrices.isSuccess ||
      setEnergyCost.isSuccess ||
      setLaborCost.isSuccess ||
      setFailureRate.isSuccess ||
      setMarkupDefault.isSuccess ||
      setConsumablesDefault.isSuccess
    ) {
      messageApi.success(t("notifications.saveSuccessful"));
    }
  }, [
    setCurrency.isSuccess,
    setBaseUrl.isSuccess,
    setRoundPrices.isSuccess,
    setEnergyCost.isSuccess,
    setLaborCost.isSuccess,
    setFailureRate.isSuccess,
    setMarkupDefault.isSuccess,
    setConsumablesDefault.isSuccess,
    messageApi,
    t,
  ]);

  // Handle form submit
  const onFinish = (values: {
    currency: string;
    base_url: string;
    round_prices: boolean;
    energy_cost_per_kwh: number;
    labor_cost_per_hour: number;
    failure_rate: number;
    markup_default_rate: number;
    consumables_default: string;
  }) => {
    if (settings.data?.currency.value !== JSON.stringify(values.currency)) {
      setCurrency.mutate(values.currency);
    }
    if (settings.data?.base_url.value !== JSON.stringify(values.base_url)) {
      setBaseUrl.mutate(values.base_url);
    }
    if (settings.data?.round_prices.value !== JSON.stringify(values.round_prices)) {
      setRoundPrices.mutate(values.round_prices);
    }
    if (settings.data?.energy_cost_per_kwh.value !== JSON.stringify(values.energy_cost_per_kwh)) {
      setEnergyCost.mutate(values.energy_cost_per_kwh);
    }
    if (settings.data?.labor_cost_per_hour.value !== JSON.stringify(values.labor_cost_per_hour)) {
      setLaborCost.mutate(values.labor_cost_per_hour);
    }
    if (settings.data?.failure_rate.value !== JSON.stringify(values.failure_rate)) {
      setFailureRate.mutate(values.failure_rate);
    }
    if (settings.data?.markup_default_rate.value !== JSON.stringify(values.markup_default_rate)) {
      setMarkupDefault.mutate(values.markup_default_rate);
    }
    try {
      const parsedConsumables = values.consumables_default ? JSON.parse(values.consumables_default) : [];
      if (settings.data?.consumables_default.value !== JSON.stringify(parsedConsumables)) {
        setConsumablesDefault.mutate(parsedConsumables);
      }
    } catch (err) {
      messageApi.error(t("notifications.validationError", { error: t("settings.general.consumables_default.error") }));
    }
  };

  return (<>
    <Form
      form={form}
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      initialValues={{
        currency: settings.data?.currency.value,
        round_prices: settings.data?.round_prices.value,
      }}
      onFinish={onFinish}
      style={{
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <Form.Item
        label={t("settings.general.currency.label")}
        name="currency"
        rules={[
          {
            required: true,
          },
          {
            pattern: /^[A-Z]{3}$/,
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label={t("settings.general.base_url.label")}
        tooltip={t("settings.general.base_url.tooltip")}
        name="base_url"
        rules={[
          {
            required: false,
          },
          {
            pattern: /^https?:\/\/.+(?<!\/)$/,
          },
        ]}
      >
        <Input placeholder="https://example.com:8000" />
      </Form.Item>

      <Form.Item
        label={t("settings.general.round_prices.label")}
        tooltip={t("settings.general.round_prices.tooltip")}
        name="round_prices"
        valuePropName="checked"
      >
        <Checkbox />
      </Form.Item>
      <Form.Item
        label={t("settings.general.energy_cost_per_kwh.label")}
        tooltip={t("settings.general.energy_cost_per_kwh.tooltip")}
        name="energy_cost_per_kwh"
        rules={[
          {
            required: true,
            type: "number",
            min: 0,
          },
        ]}
      >
        <InputNumber addonAfter="/kWh" style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item
        label={t("settings.general.labor_cost_per_hour.label")}
        tooltip={t("settings.general.labor_cost_per_hour.tooltip")}
        name="labor_cost_per_hour"
        rules={[
          {
            required: true,
            type: "number",
            min: 0,
          },
        ]}
      >
        <InputNumber addonAfter="/h" style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item
        label={t("settings.general.failure_rate.label")}
        tooltip={t("settings.general.failure_rate.tooltip")}
        name="failure_rate"
        rules={[
          {
            required: true,
            type: "number",
            min: 0,
          },
        ]}
      >
        <InputNumber min={0} max={1} step={0.05} />
      </Form.Item>
      <Form.Item
        label={t("settings.general.markup_default_rate.label")}
        tooltip={t("settings.general.markup_default_rate.tooltip")}
        name="markup_default_rate"
        rules={[
          {
            required: true,
            type: "number",
            min: 0,
          },
        ]}
      >
        <InputNumber min={0} max={1} step={0.05} />
      </Form.Item>
      <Form.Item
        label={t("settings.general.consumables_default.label")}
        tooltip={t("settings.general.consumables_default.tooltip")}
        name="consumables_default"
        rules={[
          {
            required: false,
          },
        ]}
      >
        <TextArea rows={3} />
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit" loading={settings.isFetching || setCurrency.isLoading}>
          {t("buttons.save")}
        </Button>
      </Form.Item>
    </Form>
    {contextHolder}
  </>);
}
