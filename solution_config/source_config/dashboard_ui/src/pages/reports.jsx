import React from "react";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import Form from 'react-bootstrap/Form'
import { Button, ButtonGroup, Card, Col, Container, ListGroup, Row, InputGroup } from "react-bootstrap";
import dayjs from 'dayjs'
import { useCreateReport } from '../api'

export function ReportsPage() {
  let [start_datetime, setStartDatetime] = React.useState(dayjs().hour(0).minute(0).second(0).subtract(7, 'day'))
  let [end_datetime, setEndDatetime] = React.useState(dayjs().hour(23).minute(59).second(59))
  let [mode, setMode] = React.useState("state")
  let create_report = useCreateReport()

  const handle_date_change = (new_date_string, current_value, setter) => {
    let new_date = dayjs(new_date_string)
    setter(current_value.year(new_date.year()).month(new_date.month()).date(new_date.date()))
  }

  const handle_time_change = (new_time_string, current_value, setter) => {
    let new_time = dayjs(new_time_string)
    setter(current_value.hour(new_time.hour()).minute(new_time.minute()).second(0))
  }

  const do_export = () => {
    console.log(mode, start_datetime.toISOString(), end_datetime.toISOString())
    create_report.mutate({ type: mode, start: start_datetime.toISOString(), end: end_datetime.toISOString() })
  }

  return (
    <Container fluid className="p-0 d-flex flex-column">
      <Container fluid className="flex-grow-1 px-1 pt-2 px-sm-2">
        <Row className="m-0 mx-2 d-flex justify-content-center pt-2 pb-2">
          <Col sm={10} md={8}>
            <Card className='my-2'>
              <Card.Header><h4>Reports</h4></Card.Header>
              <Card.Body>
                <Form.Label>Report Type</Form.Label>
                <Form.Check
                  type="radio"
                  label="State"
                  name="type"
                  checked={mode == "state"}
                  onChange={() => setMode("state")}
                />
                <Form.Check
                  type="radio"
                  label="Transfer Events"
                  name="type"
                  checked={mode == "transfer"}
                  onChange={() => setMode("transfer")}
                />
                {/* <Form.Check
                  type="radio"
                  label="Production Events"
                  name="type"
                  checked={mode == "production"}
                  onChange={() => setMode("production")}
                /> */}
                <Form.Label>Timeframe</Form.Label>
                {mode != "state" ?
                  <InputGroup className="mt-1">
                    <InputGroup.Text style={{ width: "70px" }}>Start</InputGroup.Text>
                    <Form.Control
                      type="date"
                      value={start_datetime.format("YYYY-MM-DD")}
                      onChange={(evt) => handle_date_change(evt.target.value, start_datetime, setStartDatetime)}
                    />
                    <Form.Control
                      type="time"
                      value={start_datetime.format("HH:mm")}
                      onChange={(evt) => handle_time_change(evt.target.value, start_datetime, setStartDatetime)}
                    />
                  </InputGroup>
                  : ""}
                <InputGroup className="mt-1">
                  <InputGroup.Text style={{ width: "70px" }}>{mode == "state" ? "At" : "End"}</InputGroup.Text>
                  <Form.Control
                    type="date"
                    value={end_datetime.format("YYYY-MM-DD")}
                    onChange={(evt) => handle_date_change(evt.target.value, end_datetime, setEndDatetime)}
                  />
                  <Form.Control
                    type="time"
                    value={end_datetime.format("HH:mm")}
                    onChange={(evt) => handle_time_change(evt.target.value, end_datetime, setEndDatetime)}
                  />
                </InputGroup>
                <Button className="mt-2" onClick={do_export}>Export CSV</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Container>
  )
}
