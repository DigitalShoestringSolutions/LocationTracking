import React from "react";
import { Button, ButtonGroup, Card, Col, Container, Form, ListGroup, OverlayTrigger, Row, Tooltip } from "react-bootstrap";


export function SettingsPage({ location_list, config, shown_locations, setShownLocations, setPageSize, page_size }) {
  return (
    <Container fluid className="vh-100 p-0 d-flex flex-column">
      <Container fluid className="flex-grow-1 px-1 pt-2 px-sm-2">
        <Row className="m-0 mx-2 d-flex justify-content-center pt-2 pb-2">
          <Col sm={10} md={8}>
            <Card className='my-2'>
              <Card.Header><h4>Settings</h4></Card.Header>
              <Card.Body>
                <LocationManager location_list={location_list} shown_locations={shown_locations} setShownLocations={setShownLocations} />
                <PageSizeManager setPageSize={setPageSize} page_size={page_size} />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Container>
  )
}

function LocationManager({ location_list, shown_locations, setShownLocations }) {
  let [available, setAvailable] = React.useState([])
  let [shown, setShown] = React.useState([])
  let [selected, setSelected] = React.useState(null)
  let [select_type, setSelectType] = React.useState(null)
  let [changed, setChanged] = React.useState(false)

  React.useEffect(() => {
    setAvailable(location_list.filter((el) => !shown_locations.includes(el.id)))
    setShown(shown_locations.map(elem_id => (location_list.find(elem => elem.id === elem_id))))
  }, [location_list, shown_locations])

  const doSave = () => {
    setShownLocations(shown.map(elem => elem.id))
    setChanged(false)
  }

  return <>
    <Row>
      <h4>Shown Locations<Button className="float-end" disabled={!changed} onClick={doSave}>Save</Button></h4>
    </Row>
    <Row>
      <Col>
        <ListGroup>
          {available.map(elem => (
            <ListGroup.Item
              key={elem.id}
              onClick={() => { setSelected(elem.id); setSelectType("available") }}
              variant={selected === elem.id ? "primary" : ""}
            >{elem.name}</ListGroup.Item>
          ))}
        </ListGroup>
      </Col>
      <Col xs={1} className="d-flex justify-content-center">
        <ButtonGroup vertical>
          <Button
            className="bi bi-arrow-left"
            disabled={select_type !== "shown"}
            onClick={() => {
              setChanged(true)
              setShown(prev => {
                let tmp = [...prev]
                let index = prev.findIndex(elem => elem.id === selected)
                if (index !== -1)
                  tmp.splice(index, 1);
                return tmp
              })
              setAvailable(prev => {
                let entry = location_list.find(elem => elem.id === selected)
                console.log(entry)
                return [entry, ...prev]
              })
              setSelectType("available")
            }}
          />
          <Button
            className="bi bi-arrow-right"
            disabled={select_type !== "available"}
            onClick={() => {
              setChanged(true)
              setAvailable(prev => {
                let tmp = [...prev]
                let index = prev.findIndex(elem => elem.id === selected)
                if (index !== -1)
                  tmp.splice(index, 1);
                return tmp
              })
              setShown(prev => {
                let entry = location_list.find(elem => elem.id === selected)
                console.log(entry)
                return [entry, ...prev]
              })
              setSelectType("shown")
            }}
          />
          <Button
            className="bi bi-arrow-up"
            disabled={select_type !== "shown"}
            onClick={() => {
              setChanged(true)
              setShown(prev => {
                let tmp = [...prev]
                let index = prev.findIndex(elem => elem.id === selected)
                let entry = prev[index]
                tmp.splice(index, 1);
                tmp.splice(index - 1, 0, entry);
                return tmp
              })
            }
            }
          />
          <Button
            className="bi bi-arrow-down"
            disabled={select_type !== "shown"}
            onClick={() => {
              setChanged(true)
              setShown(prev => {
                let tmp = [...prev]
                let index = prev.findIndex(elem => elem.id === selected)
                let entry = prev[index]
                tmp.splice(index, 1);
                tmp.splice(index + 1, 0, entry);
                return tmp
              })
            }}
          />
        </ButtonGroup>
      </Col>
      <Col>
        <ListGroup>
          {shown.map(elem => (
            <ListGroup.Item
              key={elem.id}
              onClick={() => { setSelected(elem.id); setSelectType("shown") }}
              variant={selected === elem.id ? "primary" : ""}
            >{elem.name}</ListGroup.Item>
          ))}
        </ListGroup>
      </Col>
    </Row>
  </>
}

function PageSizeManager({ page_size, setPageSize }) {
  let [changed, setChanged] = React.useState(false)
  let [n, setN] = React.useState(page_size)

  React.useEffect(() => {
    setN(page_size)
  }, [page_size])

  const doSave = () => {
    setPageSize(n)
    setChanged(false)
  }

  let values = [5, 10, 15, 25, 50]

  return <>
    <Row>
      <h4>Table Height<Button className="float-end" disabled={!changed} onClick={doSave}>Save</Button></h4>
    </Row>
    <Row className="px-2">
      <Form.Select value={n} onChange={(event) => {setN(Number(event.target.value));setChanged(true)}}>
        {values.map(val => (
          <option key={val} value={val}>{val}</option>
        ))}
      </Form.Select>
    </Row>
  </>
}