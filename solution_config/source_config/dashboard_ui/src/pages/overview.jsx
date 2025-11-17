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
import { useFilter } from '../FilterContext'

const ITEM_ORDERS = {
  alpha: "alpha",
  quantity: "quantity",
  time: "time"
}

const ITEM_TOOLTIPS = {
  alpha: "alphabetical",
  quantity: "quantity",
  time: "recent first"
}

const ITEM_ORDERS_NEXT = {
  alpha: "quantity",
  quantity: "time",
  time: "alpha"
}

const ITEM_ICONS = {
  alpha: "sort-alpha-down",
  quantity: "sort-numeric-down-alt",
  time: "stopwatch"
}

export function OverviewPage() {

  const [page_size, setPageSize] = React.useState(10)
  const [relative_time, setRelativeTime] = React.useState(true)
  const [order_item, setOrderItem] = React.useState(ITEM_ORDERS.quantity)
  const [show_filter_modal, setShowFilter] = React.useState(false)
  const { setSearchQuery } = useFilter()

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
              <OverlayTrigger placement="bottom" overlay={<Tooltip>Time display: {relative_time ? "relative" : "timestamp"}</Tooltip>}>
                <Button variant="outline-secondary" className={'bi bi-' + (relative_time ? "clock-history" : "calendar3")} onClick={() => setRelativeTime(prev => !prev)} />
              </OverlayTrigger>
              <OverlayTrigger placement="bottom" overlay={<Tooltip>Item order: {ITEM_TOOLTIPS[order_item]}</Tooltip>}>
                <Button variant="outline-secondary" className={'bi bi-' + (ITEM_ICONS[order_item] ?? "question-lg")} onClick={() => setOrderItem(prev => ITEM_ORDERS_NEXT[prev])} />
              </OverlayTrigger>
              <DropdownButton variant="outline-secondary" title={"Shown: " + page_size} size="sm" value={page_size}>
                <Dropdown.ItemText>Set Number of Rows Shown</Dropdown.ItemText>
                <Dropdown.Divider />
                {[10, 15, 25, 50].map(elem => (
                  <Dropdown.Item key={elem} value={elem} onClick={() => setPageSize(elem)}>{elem}</Dropdown.Item>
                ))}
              </DropdownButton>
            </InputGroup>
          </Card.Header>
          <Card.Body className='p-0'>
            <ItemTable settings={{ page_size: page_size, relative_time: relative_time, order_item: order_item }} />
          </Card.Body>
        </Card>
      </Container>
      <FilterModal show={show_filter_modal} handleClose={() => { setShowFilter(false) }} />
    </Container>
  )
}

function ItemTable({ settings }) {
  let queryClient = useQueryClient()
  let {search_query} = useFilter()

  let { data: state, isLoading, error } = useCurrentState(search_query)
  const [active_page, setActive] = React.useState(1)

  const { filter_function, location_filter } = useFilter()

  if (isLoading)
    return <LoadingIndicator />
  if (error)
    return <ErrorIndicator error={error} />

  let shown_state = state.filter(filter_function)


  let sort_func = {
    [ITEM_ORDERS.alpha]: (a, b) => {
      let a_entry = queryClient.getQueryData(['id', { id: a.item_id }])?.payload
      let b_entry = queryClient.getQueryData(['id', { id: b.item_id }])?.payload
      if (a_entry?.name > b_entry?.name)
        return 1
      else
        return -1
    },
    [ITEM_ORDERS.quantity]: (a, b) => (b.quantity - a.quantity),
    [ITEM_ORDERS.time]: (a, b) => (b.start - a.start),
  }[settings.order_item] ?? undefined
  let sorted_state = shown_state

  if (sort_func)
    sorted_state = shown_state.sort(sort_func)

  let grouped_state = groupBy(sorted_state, "location_link")

  let page_size = settings.page_size
  page_size = Number(page_size)
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
                <ItemName id={loc_id} show_icon={false} />
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
                <td><DisplayEntry entry={cell} settings={settings} />
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

function DisplayEntry({ entry, settings }) {
  if (entry === undefined)
    return "";
  if (entry?.quantity)
    return <div style={{ width: "max-content" }}><i className="bi bi-hash pe-1" />{entry.quantity}</div>
  else {
    if (settings?.relative_time)
      return <div style={{ width: "max-content" }}><i className="bi bi-stopwatch pe-1" />{dayjs(entry.start).fromNow()}</div>
    else
      return <div style={{ width: "max-content" }}><i className="bi bi-stopwatch pe-1" />{dayjs(entry.start).format("YYYY-MM-DD HH:MM")}</div>
  }
}