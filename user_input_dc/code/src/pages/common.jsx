import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
import { Form, InputGroup } from 'react-bootstrap';
import { useLocationList } from '../api';

export function BarcodeEntry({ submit, barcode, setBarcode, barcodeRef, button_text = "Check" }) {
    return <InputGroup className="mb-3">
        <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-upc-scan me-1' />Barcode</InputGroup.Text>
        <Form.Control
            ref={barcodeRef}
            placeholder="Barcode"
            value={barcode}
            onChange={(event) => setBarcode(event.target.value.trim())}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    submit(barcode);
                }
            }}
        />
        <Button variant="primary" onClick={() => submit(barcode)}>
            {button_text}
        </Button>
    </InputGroup>
}

export function DisplayItem({ item, pending = false, error, classes = "mb-3", button_text, handleButtonClick }) {
    if (item === undefined) {
        return ""
    }

    let form_value = ""
    let form_disabled = false
    let text_value = ""
    if (error) {
        form_value = error
        form_disabled = true
        text_value = <i className='bi bi-exclamation-triangle' />
    } else if (pending) {
        text_value = <Spinner animation="border" variant="secondary" size="sm" />
    } else if (item) {
        form_value = item.name
        form_disabled = true
        text_value = <i className='bi bi-check2' />
    }

    let end_segement = <InputGroup.Text>{text_value}</InputGroup.Text>
    if (form_disabled && button_text)
        end_segement = <Button variant="outline-secondary" onClick={handleButtonClick}>{button_text}</Button>

    return <InputGroup className={classes}>
        <InputGroup.Text style={{ width: "7em" }}><i className={'bi me-1 ' + (item?.individual ? "bi-tag" : "bi-box")} />Item</InputGroup.Text>
        <Form.Control value={form_value} readOnly disabled={form_disabled} />
        {end_segement}
    </InputGroup>
}

export function SelectLocation({
    show = true,
    fixed_location,
    filtered_location,
    location_value,
    setLocation,
    input_field_ref,
    label = "Location",
    inbound = false,
    outbound = false,
    default_label = "Select ...",
    default_selectable = false,
    classes = "mb-3" }) {
    let { data: location_list, isLoading } = useLocationList()

    if (!show || isLoading) {
        return ""
    }

    let content = ""

    let icon = ""
    if (inbound)
        icon = "bi-box-arrow-in-down-right"
    if (outbound)
        icon = "bi-box-arrow-up-right"

    if (fixed_location) {
        content = <Form.Control value={fixed_location.name} disabled />
    } else {
        content = <Form.Select ref={input_field_ref} value={location_value} onChange={(event) => setLocation(event.target.value)}>
            <option disabled={!default_selectable} value="">{default_label}</option>
            {location_list.map(loc => (
                loc.id !== filtered_location?.id ? <option key={loc.id} value={loc.id}>{loc.name}</option> : ""
            ))}
        </Form.Select>
    }
    return <InputGroup className={classes}>
        <InputGroup.Text style={{ width: "7em" }}><i className={('bi me-1 ' + icon)} />{label}</InputGroup.Text>
        {content}
    </InputGroup>
}

export function SetQuantity({ item, quantity, setQuantity, quantityRef, submitRef, classes = "mb-3" }) {
    if (item === undefined || item.individual) {
        return ""
    }
    return <InputGroup className={classes}>
        <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-box me-1' />Quantity</InputGroup.Text>
        <Form.Control
            ref={quantityRef}
            type="text"
            value={quantity}
            onChange={(event) => (setQuantity(event.target.value.replace(/\D/, '')))}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    submitRef.current.focus()
                }
            }}
        />
    </InputGroup>
}
