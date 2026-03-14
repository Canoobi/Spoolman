import {Tag} from "antd";
import type {PrintRequestStatus} from "../types/api";

type Props = {
    status: PrintRequestStatus;
};

export function StatusTag({status}: Props) {
    let color:
        | "default"
        | "processing"
        | "success"
        | "error"
        | "warning"
        | "blue"
        | "purple"
        | "cyan"
        | "green"
        | "magenta"
        | "red"
        | "volcano"
        | "orange"
        | "gold"
        | "lime"
        | "geekblue" = "default";

    switch (status) {
        case "Angefragt":
            color = "blue";
            break;
        case "In Klärung":
            color = "gold";
            break;
        case "Offen":
            color = "cyan";
            break;
        case "In Bearbeitung":
            color = "processing";
            break;
        case "Hergestellt":
            color = "purple";
            break;
        case "Abgeschlossen":
            color = "success";
            break;
        case "Abgelehnt":
            color = "error";
            break;
    }

    return <Tag color={color}>{status}</Tag>;
}
