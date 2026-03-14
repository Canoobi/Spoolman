import {api} from "./client";
import type {PublicFormDataResponse, PublicPrintRequestPayload, PublicPrintRequestResponse,} from "../types/api";

export async function getFormData(): Promise<PublicFormDataResponse> {
    const {data} = await api.get<PublicFormDataResponse>(
        "/print-request/public/form-data"
    );
    return data;
}

export async function createPrintRequest(
    payload: PublicPrintRequestPayload
): Promise<PublicPrintRequestResponse> {
    const {data} = await api.post<PublicPrintRequestResponse>(
        "/print-request/public/",
        payload
    );
    return data;
}

export async function getPrintRequest(
    publicId: string
): Promise<PublicPrintRequestResponse> {
    const {data} = await api.get<PublicPrintRequestResponse>(
        `/print-request/public/${publicId}`
    );
    return data;
}

export async function updatePrintRequest(
    publicId: string,
    payload: PublicPrintRequestPayload
): Promise<PublicPrintRequestResponse> {
    const {data} = await api.patch<PublicPrintRequestResponse>(
        `/print-request/public/${publicId}`,
        payload
    );
    return data;
}
