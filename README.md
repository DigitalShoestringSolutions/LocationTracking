# Location Tracking Starter Solution

## Install the Shoestring Assembler
In the terminal, run:
- `sudo apt install pipx -y`
- `sudo pipx run shoestring-setup`
- `sudo reboot` if prompted to restart

## Use the Shoestring Assembler to download and configure this Solution
- In the terminal run `shoestring app`, or double click the desktop icon called `Shoestring`.  
- Use the `Download` button to select the name of this solution (`Job Tracking`). Select the latest release tag.  
- Follow the prompts to configure

## Setup, Build & Start
Continue accepting the prompts to setup, build and start now

## Configure
Configure in a web browser at `localhost:8002`. Create locations, define items and associate barcodes.

## Usage
Use the operator interface in a web browser at `localhost` to move items between locations:  
<img width="1062" height="524" alt="image" src="https://github.com/user-attachments/assets/84ae91ac-9b67-4f40-95f9-f83911d261d1" />

Or record production operations, which consume one item to make another:
<img width="1911" height="815" alt="image" src="https://github.com/user-attachments/assets/2486e8bb-d221-40e8-a46e-812306685b7d" />

View the dashboard in a web browser at `localhost:8000` to see where items currently are:  
<img width="1916" height="277" alt="image" src="https://github.com/user-attachments/assets/ddd3daa6-a9b7-4ad9-ae12-1eaa1508a978" />

Items can be either of a 'type', of which a fungible quantity is at a location, or alternatively items can be 'individual' and have a unique reference number and can only be in one place at once.  

## Barcode Scanners
Barcode scanners attached to the pi can be configured to be associated with a location. When an 'individual' item is scanned, it is moved to the location associated with the barcode scanner.  
Product types cannot be directly moved via barcode scanners, but instead the barcode scanners could be used with the web forms to reduce typing of product numbers.  
