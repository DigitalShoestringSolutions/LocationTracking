import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import React from 'react';
import { Dropdown, DropdownButton, InputGroup, Table } from 'react-bootstrap';
import { PaginateWidget, groupBy, paginate, pivot } from '../table_utils';
import dayjs from 'dayjs'
import { FilterModal } from '../panels/filter_modal'
import { useCurrentState } from '../api'
import { LoadingIndicator } from '../components/loading'
import { ErrorIndicator } from '../components/error'
import { ItemName } from '../components/item'
import { useQueryClient } from '@tanstack/react-query'
import { useSettings } from '../SettingsContext'
import { PageSizeSelector } from '../components/page_size'

const ITEM_ORDERS = {
  alpha: "alpha",
  r_alpha: "r_alpha",
  quantity: "quantity",
  r_quantity: "r_quantity",
  time: "time",
  r_time: "r_time"
}

const ITEM_TOOLTIPS = {
  alpha: "alphabetical",
  r_alpha: "reverse alphabetical",
  quantity: "quantity",
  r_quantity: "reverse quantity",
  time: "recent first",
  r_time: "oldest first"
}

const ITEM_ORDERS_NEXT = {
  alpha: "r_alpha",
  r_alpha: "quantity",
  quantity: "r_quantity",
  r_quantity: "time",
  time: "r_time",
  r_time: "alpha"
}

const ITEM_ICONS = {
  alpha: "sort-alpha-down",
  r_alpha: "sort-alpha-up",
  quantity: "sort-numeric-down-alt",
  r_quantity: "sort-numeric-up-alt",
  time: "stopwatch",
  r_time: "clock-history"
}

export function OverviewPage() {
  const [show_filter_modal, setShowFilter] = React.useState(false)
  const { setSearchQuery, item_ordering, setItemOrdering, use_relative_timestamps ,setUseRelativeTimestamps } = useSettings()

  return (
    <Container fluid className="p-0 d-flex flex-column">
      <Container fluid className="flex-grow-1 p-0 ">
        <Card className='my-2'>
          <Card.Header className='d-flex flex-row justify-content-between'>
            <h3 className='flex-shrink-0 flex-grow-1'>Current State: </h3>
            <InputGroup size="sm" className="flex-grow-1 flex-shrink-1 mx-2" style={{ maxWidth: "30%" }}>
              <InputGroup.Text>🔎︎</InputGroup.Text>
              <Form.Control
                placeholder="Search"
                onChange={(e) => {
                  const query = e.target.value.toLowerCase()
                  setSearchQuery(query)
                }}
              />
            </InputGroup>
            <InputGroup size="sm" className="flex-grow-0 flex-shrink-0 my-0" style={{ width: "max-content" }}>
              <OverlayTrigger placement="bottom" overlay={<Tooltip>Filter shown items</Tooltip>}>
                <Button variant="outline-secondary" className='bi bi-funnel-fill' onClick={() => setShowFilter(true)}></Button>
              </OverlayTrigger>
              <OverlayTrigger placement="bottom" overlay={<Tooltip>Time display: {use_relative_timestamps ? "relative" : "timestamp"}</Tooltip>}>
                <Button variant="outline-secondary" className={'bi bi-' + (use_relative_timestamps ? "clock-history" : "calendar3")} onClick={() => setUseRelativeTimestamps(!use_relative_timestamps)} />
              </OverlayTrigger>
              <OverlayTrigger placement="bottom" overlay={<Tooltip>Item order: {ITEM_TOOLTIPS[item_ordering]}</Tooltip>}>
                <Button variant="outline-secondary" className={'bi bi-' + (ITEM_ICONS[item_ordering] ?? "question-lg")} onClick={() => setItemOrdering(ITEM_ORDERS_NEXT[item_ordering])} />
              </OverlayTrigger>
              <PageSizeSelector />
            </InputGroup>
          </Card.Header>
          <Card.Body className='p-0'>
            <ItemTable />
          </Card.Body>
        </Card>
      </Container>
      <FilterModal show={show_filter_modal} handleClose={() => { setShowFilter(false) }} />
    </Container>
  )
}

