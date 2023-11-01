import Card from 'react-bootstrap/Card'
import Container from 'react-bootstrap/Container'
import { useMQTTDispatch, useMQTTState } from '../MQTTContext'
import React from 'react';
import { Button, Col, Dropdown, DropdownButton, Form, InputGroup, Row, Spinner, Table } from 'react-bootstrap';
import { PaginateWidget, groupBy, paginate, pivot } from '../table_utils';
import { NavLink, useParams } from 'react-router-dom';

import * as dayjs from 'dayjs'
import { useCache } from '../CacheContext'
import { load_current_state, load_location_transactions } from '../fetch_data';


export function LocationPage({ config = {}, location_list }) {

  let params = useParams();
  const current_location_id = params.location_id

  const [page_size, setPageSize] = React.useState(10)

  return <Container fluid className="p-0 d-flex flex-column">
    <Container fluid className="flex-grow-1 p-1">
      <div className='d-flex flex-row justify-content-between'>
        <h1 className='flex-shrink-0 flex-grow-1'>{location_list.find(elem => elem.id === current_location_id).name}:</h1>
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
              <CurrentStatePanel config={config} location_list={location_list} current_location_id={current_location_id} settings={{ page_size: page_size }} />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <TransactionPanel config={config} location_list={location_list} current_location_id={current_location_id} settings={{ page_size: page_size }} />
        </Col>
      </Row>
    </Container>
  </Container>
}

function CurrentStatePanel({ config, current_location_id, settings }) {
  let dispatch = useMQTTDispatch()
  let { items_state } = useMQTTState()

  let [loaded, setLoaded] = React.useState(items_state.length>0)
  let [pending, setPending] = React.useState(false)
  let [error, setError] = React.useState(undefined)
  let [reload, setReload] = React.useState(undefined)
  let { cache_fetch } = useCache();

  let load_current_state_callback = React.useCallback(load_current_state, [])

  React.useEffect(() => {
    if ((!loaded && !pending) | reload) {
      load_current_state_callback(config, dispatch, setPending, setLoaded, setReload, setError)
    }
  }, [config, dispatch, load_current_state_callback, loaded, pending, reload])

  const [active_page, setActive] = React.useState(1)

  if (!loaded) {
    return <Container fluid="md">
      <Card className='mt-2 text-center'>
        {error !== null ? <h1>{error}</h1> : <div><Spinner></Spinner> <h2 className='d-inline'>Loading...</h2></div>}
      </Card>
    </Container>
  }
  let shown_state = items_state.filter(elem => current_location_id === elem.location_link)

  let grouped_state = groupBy(shown_state, "location_link")

  let page_size = settings.page_size
  page_size = Number(page_size)
  let n_pages = Math.ceil((grouped_state[current_location_id] ?? []).length / page_size)
  n_pages = n_pages > 0 ? n_pages : 1

  let current_page_set = pivot([paginate(grouped_state[current_location_id] ?? [], page_size, active_page)])

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
                <td><NavLink className="link-primary link-underline link-underline-opacity-0 link-underline-opacity-75-hover" to={"/item/" + cell?.item_id}>{cache_fetch(cell?.item_id)?.name ?? "loading..."}</NavLink></td>
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
    return <span><i className="bi bi-boxes pe-1" />{entry.quantity}</span>
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

function TransactionPanel({ config, current_location_id, settings }) {
  let [loaded, setLoaded] = React.useState(false)
  let [pending, setPending] = React.useState(false)
  let [error, setError] = React.useState(null)
  let [transactions, setTransactions] = React.useState([])

  let [show_day, setShowDay] = React.useState(dayjs())
  let [period, setPeriod] = React.useState(Object.keys(periods)[0])


  let now = dayjs()
  let start_period = show_day.startOf(period)
  let next_period = show_day.add(1, period).startOf(period)
  let end_period = now.isBefore(next_period) ? now : next_period

  let { cache_fetch } = useCache();

  let load_location_transactions_callback = React.useCallback(load_location_transactions, [])

  React.useEffect(() => {
    if ((loaded?.start !== start_period.toISOString() && loaded?.end !== end_period.toISOString() && !pending)) {
      load_location_transactions_callback(config, current_location_id, setPending, setLoaded, setError, setTransactions, start_period, end_period)
    }
  }, [loaded, pending, config, current_location_id, load_location_transactions_callback, start_period, end_period])

  const [active_page, setActive] = React.useState(1)

  if (!loaded) {
    return <Container fluid="md">
      <Card className='mt-2 text-center'>
        {error !== null ? <h1>{error}</h1> : <div><Spinner></Spinner> <h2 className='d-inline'>Loading...</h2></div>}
      </Card>
    </Container>
  }

  let page_size = settings.page_size
  page_size = Number(page_size)
  let n_pages = Math.ceil((transactions ?? []).length / page_size)
  n_pages = n_pages > 0 ? n_pages : 1

  let current_page_set = paginate(transactions ?? [], page_size, active_page)

  return <Card className='my-2'>
    <Card.Header className='d-flex flex-row justify-content-between'>
      <h3 className='flex-shrink-0 flex-grow-1'>Transations</h3>
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
            <th>Quantity:</th>
            <th>Last Updated:</th>
          </tr>
        </thead>
        <tbody>
          {current_page_set.map((entry, index) => {
            let in_n_out = entry.to_location_link === current_location_id;
            return <tr key={index}>
              <td className={'p-0 text-center align-middle ' + (in_n_out ? "text-success" : "text-danger")}>
                <i className={"bi " + (in_n_out ? "bi-box-arrow-in-down-right" : "bi-box-arrow-up-right")} />
              </td>
              <td><NavLink className="link-primary link-underline link-underline-opacity-0 link-underline-opacity-75-hover" to={"/item/" + entry?.item_id}>{cache_fetch(entry?.item_id)?.name ?? "loading..."}</NavLink></td>
              <td>{entry?.quantity}</td>
              <td>{entry?.timestamp ? do_format(dayjs(entry.timestamp)) : ""}</td>
            </tr>
          })}
        </tbody>
      </Table>
      <PaginateWidget active={active_page} n_pages={n_pages} setPage={(number) => setActive(number)} />
    </Card.Body>
  </Card>
}