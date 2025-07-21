#!/bin/env bash
echo "This helper program detects the Serial Number, and USB platform and connection point of a connected USB device."
echo "---------------------------------------------------------------------------------------------------------------"
echo "It will start now..."
echo ""

while true; do
    # Prompt the user to plug in the USB device
    echo "If the USB device is plugged in, please unplug the USB device now. Press Enter to continue."
    read -r
    sleep 3s    # Making the 3 sleeps shorter (eg 1s) can cause this script to fail to detect USB changes. Reason unknown.
    # Get the initial list of connected USB devices
    initial_devices=$(lsusb| sort)
    initial_inputs=$(ls -l /dev/input/by-path | sort)
    #echo "$initial_devices"
    # Loop until a USB device is removed

    # Prompt the user to plug in the USB device
    echo "Please plug in the USB device and press Enter to continue."
    read -r
    sleep 3s
    # Get the updated list of connected USB devices
    updated_devices=$(lsusb | sort)
    updated_inputs=$(ls -l /dev/input/by-path | sort)
    # echo "$updated_devices"
    # echo "$updated_inputs"

    # Find the removed USB device
    removed_device=$(comm -3 <(echo "$initial_devices") <(echo "$updated_devices")| awk '{print}')
    removed_input=$(comm -3 <(echo "$initial_inputs") <(echo "$updated_inputs")| awk '{print}')

    # echo "Device Removed: $removed_device" 
    # echo "Input Removed: $removed_input" 
    # Extract the Device information
    ID=$(echo "$removed_device" | sed -n 's/.*ID \([^ ]*\).*/\1/p' | tr ':' '_' | uniq)
    platform=$(echo "$removed_input" | sed 's/.*platform-\(.*\)-usb.*/\1/' | uniq)
    connection_port=$(echo "$removed_input" | sed 's/.*-usb-\([^:]*:[^:]*\).*/\1/' | uniq) # sed 's/.*platform-\(.*\)\..*/\1/')

    echo -e  "Serial: \t \t $ID"
    echo -e  "Connection Point: \t $connection_port"
    echo -e  "Platform: \t \t $platform"
    echo ""

    echo "Check another USB device? Press Enter to continue or Control and c to stop."
    read -r
    sleep 3s
done