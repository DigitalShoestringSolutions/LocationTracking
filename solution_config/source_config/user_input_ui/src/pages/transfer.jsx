import 'bootstrap/dist/css/bootstrap.css';
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Form from 'react-bootstrap/Form'
import Container from 'react-bootstrap/Container'
import { useMQTTControl, useMQTTDispatch } from 'core/context/mqtt'
import React from 'react';
import { add_toast, useToastDispatch } from 'core/context/toast'
import { useParams } from 'react-router-dom'
import { useBarcodeDetails, useLocationList } from 'app/api';
import { BarcodeEntry, DisplayItem, SelectLocation, SetQuantity } from './common'



export function TransferOperation() {
    let params = useParams();
    let { data: location_list } = useLocationList()


    const current_location_id = params.location_id
    const current_location = (location_list ?? []).find(elem => elem.id === current_location_id)

    const barcodeRef = React.useRef(null);
    const toRef = React.useRef(null);
    const fromRef = React.useRef(null);
    const quantityRef = React.useRef(null);
    const submitRef = React.useRef(null);

    let [barcode_buffer, setBarcodeBuffer] = React.useState("")
    let [barcode, setBarcode] = React.useState("")
    let [item_error, setItemError] = React.useState(undefined)
    let [autoSubmit, setAutoSubmit] = React.useState(false)

    let [quantity, setQuantity] = React.useState("")
    let [to, setTo] = React.useState("")
    let [from, setFrom] = React.useState("")


    let toast_dispatch = useToastDispatch()
    const { sendJsonMessage } = useMQTTControl()

    let { data: current_item, isLoading: barcode_loading, isError: barode_error } = useBarcodeDetails(barcode)

    const handle_barcode_submit = () => {
        console.log("handle_barcode_submit: " + barcode_buffer)
        setBarcode(barcode_buffer);
    }

    React.useEffect(() => {
        if (current_location && to !== current_location.id) {
            setTo(current_location.id)
        }
    }, [current_location, to])

    React.useEffect(() => {
        if (!current_item) {
            console.log("focus barcode")
            if (barcodeRef?.current)
                barcodeRef.current.focus()
        } else if (!current_item?.individual && !from) {
            console.log("focus from")
            if (fromRef?.current)
                fromRef.current.focus()
        } else if (!to) {
            console.log("focus to")
            if (toRef?.current)
                toRef.current.focus()
        } else {
            console.log("focus submit")
            if (!current_item?.individual) {
                console.log("focus quantity")
                if (quantityRef?.current)
                    quantityRef.current.focus()
            } else {
                if (submitRef?.current)
                    submitRef.current.focus()
                if (autoSubmit) {
                    submitRef.current.click()
                }
            }
        }
    }, [current_item, from, to])

    const handleSubmit = () => {
        const payload = {
            item: current_item.id,
            to_loc: to,
        }
        let topic = "transfer_operation/" + to

        if (!current_item.individual) {
            payload.quantity = Number(quantity)
            payload.from_loc = from
            topic += "/" + from
        }

        try {
            sendJsonMessage(topic, payload);
            add_toast(toast_dispatch, { header: "Sent", body: "" })

            //reset
            setQuantity("");
            // setTo(""); //don't reset to enable quick rescans
            // setFrom("");
            setBarcodeBuffer("");
            setBarcode(undefined);
            barcodeRef.current.focus()
        } catch (err) {
            console.error(err)
            add_toast(toast_dispatch, { header: "Error", body: err.message })
        }
    }

    return (
        <Container fluid className="flex-grow-1 px-1 pt-2 px-sm-2">
            <Row className="m-0 mx-2 d-flex justify-content-center pt-2 pb-2">
                <Col>
                    {/* <CurrentStatus /> */}
                    <Card className='my-2'>
                        <Card.Header>
                            <div className='d-flex justify-content-between align-items-center'>
                                <h4>Transfer Items:</h4>
                                <Form.Check
                                    type="switch"
                                    label="Auto Submit"
                                    checked={autoSubmit}
                                    onChange={(e) => setAutoSubmit(e.target.checked)}
                                />
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <BarcodeEntry barcode={barcode_buffer} setBarcode={setBarcodeBuffer} submit={handle_barcode_submit} barcodeRef={barcodeRef} />
                            <DisplayItem item={current_item} pending={barcode_loading} error={item_error} />
                            <SelectLocation
                                show={!(current_item === undefined || current_item.individual)}
                                filtered_location={current_location}
                                location_value={from}
                                setLocation={setFrom}
                                input_field_ref={fromRef}
                                outbound={true}
                                label="From"
                            />
                            <SelectLocation
                                fixed_location={current_location}
                                location_value={to}
                                setLocation={setTo}
                                input_field_ref={toRef}
                                inbound={true}
                                label="To"
                            />
                            <SetQuantity item={current_item} quantity={quantity} setQuantity={setQuantity} quantityRef={quantityRef} submitRef={submitRef} />
                            <div className="d-grid gap-2">
                                <Button
                                    ref={submitRef}
                                    variant="success"
                                    disabled={current_item == null || (!current_item?.individual && (!quantity || !from)) || !to}
                                    onClick={handleSubmit}
                                >Submit</Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    )
}