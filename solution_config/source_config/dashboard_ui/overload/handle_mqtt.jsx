export const initial_state = { connected: false }

export async function new_message_action(dispatch, queryClient, message) {
    if (message && message.topic.match("location_state/update")) {
        console.log("update received on ", message.topic)
        queryClient.refetchQueries({ queryKey: ["state"] })
        queryClient.refetchQueries({ queryKey: ["state_at", { id: message?.payload?.location_link }] })
        queryClient.refetchQueries({ queryKey: ['history_for', { id: message.payload.item_id }] })
        queryClient.refetchQueries({ queryKey: ['events_at', { id: message?.payload?.location_link }] })
    } else if (message && (message.topic.match("location_state/entered")) || message.topic.match("location_state/exited")) {
        console.log("entry received on ", message.topic)
        queryClient.refetchQueries({ queryKey: ["state"] })
        queryClient.refetchQueries({ queryKey: ["state_at", { id: message?.payload?.location_link }] })
        queryClient.refetchQueries({ queryKey: ['history_for', { id: message.payload.item_id }] })
        queryClient.refetchQueries({ queryKey: ['events_at', { id: message?.payload?.location_link }] })
    }
}

export const state_reducer = (currentState, action) => {
    switch (action.type) {
        case 'MQTT_STATUS':
            return {
                ...currentState,
                connected: action.connected
            };
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
};