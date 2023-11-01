import React from "react";
import { Button, ButtonGroup, Card, Col, Container, ListGroup, Row } from "react-bootstrap";
import { useCache } from "./CacheContext";
import { LocationSelector } from "./panels/filter_modal";


export function SettingsPage(props) {
  return (
    <Container fluid className="p-0 d-flex flex-column">
      <Container fluid className="flex-grow-1 px-1 pt-2 px-sm-2">
        <Row className="m-0 mx-2 d-flex justify-content-center pt-2 pb-2">
          <Col sm={10} md={8}>
            <Card className='my-2'>
              <Card.Header><h4>Settings</h4></Card.Header>
              <Card.Body>
                <LocationManager {...props} />
                <ClearCache />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Container>
  )
}

function LocationManager({ location_list, config, location_filter, saveLocationFilter, shown_locations, saveShownLocations }) {
  let [available, setAvailable] = React.useState([])
  let [new_shown, setNewShown] = React.useState([])
  let [selected, setSelected] = React.useState(null)
  let [select_type, setSelectType] = React.useState(null)
  let [changed, setChanged] = React.useState(false)

  React.useEffect(() => {
    // let tmp_shown = shown_locations ? location_list.filter(elem => shown_locations.indexOf(elem.id) > -1) : []
    let tmp_shown = shown_locations
      ? shown_locations.reduce((acc, elem) => {
        let res = location_list.find(item => item.id === elem)
        if (res)
          acc.push(res)
        return acc
      }, [])
      : []
    setNewShown(tmp_shown)
    setAvailable(location_list.filter(elem => tmp_shown.indexOf(elem) === -1))
  }, [location_list, location_filter, shown_locations])

  const doSave = () => {
    saveShownLocations(new_shown.map(elem => elem.id))
    setChanged(false)
  }

  return <>
    <Row>
      <h4>Shown Locations
        <Button className="ms-1 float-end" variant="warning" onClick={() => {
          saveLocationFilter(config.locations.defaults.reduce((obj, elem) => { obj[elem] = true; return obj }, {}));
          saveShownLocations(undefined)
          }}>Reset</Button>
        <Button className="float-end" disabled={!changed} onClick={doSave}>Save</Button></h4>
    </Row>
    <Row>
      <LocationSelector config={config} state={location_filter} setState={(filter) => {setChanged(true);saveLocationFilter(filter)}} />
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
              setNewShown(prev => {
                let tmp = [...prev]
                let index = prev.findIndex(elem => elem.id === selected)
                if (index !== -1)
                  tmp.splice(index, 1);
                return tmp
              })
              setAvailable(prev => {
                let entry = location_list.find(elem => elem.id === selected)
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
              setNewShown(prev => {
                let entry = location_list.find(elem => elem.id === selected)
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
          />
          <Button
            className="bi bi-arrow-down"
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
          />
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
  let { clear_cache, get_size } = useCache()
  return <Row className="py-2">
    <h4>Item Name Cache <Button className="float-end" variant="warning" disabled={get_size() === 0} onClick={() => clear_cache()}>Clear</Button></h4>
    <div>Size: {get_size()}</div>
  </Row>
}
