# Christmas Lights (BLE) #

Homey app to integrate Bluetooth Low Energy (BLE) christmas lights.

You can do these actions from the Homey mobile app or from a flow:

* turn the lights on and off
* dim the lights
* set the light effect
* set a random light effect (flow only)

![image][mobile-card-image]


![image][flow-cards-image]

### Setup in Homey: ###
Go to devices and select the right driver. Presently two brands of BLE lights are supported: Novolink and Lumineo. If you would like to have an additional brand integrated, let me know.

### Controlling BLE lights: ###
Since this app uses Bluetooth Low Energy (BLE), the maximum distance between Homey and the light is around 10 meters. If you have intermittend issues, try moving the lights closer to Homey. Due to the nature of BLE (and how Homey has implemented it), it takes some time for Homey to connect to the light. This means that it takes 5 to 10 seconds before a command takes effect. After sending the first command you can send new commands much faster. 30 seconds after the last command, Homey will disconnect the light again. Please note that BLE only allows one connection at at time. So Homey is not able to find or control the lights if you are connected via another device, and vice versa.

### Donate: ###
If you like the app you can show your appreciation by posting it in the [forum].
If you really like the app you can buy me a beer.

[![Paypal donate][pp-donate-image]][pp-donate-link]

===============================================================================

Version changelog: [changelog.txt]

[forum]: https://community.athom.com/t/4839
[pp-donate-link]: https://www.paypal.me/gruijter
[pp-donate-image]: https://www.paypalobjects.com/webstatic/en_US/i/btn/png/btn_donate_92x26.png
[mobile-card-image]: https://discourse-cdn-sjc1.com/business4/uploads/athom/original/2X/a/aa8d4a803e293d6df266c2c4a34564fe34973f42.png
[flow-cards-image]: https://discourse-cdn-sjc1.com/business4/uploads/athom/original/2X/e/e53333d69dd26c18e32cc77cf4ac69803893a97a.png
[changelog.txt]: https://github.com/gruijter/com.gruijter.clusterlights/blob/master/changelog.txt