import type {PropsWithChildren} from "react";
import {Typography} from "antd";

type Props = PropsWithChildren<{
    title: string;
    subtitle?: string;
}>;

export function AppLayout({title, subtitle, children}: Props) {
    return (
        <div className="app-shell">
            <div className="app-shell__inner">
                <header className="app-header">
                    <Typography.Title level={1} className="app-header__title">
                        {title}
                    </Typography.Title>
                    {subtitle && (
                        <Typography.Paragraph className="app-header__subtitle">
                            {subtitle}
                        </Typography.Paragraph>
                    )}
                </header>

                {children}
            </div>
        </div>
    );
}
