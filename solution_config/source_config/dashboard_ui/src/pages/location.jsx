import Card from 'react-bootstrap/Card'
import Container from 'react-bootstrap/Container'
import React from 'react';
import { Button, Col, Dropdown, DropdownButton, Form, InputGroup, Row, Table } from 'react-bootstrap';
import { PaginateWidget, paginate, pivot } from '../table_utils';
import { useParams } from 'react-router-dom';

import dayjs from 'dayjs'
import { useEventsAt, useItem, useStateAt } from '../api';
import { LoadingIndicator } from '../components/loading';
import { ErrorIndicator } from '../components/error';
import { ItemName } from '../components/item';


export function LocationPage() {

  let params = useParams();
  const current_location_id = params.location_id

  let { data: current_location, isLoading, error } = useItem(current_location_id)
  const [page_size, setPageSize] = React.useState(10)

  if (isLoading)
    return <LoadingIndicator />
  if (error)
    return <ErrorIndicator error={error} />

  return <Container fluid className="p-0 d-flex flex-column">
    <Container fluid className="flex-grow-1 p-1">
      <div className='d-flex flex-row justify-content-between'>
        <h1 className='flex-shrink-0 flex-grow-1'>{current_location.name}:</h1>
        <InputGroup className="flex-grow-0 flex-shrink-0 my-2" style={{ width: "max-content" }}>
          <DropdownButton variant="outline-secondary" title={"Show: " + page_size} size="sm" value={page_size}>
            <Dropdown.ItemText>Set Number of Rows Shown</Dropdown.ItemText>
            <Dropdown.Divider />
            {[10, 15, 25, 50].map(elem => (
              <Dropdown.Item key={elem} value={elem} onClick={() => setPageSize(elem)}>{elem}</Dropdown.Item>
            ))}
          </DropdownButton>
        </InputGroup>
      </div>
      <Row>
        <Col xs={12} md={6}>
          <Card className='my-2'>
            <Card.Header><h3>Current State</h3></Card.Header>
            <Card.Body className='p-0'>
              <CurrentStatePanel current_location_id={current_location_id} settings={{ page_size: page_size }} />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <TransactionPanel current_location_id={current_location_id} settings={{ page_size: page_size }} />
        </Col>
      </Row>
    </Container>
  </Container>
}

function CurrentStatePanel({ current_location_id, settings }) {
  let { data: state, isLoading, error } = useStateAt(current_location_id)

  const [active_page, setActive] = React.useState(1)

  if (isLoading)
    return <LoadingIndicator />
  if (error)
    return <ErrorIndicator error={error} />

  let page_size = settings.page_size
  page_size = Number(page_size)
  let n_pages = Math.ceil((state ?? []).length / page_size)
  n_pages = n_pages > 0 ? n_pages : 1

  let current_page_set = pivot([paginate(state ?? [], page_size, active_page)])

  return <>
    <Table bordered striped responsive="sm">
      <thead>
        <tr>
          <th>Item:</th>
          <th>Quantity:</th>
          <th>Last Updated:</th>
        </tr>
      </thead>
      <tbody>
        {current_page_set.map((row, index) => (
          <tr key={index}>
            {row.map((cell, rindex) => {
              return <React.Fragment key={rindex}>
                <td><ItemName id={cell?.item_id} /></td>
                <td><DisplayEntry entry={cell} /></td>
                <td>{cell?.start ? do_format(dayjs(cell.start)) : ""}</td>
              </React.Fragment>
            })}
          </tr>
        ))}
      </tbody>
    </Table>
    <PaginateWidget active={active_page} n_pages={n_pages} setPage={(number) => setActive(number)} />
  </>
}

function do_format(timestamp) {
  if (dayjs().isSame(timestamp, 'day')) {
    return timestamp.format("HH:mm")
  }
  return timestamp.format("YYYY-MM-DD HH:mm")
}

function DisplayEntry({ entry, settings }) {
  if (entry === undefined)
    return "";
  if (entry?.quantity)
    return <span><i className="bi bi-hash pe-1" />{entry.quantity}</span>
  else {
    return <span><i className="bi bi-stopwatch pe-1" />{dayjs(entry.start).fromNow()}</span>
  }
}


