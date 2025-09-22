
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import ListGroup from 'react-bootstrap/ListGroup';
import { useMQTTState } from 'core/context/mqtt'
import { Routes, Route, NavLink, Outlet } from 'react-router-dom'


import { useLocationList } from 'app/api';

import { ProductionOperation } from 'app/pages/production';
import { TransferOperation } from 'app/pages/transfer';

import 'app/app.css'

export function Routing() {
  return (
    <Routes>
      <Route path='/' element={<Base />}>
        <Route path='/transfer' element={<TransferOperation />} />
        <Route path='/transfer/:location_id' element={<TransferOperation />} />
        <Route path='/production' element={<ProductionOperation />} />
        <Route path='/production/:location_id' element={<ProductionOperation />} />
        <Route index element={<LocationList />}></Route>
      </Route>
    </Routes>
  )
}


function Base() {

  let { connected } = useMQTTState()
  let variant = "danger"
  let text = "Disconnected"
  if (connected) {
    variant = "success"
    text = "Connected"
  }


  let { isLoading, isError } = useLocationList()

  if (isLoading) {
    return <Container fluid="md">
      <Card className='mt-2 text-center'>
        <div><Spinner></Spinner> <h2 className='d-inline'>Loading...</h2></div>
      </Card>
    </Container>
  } else if (isError) {
    <Container fluid="md">
      <Card className='mt-2 text-center'>
        <h1>ERROR: Unable to load location list!</h1>
      </Card>
    </Container>
  } else {
    return (
      <Container fluid className="p-0 d-flex flex-column">
        {/* <div id='header'> */}
        <Navbar sticky="top" bg="secondary" variant="dark" expand="md">
          <Container fluid>
            <Navbar.Brand href="/">
              Shoestring Location Tracking
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" className='mb-2' />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav variant="pills" className="me-auto">
                <BSNavLink to='/'>Choose Location</BSNavLink>
                <BSNavLink to='/transfer'>Transfer to any Location</BSNavLink>
                <BSNavLink to='/production'>Record Production at any Location</BSNavLink>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        {/* </div> */}
        <Container fluid className="flex-grow-1 main-background px-1 pt-2 px-sm-2">
          <Row className="h-100 m-0 d-flex justify-content-center pt-4 pb-5">
            <Col md={10} lg={8}>
              <Container fluid className="p-0 d-flex flex-column">
                <Outlet />
                <div className='bottom_bar'>
                  <ButtonGroup aria-label="Basic example">
                    <OverlayTrigger
                      placement='top'
                      overlay={
                        <Tooltip>
                          Live updates over MQTT: {text}
                        </Tooltip>
                      }
                    >
                      <Button variant={variant} className='bi bi-rss'>{" " + text}</Button>
                    </OverlayTrigger>
                  </ButtonGroup>
                </div>
              </Container>
            </Col>
          </Row>
        </Container>
      </Container>
    )
  }
}

function BSNavLink({ children, className, ...props }) {
  return <NavLink className={({ isActive }) => (isActive ? ("nav-link active " + className) : ("nav-link " + className))} {...props}>{children}</NavLink>
}

function LocationList() {
  let { data: location_list } = useLocationList()

  if (location_list) {
    return <Container fluid="md">
      <Card className='mt-2'>
        <Card.Header className='text-center'><h1>Locations</h1></Card.Header>
        <Card.Body>
          <ListGroup>
            {location_list.map(item => (
              <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-baseline flex-wrap">
                <div className='flex-grow-1 flex-shrink-0'>
                  {item.name}
                </div>
                <span className='flex-shrink-1'>
                  <NavLink to={"/transfer/" + encodeURIComponent(item.id)}>
                    <Button className="m-1" variant="primary">Transfer Item(s)</Button>
                  </NavLink>
                  <NavLink to={"/production/" + encodeURIComponent(item.id)}>
                    <Button className="m-1">Record Production</Button>
                  </NavLink>
                </span>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card>
    </Container>
  } else { return "List not loaded" }
}

