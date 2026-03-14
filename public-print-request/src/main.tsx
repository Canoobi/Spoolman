import React from "react";
import ReactDOM from "react-dom/client";
import {ConfigProvider} from "antd";
import {RouterProvider} from "react-router-dom";
import deDE from "antd/locale/de_DE";
import {router} from "./router";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ConfigProvider
            locale={deDE}
            theme={{
                token: {
                    colorPrimary: "#1677ff",
                    borderRadius: 10,
                },
            }}
        >
            <RouterProvider router={router}/>
        </ConfigProvider>
    </React.StrictMode>
);
