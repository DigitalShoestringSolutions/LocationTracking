
import APIBackend from './RestAPI'

export const load_config = async (setPending, setLoaded, setError, setConfig) => {
  setPending(true)
  APIBackend.api_get('http://' + document.location.host + '/config/config.json').then((response) => {
    if (response.status === 200) {
      const raw_conf = response.payload;
      console.log("config", raw_conf)
      setConfig(raw_conf)
      setLoaded(true)
    } else {
      console.log("ERROR LOADING CONFIG")
      setError("ERROR: Unable to load configuration!")
    }
  }).catch((err) => {
    console.error(err.message);
    setError("ERROR: Unable to load configuration!")
  })
}

export const fetch_new = async (config, keys, add_function) => {
  let searchParams = new URLSearchParams()
  keys.forEach(key => {
    searchParams.append("id", encodeURIComponent(key))
  });
  let url = (config.api.host ? config.api.host : window.location.hostname) + (config.api.port ? ":" + config.api.port : "")
  APIBackend.api_get('http://' + url + '/id/?' + searchParams.toString()).then((response) => {
    if (response.status === 200) {
      // add_function(response.payload.id, response.payload);
      response.payload.forEach((elem) => {
        console.log(elem)
        add_function(elem.id, elem);
      })
    } else {
      console.error("Unable to load items for: ", keys);
    }
  }).catch((err) => {
    console.error(err.message);
  })
}

export const load_type_list = async (config, types, setPending, setLoaded, setError, setState) => {
  if(!Array.isArray(types)){
    types = [types]
  }
  setPending(true)
  let searchParams = new URLSearchParams()
  types.forEach(key => {
    searchParams.append("type", encodeURIComponent(key))
  });
  let url = (config.api.host ? config.api.host : window.location.hostname) + (config.api.port ? ":" + config.api.port : "")
  APIBackend.api_get('http://' + url + '/id/list?' + searchParams.toString()).then((response) => {
    if (response.status === 200) {
      setState(response.payload)
      setLoaded(true)
      setPending(false)
    } else {
      console.error("Unable to load list of for tag "+types)
      setError("Unable to load list for types - please try refresh")
      setPending(false)
    }
  }).catch((err) => {
    console.error(err.message);
    setError("ERROR: Unable to load list for types!")
    setPending(false)
  })
}

export const load_types = async (config, setPending, setLoaded, setError, setState) => {
  setPending(true)
  let url = (config.api.host ? config.api.host : window.location.hostname) + (config.api.port ? ":" + config.api.port : "")
  APIBackend.api_get('http://' + url + '/id/types').then((response) => {
    if (response.status === 200) {
      setState(response.payload)
      setLoaded(true)
    } else {
      console.error("Unable to load list of types")
      setError("Unable to load list of types - please try refresh")
    }
  }).catch((err) => {
    console.error(err.message);
    setError("ERROR: Unable to load type list!")
  })
}

export const load_current_state = async (config, dispatch, setPending, setLoaded, setReload, setError) => {
  setLoaded(false);
  setPending(true);
  setReload(false);

  let url = (config.db.host ? config.db.host : window.location.hostname) + (config.db.port ? ":" + config.db.port : "")
  APIBackend.api_get('http://' + url + '/state/').then((response) => {
    if (response.status === 200) {
      setLoaded(true)
      dispatch({ type: 'SET_ITEMS', item: response.payload })
      setError(false)
    } else {
      console.log("ERROR LOADING ITEMS")
      dispatch({ type: 'SET_ITEMS', item: null })
      setError(true)
    }
  }).catch((err) => {
    console.error(err.message);
    setError("ERROR: Unable to load items list!")
  })
}

export const load_item_history = async (config, item, setPending, dispatch, setLoaded, setError, start_period = null, end_period = null) => {
  console.log("Loading item history")
  setLoaded(false);
  setPending(true);

  let url = (config.db.host ? config.db.host : window.location.hostname) + (config.db.port ? ":" + config.db.port : "")
  console.log(url)
  const searchParams = new URLSearchParams();
  if (start_period) {
    searchParams.append("from", start_period.toISOString())
  }
  if (end_period) {
    searchParams.append("to", end_period.toISOString())
  }
  let search_string = searchParams.size > 0 ? "?" + searchParams.toString() : ""

  APIBackend.api_get('http://' + url + '/state/history/for/' + encodeURIComponent(item.id) + search_string).then((response) => {
    if (response.status === 200) {
      setPending(false)
      dispatch({ type: 'ITEM_HISTORY', dataset: response.payload, current_item: item.id })
      setError(false)
    } else {
      console.log("ERROR LOADING ITEM HISTORY")
      dispatch({ type: 'ITEM_HISTORY', dataset: null, current_item: undefined })
      setError(true)
      setPending(false)
    }
    if (start_period && end_period) {
      setLoaded({ start: start_period.toISOString(), end: end_period.toISOString() })
    } else {
      setLoaded(true)
    }
  }).catch((err) => {
    console.error(err.message);
    setError("ERROR: Unable to load items list!")
  })
}

export const load_location_transactions = async (config, current_location_id, setPending, setLoaded, setError, setTransactions, start_period, end_period) => {
  setPending(true)
  let url = (config.db.host ? config.db.host : window.location.hostname) + (config.db.port ? ":" + config.db.port : "")
  const searchParams = new URLSearchParams();
  if (start_period) {
    searchParams.append("from", start_period.toISOString())
  }
  if (end_period) {
    searchParams.append("to", end_period.toISOString())
  }
  let search_string = searchParams.size > 0 ? "?" + searchParams.toString() : ""

  APIBackend.api_get('http://' + url + '/events/at/' + current_location_id + search_string).then((response) => {
    if (response.status === 200) {
      setTransactions(response.payload)
      setLoaded({ start: start_period.toISOString(), end: end_period.toISOString() })
      setPending(false)
    } else {
      console.error("Unable to load list of item transactions")
      setError("Unable to load list of item transactions - please try refresh")
    }
  }).catch((err) => {
    console.error(err.message);
    setError("ERROR: Unable to load item transactions list!")
  })
}