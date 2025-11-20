import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import React from "react";
import { useFilter } from "../FilterContext/context";

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100, 200, 500, 1000]

export function PageSizeSelector(){
    let { page_size, setPageSize } = useFilter()

    return <DropdownButton variant="outline-secondary" title={"Shown: " + page_size} size="sm" value={page_size}>
        <Dropdown.ItemText>Set Number of Rows Shown</Dropdown.ItemText>
        <Dropdown.Divider />
        {PAGE_SIZE_OPTIONS.map(elem => (
            <Dropdown.Item key={elem} value={elem} onClick={() => setPageSize(elem)}>{elem}</Dropdown.Item>
        ))}
    </DropdownButton>
}