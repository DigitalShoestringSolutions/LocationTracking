import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Container from 'react-bootstrap/Container'
import { useMQTTDispatch, useMQTTState } from '../MQTTContext'
import React from 'react';
import { Dropdown, DropdownButton, InputGroup, Spinner, Table } from 'react-bootstrap';
import { PaginateWidget, groupBy, paginate, pivot } from '../table_utils';
import { NavLink } from 'react-router-dom';
import { useCache } from '../CacheContext'
import dayjs from 'dayjs'
import { load_current_state } from '../fetch_data'
import { FilterModal } from '../panels/filter_modal'

export function OverviewPage({ config = {}, location_list, shown_locations, item_filter, saveItemFilter }) {
  console.log(item_filter)

  let dispatch = useMQTTDispatch()
  let { items_state } = useMQTTState()

  let [loaded, setLoaded] = React.useState(items_state.length > 0)
  let [pending, setPending] = React.useState(false)
  let [error, setError] = React.useState(undefined)
  let [reload, setReload] = React.useState(undefined)

  const [page_size, setPageSize] = React.useState(10)
  const [relative_time, setRelativeTime] = React.useState(true)
  const [show_filter_modal, setShowFilter] = React.useState(false)

  let load_current_state_callback = React.useCallback(load_current_state, [])

  React.useEffect(() => {
    if ((!loaded && !pending) | reload) {
      load_current_state_callback(config, dispatch, setPending, setLoaded, setReload, setError)
    }
  }, [config, config.api, config.db, dispatch, load_current_state_callback, loaded, pending, reload])

  if (!loaded) {
    return <Container fluid="md">
      <Card className='mt-2 text-center'>
        {error !== null ? <h1>{error}</h1> : <div><Spinner></Spinner> <h2 className='d-inline'>Loading...</h2></div>}
      </Card>
    </Container>
  }

  return (
    <Container fluid className="p-0 d-flex flex-column">
      <Container fluid className="flex-grow-1 p-0 ">
        <Card className='my-2'>
          <Card.Header className='d-flex flex-row justify-content-between'>
            <h3 className='flex-shrink-0 flex-grow-1'>Current State: </h3>
            <InputGroup size="sm" className="flex-grow-0 flex-shrink-0 my-0" style={{ width: "max-content" }}>
              <OverlayTrigger placement="bottom" overlay={<Tooltip>Filter shown items</Tooltip>}>
                <Button variant="outline-secondary" className='bi bi-funnel-fill' onClick={() => setShowFilter(true)}></Button>
              </OverlayTrigger>
              <OverlayTrigger placement="bottom" overlay={<Tooltip>Toggle time display</Tooltip>}>
                <Button variant="outline-secondary" className={'bi bi-' + (relative_time ? "clock-history" : "calendar3")} onClick={() => setRelativeTime(prev => !prev)} />
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
            <ItemTable filter={item_filter} state={items_state} shown_locations={shown_locations} location_list={location_list} config={config} settings={{ page_size: page_size, relative_time: relative_time }} />
          </Card.Body>
        </Card>
      </Container>
      <FilterModal current_filter={item_filter} config={config} show={show_filter_modal} handleClose={(filter) => { setShowFilter(false); saveItemFilter(filter) }} />
    </Container>
  )
}

function ItemTable({ filter, state, location_list, shown_locations = [], settings }) {
  let { cache_fetch } = useCache();

  const [active_page, setActive] = React.useState(1)

  let shown_state = state.filter(elem => {
    let type_tag = elem.item_id.split('@')[0]
    let filter_entry = filter[type_tag]
    if (filter_entry === true)
      return shown_locations.indexOf(elem.location_link) >= 0
    if (Array.isArray(filter_entry))
      return (shown_locations.indexOf(elem.location_link) >= 0) && (filter_entry.indexOf(elem.item_id) >= 0)
    return false
  })

  let grouped_state = groupBy(shown_state, "location_link")

  let page_size = settings.page_size
  page_size = Number(page_size)
  let n_pages = Math.ceil(Math.max(...shown_locations.map((k => ((grouped_state[k] ?? []).length)))) / page_size)
  n_pages = n_pages > 0 ? n_pages : 1

  let current_page_set = pivot(shown_locations.map((k => (paginate(grouped_state[k] ?? [], page_size, active_page)))))

  return <>
    <Table bordered striped responsive>
      <thead>
        <tr>
          {shown_locations.map(loc_id => (
            <th key={loc_id} colSpan={2}>
              <h3>
                <NavLink
                  className="link-primary link-underline link-underline-opacity-0 link-underline-opacity-75-hover"
                  to={"/loc/" + loc_id}
                >
                  {location_list.find(elem => elem.id === loc_id)?.name}
                </NavLink>
              </h3>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {current_page_set.map((row, index) => (
          <tr key={index}>
            {row.map((cell, rindex) => {
              let name = ""
              let itemobj = cache_fetch(cell?.item_id)
              if (itemobj) {
                name = itemobj?.name ?? "loading..."
              }
              return <React.Fragment key={rindex}>
                <td><NavLink className="link-primary link-underline link-underline-opacity-0 link-underline-opacity-75-hover" to={"/item/" + cell?.item_id}>{name}</NavLink></td>
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
    return <div style={{ width: "max-content" }}><i className="bi bi-boxes pe-1" />{entry.quantity}</div>
  else {
    if (settings?.relative_time)
      return <div style={{ width: "max-content" }}><i className="bi bi-stopwatch pe-1" />{dayjs(entry.start).fromNow()}</div>
    else
      return <div style={{ width: "max-content" }}><i className="bi bi-stopwatch pe-1" />{dayjs(entry.start).format("YYYY-MM-DD HH:MM")}</div>
  }
}