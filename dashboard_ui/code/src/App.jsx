import 'bootstrap/dist/css/bootstrap.css';
import Spinner from 'react-bootstrap/Spinner'
import Card from 'react-bootstrap/Card'
import Container from 'react-bootstrap/Container'
import { MQTTProvider, useMQTTState } from './MQTTContext'
import React from 'react';
import './app.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import { custom_new_message_action, CustomReducer } from './custom_mqtt';
import { Button, Nav, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ToastProvider } from './ToastContext'
import { BrowserRouter, Routes, Route, NavLink, Outlet, useLocation } from 'react-router-dom'
import { SettingsPage } from './settings';
import { OverviewPage } from './pages/overview';
import { LocationPage } from './pages/location';
import { ItemPage } from './pages/item';

import * as dayjs from 'dayjs'
import * as duration from 'dayjs/plugin/duration';
import * as relativeTime from 'dayjs/plugin/relativeTime';
import { CacheProvider } from './CacheContext';
import { fetch_new, load_config, load_type_list } from './fetch_data';
dayjs.extend(duration);
dayjs.extend(relativeTime)

function App() {
  let [loaded, setLoaded] = React.useState(false)
  let [pending, setPending] = React.useState(false)
  let [error, setError] = React.useState(null)

  let [config, setConfig] = React.useState([])

  let load_config_callback = React.useCallback(load_config, [])

  React.useEffect(() => {
    if (!loaded && !pending) {
      load_config_callback(setPending, setLoaded, setError, setConfig)
    }
  }, [load_config_callback, loaded, pending])

  if (!loaded) {
    return <Container fluid="md">
      <Card className='mt-2 text-center'>
        {error !== null ? <h1>{error}</h1> : <div><Spinner></Spinner> <h2 className='d-inline'>Loading Config</h2></div>}
      </Card>
    </Container>
  } else {
    return (
      <MQTTProvider
        host={config?.mqtt?.host ? config.mqtt.host : document.location.hostname}
        port={config?.mqtt?.port ?? 9001}
        prefix={config?.mqtt?.prefix ?? []}
        subscriptions={["location_state/#"]}
        new_message_action={custom_new_message_action}
        reducer={CustomReducer}
        initial_state={{ items_state: [], item_history: [], current_item: undefined }}
        debug={false}
      >
        <ToastProvider position='bottom-end'>
          <CacheProvider fetch_new_function={(key, add) => fetch_new(config, key, add)}>
            <BrowserRouter>
              <Routing config={config} />
            </BrowserRouter>
          </CacheProvider>
        </ToastProvider>
      </MQTTProvider>
    )
  }
}

const LOAD_STATE = { STORAGE: 1, CONFIG: 2, COMPLETE: 3 };

function Routing(props) {
  let { config } = props

  let [loading_state, setLoadingState] = React.useState(LOAD_STATE.STORAGE)
  let [location_filter, setLocationFilter] = React.useState(undefined)
  let [shown_locations, setShownLocations] = React.useState(undefined)
  let [item_filter, setItemFilter] = React.useState(undefined)

  let [location_list_loaded, setLocationListLoaded] = React.useState(false)
  let [location_list, setLocationList] = React.useState([])

  //Load from Storage
  React.useEffect(() => {
    if (loading_state === LOAD_STATE.STORAGE) {
      if (localStorage.getItem('location_filter')) {
        setLocationFilter(JSON.parse(localStorage.getItem('location_filter')))
      }
      if (localStorage.getItem('shown_locations')) {
        setShownLocations(JSON.parse(localStorage.getItem('shown_locations')))
      }
      if (localStorage.getItem('item_filter')) {
        setItemFilter(JSON.parse(localStorage.getItem('item_filter')))
      }
      setLoadingState(LOAD_STATE.CONFIG)
    }
  }, [loading_state])

  //Load from Config if not loaded from storage
  React.useEffect(() => {
    if (loading_state === LOAD_STATE.CONFIG) {
      if (location_filter === undefined && config?.locations?.defaults) {
        setLocationFilter(config.locations.defaults.reduce((obj, elem) => { obj[elem] = true; return obj }, {}))
      }
      if (item_filter === undefined && config?.items?.defaults) {
        setItemFilter(config.items.defaults.reduce((obj, elem) => { obj[elem] = true; return obj }, {}))
      }
      setLoadingState(LOAD_STATE.COMPLETE)
    }
  }, [config, item_filter, loading_state, location_filter])

  //Set shown_locations to all if not set from storage
  React.useEffect(() => {
    if (loading_state === LOAD_STATE.COMPLETE && location_list_loaded && shown_locations === undefined) {
      setShownLocations(location_list.map(elem => elem.id))
    }
  }, [loading_state, location_list, location_list_loaded, shown_locations])


  const saveLocationFilter = (new_filter) => {
    setLocationFilter(new_filter)
    if (typeof new_filter === 'function') {
      new_filter = new_filter(location_filter)
    }
    localStorage.setItem('location_filter', JSON.stringify(new_filter));
    setLocationListLoaded(false);
  }

  const saveShownLocations = (shown) => {
    setShownLocations(shown)
    if (shown)
      localStorage.setItem('shown_locations', JSON.stringify(shown));
    else
      localStorage.removeItem('shown_locations');
  }

  const saveItemFilter = (new_filter) => {
    if (new_filter === undefined)
      new_filter = config.items.defaults.reduce((obj, elem) => { obj[elem] = true; return obj }, {})

    setItemFilter(new_filter)
    localStorage.setItem('item_filter', JSON.stringify(new_filter));
  }

  return (
    <Routes>
      <Route path='/' element={<Base location_filter={location_filter} location_list_loaded={location_list_loaded} setLocationListLoaded={setLocationListLoaded} setLocationList={setLocationList} {...props} />}>
        <Route path='/settings' element={<SettingsPage location_list={location_list} config={props.config} location_filter={location_filter} saveLocationFilter={saveLocationFilter} shown_locations={shown_locations} saveShownLocations={saveShownLocations} />} />
        <Route path='/loc/:location_id' element={<LocationPage location_list={location_list} config={props.config} />} />
        <Route path='/item/:item_id' element={<ItemPage location_list={location_list} config={props.config} shown_locations={shown_locations}/>} />
        <Route index element={<OverviewPage item_filter={item_filter} saveItemFilter={saveItemFilter} location_list={location_list} config={props.config} shown_locations={shown_locations} />}></Route>
      </Route>
    </Routes>
  )
}


