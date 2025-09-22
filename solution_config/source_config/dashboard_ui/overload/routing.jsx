import Container from 'react-bootstrap/Container'
import { useMQTTState } from 'core/context/mqtt'
import { Button, Nav, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Routes, Route, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { SettingsPage } from 'app/settings';
import { OverviewPage } from 'app/pages/overview';
import { LocationPage } from 'app/pages/location';
import { ItemPage } from 'app/pages/item';

import 'app/app.css'

export function Routing() {
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
  let navigate = useNavigate()

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
          onClick={() => navigate("/")}
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