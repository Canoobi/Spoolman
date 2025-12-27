import {IResourceComponentsProps} from "@refinedev/core";
import {theme} from "antd";
import {Content} from "antd/es/layout/layout";
import React from "react";

const {useToken} = theme;

export const AmsConnect: React.FC<IResourceComponentsProps> = () => {
    const {token} = useToken();

    return (
        <Content style={{padding: 16}}>
            <div
                style={{
                    backgroundColor: token.colorBgContainer,
                    borderRadius: token.borderRadiusLG,
                    height: "calc(100vh - 160px)",
                    overflow: "hidden",
                }}
            >
                <iframe
                    title="AMS-Connect"
                    src="http://192.168.1.99:30169"
                    style={{border: 0, width: "100%", height: "100%"}}
                />
            </div>
        </Content>
    );
};

export default AmsConnect;