function Base({ location_list_loaded, setLocationListLoaded, location_filter, setLocationList, config }) {
  let [pending, setPending] = React.useState(false)
  let [error, setError] = React.useState(null)
  const location = useLocation();

  let load_locations_callback = React.useCallback(load_type_list, [])

  let { connected } = useMQTTState()

  let variant = "danger"
  let text = "Disconnected"
  if (connected) {
    variant = "success"
    text = "Connected"
  }

  React.useEffect(() => {
    if (!location_list_loaded && !pending) {
      if (location_filter)
        load_locations_callback(config, Object.keys(location_filter).filter(elem => location_filter[elem]), setPending, setLocationListLoaded, setError, setLocationList)
    }
  }, [location_list_loaded, pending, config, load_locations_callback, setLocationList, location_filter, setLocationListLoaded])

  if (!location_list_loaded) {
    return <Container fluid="md">
      <Card className='mt-2 text-center'>
        {error !== null ? <h1>{error}</h1> : <div><Spinner></Spinner> <h2 className='d-inline'>Loading...</h2></div>}
      </Card>
    </Container>
  } else {
    return <>
      <div className='sidebar flex-shrink-0 border-end bg-dark d-flex flex-column justify-content-between'>
        <div>
          <img
            src="/logo.png"
            alt="S"
            style={{ width: "3rem", height: "3rem", margin: "0.25rem" }}
          />

          <Nav variant="pills" fill={true} className="me-auto">
            {location.pathname !== '/' ? <SidebarLink icon="bi-caret-left-fill" label="Back" to={-1} activeVariant={"bg-secondary"} /> : ""}
            {/* <SidebarButton icon="bi-filter" label="Filter" />
              <SidebarButton icon="bi-clock-history" label="Set Time" /> */}
          </Nav>
        </div>
        <div>
          <Nav variant="pills" fill={true} className="me-auto">
            <SidebarLink icon="bi-gear" label="Settings" to="/settings" />
          </Nav>
          <OverlayTrigger
            placement='right'
            overlay={
              <Tooltip>
                Live updates over MQTT: {text}
              </Tooltip>
            }
          >
            <Button style={{ width: "100%", borderRadius: "0" }} variant={variant} className='bi bi-rss' />
          </OverlayTrigger>
        </div>
      </div>
      <Container fluid className="mainpage vh-100 d-flex flex-column">
        <Container fluid className="p-0 d-flex flex-row flex-grow-1">
          <Container fluid className="flex-grow-1 px-1 pt-2 px-sm-2">
            <Outlet />
          </Container>
        </Container>
      </Container>
    </>
  }
}

function SidebarLink({ icon, label, to = "/", activeVariant }) {
  return (
    <OverlayTrigger placement="right" overlay={<Tooltip>{label}</Tooltip>}>
      <NavLink className={({ isActive }) => (isActive ? ("border-top nav-link active ") + activeVariant : ("border-top nav-link "))} to={to} style={{ borderRadius: '0px' }}>
        <i className={'text-light bi ' + icon} />
      </NavLink>
    </OverlayTrigger>
  )
}

// function SidebarButton({ icon, label, isActive = false }) {
//   return (
//     <OverlayTrigger placement="right" overlay={<Tooltip>{label}</Tooltip>}>
//       <Button variant="none" className={(isActive ? ("border-top nav-link active ") : ("border-top nav-link "))} style={{ borderRadius: '0px', width: "100%" }}>
//         <i className={'text-light bi ' + icon} />
//       </Button>
//     </OverlayTrigger>
//   )
// }

export default App;
