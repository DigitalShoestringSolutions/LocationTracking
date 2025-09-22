import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Container from 'react-bootstrap/Container'
import { useMQTTControl, useMQTTDispatch } from 'core/context/mqtt'
import React from 'react';
import { ListGroup } from 'react-bootstrap';
import { add_toast, useToastDispatch } from 'core/context/toast'
import { useParams } from 'react-router-dom'
import { useBarcodeDetails, useLocationList } from 'app/api';
import { BarcodeEntry, DisplayItem, SelectLocation, SetQuantity } from './common'


export function ProductionOperation() {

    let { data: location_list } = useLocationList()
    let params = useParams();
    const current_location_id = params.location_id

    const current_location = (location_list ?? []).find(elem => elem.id === current_location_id)
    const { sendJsonMessage } = useMQTTControl()


    const inputBarcodeRef = React.useRef(null);
    const barcodeRef = React.useRef(null);
    const toRef = React.useRef(null);
    const quantityRef = React.useRef(null);
    const submitRef = React.useRef(null);

    let [output_barcode_buffer, setOutputBarcodeBuffer] = React.useState("")
    let [output_barcode, setOutputBarcode] = React.useState(undefined)

    let [input_barcode_buffer, setInputBarcodeBuffer] = React.useState("")

    let [output_quantity, setOutputQuantity] = React.useState("")
    let [output_to, setOutputTo] = React.useState("")


    let [inputs, setInputs] = React.useState({})

    let toast_dispatch = useToastDispatch()

    let { data: current_item, isLoading: barcode_loading, error: item_error } = useBarcodeDetails(output_barcode)

    const handle_barcode_submit = () => {
        console.log("handle_barcode_submit: " + output_barcode_buffer)
        setOutputBarcode(output_barcode_buffer);
    }

    const handle_add_input = () => {
        if (input_barcode_buffer != "")
            setInputs(prev_value => ({ ...prev_value, [input_barcode_buffer]: { location: undefined } }))
        setInputBarcodeBuffer("")
    }

    const handle_remove_input = (barcode) => {
        setInputs(prev_value => {
            let new_value = { ...prev_value };
            delete new_value[barcode]
            return new_value
        })
    }

    const setInputLocation = (barcode, value) => {
        setInputs(prev_value => ({ ...prev_value, [barcode]: { ...prev_value[barcode], location: value } }))
    }

    const setInputItem = (barcode, value) => {
        setInputs(prev_value => ({ ...prev_value, [barcode]: { ...prev_value[barcode], item: value } }))
    }

    const setInputQuantity = (barcode, value) => {
        setInputs(prev_value => ({ ...prev_value, [barcode]: { ...prev_value[barcode], quantity: value } }))
    }

    React.useEffect(() => {
        if (current_location && output_to !== current_location.id) {
            setOutputTo(current_location.id)
        }
    }, [current_location, output_to])

    React.useEffect(() => {
        if (!current_item) {
            console.log("focus barcode")
            if (barcodeRef?.current)
                barcodeRef.current.focus()
        } else if (!output_to) {
            console.log("focus to")
            if (toRef?.current)
                toRef.current.focus()
        } else {
            if (!current_item?.individual) {
                console.log("focus quantity")
                if (quantityRef?.current)
                    quantityRef.current.focus()
            } else {
                console.log("focus input")
                if (inputBarcodeRef?.current)
                    inputBarcodeRef.current.focus()
            }
        }
    }, [current_item, output_to])

    const handleSubmit = () => {
        let payload = {
            item: current_item.id,
            loc: output_to,
        }

        let topic = "production_operation/" + output_to

        if (!current_item.individual) {
            payload.quantity = Number(output_quantity)
        }

        let inputs_payload = Object.keys(inputs).map(input_key => {
            let input = inputs[input_key]
            let input_payload = {
                item: input.item.id
            }
            if (input.location) {
                input_payload.loc = input.location
            }
            if (!input.item.individual) {
                input_payload.quantity = input.quantity
            }

            return input_payload
        })

        payload.inputs = inputs_payload

        console.log("Submitting: ",payload)

        try {
            sendJsonMessage(topic, payload);
            add_toast(toast_dispatch, { header: "Sent", body: "" })

            //reset
            setOutputQuantity("");
            setOutputBarcodeBuffer("");
            setOutputBarcode(undefined);
            setInputs({})
            barcodeRef.current.focus()
        } catch (err) {
            console.error(err)
            add_toast(toast_dispatch, { header: "Error", body: err.message })
        }
    }

    let inputs_valid = Object.keys(inputs).reduce((acc, key) => (acc && inputs[key]?.item?.individual || !!inputs[key]?.quantity), true)
    let can_submit = current_item != null && (current_item?.individual || !!output_quantity) && !!output_to && inputs_valid
    console.log(item_error?.message)
    return (
        <Container fluid className="flex-grow-1 px-1 pt-2 px-sm-2">
            <Card className='my-2'>
                <Card.Header><h4>Record Production:</h4></Card.Header>
                <Card.Body>
                    <Card.Title>Output</Card.Title>
                    <Card.Body>
                        <BarcodeEntry barcode={output_barcode_buffer} setBarcode={setOutputBarcodeBuffer} submit={handle_barcode_submit} barcodeRef={barcodeRef} />
                        <DisplayItem item={current_item} pending={barcode_loading} error={item_error?.message} />
                        <SelectLocation
                            fixed_location={current_location}
                            location_value={output_to}
                            setLocation={setOutputTo}
                            input_field_ref={toRef}
                        />
                        <SetQuantity item={current_item} quantity={output_quantity} setQuantity={setOutputQuantity} quantityRef={quantityRef} submitRef={submitRef} />
                    </Card.Body>
                    <Card.Title>Inputs</Card.Title>
                    <Card.Body>
                        <BarcodeEntry
                            barcode={input_barcode_buffer}
                            setBarcode={setInputBarcodeBuffer}
                            submit={handle_add_input}
                            barcodeRef={inputBarcodeRef}
                            button_text='Add'
                        />
                        <ListGroup>
                            {Object.keys(inputs).map(barcode =>
                                <InputEntry
                                    key={barcode}
                                    barcode={barcode}
                                    location={inputs[barcode].location}
                                    setLocation={(value) => setInputLocation(barcode, value)}
                                    quantity={inputs[barcode]?.quantity}
                                    setQuantity={(value) => setInputQuantity(barcode, value)}
                                    setItem={(value) => setInputItem(barcode, value)}
                                    removeInput={() => handle_remove_input(barcode)}
                                />)}
                        </ListGroup>
                    </Card.Body>
                    <div className="d-grid gap-2 mt-3">
                        <Button
                            ref={submitRef}
                            variant="success"
                            disabled={!can_submit}
                            onClick={handleSubmit}
                        >Submit</Button>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    )
}

function InputEntry({ barcode, location, setLocation, quantity, setQuantity, removeInput, setItem }) {
    let { data: item, isLoading, error, isError } = useBarcodeDetails(barcode)
    React.useEffect(() => {
        setItem(item)
    }, [item])

    return <ListGroup.Item>
        <DisplayItem
            item={item ?? undefined}
            pending={isLoading}
            error={(error && error.name == "PayloadError") ? (error.message + " [barcode: "+barcode+"]") : undefined}
            classes={item?.individual ? "" : "mb-3"}
            button_text="Remove"
            handleButtonClick={removeInput} />
        <SelectLocation
            show={!(item?.individual || isLoading) && !isError}
            location_value={location}
            setLocation={setLocation}
            label='From'
            default_label='<Output Location>'
            default_selectable={true}
        />
        <SetQuantity item={item} quantity={quantity ?? ""} setQuantity={setQuantity} classes='' />

    </ListGroup.Item>
}