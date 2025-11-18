import { useQuery, useQueryClient, useQueries } from "@tanstack/react-query"
import APIBackend from 'core/RestAPI'
import React from "react";

class APIException extends Error {
    constructor(message, code = code, payload = undefined, name = "PayloadError") {
        super(message);
        this.name = name;
        this.payload = payload
        this.code = code
    }
}

function get_id_url(config) {
    return (config.api.host ? config.api.host : window.location.hostname) + (config.api.port ? ":" + config.api.port : "")
}

function get_db_url(config) {
    return (config.db.host ? config.db.host : window.location.hostname) + (config.db.port ? ":" + config.db.port : "")
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


export function useStateAt(id) {
    let { data: config } = useConfig()
    return useQuery(
        {
            queryKey: ['state_at', { id: id }],
            queryFn: async () => APIBackend.api_get('http://' + get_db_url(config) + '/state/at/' + id),
            select: (data) => (data.payload)
        }
    )
}

export function useCurrentState(search_query = "") {
    let { data: config } = useConfig()

    const searchParams = new URLSearchParams();
    if (search_query) {
        searchParams.append("q", encodeURIComponent(search_query))
    }
    let search_string = searchParams.size > 0 ? "?" + searchParams.toString() : "" 
    return useQuery(
        {
            queryKey: ['state',{ search: search_query }],
            queryFn: async () => APIBackend.api_get('http://' + get_db_url(config) + '/state/' + search_string),
            select: (data) => (data.payload)
        }
    )
}

export function useBulkItem(id_list) {
    let { data: config } = useConfig()
    const empty_results = id_list.reduce((acc, id) => ({ ...acc, [id]: undefined }), {})
    return useQueries({
        queries: id_list.map((id) => ({
            queryKey: ['id', { id: id }],
            queryFn: async () => APIBackend.api_get('http://' + get_id_url(config) + '/id/' + id),
            select: (data) => (data.payload)
        })),
        combine: React.useCallback((results) => {
            let complete_results = results.reduce((acc, result) => ({ ...acc, [result?.data?.id]: result.data }), { ...empty_results})
            return {
                data: complete_results,
                pending: results.some((result) => result.isPending),
            }
        })
    })
}

export function useItem(id) {
    let { data: config } = useConfig()
    return useQuery(
        {
            queryKey: ['id', { id: id }],
            queryFn: async () => APIBackend.api_get('http://' + get_id_url(config) + '/id/' + id),
            select: (data) => (data.payload),
            enabled: !!id
        }
    )
}

export function useIdTypes() {
    let { data: config } = useConfig()
    return useQuery(
        {
            queryKey: ['id_types'],
            queryFn: async () => APIBackend.api_get('http://' + get_id_url(config) + '/id/types'),
            select: (data) => (data.payload),
        }
    )
}

export function useIdListForTypes(type_list) {
    let { data: config } = useConfig()

    const searchParams = new URLSearchParams();
    if (!Array.isArray(type_list)) {
        type_list = [type_list]
    }
    type_list.forEach(key => {
        searchParams.append("type", encodeURIComponent(key))
    });
    let search_string = searchParams.size > 0 ? "?" + searchParams.toString() : ""

    return useQuery(
        {
            queryKey: ['id_list_for_types', { types: type_list }],
            queryFn: async () => APIBackend.api_get('http://' + get_id_url(config) + '/id/list' + search_string),
            select: (data) => (data.payload),
            enabled: type_list.length > 0
        }
    )
}

export function useHistoryFor(id, start_period = undefined, end_period = undefined) {
    let { data: config } = useConfig()

    const searchParams = new URLSearchParams();
    if (start_period) {
        searchParams.append("from", start_period.toISOString())
    }
    if (end_period) {
        searchParams.append("to", end_period.toISOString())
    }
    let search_string = searchParams.size > 0 ? "?" + searchParams.toString() : ""

    return useQuery(
        {
            queryKey: ['history_for', { id: id, from: start_period, to: end_period }],
            queryFn: async () => APIBackend.api_get('http://' + get_db_url(config) + '/state/history/for/' + id + search_string),
            select: (data) => (data.payload)
        }
    )



} export function useEventsAt(id, start_period = undefined, end_period = undefined) {
    let { data: config } = useConfig()

    const searchParams = new URLSearchParams();
    if (start_period) {
        searchParams.append("from", start_period.toISOString())
    }
    if (end_period) {
        searchParams.append("to", end_period.toISOString())
    }
    let search_string = searchParams.size > 0 ? "?" + searchParams.toString() : ""

    return useQuery(
        {
            queryKey: ['events_at', { id: id, from: start_period, to: end_period }],
            queryFn: async () => APIBackend.api_get('http://' + get_db_url(config) + '/events/at/' + id + search_string),
            select: (data) => (data.payload)
        }
    )
}