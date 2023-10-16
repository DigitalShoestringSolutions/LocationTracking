import 'bootstrap/dist/css/bootstrap.css';
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Container from 'react-bootstrap/Container'
import { MQTTProvider, useMQTTControl, useMQTTDispatch, useMQTTState } from './MQTTContext'
import React from 'react';
import APIBackend from './RestAPI'
import './app.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import { custom_new_message_action, CustomReducer } from './custom_mqtt';
import { Form, InputGroup, ListGroup, Nav, Navbar } from 'react-bootstrap';
import { ToastProvider, add_toast, useToastDispatch } from './ToastContext'
import { BrowserRouter, Routes, Route, NavLink, Outlet, useParams } from 'react-router-dom'

function App() {
  let [loaded, setLoaded] = React.useState(false)
  let [pending, setPending] = React.useState(false)
  let [error, setError] = React.useState(null)

  let [config, setConfig] = React.useState([])

  React.useEffect(() => {
    let do_load = async () => {
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
        console.error(err);
        setError("ERROR: Unable to load configuration!")
      })
    }
    if (!loaded && !pending) {
      do_load()
    }
  }, [loaded, pending])

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
        subscriptions={[]}
        new_message_action={custom_new_message_action}
        reducer={CustomReducer}
        initial_state={{ current_item: null }}
        debug={true}
      >
        <ToastProvider position='bottom-end'>
          <BrowserRouter>
            <Routing config={config} />
          </BrowserRouter>
        </ToastProvider>
      </MQTTProvider>
    )
  }
}


function Routing(props) {
  let [location_list, setLocationList] = React.useState([])

  return (
    <Routes>
      <Route path='/' element={<Base location_list={location_list} setLocationList={setLocationList} {...props} />}>
        <Route path='/loc' element={<Dashboard location_list={location_list} config={props.config} />} />
        <Route path='/loc/:location_id' element={<Dashboard location_list={location_list} config={props.config} />} />
        <Route index element={<LocationList location_list={location_list} config={props.config} />}></Route>
      </Route>
    </Routes>
  )
}


