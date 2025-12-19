import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import React, { use } from 'react';
import { Dropdown, DropdownButton, InputGroup, Table, Modal, Spinner } from 'react-bootstrap';
import { PaginateWidget, groupBy, paginate, pivot } from '../table_utils';
import dayjs from 'dayjs'
import { FilterModal } from '../panels/filter_modal'
import { useCurrentState, useCurrentStatus, useStatusOptions, useSetStatus, useNotes, useSaveNote, useDeleteNote, useItem } from '../api'
import { LoadingIndicator } from '../components/loading'
import { ErrorIndicator } from '../components/error'
import { ItemName } from '../components/item'
import { useQueryClient } from '@tanstack/react-query'
import { useSettings } from '../SettingsContext'
import { PageSizeSelector } from '../components/page_size'
import Select from 'react-select';
import chroma from "chroma-js";


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
  const { setSearchQuery, item_ordering, setItemOrdering, use_relative_timestamps, setUseRelativeTimestamps } = useSettings()

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
  if (a === undefined || a === null)
    return 1
  if (b === undefined || b === null)
    return -1
  return (b - a)
}

function ItemTable({ }) {
  let queryClient = useQueryClient()
  let { search_query } = useSettings()
  let [show_tag_modal, setShowTagModal] = React.useState(null)

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
    [ITEM_ORDERS.quantity]: (a, b) => sort_numeric(a?.quantity, b?.quantity),
    [ITEM_ORDERS.r_quantity]: (a, b) => sort_numeric(b?.quantity, a?.quantity),
    [ITEM_ORDERS.time]: (a, b) => sort_numeric(dayjs(a.start), dayjs(b.start)),
    [ITEM_ORDERS.r_time]: (a, b) => sort_numeric(dayjs(b.start), dayjs(a.start)),
  }[item_ordering] ?? undefined
  let sorted_state = shown_state

  if (sort_func)
    sorted_state = shown_state.sort(sort_func)

  let grouped_state = groupBy(sorted_state, "location_link")

  let page_size = Number(settings_page_size)
  let n_pages = Math.ceil(Math.max(...location_filter.map((k => ((grouped_state[k] ?? []).length)))) / page_size)
  n_pages = n_pages > 0 ? n_pages : 1

  let current_page_set = pivot(location_filter.map((k => (paginate(grouped_state[k] ?? [], page_size, active_page)))))

  const handleTagClick = (id, location) => {
    setShowTagModal({ id: id, location: location });
  }

  return <>
    <Table bordered striped responsive>
      <colgroup>
        {
          // Create three columns per location: tag, item name, entry
          location_filter.map(loc_id => (<React.Fragment key={loc_id}>
            <col span="1" style={{ width: "40px" }} />
            <col span="1" />
            <col span="1" />
          </React.Fragment>
          ))}
      </colgroup>
      <thead>
        <tr>
          {location_filter.map(loc_id => (
            <th key={loc_id} colSpan={3}>
              <h3>
                <ItemName id={loc_id} show_icon={false} quantity={(grouped_state[loc_id] ?? []).length} />
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
                <Tag id={cell?.item_id} location={cell?.location_link} handleTagClick={() => handleTagClick(cell?.item_id, cell?.location_link)} />
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
    <TagModal show={show_tag_modal !== null} handleClose={() => setShowTagModal(null)} tag_id={show_tag_modal?.id} tag_location={show_tag_modal?.location} />
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

function Tag({ id, location, handleTagClick }) {
  let { isLoading: current_status_loading, data: current_status } = useCurrentStatus(id, location);
  let { isLoading: notes_loading, data: notes_data } = useNotes(id);
  if (id === undefined)
    return <td></td>;

  if (current_status_loading) {
    return <td>...</td>
  }

  let icon = "bi-plus"
  if (current_status?.icon) {
    icon = "bi-" + current_status.icon
  }

  let color = "inherit"
  let indicator = "light"
  if (current_status?.color) {
    color = current_status?.color
    indicator = chroma.contrast(color, "white") > chroma.contrast(color, "black") ? "dark" : "light"
  }

  return <td
    className={'p-0 ' + indicator + " " + (notes_data && notes_data?.filter(elem => elem?.location_link == location)?.length > 0 ? "has-note" : "")}
    style={{
      backgroundColor: color
    }}
  >
    < OverlayTrigger placement="top" overlay={< Tooltip >Status: {current_status?.label}</Tooltip >}>
      <Button className="tag-icon" onClick={handleTagClick}><i style={{ fontSize: "1.6rem" }} className={("bi " + icon)} /></Button>
    </OverlayTrigger >
  </td>
}

// const show_icon = (icon = null, color = null) => {
//   console.log(icon, color)
//   return {
//     alignItems: 'center',
//     display: 'flex',

//     ':before': {
//       color: color,
//       content: '"\f82e"',
//       display: 'block',
//       marginRight: 8,
//       height: 10,
//       width: 10,
//     },
//   }
// };

// const colourStyles = {
//   singleValue: (styles, { data }) => ({ ...styles, ...show_icon(data.icon, data.color) }),
// };

let null_placeholder = "$NONE$"

function TagModal({ show, handleClose, tag_id, tag_location }) {
  let { isLoading: current_status_loading, data: current_status } = useCurrentStatus(tag_id, tag_location);
  let { isLoading: status_options_loading, data: status_options_data } = useStatusOptions();
  let set_status = useSetStatus(tag_id, tag_location);


  let options_list = status_options_data?.map(elem => ({ ...elem, value: elem.id })) ?? []

  options_list.unshift({ label: "None", value: null_placeholder })

  let select_value = { label: current_status?.label ?? "None", value: current_status?.id ?? null_placeholder }

  return (
    <Modal show={show} size="lg" onHide={handleClose}>
      <Modal.Header closeButton>
        <span className='w-50'>Status</span>
        <Select
          isLoading={status_options_loading || current_status_loading}
          isSearchable={true}
          name="status"
          className="w-50"
          options={options_list}
          value={select_value}
          onChange={(selectedOption) => {

            let value = selectedOption?.value
            if (value === null_placeholder)
              value = null
            set_status.mutate(value)
          }}
        // styles={colourStyles}
        />
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "75vh" }} className='overflow-scroll'>
        <Notes tag_id={tag_id} tag_location={tag_location} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

function Notes({ tag_id, tag_location }) {
  let { isLoading: notes_loading, data: notes_data } = useNotes(tag_id);
  let [new_note, setNewNote] = React.useState(false)
  let [location_only, setLocationOnly] = React.useState(false)

  return <div className='d-flex flex-column'>
    <div className='d-flex flex-row justify-content-start align-items-center align-content-center w-100'>
      <div className='fw-bold'>Notes:</div>
      <Button className="ms-3 tag-icon m-0 flex-grow-0 flex-shrink-0" style={{ color: "black" }} onClick={() => setNewNote(true)} ><i className="bi bi-plus-lg me-1" />Add</Button>
      <Form.Check
        className="ms-5"
        type="switch"
        label="Current Location Only"
        checked={location_only}
        onChange={() => setLocationOnly(!location_only)}
      />
    </div>
    <div>
      {new_note ? <Note data={{ text: "", note_id: null, item_id: tag_id, location_link: tag_location }} onSave={() => (setNewNote(false))} /> : ""}
      {notes_loading ? <Spinner /> :
        notes_data?.filter(elem => !location_only || elem?.location_link == tag_location)?.map(entry => <Note key={entry?.note_id} data={entry} />)}
    </div>
  </div>
}

function Note({ data, onSave = () => (null) }) {
  let [edit, setEdit] = React.useState(false)
  let [content, setContent] = React.useState("")
  let save_note = useSaveNote(data?.item_id, data?.location_link, data?.note_id)
  const ta_reference = React.useRef(null);
  let delete_note = useDeleteNote(data?.item_id, data?.note_id)


  React.useEffect(() => {
    setContent(data?.text ?? "")
    if (data?.note_id === null) {
      setEdit(true)
      ta_reference.current.focus();
      console.log("focussed")
    }
  }, [data])


  return <div className='border border-primary w-100 p-1'>
    <div className='d-flex flex-row justify-content-between'>
      <span>
        <span className='text-decoration-underline'>{(data?.timestamp ? dayjs(data.timestamp) : dayjs()).format("DD/MM/YYYY HH:mm")}</span>
        <span className='ms-3'>{data.location_link ? <ItemName id={data.location_link} link={false} force_show_icon={true} /> : ""}</span>
      </span>
      {edit ?
        <Button className="tag-icon m-0 flex-grow-0 flex-shrink-0" style={{ color: "black" }} onClick={() => { setEdit(false); save_note.mutate(content); onSave() }}><i className="bi bi-floppy me-1" />Save</Button> :
        <div className='d-flex flex-row'>
          <Button className="ms-3 tag-icon m-0 flex-grow-0 flex-shrink-0" style={{ color: "black" }} onClick={() => { delete_note.mutate(); onSave() }}><i className="bi bi-trash me-1" />Delete</Button>
          <Button className="ms-3 tag-icon m-0 flex-grow-0 flex-shrink-0" style={{ color: "black" }} onClick={() => setEdit(true)}><i className="bi bi-pencil me-1" />Edit</Button>
        </div>
      }
    </div>
    <Form.Control ref={ta_reference} as="textarea" rows={3} value={content ?? ""} disabled={!edit} onChange={(evt) => (setContent(evt.target.value))} />
  </div>
}