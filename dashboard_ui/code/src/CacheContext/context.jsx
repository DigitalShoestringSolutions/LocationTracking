import React from "react";

import { DefaultReducer } from "./default_reducer";
import dayjs from "dayjs";

const CacheContext = React.createContext();

export function useCache() {
  const context = React.useContext(CacheContext);
  if (context === undefined) {
    throw new Error("useCache must be used within a CacheProvider");
  }

  return context;
}

export const CacheProvider = ({ children, reducer = DefaultReducer, fetch_new_function, initial_state = {} }) => {
  const [state, dispatch] = React.useReducer(reducer, initial_state);
  const pending_list_ref = React.useRef([])
  const pending_storage_ref = React.useRef({})

  const do_storage_add = () => {
    let current = pending_storage_ref.current
    if (Object.keys(current).length > 0) {
      Object.keys(current).forEach(key => {
        dispatch({ type: "ADD", key: key, ...current[key] })
      })
    }
    pending_storage_ref.current = {}
  }

  const add_function = (key, value) => {
    dispatch({ type: "ADD", key: key, value: value })
    try {
      localStorage.setItem(key, JSON.stringify({ value: value, timestamp: dayjs().toISOString() }))
    } catch (error) {
      console.error(error)
      console.warn("Local Storage Full");
    }
  }

  const add_to_fetch_list = (key) => {
    let pending_list = pending_list_ref.current
    console.log(pending_list)
    if (pending_list.indexOf(key) === -1) {
      pending_list.push(key)
    }
  }

  const add_to_storage = (key, entry) => pending_storage_ref.current[key] = entry

  const cache_fetch = (key) => {
    if (key) {
      let result = state[key]
      if (result !== undefined) {
        if (result.timestamp.isBefore(dayjs().subtract(1, 'day'))) {
          console.log(key, "EXPIRED", result.timestamp)
          add_to_fetch_list(key)
        }
        return result.value
      } else {
        let local = localStorage.getItem(key)
        if (local) {
          let entry = JSON.parse(local)
          add_to_storage(key, entry)
          return entry.value
        } else {
          add_to_fetch_list(key)
        }
        return "loading..."
      }
    }
    return null
  }

  const do_fetch = React.useCallback(() => {
    if (pending_list_ref.current.length > 0) {
      console.log("doing_fetch")
      fetch_new_function(pending_list_ref.current, add_function)
      pending_list_ref.current = []
    }
    do_storage_add()
  },[fetch_new_function])

  React.useEffect(() => {
    let interval_id = setInterval(do_fetch, 1000);
    const cancel = () => clearInterval(interval_id);
    return cancel 
  }, [do_fetch])

  const clear_cache = () => {
    dispatch({ type: "CLEAR" })
    let tmp_lf = localStorage.getItem("location_filter")
    let tmp_if = localStorage.getItem("item_filter")
    let tmp_sl = localStorage.getItem("shown_locations")
    localStorage.clear();
    localStorage.setItem("location_filter", tmp_lf)
    localStorage.setItem("item_filter", tmp_if)
    localStorage.setItem("shown_locations", tmp_sl)
  }
  const get_size = () => Object.keys(state).length

  return (
    <CacheContext.Provider value={{ cache_fetch: cache_fetch, clear_cache: clear_cache, get_size: get_size }}>
      {children}
    </CacheContext.Provider>
  );
};