function Base({ setLocationList, config }) {
  let [loaded, setLoaded] = React.useState(false)
  let [pending, setPending] = React.useState(false)
  let [error, setError] = React.useState(null)

  React.useEffect(() => {
    let do_load = async () => {
      setPending(true)
      let url = (config.api.host ? config.api.host : window.location.hostname) + (config.api.port ? ":" + config.api.port : "")
      APIBackend.api_get('http://' + url + '/id/list/' + config.locations.tag).then((response) => {
        if (response.status === 200) {
          setLocationList(response.payload)
          setLoaded(true)
        } else {
          console.error("Unable to load list of locations")
          setError("Unable to load list of locations - please try refresh")
        }
      }).catch((err) => {
        console.error(err);
        setError("ERROR: Unable to load location list!")
      })
    }
    if (!loaded && !pending) {
      do_load()
    }
  }, [loaded, pending, config, setLocationList])

  if (!loaded) {
    return <Container fluid="md">
      <Card className='mt-2 text-center'>
        {error !== null ? <h1>{error}</h1> : <div><Spinner></Spinner> <h2 className='d-inline'>Loading...</h2></div>}
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
                <BSNavLink to='/loc'>Scan</BSNavLink>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        {/* </div> */}
        <Container fluid className="flex-grow-1 main-background px-1 pt-2 px-sm-2">
          <Row className="h-100 m-0 d-flex justify-content-center pt-4 pb-5">
            <Col md={10} lg={8}>
              <Outlet />
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

function LocationList({ config = {}, location_list }) {
  return <Container fluid="md">
    <Card className='mt-2'>
      <Card.Header className='text-center'><h1>{config?.locations?.title}</h1></Card.Header>
      <Card.Body>
        <ListGroup>
          {location_list.map(item => (
            <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-baseline">
              <NavLink className="mx-2" to={"/loc/" + encodeURIComponent(item.id)}>
                {item.name}
              </NavLink>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  </Container>
}

function Dashboard({ config = {}, location_list }) {
  let params = useParams();
  const current_location_id = params.location_id
  console.log(current_location_id)
  const current_location = location_list.find(elem => elem.id === current_location_id)
  const { sendJsonMessage } = useMQTTControl()


  const barcodeRef = React.useRef(null);
  const toRef = React.useRef(null);
  const fromRef = React.useRef(null);
  const quantityRef = React.useRef(null);
  const submitRef = React.useRef(null);

  let [barcode, setBarcode] = React.useState("")
  let [item_loaded, setItemLoaded] = React.useState(true)
  let [item_pending, setItemPending] = React.useState(false)
  let [item_error, setItemError] = React.useState(undefined)
  let [item_reload, setItemReload] = React.useState(undefined)

  let [quantity, setQuantity] = React.useState("")
  let [to, setTo] = React.useState("")
  let [from, setFrom] = React.useState("")


  let toast_dispatch = useToastDispatch()
  let dispatch = useMQTTDispatch()
  let { connected, current_item } = useMQTTState()
  let variant = "danger"
  let text = "Disconnected"
  if (connected) {
    variant = "success"
    text = "Connected"
  }

  const handle_barcode_submit = () => {
    console.log("handle_barcode_submit: " + barcode)
    setItemReload(true);
  }

  React.useEffect(() => {
    if (current_location && to !== current_location.id) {
      setTo(current_location.id)
    }
  }, [current_location, to])

  React.useEffect(() => {
    let do_load = async () => {
      console.log("Loading new item")
      setItemLoaded(false);
      setItemPending(true);
      setItemReload(false);

      let url = (config.api.host ? config.api.host : window.location.host) + (config.api.port ? ":" + config.api.port : "")
      APIBackend.api_get('http://' + url + '/id/get/' + config.api.type + '/' + encodeURIComponent(barcode) + "?full").then((response) => {
        if (response.status === 200) {
          console.log("id", response.payload)
          setItemLoaded(true)
          dispatch({ type: 'SET_ITEM', item: response.payload })
          setItemError(false)
        } else {
          console.log("ERROR LOADING ID")
          dispatch({ type: 'SET_ITEM', item: null })
          setItemError(true)
        }
      }).catch(() => (setItemError(true)))
    }
    if ((!item_loaded && !item_pending) | item_reload) {
      do_load()
    }
  }, [barcode, config.api, dispatch, from, item_loaded, item_pending, item_reload])

  React.useEffect(() => {
    if (!current_item) {
      console.log("focus barcode")
      if (barcodeRef?.current)
        barcodeRef.current.focus()
    } else if (!current_item?.individual && !from) {
      console.log("focus from")
      if (fromRef?.current)
        fromRef.current.focus()
    } else if (!to) {
      console.log("focus to")
      if (toRef?.current)
        toRef.current.focus()
    } else {
      console.log("focus submit")
      if (!current_item?.individual) {
        console.log("focus quantity")
        if (quantityRef?.current)
          quantityRef.current.focus()
      } else {
        if (submitRef?.current)
          submitRef.current.focus()
      }
    }
  }, [current_item, from, to])

  const handleSubmit = () => {
    const payload = {
      item: current_item.id,
      to: to,
    }
    let topic = "location_update/" + to

    if (!current_item.individual) {
      payload.quantity = Number(quantity)
      payload.from = from
      topic += "/" + from
    }

    try {
      sendJsonMessage(topic, payload);
      add_toast(toast_dispatch, { header: "Sent", body: "" })

      //reset
      setQuantity("");
      // setTo(""); //don't reset to enable quick rescans
      // setFrom("");
      setBarcode("");
      dispatch({ type: 'SET_ITEM', item: null })
      barcodeRef.current.focus()
    } catch (err) {
      console.error(err)
      add_toast(toast_dispatch, { header: "Error", body: err.message })
    }
  }

  return (
    <Container fluid className="p-0 d-flex flex-column">
      <Container fluid className="flex-grow-1 px-1 pt-2 px-sm-2">
        <Row className="m-0 mx-2 d-flex justify-content-center pt-2 pb-2">
          <Col>
            {/* <CurrentStatus /> */}
            <Card className='my-2'>
              <Card.Header><h4>Update Location:</h4></Card.Header>
              <Card.Body>
                <BarcodeEntry config={config} barcode={barcode} setBarcode={setBarcode} submit={handle_barcode_submit} barcodeRef={barcodeRef} />
                <DisplayItem item={current_item} pending={!item_loaded} error={item_error} />
                <SelectFrom item={current_item} current_location={current_location} location_list={location_list} from={from} setFrom={setFrom} fromRef={fromRef} />
                <SelectTo current_location={current_location} location_list={location_list} to={to} setTo={setTo} toRef={toRef} />
                <SetQuantity item={current_item} quantity={quantity} setQuantity={setQuantity} quantityRef={quantityRef} submitRef={submitRef} />
                <div className="d-grid gap-2">
                  <Button
                    ref={submitRef}
                    variant="success"
                    disabled={current_item == null || (!current_item?.individual && (!quantity || !from)) || !to}
                    onClick={handleSubmit}
                  >Submit</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
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
  )
}

function BarcodeEntry({ submit, barcode, setBarcode, barcodeRef }) {
  return <InputGroup className="mb-3">
    <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-upc-scan me-1' />Barcode</InputGroup.Text>
    <Form.Control
      ref={barcodeRef}
      placeholder="Barcode"
      value={barcode}
      onChange={(event) => setBarcode(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          submit(barcode);
        }
      }}
    />
    <Button variant="primary" onClick={() => submit(barcode)}>
      Check
    </Button>
  </InputGroup>
}

function DisplayItem({ item, pending, error }) {
  if (item == null) {
    return ""
  }

  let form_value = ""
  let form_disabled = false
  let text_value = ""
  if (error) {
    form_value = error
    form_disabled = true
    text_value = <i className='bi bi-exclamation-triangle' />
  } else if (pending) {
    text_value = <Spinner animation="border" variant="secondary" size="sm" />
  } else if (item) {
    form_value = item.name
    form_disabled = true
    text_value = <i className='bi bi-check2' />
  }

  return <InputGroup className="mb-3">
    <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-box me-1' />Item</InputGroup.Text>
    <Form.Control value={form_value} disabled={form_disabled} />
    <InputGroup.Text>{text_value}</InputGroup.Text>
  </InputGroup>
}

function SelectFrom({ item, current_location, location_list, from, setFrom, fromRef }) {
  if (item === null || item.individual) {
    return ""
  }

  return <InputGroup className="mb-3">
    <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-box-arrow-up-right me-1' />From</InputGroup.Text>
    <Form.Select ref={fromRef} value={from} onChange={(event) => setFrom(event.target.value)}>
      <option>Select ...</option>
      {location_list.map(loc => (
        loc.id !== current_location?.id ? <option key={loc.id} value={loc.id}>{loc.name}</option> : ""
      ))}
    </Form.Select>
  </InputGroup>
}

function SelectTo({ current_location, location_list, to, setTo, toRef }) {
  let content = ""
  if (current_location) {
    content = <Form.Control value={current_location.name} disabled />
  } else {
    content = <Form.Select ref={toRef} value={to} onChange={(event) => setTo(event.target.value)}>
      <option>Select ...</option>
      {location_list.map(loc => (
        <option key={loc.id} value={loc.id}>{loc.name}</option>
      ))}
    </Form.Select>
  }
  return <InputGroup className="mb-3">
    <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-box-arrow-in-down-right me-1' />To</InputGroup.Text>
    {content}
  </InputGroup>
}

function SetQuantity({ item, quantity, setQuantity, quantityRef, submitRef }) {
  if (item === null || item.individual) {
    return ""
  }
  return <InputGroup className="mb-3">
    <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-box me-1' />Quantity</InputGroup.Text>
    <Form.Control
      ref={quantityRef}
      type="text"
      value={quantity}
      onChange={(event) => (setQuantity(event.target.value.replace(/\D/, '')))}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          submitRef.current.focus()
        }
      }}
    />
  </InputGroup>
}

// function BatchForm({ config }) {
//   let [product, setProduct] = React.useState("")
//   let [batch, setBatch] = React.useState("")
//   let [expires, setExpires] = React.useState("")
//   let [quantity, setQuantity] = React.useState("")

//   let { sendJsonMessage } = useMQTTControl()

//   let { product: c_product, batch: c_batch, expires: c_expires, quantity: c_quantity } = useMQTTState()

//   const onSubmit = () => {
//     if (product && batch && expires && quantity) {
//       sendJsonMessage("batch_details/" + config.id, { id: config.id, product: product, batch: batch, expires: expires, quantity: quantity }, 1, true);
//       setProduct("");
//       setBatch("");
//       setExpires("");
//       setQuantity("");
//     }
//   }

//   const fillCurrent = () => {
//     if (c_product)
//       setProduct(c_product);
//     if (c_batch)
//       setBatch(c_batch);
//     if (c_expires)
//       setExpires(c_expires);
//     if (c_quantity)
//       setQuantity(c_quantity);
//   }

//   return <Card className='my-2'>
//     <Card.Header><h4>Update Location:</h4></Card.Header>
//     <Card.Body>
//       <Form noValidate validated={true}>
//         <InputGroup className="mb-3">
//           <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-box me-1' />Item</InputGroup.Text>
//           <Form.Control
//             placeholder="Barcode"
//             value={product}
//             onChange={(event) => setProduct(event.target.value)}
//             required
//             isValid={!!product}
//           />
//           <Button variant="primary">
//             Submit
//           </Button>
//         </InputGroup>

//         <InputGroup className="mb-3">
//           <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-box2 me-1' />Batch</InputGroup.Text>
//           <Form.Control
//             placeholder="Batch"
//             value={batch}
//             onChange={(event) => setBatch(event.target.value)}
//             required
//             isValid={!!batch}
//           />
//         </InputGroup>

//         <InputGroup className="mb-3">
//           <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-calendar-week me-1' />Expiry</InputGroup.Text>
//           <Form.Control
//             type="date"
//             value={expires}
//             onChange={(event) => setExpires(event.target.value)}
//             required
//             isValid={!!expires}
//           />
//         </InputGroup>

//         <InputGroup className="mb-3">
//           <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-bullseye me-1' />Quantity</InputGroup.Text>
//           <Form.Control
//             type="text"
//             value={quantity}
//             onChange={(event) => setQuantity(event.target.value.replace(/\D/, ''))}
//             required
//             isValid={!!quantity}
//           />
//         </InputGroup>

//         <Button className='float-end' onClick={onSubmit}>Submit</Button>
//       </Form>
//     </Card.Body>
//   </Card>
// }

export default App;
