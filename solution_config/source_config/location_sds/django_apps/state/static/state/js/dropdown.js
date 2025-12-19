window.addEventListener('DOMContentLoaded', function () {

    const dropdown = document.querySelector('.dropdown');
    const hidden_input = dropdown.querySelector("input")
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const items = dropdown.querySelectorAll('.dropdown-item');
    const selectedValue = dropdown.querySelector('.selected-value');

    // 1. Toggle visibility
    trigger.addEventListener('click', () => {
        dropdown.classList.toggle('active');

        // ensure form-row allows overflow so dropdown not cut off
        let elem = dropdown
        while (!elem.classList.contains("form-row") && elem !== null)
            elem = elem.parentElement
        
        if(elem){
            elem.style.overflow = "visible"
        }
    });

    // 2. Handle selection
    items.forEach(item => {
        item.addEventListener('click', () => {
            // Update the trigger HTML with the selected item's content
            selectedValue.innerHTML = item.innerHTML;

            // Close the menu
            dropdown.classList.remove('active');


            // Log the actual value (for forms)
            console.log("Selected Value:", item.getAttribute('data-value'));
            hidden_input.value = item.getAttribute('data-value')
        });
    });

    // 3. Close when clicking outside
    window.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

});