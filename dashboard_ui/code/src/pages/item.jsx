import React from "react";
import { Button, Card, Container, Dropdown, DropdownButton, Form, InputGroup, Spinner, Table } from "react-bootstrap";
import { NavLink, useParams } from "react-router-dom";
import dayjs from 'dayjs'
import { useMQTTDispatch, useMQTTState } from "../MQTTContext";
import { PaginateWidget, groupBy, paginate } from "../table_utils";

import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Title,
  Legend,
  Colors,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';
import { useCache } from "../CacheContext";
import { load_item_history } from "../fetch_data";

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTooltip,
  Title,
  Legend,
  Colors
);



export function ItemPage({ config = {}, location_list, shown_locations, settings_page_size }) {
  let params = useParams();
  const current_item_id = params.item_id

  let { cache_fetch } = useCache();

  let current_item = cache_fetch(current_item_id)

  if (!current_item) {
    return <Container fluid="md">
      <Card className='mt-2 text-center'>
        <div><Spinner></Spinner> <h2 className='d-inline'>Loading...</h2></div>
      </Card>
    </Container>
  }

  return <Container fluid className="p-0 d-flex flex-column">
    <Container className="flex-grow-1 p-0 ">
      {current_item.individual
        ? <IndividualItem config={config} item={current_item} location_list={location_list} />
        : <CollectionItem config={config} item={current_item} location_list={location_list} shown_locations={shown_locations} />}
    </Container>
  </Container>

}

function IndividualItem({ config, item, location_list }) {
  const [active_page, setActive] = React.useState(1)
  const [page_size, setPageSize] = React.useState(15)
  let dispatch = useMQTTDispatch()
  let [loaded, setLoaded] = React.useState(false)
  let [pending, setPending] = React.useState(false)
  let [error, setError] = React.useState(undefined)

  let load_item_history_callback = React.useCallback(load_item_history, [])
  let { item_history } = useMQTTState()

  React.useEffect(() => {
    if ((!loaded && !pending)) {
      load_item_history_callback(config, item, setPending, dispatch, setLoaded, setError)
    }
  }, [config, config.api, config.db, dispatch, loaded, item, load_item_history_callback, pending])

  if (!loaded) {
    return <Container fluid="md">
      <Card className='mt-2 text-center'>
        {error !== null ? <h1>{error}</h1> : <div><Spinner></Spinner> <h2 className='d-inline'>Loading...</h2></div>}
      </Card>
    </Container>
  }

  let last_date = ""

  let n_pages = Math.ceil(item_history.length / page_size)
  let current_page_set = paginate(item_history, page_size, active_page)

  return <Card className='my-2'>
    <Card.Header className='d-flex flex-row justify-content-between'>
      <h4 className='flex-shrink-0 flex-grow-1'>{item.name}:</h4>
      <InputGroup className="flex-grow-0 flex-shrink-0 my-2" style={{ width: "max-content" }}>
        <DropdownButton variant="outline-secondary" title={"Show: " + page_size} size="sm" value={page_size}>
          <Dropdown.ItemText>Set Number of Rows Shown</Dropdown.ItemText>
          <Dropdown.Divider />
          {[15, 25, 50].map(elem => (
            <Dropdown.Item key={elem} value={elem} onClick={() => setPageSize(elem)}>{elem}</Dropdown.Item>
          ))}
        </DropdownButton>
      </InputGroup>
    </Card.Header>
    <Card.Body className="p-0">
      <Table striped size="sm">
        <colgroup>
          <col span="1" style={{ width: "6em" }} />
          <col span="1" style={{ width: "6em" }} />
          <col span="1" />
          <col span="1" />
        </colgroup>
        <tbody>
          {current_page_set.map((entry, index) => {
            let start_timestamp = dayjs(entry.start)
            let date = start_timestamp.format('DD/MM/YYYY')
            let shown_date = ""
            if (date !== last_date) {
              shown_date = date
              last_date = date
            }
            return <tr key={index}>
              <td className="text-end">{shown_date}</td>
              <td>{start_timestamp.format('HH:mm:ss')}</td>
              <td><i className="bi bi-geo-alt pe-1" /><NavLink className="link-primary link-underline link-underline-opacity-0 link-underline-opacity-75-hover" to={"/loc/" + entry.location_link}>{location_list.find(elem => elem.id === entry.location_link).name}</NavLink></td>
              <td><i className="bi bi-stopwatch pe-1" />{entry.end ? format_duration(dayjs.duration(dayjs(entry.end).diff(start_timestamp))) : "..."}</td>
            </tr>
          })}
        </tbody>
      </Table>
      <PaginateWidget active={active_page} n_pages={n_pages} setPage={(number) => setActive(number)} />
    </Card.Body>
  </Card>
}

