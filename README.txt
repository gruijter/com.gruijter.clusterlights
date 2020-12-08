Control Bluetooth Low Energy (BLE) christmas lights.

You can do these actions from the Homey mobile app or from a flow:

* turn the lights on and off
* dim the lights
* set the colour
* set the light effect
* set a random light effect (flow only)

Setup in Homey:
Go to devices and select the right driver. Presently three brands of BLE lights are supported: Novolink (action), happylighting and Lumineo. If you would like to have an additional brand integrated, let me know.

Controlling BLE lights:
Since this app uses Bluetooth Low Energy (BLE), the maximum distance between Homey and the light is around 10 meters. If you have intermittend issues, try moving the lights closer to Homey. Due to the nature of BLE (and how Homey has implemented it), it takes some time for Homey to connect to the light. This means that it takes 5 to 10 seconds before a command takes effect. After sending the first command you can send new commands much faster. 30 seconds after the last command, Homey will disconnect the light again. Please note that BLE only allows one connection at at time. So Homey is not able to find or control the lights if you are connected via another device, and vice versa.
