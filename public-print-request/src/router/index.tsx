import {createBrowserRouter, Navigate} from "react-router-dom";
import App from "../App";
import {LoginPage} from "../pages/LoginPage";
import {RequestPage} from "../pages/RequestPage";
import {StatusPage} from "../pages/StatusPage";
import {InvoicePage} from "../pages/InvoicePage";
import {NotFoundPage} from "../pages/NotFoundPage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App/>,
        children: [
            {index: true, element: <LoginPage/>},
            {path: "request", element: <RequestPage/>},
            {path: "request/status/:publicId", element: <StatusPage/>},
            {path: "request/status/:publicId/invoice", element: <InvoicePage/>},
            {path: "404", element: <NotFoundPage/>},
            {path: "*", element: <Navigate to="/404" replace/>},
        ],
    },
]);
