export async function custom_new_message_action(dispatch, message) {
  console.log(message)
  if (message && message.topic.match("location_state/update")) {
    dispatch({ type: 'UPDATE_ITEM', updated_entry: message.payload })
  } 
}

export const CustomReducer = (currentState, action) => {
  console.log(action)
  switch (action.type) {
    case 'MQTT_STATUS':
      return {
        ...currentState,
        connected: action.connected
      };
    case 'SET_ITEMS':
      return {
        ...currentState,
        items_state: action.item
      }
    case 'UPDATE_ITEM':
      let filtered_items_state = currentState.items_state.filter(item => !(item.item_id === action.updated_entry.item_id && item.location_link === action.updated_entry.location_link))
      return {
        ...currentState,
        items_state: [action.updated_entry,...filtered_items_state]
      }
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};
