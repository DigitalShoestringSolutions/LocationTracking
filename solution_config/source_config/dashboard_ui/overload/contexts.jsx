import { FilterProvider } from "app/FilterContext"
import { useConfig } from "app/api"

export function ExtraPreRoutingContexts({ children }) {
    let { data: config, isLoading, error } = useConfig()

    if (isLoading)
        return "Loading..."
    
    return <FilterProvider config={config}>
        {children}
    </FilterProvider>
}