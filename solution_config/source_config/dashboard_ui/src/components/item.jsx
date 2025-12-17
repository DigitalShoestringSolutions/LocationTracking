import { useItem } from "../api"
import { NavLink } from "react-router-dom";
import { useSettings } from "../SettingsContext";

export function ItemName({ id, link_if_collective = true, link_if_individual = true, link = true, show_icon = true, quantity = undefined, force_show_icon = false }) {
    let { data: item, isLoading, error } = useItem(id)
    let { show_icons: global_show_icons } = useSettings()

    const do_show_icon = (global_show_icons && show_icon) || force_show_icon

    if (id == undefined)
        return ""

    if (error)
        return "Error loading " + id
    if (isLoading)
        return "loading..."

    let slug = "/item/"
    let icon = ""
    if (item.type == "loc") { //location
        slug = "/loc/"
        icon = <i className="bi bi-geo-alt pe-1" />
    } else {
        if (item.individual) {
            icon = <i className="bi bi-1-circle pe-1" />
        } else {
            icon = <i className="bi bi-boxes pe-1" />
        }
    }

    let quantity_entry = ""
    if (quantity !== undefined) {
        quantity_entry = <span className="badge bg-secondary ms-1">{quantity}</span>
    }

    if (link && ((link_if_collective && !item.individual) || (link_if_individual && item.individual))) {
        return <div className="d-flex justify-content-between align-items-center"><NavLink className="link-primary link-underline link-underline-opacity-0 link-underline-opacity-75-hover" to={slug + id} >{do_show_icon && icon}{item.name}</NavLink>{quantity_entry}</div>
    } else {
        return <span>{do_show_icon && icon}{item.name}{quantity_entry}</span>
    }
}