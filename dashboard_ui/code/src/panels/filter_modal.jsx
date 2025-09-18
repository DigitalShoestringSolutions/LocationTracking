import React from "react"
import { Button, Modal, Spinner } from "react-bootstrap"
import { useIdListForTypes, useIdTypes } from "../api"
import { useFilter } from "../FilterContext"

export function FilterModal({ show, handleClose }) {

  let { item_filter, setItemFilter } = useFilter()

  let [state, setState] = React.useState(item_filter)

  const do_handle_close = (filter_value) => {
    setItemFilter(filter_value)
    handleClose()
  }

  React.useEffect(() => {
    setState(item_filter)
  }, [item_filter])

  return <Modal restoreFocus={false} show={show} onHide={() => do_handle_close(state)}>
    <Modal.Header>
      <Modal.Title className="w-100"><h4>Filter Shown Items:
        <Button className="ms-1 float-end" variant="primary" onClick={() => do_handle_close(state)}>Save</Button>
        <Button className="float-end" variant="warning" onClick={() => do_handle_close(undefined)}>Reset</Button>
      </h4></Modal.Title>
    </Modal.Header>
    <Modal.Body><FilterBody state={state} setState={setState} /></Modal.Body>
  </Modal>
}

function FilterBody({ state, setState }) {
  let [lists, doSetLists] = React.useState({})
  let { data: types, isLoading, error } = useIdTypes()
  let { location_types } = useFilter()

  if (isLoading) {
    return error !== null ? <h1>{error}</h1> : <div><Spinner></Spinner> <h2 className='d-inline'>Loading...</h2></div>
  }

  const setList = (key, value) => {
    doSetLists(prev => ({ ...prev, [key]: value }))
  }


  const handleClick = (type, item) => {
    if (item === null) { //if type box clicked
      setState(prev => {
        return { ...prev, [type]: !(prev[type] === true) } //set to false if currently true and to true if currently false or partial
      })
    } else { //if individual box clicked
      setState(prev => {
        if (prev[type] === false || prev[type] === undefined) { //if all false
          return { ...prev, [type]: [item] }  //start partial list
        } else if (Array.isArray(prev[type])) { //if currently partial list
          let list = prev[type]
          let index = list.indexOf(item)
          if (index === -1) { //if item not present
            let list = [...prev[type], item] // add to partial list
            if (list.length === lists[type].length) {  //if list full
              return { ...prev, [type]: true } //set true
            }
            return { ...prev, [type]: list } //else return list
          } else { //if present
            list.splice(index, 1) //remove from list
            if (list.length === 0) {  //if empty
              return { ...prev, [type]: false } //set false
            }
            return { ...prev, [type]: list }  //else return list
          }
        } else { //if all true
          let list = lists[type].map(elem => elem.id) //get fill list
          let index = list.indexOf(item)
          list.splice(index, 1) //remove item from list
          return { ...prev, [type]: list }
        }
      })
    }
  }

  return <div>
    {types.filter(
      elem => location_types.indexOf(elem.tag) == -1  // do all types except the location types
    ).map(elem =>
      <DisplayType
        key={elem.tag}
        state={state[elem.tag]}
        type_tag={elem.tag}
        label={elem.title}
        handleClick={handleClick}
        list={lists[elem.tag] ?? []}
        setList={(value) => setList(elem.tag, value)}
      />)}
  </div>
}

function DisplayType(props) {
  let [expanded, setExpanded] = React.useState(false)
  return <div>
    <div className="d-flex justify-content-between">
      <TriStateCheckbox {...props} handleClick={() => props.handleClick(props.type_tag, null)} />
      <span role="button" className={"ms-1 bi bi-" + (expanded ? "caret-up-fill" : "caret-down-fill")} onClick={() => setExpanded(prev => !prev)} />
    </div>
    {expanded ? <DisplayIdentities {...props} /> : ""}
  </div>
}

function DisplayIdentities({ type_tag, state, handleClick, list, setList }) {
  let { data: fetched_list, isLoading, error } = useIdListForTypes(type_tag)

  React.useEffect(() => {
    if (fetched_list) {
      setList(fetched_list)
    }
  }, [fetched_list])

  if (isLoading) {
    return error ? error : "Loading..."
  }

  if (list.length === 0) {
    return <div className="ps-4">[None]</div>
  }

  let array_state = Array.isArray(state)

  return list.map(elem => <div key={elem.id} className="ps-4">
    <TriStateCheckbox state={array_state ? state.indexOf(elem.id) > -1 : state} label={elem.name} handleClick={() => handleClick(type_tag, elem.id)} />
  </div>
  )

}

function TriStateCheckbox({ state, label, handleClick }) {
  let icon = "dash-square-fill";
  if (state === true) {
    icon = "square-fill"
  } else if (state === false || state === undefined) {
    icon = "square"
  }

  return <span role="button" onClick={handleClick} className={"bi bi-" + icon}>{" "}{label}</span>
}

// export function LocationSelector({ config, state, setState }) {

//   let [loaded, setLoaded] = React.useState(false)
//   let [pending, setPending] = React.useState(false)
//   let [error, setError] = React.useState(undefined)
//   let [types, setTypes] = React.useState([])

//   let load_types_callback = React.useCallback(load_types, [])

//   React.useEffect(() => {
//     if (!loaded && !pending) {
//       load_types_callback(config, setPending, setLoaded, setError, setTypes)
//     }
//   }, [config, load_types_callback, loaded, pending])

//   if (!loaded) {
//     return error !== null ? <h1>{error}</h1> : <div><Spinner></Spinner> <h2 className='d-inline'>Loading...</h2></div>
//   }

//   const handleClick = (type) => {
//     setState(prev => ({ ...prev, [type]: !(prev[type] === true) }))
//   }

//   return <div className="d-flex justify-content-around">
//     {types.map(elem => (
//       <div key={elem.tag} >
//         <TriStateCheckbox state={state[elem.tag]} label={elem.title} handleClick={() => handleClick(elem.tag)} />
//       </div>))}
//   </div>
// }