import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import APIBackend from 'core/RestAPI'

class APIException extends Error {
    constructor(message, code = code, payload = undefined, name = "PayloadError") {
        super(message);
        this.message = message
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
    let search_params = new URLSearchParams();
    search_params.append("identifier", barcode)
    search_params.append("full", "true")

    return useQuery(
        {
            queryKey: ['item_details', { barcode: barcode }],
            queryFn: async () => APIBackend.api_get('http://' + get_url(config) + '/id/get/' + config.api.type + "?" + search_params.toString()).then(
                result => {
                    if (result.status === 404) {
                        throw new APIException("Not Found",result.status,result.payload)
                    } else if (result.status >= 400) {
                        throw new APIException("API Error",result.status,result.payload)
                    } else {
                        return result
                    }
                }),
            select: (data) => (data.payload),
            retry: (failureCount, error) => {
                if (error instanceof APIException)
                    return false
                return failureCount<3
            },
            enabled: !!barcode
        }
    )
}

