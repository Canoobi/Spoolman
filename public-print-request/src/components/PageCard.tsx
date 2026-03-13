import { Card, Typography } from "antd";
import type {PropsWithChildren, ReactNode} from "react";

type Props = PropsWithChildren<{
    title: string;
    extra?: ReactNode;
}>;

export function PageCard({ title, extra, children }: Props) {
    return (
        <Card
            title={
            <Typography.Text strong style={{ fontSize: 18 }}>
    {title}
    </Typography.Text>
}
    extra={extra}
    bordered={false}
    styles={{
        body: { paddingTop: 20 },
    }}
>
    {children}
    </Card>
);
}
