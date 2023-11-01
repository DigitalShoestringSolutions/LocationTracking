import dayjs from "dayjs";

export const DefaultReducer = (currentState, action) => {
  console.log(action)
  switch (action.type) {
    case 'ADD':
      return {
        ...currentState,
        [action.key]: {value:action.value,timestamp:action?.timestamp ? dayjs(action?.timestamp): dayjs()}
      };
    case 'CLEAR':{
      return {};
    }
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};