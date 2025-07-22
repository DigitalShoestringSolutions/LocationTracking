import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import APIBackend from './RestAPI'

class APIException extends Error {
    constructor(message, code = code, payload = undefined, name = "PayloadError") {
        super(message);
        this.name = name;
        this.payload = payload
        this.code = code
    }
}

function get_url(config) {
    return (config.api.host ? config.api.host : window.location.hostname) + (config.api.port ? ":" + config.api.port : "")
}

export function useConfig() {
    return useQuery(
        {
            queryKey: ['config'],
            queryFn: async () => APIBackend.api_get('http://' + document.location.host + '/config/config.json'),
            select: (data) => (data.payload)
        }
    )
}

export function useLocationList() {
    let { data: config } = useConfig()
    return useQuery(
        {
            queryKey: ['location_list'],
            queryFn: async () => APIBackend.api_get('http://' + get_url(config) + '/id/list/' + config.locations.tag),
            select: (data) => (data.payload)
        }
    )
}

export function useBarcodeDetails(barcode) {
    let { data: config } = useConfig()
    return useQuery(
        {
            queryKey: ['item_details', { barcode: barcode }],
            queryFn: async () => APIBackend.api_get('http://' + get_url(config) + '/id/get/' + config.api.type + '/' + encodeURIComponent(barcode) + "?full"),
            select: (data) => (data.payload),
            enabled: !!barcode
        }
    )
}