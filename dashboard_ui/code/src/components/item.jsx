import { useItem } from "../api"
import { NavLink } from "react-router-dom";

export function ItemName({ id, link_if_collective = true, link_if_individual = true, link = true, show_icon = true }) {
    let { data: item, isLoading, error } = useItem(id)

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

    if (link && ((link_if_collective && !item.individual) || (link_if_individual && item.individual))) {
        return <NavLink className="link-primary link-underline link-underline-opacity-0 link-underline-opacity-75-hover" to={slug + id} > {show_icon && icon}{item.name}</NavLink>
    } else {
        return <span>{show_icon && icon}{item.name}</span>
    }
}