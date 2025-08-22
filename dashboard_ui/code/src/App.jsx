import 'bootstrap/dist/css/bootstrap.css';
import Container from 'react-bootstrap/Container'
import { MQTTProvider, useMQTTState } from './MQTTContext'
import './app.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import { custom_new_message_action } from './custom_mqtt';
import { Button, Nav, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ToastProvider } from './ToastContext'
import { BrowserRouter, Routes, Route, NavLink, Outlet, useLocation } from 'react-router-dom'
import { SettingsPage } from './settings';
import { OverviewPage } from './pages/overview';
import { LocationPage } from './pages/location';
import { ItemPage } from './pages/item';

import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import { FilterProvider } from './FilterContext';
dayjs.extend(duration);
dayjs.extend(relativeTime)

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { useConfig } from './api';
import { LoadingIndicator } from './components/loading';
import { ErrorIndicator } from './components/error';

// Create a client
const queryClient = new QueryClient()

function App() {

  return (

    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  )
}

function AppInner() {
  let { data: config, isLoading, error } = useConfig()

  if (isLoading)
    return <LoadingIndicator />
  if (error)
    return <ErrorIndicator error={error} />

  return <MQTTProvider
    host={config?.mqtt?.host ? config.mqtt.host : document.location.hostname}
    port={config?.mqtt?.port ?? 9001}
    prefix={config?.mqtt?.prefix ?? []}
    subscriptions={["location_state/#"]}
    new_message_action={custom_new_message_action}
    initial_state={{ items_state: [], item_history: [], current_item: undefined }}
    debug={false}
  >
    <ToastProvider position='bottom-end'>
      <FilterProvider config={config}>
        <BrowserRouter>
          <Routing />
        </BrowserRouter>
      </FilterProvider>
    </ToastProvider>
  </MQTTProvider>

}

const LOAD_STATE = { STORAGE: 1, CONFIG: 2, COMPLETE: 3 };

function Routing() {
  return (
    <Routes>
      <Route path='/' element={<Base />}>
        <Route path='/settings' element={<SettingsPage />} />
        <Route path='/loc/:location_id' element={<LocationPage />} />
        <Route path='/item/:item_id' element={<ItemPage />} />
        <Route index element={<OverviewPage />}></Route>
      </Route>
    </Routes>
  )
}


function Base() {
  const location = useLocation();

  let { connected } = useMQTTState()

  let variant = "danger"
  let text = "Disconnected"
  if (connected) {
    variant = "success"
    text = "Connected"
  }

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
