import React from "react";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import Form from 'react-bootstrap/Form'
import { Button, ButtonGroup, Card, Col, Container, ListGroup, Row } from "react-bootstrap";
import { useQueryClient } from '@tanstack/react-query'
import { useIdListForTypes } from "app/api";
import { useFilter } from "app/FilterContext";


export function SettingsPage() {
  return (
    <Container fluid className="p-0 d-flex flex-column">
      <Container fluid className="flex-grow-1 px-1 pt-2 px-sm-2">
        <Row className="m-0 mx-2 d-flex justify-content-center pt-2 pb-2">
          <Col sm={10} md={8}>
            <Card className='my-2'>
              <Card.Header><h4>Settings</h4></Card.Header>
              <Card.Body>
                <LocationManager />
                <ClearCache />
                <ShowIcons />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Container>
  )
}

function LocationManager() {
  let [available, setAvailable] = React.useState([])
  let [new_shown, setNewShown] = React.useState([])
  let [selected, setSelected] = React.useState(null)
  let [select_type, setSelectType] = React.useState(null)
  let [changed, setChanged] = React.useState(false)

  let { location_types, location_filter, setLocationFilter } = useFilter()
  let { data: all_locations } = useIdListForTypes(location_types)

  React.useEffect(() => {
    if (all_locations) {
      let tmp_shown = location_filter
        ? location_filter.reduce((acc, elem) => {
          let res = all_locations.find(item => item.id === elem)
          if (res)
            acc.push(res)
          return acc
        }, [])
        : []
      setNewShown(tmp_shown)
      setAvailable(all_locations.filter(elem => tmp_shown.indexOf(elem) === -1))
    }
  }, [location_filter, all_locations])

  const doSave = () => {
    setLocationFilter(new_shown.map(elem => elem.id))
    setChanged(false)
  }

  return <>
    <Row>
      <h4>Shown Locations
        <Button className="ms-1 float-end" variant="warning" onClick={() => {
          setLocationFilter(undefined)
        }}>Reset</Button>
        <Button className="float-end" disabled={!changed} onClick={doSave}>Save</Button></h4>
    </Row>
    {/* <Row>
      <LocationSelector config={config} state={location_filter} setState={(filter) => {setChanged(true);saveLocationFilter(filter)}} />
    </Row> */}
    <Row>
      <Col>
        <h4>Available Locations</h4>
      </Col>
      <Col xs={1}></Col>
      <Col>
        <h4>Shown Locations</h4>
      </Col>
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
              setNewShown(prev => {
                let entry = all_locations.find(elem => elem.id === selected)
                return [entry, ...prev]
              })
              setSelectType("shown")
            }}
          >
            Show
          </Button>
          <Button
            disabled={select_type !== "shown"}
            onClick={() => {
              setChanged(true)
              setNewShown(prev => {
                let tmp = [...prev]
                let index = prev.findIndex(elem => elem.id === selected)
                let entry = prev[index]
                tmp.splice(index, 1);
                tmp.splice(index - 1, 0, entry);
                return tmp
              })
            }
            }
          >
            Move up
          </Button>
          <Button
            disabled={select_type !== "shown"}
            onClick={() => {
              setChanged(true)
              setNewShown(prev => {
                let tmp = [...prev]
                let index = prev.findIndex(elem => elem.id === selected)
                let entry = prev[index]
                tmp.splice(index, 1);
                tmp.splice(index + 1, 0, entry);
                return tmp
              })
            }}
          >
            Move down
          </Button>
          <Button
            disabled={select_type !== "shown"}
            onClick={() => {
              setChanged(true)
              setNewShown(prev => {
                let tmp = [...prev]
                let index = prev.findIndex(elem => elem.id === selected)
                if (index !== -1)
                  tmp.splice(index, 1);
                return tmp
              })
              setAvailable(prev => {
                let entry = all_locations.find(elem => elem.id === selected)
                return [entry, ...prev]
              })
              setSelectType("available")
            }}
          >
            Hide
          </Button>
        </ButtonGroup>
      </Col>
      <Col>
        <ListGroup>
          {new_shown.map(elem => (
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

function ClearCache() {
  let [done, setDone] = React.useState(false)
  let queryClient = useQueryClient()

  return <Row className="py-2">
    <h4>Item Name Cache {done ? " (Empty)" : ""}  <Button className="float-end" variant="warning" disabled={done} onClick={() => { queryClient.clear(); setDone(true) }}>Clear</Button></h4>
  </Row>
}

function ShowIcons() {
  let { show_icons, setShowIcons } = useFilter()

  return <Row className="py-2">
    <h4 className="d-flex justify-content-between align-items-center">
      <span>Show Item Icons</span>
      <Form.Check // prettier-ignore
        type="switch" checked={show_icons} onChange={(event) => { setShowIcons(event.target.checked) }} /></h4>
  </Row>
}