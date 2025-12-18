import { DateField, NumberField, Show, TextField } from "@refinedev/antd";
import { IResourceComponentsProps, useShow, useTranslate } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import React from "react";
import { getCurrencySymbol, useCurrency } from "../../utils/settings";
import { IPrinter } from "./model";

dayjs.extend(utc);

const { Title } = Typography;

export const PrinterShow: React.FC<IResourceComponentsProps> = () => {
  const t = useTranslate();
  const currency = useCurrency();
  const currencySymbol = getCurrencySymbol(undefined, currency);

  const { queryResult } = useShow<IPrinter>({
    liveMode: "auto",
  });
  const { data, isLoading } = queryResult;

  const record = data?.data;

  const formatTitle = (item: IPrinter) => {
    return t("printer.titles.show_title", { id: item.id, name: item.name, interpolation: { escapeValue: false } });
  };

  return (
    <Show isLoading={isLoading} title={record ? formatTitle(record) : ""}>
      <Title level={5}>{t("printer.fields.id")}</Title>
      <NumberField value={record?.id ?? ""} />
      <Title level={5}>{t("printer.fields.registered")}</Title>
      <DateField
        value={dayjs.utc(record?.registered).local()}
        title={dayjs.utc(record?.registered).local().format()}
        format="YYYY-MM-DD HH:mm:ss"
      />
      <Title level={5}>{t("printer.fields.name")}</Title>
      <TextField value={record?.name} />
      <Title level={5}>{t("printer.fields.power_watts")}</Title>
      <NumberField value={record?.power_watts ?? 0} />
      <Title level={5}>{t("printer.fields.depreciation_cost_per_hour")}</Title>
      <TextField value={record?.depreciation_cost_per_hour != null ? `${currencySymbol} ${record?.depreciation_cost_per_hour}/h` : ""} />
      <Title level={5}>{t("printer.fields.comment")}</Title>
      <TextField value={record?.comment} />
    </Show>
  );
};

export default PrinterShow;
