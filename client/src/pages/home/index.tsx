import {HighlightOutlined, PlusOutlined, UnorderedListOutlined} from "@ant-design/icons";
import {IResourceComponentsProps, useList, useTranslate} from "@refinedev/core";
import {Card, Col, Row, Statistic, theme} from "antd";
import {Content} from "antd/es/layout/layout";
import Title from "antd/es/typography/Title";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import React, {ReactNode} from "react";
import {Link} from "react-router";
import {Trans} from "react-i18next";
import Logo from "../../icon.svg?react";
import {ISpool} from "../spools/model";
import type {PrintRequestRecord} from "../../types/printRequest";

dayjs.extend(utc);

const {useToken} = theme;

export const Home: React.FC<IResourceComponentsProps> = () => {
    const {token} = useToken();
    const t = useTranslate();

    const spools = useList<ISpool>({
        resource: "spool",
        pagination: {pageSize: 1},
    });
    const filaments = useList<ISpool>({
        resource: "filament",
        pagination: {pageSize: 1},
    });
    const printRequests = useList<PrintRequestRecord>({
        resource: "print-request",
        pagination: {pageSize: 1},
    });
    const vendors = useList<ISpool>({
        resource: "vendor",
        pagination: {pageSize: 1},
    });

    const hasSpools = !spools.data || spools.data.data.length > 0;

    const ResourceStatsCard = (props: {
        loading: boolean;
        value: number;
        resource: string;
        icon: ReactNode;
        title?: string;
        showCreateAction?: boolean;
    }) => (
        <Col xs={12} md={6}>
            <Card
                loading={props.loading}
                actions={[
                    <Link to={`/${props.resource}`}>
                        <UnorderedListOutlined/>
                    </Link>,
                    ...(props.showCreateAction === false ? [] : [
                        <Link to={`/${props.resource}/create`}>
                            <PlusOutlined/>
                        </Link>,
                    ]),
                ]}
            >
                <Statistic title={props.title || t(`${props.resource}.${props.resource}`)} value={props.value} prefix={props.icon}/>
            </Card>
        </Col>
    );

    return (
        <Content
            style={{
                padding: "2em 20px",
                minHeight: 280,
                maxWidth: 800,
                margin: "0 auto",
                backgroundColor: token.colorBgContainer,
                borderRadius: token.borderRadiusLG,
                color: token.colorText,
                fontFamily: token.fontFamily,
                fontSize: token.fontSizeLG,
                lineHeight: 1.5,
            }}
        >
            <Title
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: token.fontSizeHeading1,
                }}
            >
                <div
                    style={{
                        display: "inline-block",
                        height: "1.5em",
                        marginRight: "0.5em",
                    }}
                >
                    <Logo/>
                </div>
                Spoolman
            </Title>
            <Row justify="center" gutter={[16, 16]} style={{marginTop: "3em"}}>
                <ResourceStatsCard
                    resource="spool"
                    value={spools.data?.total || 0}
                    loading={spools.isLoading}
                    icon={<img src="/spool.png" width={23} height={23} alt="spool"/>}
                />
                <ResourceStatsCard
                    resource="filament"
                    value={filaments.data?.total || 0}
                    loading={filaments.isLoading}
                    icon={<HighlightOutlined/>}
                />
                <ResourceStatsCard
                    resource="print-request"
                    value={printRequests.data?.total || 0}
                    loading={printRequests.isLoading}
                    icon={<img src="/order.png" width={23} height={23} alt="order"/>}
                    title={t("print_request.print_request")}
                    showCreateAction={false}
                />
                <ResourceStatsCard
                    resource="vendor"
                    value={vendors.data?.total || 0}
                    loading={vendors.isLoading}
                    icon={<img src="/vendor.png" width={23} height={23} alt="vendor"/>}
                    showCreateAction={false}
                />
            </Row>
            {!hasSpools && (
                <>
                    <p style={{marginTop: 32}}>{t("home.welcome")}</p>
                    <p>
                        <Trans
                            i18nKey="home.description"
                            components={{
                                helpPageLink: <Link to="/help"/>,
                            }}
                        />
                    </p>
                </>
            )}
        </Content>
    );
};

export default Home;
