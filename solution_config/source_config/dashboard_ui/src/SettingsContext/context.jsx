import React from "react";

import { useIdListForTypes } from "app/api";

const SettingsContext = React.createContext();

export function useSettings() {
  const context = React.useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }

  return context;
}

const localStorageSetWrapper = (key, local_set_func, value) => {
  local_set_func(value)
  if (value != undefined) {
    localStorage.setItem(key, JSON.stringify(value))
  } else {
    localStorage.clear(key)
  }
}

const doloadFromLocalStorage = (key, local_set_func, default_value) => {
  let raw_storage_value = localStorage.getItem(key)
  if (raw_storage_value !== null) {
    let value = JSON.parse(raw_storage_value)
    local_set_func(value)
    console.log(`${key} - loaded from storage: `, value)
  } else {
    local_set_func(default_value)
    console.log(`${key} - default used: `, default_value)
  }
}

export const SettingsProvider = ({ children, config }) => {
  let [item_filter, setItemFilter] = React.useState({}) // map of <type>:bool or <type>:[<id>] 
  let [location_filter, setLocationFilter] = React.useState([]) // list of location ids
  let [search_query, setSearchQuery] = React.useState("")
  let [default_item_filter, setDefaultItemFilter] = React.useState({})

  let [use_relative_timestamps, setUseRelativeTimestamps] = React.useState(true)
  let [item_ordering, setItemOrdering] = React.useState("quantity")
  let [show_icons, setShowIcons] = React.useState(true)
  let [location_types, setLocationTypes] = React.useState([])
  let { data: location_ids } = useIdListForTypes(location_types)

  const [page_size, setPageSize] = React.useState(10)
  const loadFromLocalStorage = React.useCallback(doloadFromLocalStorage, [])

  React.useEffect(() => {
    //// Item filter
    // Load config file types
    console.log(config)
    let config_valid_item_types = config?.items?.defaults
    // create default filter
    let default_item_filter = config_valid_item_types.reduce((obj, elem) => { obj[elem] = true; return obj }, {})
    setDefaultItemFilter(default_item_filter)
    // load prior filter value from browser storage
    let raw_storage_item_filter = localStorage.getItem('item_filter')
    // load existing filter if present else use default
    loadFromLocalStorage('item_filter', setItemFilter, default_item_filter)

    //// Location filter
    // Load config file types
    let config_valid_location_types = config?.locations?.defaults
    setLocationTypes(config_valid_location_types) // triggers useIdListForTypes
    // load prior filter value from browser storage
    loadFromLocalStorage('shown_locations', setLocationFilter, [])

    //// Show icons
    loadFromLocalStorage('show_icons', setShowIcons, true)
    
    //// Page size
    loadFromLocalStorage('page_size', setPageSize, 10)

    //// Relative timestamps
    loadFromLocalStorage('use_relative_timestamps', setUseRelativeTimestamps , true)

    //// item ordering
    loadFromLocalStorage('item_ordering', setItemOrdering, item_ordering)

  }, [config, loadFromLocalStorage]) //run once on mount

  React.useEffect(() => {
    if (location_ids && location_filter.length == 0) {
      let default_location_filter = location_ids.map(elem => elem.id)
      setLocationFilter(default_location_filter)
      console.log("Default location filter used: ", default_location_filter)
    }
  }, [location_ids])

 

  // Wrappers to set state and local storage together
  const setPageSizeWrapper = (new_value) => localStorageSetWrapper("page_size", setPageSize, new_value)
  const setShowIconsWrapper = (new_value) => localStorageSetWrapper("show_icons", setShowIcons, new_value)
  const setItemFilterWrapper = (new_value) => localStorageSetWrapper("item_filter", setItemFilter, new_value)
  const setLocationFilterWrapper = (new_value) => localStorageSetWrapper("shown_locations", setLocationFilter, new_value)
  const setUseRelativeTimestampsWrapper = (new_value) => localStorageSetWrapper("use_relative_timestamps", setUseRelativeTimestamps, new_value)
  const setItemOrderingWrapper = (new_value) => localStorageSetWrapper("item_ordering", setItemOrdering, new_value)

  // Combined filter function

  const filter_function = (elem) => {
    let type_tag = elem.item_id.split('@')[0]
    let filter_entry = item_filter[type_tag]
    if (filter_entry === true)
      return location_filter.indexOf(elem.location_link) >= 0
    if (Array.isArray(filter_entry))
      return (location_filter.indexOf(elem.location_link) >= 0) && (filter_entry.indexOf(elem.item_id) >= 0)
    return false
  }

  return (
    <SettingsContext.Provider value={{
      location_types: location_types,

      //item filtering
      item_filter: item_filter,
      setItemFilter: setItemFilterWrapper,
      default_item_filter: default_item_filter,
      filter_function: filter_function,
      // location filtering
      location_filter: location_filter,
      setLocationFilter: setLocationFilterWrapper,
      // search query
      search_query: search_query,
      setSearchQuery: setSearchQuery,
      //show icons
      show_icons: show_icons,
      setShowIcons: setShowIconsWrapper,
      // page size
      page_size: page_size,
      setPageSize: setPageSizeWrapper,
      // relative timestamps
      use_relative_timestamps: use_relative_timestamps,
      setUseRelativeTimestamps: setUseRelativeTimestampsWrapper,
      // item ordering
      item_ordering: item_ordering,
      setItemOrdering: setItemOrderingWrapper,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}
