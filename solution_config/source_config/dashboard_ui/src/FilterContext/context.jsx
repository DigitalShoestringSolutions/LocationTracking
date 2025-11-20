import React from "react";

import { useIdListForTypes } from "app/api";

const FilterContext = React.createContext();

export function useFilter() {
  const context = React.useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useFilter must be used within a FilterProvider");
  }

  return context;
}

export const FilterProvider = ({ children, config }) => {
  let [item_filter, setItemFilter] = React.useState({}) // map of <type>:bool or <type>:[<id>] 
  let [location_filter, setLocationFilter] = React.useState([]) // list of location ids
  let [search_query, setSearchQuery] = React.useState("")
  let [default_item_filter, setDefaultItemFilter] = React.useState({})

  let [show_icons, setShowIcons] = React.useState(true)
  let [location_types, setLocationTypes] = React.useState([])
  let { data: location_ids } = useIdListForTypes(location_types)
  
  const [page_size, setPageSize] = React.useState(10)

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
    if (raw_storage_item_filter) {
      let storage_item_filter = JSON.parse(raw_storage_item_filter)
      setItemFilter(storage_item_filter)
      console.log("Item filter loaded from storage: ", storage_item_filter)
    } else {
      setItemFilter(default_item_filter)
      console.log("Default item filter used: ", default_item_filter)
    }

    //// Location filter
    // Load config file types
    let config_valid_location_types = config?.locations?.defaults
    // load prior filter value from browser storage
    let raw_storage_location_filter = localStorage.getItem('shown_locations')
    // load existing filter if present else use default
    if (raw_storage_location_filter) {
      let storage_location_filter = JSON.parse(raw_storage_location_filter)
      if (storage_location_filter instanceof Array)
        setLocationFilter(storage_location_filter)
      console.log("Location filter loaded from storage: ", storage_location_filter)
    }
    setLocationTypes(config_valid_location_types) // triggers useIdListForTypes

    //// Show icons
    let raw_storage_show_icons = localStorage.getItem('show_icons')
    if (raw_storage_show_icons !== null) {
      let storage_show_icons = JSON.parse(raw_storage_show_icons)
      setShowIcons(storage_show_icons)
      console.log("Show icons loaded from storage: ", storage_show_icons)
    } else {
      setShowIcons(true)
      console.log("Default show icons used: true")
      
    //// Page size
    let raw_storage_page_size = localStorage.getItem('page_size')
    if (raw_storage_page_size) {
      let storage_page_size = JSON.parse(raw_storage_page_size)
      setPageSize(storage_page_size)
      console.log("Page size loaded from storage: ", storage_page_size)
    } else {
      setPageSize(10)
      console.log("Default page size used: 10")
    }

  }, [config]) //run once on mount

  React.useEffect(() => {
    if (location_ids && location_filter.length == 0) {
      let default_location_filter = location_ids.map(elem => elem.id)
      setLocationFilter(default_location_filter)
      console.log("Default location filter used: ", default_location_filter)
    }
  }, [location_ids])

  const setLocationFilterWrapper = (new_location_filter) => {
    setLocationFilter(new_location_filter)
    if (new_location_filter != undefined) {
      localStorage.setItem("shown_locations", JSON.stringify(new_location_filter))
    } else {
      localStorage.clear("shown_locations")
    }
  }

  const setItemFilterWrapper = (new_item_filter) => {
    setItemFilter(new_item_filter)
    if (new_item_filter != undefined) {
      localStorage.setItem("item_filter", JSON.stringify(new_item_filter))
    } else {
      localStorage.clear("item_filter")
    }
  }

  const setShowIconsWrapper = (new_show_icons) => {
    setShowIcons(new_show_icons)
    if (new_show_icons != undefined) {
      localStorage.setItem("show_icons", JSON.stringify(new_show_icons))
    } else {
      localStorage.clear("show_icons")
      
  const setPageSizeWrapper = (new_page_size) => {
    setPageSize(new_page_size)
    if (new_page_size != undefined) {
      localStorage.setItem("page_size", JSON.stringify(new_page_size))
    } else {
      localStorage.clear("page_size")
    }
  }

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
    <FilterContext.Provider value={{
      location_types: location_types,

      item_filter: item_filter,
      setItemFilter: setItemFilterWrapper,
      location_filter: location_filter,
      setLocationFilter: setLocationFilterWrapper,
      search_query: search_query,
      setSearchQuery: setSearchQuery,

      default_item_filter: default_item_filter,

      filter_function: filter_function,
      show_icons: show_icons,
      setShowIcons: setShowIconsWrapper,

      page_size: page_size,
      setPageSize: setPageSizeWrapper,
    }}>
      {children}
    </FilterContext.Provider>
  );
};
