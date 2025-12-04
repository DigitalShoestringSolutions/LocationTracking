import { SettingsProvider } from "app/SettingsContext"
import { useConfig } from "app/api"

export function ExtraPreRoutingContexts({ children }) {
    let { data: config, isLoading, error } = useConfig()

    if (isLoading)
        return "Loading..."
    
    return <SettingsProvider config={config}>
        {children}
    </SettingsProvider>
}