const periods = {
  'day': {
    unit: 'hour',
    displayFormats: {
      hour: 'HH:mm'
    }
  },
  'week': {
    unit: 'day',
    displayFormats: {
      day: 'ddd DD/MM'
    }
  },
  'month': {
    unit: 'day',
    displayFormats: {
      day: 'DD/MM'
    }
  }
}

function TransactionPanel({ current_location_id, settings }) {

  let [show_day, setShowDay] = React.useState(dayjs())
  let [period, setPeriod] = React.useState(Object.keys(periods)[0])


  let now = dayjs()
  let start_period = show_day.startOf(period)
  let next_period = show_day.add(1, period).startOf(period)
  let end_period = now.isBefore(next_period) ? now.endOf(period) : next_period


  let { data: transactions, isLoading, error } = useEventsAt(current_location_id, start_period, end_period)

  const [active_page, setActive] = React.useState(1)

  if (isLoading)
    return <LoadingIndicator />

  if (error)
    return <ErrorIndicator error={error} />

  let page_size = settings.page_size
  page_size = Number(page_size)
  let n_pages = Math.ceil((transactions ?? []).length / page_size)
  n_pages = n_pages > 0 ? n_pages : 1

  let current_page_set = paginate(transactions ?? [], page_size, active_page)

  return <Card className='my-2'>
    <Card.Header className='d-flex flex-row justify-content-between'>
      <h3 className='flex-shrink-0 flex-grow-1'>Transactions</h3>
      <InputGroup className="my-1 d-flex justify-content-center flex-grow-0 flex-shrink-0" style={{ width: "max-content" }}>
        <Button variant="outline-secondary" onClick={() => setShowDay(show_day.subtract(1, period))}>
          {"<"}
        </Button>
        <InputGroup.Text>{start_period.format("YYYY-MM-DD")}</InputGroup.Text>
        <Form.Select className="flex-grow-0" style={{ width: "max-content" }} value={period} onChange={(event) => setPeriod(event.target.value)}>
          {Object.keys(periods).map(elem => (
            <option key={elem} value={elem}>{elem}</option>
          ))}
        </Form.Select>
        <Button variant="outline-secondary" onClick={() => setShowDay(show_day.add(1, period))} disabled={now.isBefore(next_period)}>
          {">"}
        </Button>
      </InputGroup>
    </Card.Header>
    <Card.Body className='p-0'>
      <Table bordered striped responsive="sm">
        <thead>
          <tr>
            <th className='p-0'></th>
            <th>Item:</th>
            <th>Quantity / Length of Stay:</th>
            <th>Timestamp:</th>
          </tr>
        </thead>
        <tbody>
          {current_page_set.map((entry, index) => {
            let icon = ""
            switch (entry?.type) {
              case "transfer":
                if (entry.to_location_link === current_location_id) {
                  icon = <i className="bi bi-box-arrow-in-down-right text-success">&nbsp;In</i>
                } else {
                  icon = <i className="bi bi-box-arrow-up-right text-danger" >&nbsp;Out</i>
                }
                break
              case "consumed":
                icon = <i className="bi bi-box-arrow-in-down text-danger" >&nbsp;Used</i>
                break
              case "produced":
                if (entry.location_link === current_location_id) {
                  icon = <i className="bi bi-box-arrow-up text-success" >&nbsp;New</i>
                } else {
                  icon = <i className="bi bi-box-arrow-up-right text-danger" >&nbsp;Out</i>
                }
                break
            }



            return <tr key={index}>
              <td className='p-0 text-center align-middle '>
                {icon}
              </td>
              <td><ItemName id={entry.item_id} /></td>
              <td>{entry?.quantity ?? "<individual>"}</td>
              <td>{entry?.timestamp ? do_format(dayjs(entry.timestamp)) : ""}</td>
            </tr>
          })}
        </tbody>
      </Table>
      <PaginateWidget active={active_page} n_pages={n_pages} setPage={(number) => setActive(number)} />
    </Card.Body>
  </Card>
}