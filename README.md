# Location Tracking Starter Solution


## Download
Clone this repo: `git clone https://github.com/DigitalShoestringSolutions/LocationTracking`  
Open the downloaded folder: `cd LocationTracking`


## Build
Set up secret keys and default passwords: `./setup.sh`  
Build using docker: `docker compose build`


## Run
Run using the `./start.sh` script. 


## Configure
Configure in a web browser at `localhost:8002`. Create locations, define items and associate barcodes.


## Usage
Use the operator interface in a web browser at `localhost` to move items between locations:  
<img width="1062" height="524" alt="image" src="https://github.com/user-attachments/assets/84ae91ac-9b67-4f40-95f9-f83911d261d1" />

Or record production operations, which consume one item to make another:
<img width="1911" height="815" alt="image" src="https://github.com/user-attachments/assets/2486e8bb-d221-40e8-a46e-812306685b7d" />

View the dashboard in a web browser at `localhost:8000` to see where items currently are:  
<img width="1916" height="277" alt="image" src="https://github.com/user-attachments/assets/ddd3daa6-a9b7-4ad9-ae12-1eaa1508a978" />
