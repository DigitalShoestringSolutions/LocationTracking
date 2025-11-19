import React, { use } from "react";
import { Button, Card, Container, Dropdown, DropdownButton, Form, InputGroup, Spinner, Table } from "react-bootstrap";
import { useParams } from "react-router-dom";
import dayjs from 'dayjs'
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
import { useHistoryFor, useItem, useStateAt, useBulkItem } from "../api";
import { ItemName } from "../components/item";
import { LoadingIndicator } from "../components/loading";
import { ErrorIndicator } from "../components/error";
import { useFilter } from "../FilterContext";

import { PageSizeSelector } from '../components/page_size'

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



export function ItemPage() {
  let params = useParams();
  const current_item_id = params.item_id

  let { data: current_item, isLoading, error } = useItem(current_item_id)


  if (isLoading)
    return <LoadingIndicator />

  if (error)
    return <ErrorIndicator error={error} />


  return <Container fluid className="p-0 d-flex flex-column">
    <Container className="flex-grow-1 p-0 ">
      {current_item.individual
        ? <IndividualItem item={current_item} />
        : <CollectionItem item={current_item} />}
    </Container>
  </Container>

}

function IndividualItem({ item }) {
  const [active_page, setActive] = React.useState(1)
  const {page_size} = useFilter()

  let { data: item_history, isLoading, error } = useHistoryFor(item.id)

  if (isLoading)
    return <LoadingIndicator />

  if (error)
    return <ErrorIndicator error={error} />

  let last_date = ""

  let n_pages = Math.ceil(item_history.length / page_size)
  let current_page_set = paginate(item_history, page_size, active_page)

  return <><Card className='my-2'>
    <Card.Header className='d-flex flex-row justify-content-between'>
      <h4 className='flex-shrink-0 flex-grow-1'>Location History for: {item.name}</h4>
      <InputGroup className="flex-grow-0 flex-shrink-0 my-2" style={{ width: "max-content" }}>
        <PageSizeSelector />
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

              <td><ItemName id={entry.location_link} /></td>
              <td><i className="bi bi-stopwatch pe-1" />{entry.end ? format_duration(dayjs.duration(dayjs(entry.end).diff(start_timestamp))) : "..."}</td>
            </tr>
          })}
        </tbody>
      </Table>
      <PaginateWidget active={active_page} n_pages={n_pages} setPage={(number) => setActive(number)} />
    </Card.Body>
  </Card>
    <ItemComposition item={item} />
  </>
}

function format_duration(d) {
  if (d >= dayjs.duration(1, 'days'))
    return d.format('D[d]H[h]')
  else if (d >= dayjs.duration(1, 'hours'))
    return d.format('H[h]mm')
  else
    return d.format('m[m]ss[s]')
}

function ItemComposition({ item }) {
  let { data: composition, error, isLoading } = useStateAt(item.id)


  if (isLoading)
    return <LoadingIndicator />

  if (error)
    return <ErrorIndicator error={error} />


  return <Card className='my-2'>
    <Card.Header className='d-flex flex-row justify-content-between'>
      <h4 className='flex-shrink-0 flex-grow-1'>Composition of: {item.name}</h4>
    </Card.Header>
    <Card.Body className="p-0">
      <Table striped size="sm">
        <thead>
          <tr>
            <th>Item:</th>
            <th>Quantity:</th>
            <th>Time added:</th>
          </tr>
        </thead>
        <tbody>
          {composition.map((entry, index) => {
            return <tr key={index}>
              <td><ItemName id={entry.item_id} link_if_collective={false} /></td>
              <td>{entry?.quantity ?? "<individual>"}</td>
              <td>{dayjs(entry.start).format('DD/MM/YYYY HH:mm:ss')}</td>
            </tr>
          })}
        </tbody>
      </Table>
    </Card.Body>
  </Card>
}


function CollectionItem({ item }) {

  let { location_filter } = useFilter()

  let { isLoading: locationsLoading, data: location_details } = useBulkItem(location_filter)

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

  let [show_day, setShowDay] = React.useState(dayjs())
  let [period, setPeriod] = React.useState(Object.keys(periods)[0])

  let now = dayjs()
  let start_period = show_day.startOf(period)
  let next_period = show_day.add(1, period).startOf(period)
  let end_period = now.isBefore(next_period) ? now.endOf(period) : next_period

  let { data: item_history, isLoading, error } = useHistoryFor(item.id, start_period, end_period)

  if (isLoading || locationsLoading)
    return <LoadingIndicator />

  if (error)
    return <ErrorIndicator error={error} />



  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      // title: {
      //   display: true,
      //   text: "History for " + item.name + ":",
      //   font: {
      //     size: 35,
      //     weight: "bold"
      //   }
      // },
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
  let filtered_data = location_filter.reduce((acc, key) => { if (raw_data[key]) acc[key] = raw_data[key]; return acc }, {})
  console.log(filtered_data, raw_data, location_filter)
  let datasets = Object.keys(filtered_data).map(loc_id => ({
    label: location_details[loc_id]?.name,
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
    <Card.Header><h3 className="text-center">History for: <ItemName id={item.id} link={false} /></h3></Card.Header>
    <Card.Body>
      <div className="d-flex" style={{ maxHeight: "75vh" }}>
        <Line className="flex-grow-1" options={options} data={data} />
      </div>
    </Card.Body>
    <Card.Footer>
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
    </Card.Footer>
  </Card>
}