function format_duration(d) {
  if (d >= dayjs.duration(1, 'days'))
    return d.format('D[d]H[h]')
  else if (d >= dayjs.duration(1, 'hours'))
    return d.format('H[h]mm')
  else
    return d.format('m[m]ss[s]')
}

function CollectionItem({ config, item, location_list, shown_locations }) {

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

  let dispatch = useMQTTDispatch()

  let [loaded, setLoaded] = React.useState(false)
  let [pending, setPending] = React.useState(false)
  let [error, setError] = React.useState(undefined)

  let [show_day, setShowDay] = React.useState(dayjs())
  let [period, setPeriod] = React.useState(Object.keys(periods)[0])

  let load_item_history_callback = React.useCallback(load_item_history, [])

  let { item_history } = useMQTTState()

  let now = dayjs()
  let start_period = show_day.startOf(period)
  let next_period = show_day.add(1, period).startOf(period)
  let end_period = now.isBefore(next_period) ? now : next_period

  React.useEffect(() => {
    if ((loaded?.start !== start_period.toISOString() && loaded?.end !== end_period.toISOString() && !pending)) {
      load_item_history_callback(config, item, setPending, dispatch, setLoaded, setError, start_period, end_period)
    }
  }, [config, config.api, config.db, dispatch, end_period, loaded, item, load_item_history_callback, pending, start_period])

  if (!loaded) {
    return <Container fluid="md">
      <Card className='mt-2 text-center'>
        {error !== null ? <h1>{error}</h1> : <div><Spinner></Spinner> <h2 className='d-inline'>Loading...</h2></div>}
      </Card>
    </Container>
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: "History for " + item.name + ":",
        font: {
          size: 35,
          weight: "bold"
        }
      },
    },
    scales: {
      x: {
        type: 'time',
        time: periods[period],
        min: start_period.toISOString(),
        max: end_period.toISOString(),
      }
    },
    interaction: {
      axis: "xy",
      mode: "nearest",
      intersect: false,
    }
  };

  let raw_data = groupBy(item_history, "location_link")
  let filtered_data = shown_locations.reduce((acc, key) => { if (raw_data[key]) acc[key] = raw_data[key]; return acc }, {})
  console.log(filtered_data, raw_data, shown_locations)
  let datasets = Object.keys(filtered_data).map(loc_id => ({
    label: location_list.find(elem => elem.id === loc_id).name,
    data: filtered_data[loc_id].reduce((acc, elem) => {
      acc.unshift({ y: elem.quantity, x: elem.end ? elem.end : end_period.toISOString() })
      acc.unshift({ y: elem.quantity, x: dayjs(elem.start) < start_period ? start_period.toISOString() : elem.start })
      return acc
    }, []),
  }))

  datasets.sort((a, b) => a.label > b.label)

  const data = {
    datasets: datasets
  };

  return <Card className="mb-5">
    <div className="d-flex" style={{ maxHeight: "75vh" }}>
      <Line className="flex-grow-1" options={options} data={data} />
    </div>
    <InputGroup className="my-1 d-flex justify-content-center">
      <Button variant="primary" onClick={() => setShowDay(show_day.subtract(1, period))}>
        {"<"}
      </Button>
      <InputGroup.Text>{start_period.format("YYYY-MM-DD")}</InputGroup.Text>
      <Form.Select className="flex-grow-0" style={{ width: "max-content" }} value={period} onChange={(event) => setPeriod(event.target.value)}>
        {Object.keys(periods).map(elem => (
          <option key={elem} value={elem}>{elem}</option>
        ))}
      </Form.Select>
      <Button variant="primary" onClick={() => setShowDay(show_day.add(1, period))} disabled={now.isBefore(next_period)}>
        {">"}
      </Button>
    </InputGroup>
  </Card>
}