function sort_alpha(a, b, queryClient) {
  let a_entry = queryClient.getQueryData(['id', { id: a.item_id }])?.payload
  let b_entry = queryClient.getQueryData(['id', { id: b.item_id }])?.payload
  if (a_entry?.name?.toLowerCase() > b_entry?.name?.toLowerCase())
    return 1
  else
    return -1
}

function sort_numeric(a, b) {
  if (a.quantity === undefined || a.quantity === null)
    return 1
  if (b.quantity === undefined || b.quantity === null)
    return -1
  return (b.quantity - a.quantity)
}

function ItemTable({}) {
  let queryClient = useQueryClient()
  let { search_query } = useSettings()

  let { data: state, isLoading, error } = useCurrentState(search_query)
  const [active_page, setActive] = React.useState(1)

  const { filter_function, location_filter, page_size: settings_page_size, item_ordering } = useSettings()

  if (isLoading)
    return <LoadingIndicator />
  if (error)
    return <ErrorIndicator error={error} />

  let shown_state = state.filter(filter_function)


  let sort_func = {
    [ITEM_ORDERS.alpha]: (a, b) => sort_alpha(a, b, queryClient),
    [ITEM_ORDERS.r_alpha]: (a, b) => sort_alpha(b, a, queryClient),
    [ITEM_ORDERS.quantity]: (a, b) => sort_numeric(a, b),
    [ITEM_ORDERS.r_quantity]: (a, b) => sort_numeric(b, a),
    [ITEM_ORDERS.time]: (a, b) => sort_numeric(a, b),
    [ITEM_ORDERS.r_time]: (a, b) => sort_numeric(b, a),
  }[item_ordering] ?? undefined
  let sorted_state = shown_state

  if (sort_func)
    sorted_state = shown_state.sort(sort_func)

  let grouped_state = groupBy(sorted_state, "location_link")

  let page_size = Number(settings_page_size)
  let n_pages = Math.ceil(Math.max(...location_filter.map((k => ((grouped_state[k] ?? []).length)))) / page_size)
  n_pages = n_pages > 0 ? n_pages : 1

  let current_page_set = pivot(location_filter.map((k => (paginate(grouped_state[k] ?? [], page_size, active_page)))))

  return <>
    <Table bordered striped responsive>
      <thead>
        <tr>
          {location_filter.map(loc_id => (
            <th key={loc_id} colSpan={2}>
              <h3>
                <ItemName id={loc_id} show_icon={false} quantity={(grouped_state[loc_id]??[]).length} />
              </h3>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {current_page_set.map((row, index) => (
          <tr key={index}>
            {row.map((cell, rindex) => {
              return <React.Fragment key={rindex}>
                <td><ItemName id={cell?.item_id} /></td>
                <td><DisplayEntry entry={cell} />
                </td>
              </React.Fragment>
            })}
          </tr>
        ))}
      </tbody>
    </Table>
    <PaginateWidget active={active_page} n_pages={n_pages} setPage={(number) => setActive(number)} />
  </>
}

function DisplayEntry({ entry }) {
  let { show_icons: global_show_icons, use_relative_timestamps } = useSettings()
  
  if (entry === undefined)
    return "";
  if (entry?.quantity)
    return <div style={{ width: "max-content" }}><i className="bi bi-hash pe-1" />{entry.quantity}</div>
  else {
    if (use_relative_timestamps)
      return <div style={{ width: "max-content" }}>{global_show_icons ? <i className="bi bi-stopwatch pe-1" /> : ""}{dayjs(entry.start).fromNow(true)}</div>
    else
      return <div style={{ width: "max-content" }}>{global_show_icons ? <i className="bi bi-stopwatch pe-1" /> : ""}{dayjs(entry.start).format("YYYY-MM-DD HH:mm")}</div>
  }

}
