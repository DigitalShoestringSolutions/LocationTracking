export async function custom_new_message_action(dispatch, message) {
  // console.log(message)
  if (message && message.topic.match("location_state/update")) {
    dispatch({ type: 'ITEM_UPDATE', updated_entry: { start: message.payload.timestamp, ...message.payload } })
  } else if (message && message.topic.match("location_state/entered")) {
    dispatch({ type: 'ITEM_ENTERED', added_entry: { start: message.payload.timestamp, ...message.payload } })
  } else if (message && message.topic.match("location_state/exited")) {
    dispatch({ type: 'ITEM_EXITED', removed_entry: message.payload })
  }
}

export const CustomReducer = (currentState, action) => {
  console.log(action)
  let filtered_items_state = []
  let new_item_history = []
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
    case 'ITEM_UPDATE':
      filtered_items_state = currentState.items_state.filter(item => !(item.item_id === action.updated_entry.item_id && item.location_link === action.updated_entry.location_link))
      return {
        ...currentState,
        items_state: [action.updated_entry, ...filtered_items_state]
      }
    case 'ITEM_ENTERED':
      new_item_history = action.added_entry.item_id === currentState.current_item ? [action.added_entry, ...currentState.item_history] : currentState.item_history
      return {
        ...currentState,
        items_state: [action.added_entry, ...currentState.items_state],
        item_history: new_item_history
      }
    case 'ITEM_EXITED':
      filtered_items_state = currentState.items_state.filter(item => !(item.item_id === action.removed_entry.item_id && item.location_link === action.removed_entry.location_link))
      new_item_history = action.removed_entry.item_id === currentState.current_item ? [...currentState.item_history].map(elem => (elem.item_id === action.removed_entry.item_id && !elem.end ? { ...elem, end: action.removed_entry.timestamp } : elem)) : currentState.item_history
      return {
        ...currentState,
        items_state: filtered_items_state,
        item_history: new_item_history
      }
    case 'ITEM_HISTORY':
      return {
        ...currentState,
        item_history: action.dataset,
        current_item: action.current_item
      }
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};
