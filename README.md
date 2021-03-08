# standoutjs

## Installation

### CDN
Insert this code after jQuery import:
```html
<script src="https://cdn.jsdelivr.net/npm/standoutjs@2.3.3/dist/standout.min.js"></script>
```

### NPM
Install using npm:
```
npm install --save standoutjs
```

Then load it into your app.js:
```javascript
require('standoutjs');
```

## Basic usage
```javascript
$(yourSelector).standout();
```

## Customizing the options
```javascript
$(yourSelector).standout({
        onlyFirstTime: true,
        top: 0.4,
        bottom: 0.2
});
```

## Enabling the lightbox effect
```javascript
$(yourSelector).standout({
        lightBoxEffect: true,
        top: 0.4,
        bottom: 0.2
});
```
_NOTE: the lightbox effect will override both the `onlyFirstTime` and the `oncePerEvent` options in order to work properly._


## Using the events
```javascript
$(yourSelector).standout({
        top: 0.4,
        bottom: 0.2
}).on("ET", function(event, object) {
    console.log("ENTERING FROM TOP " + obj.idx);
});
```
_NOTE: you can chain all the events as you do for any other jQuery event_


## Events list
- **ET**
    - Fired when the element is ENTERING from the TOP of the defined area
- **EXT**
    - Fired when the element is EXITING from the TOP of the defined area
- **EB**
    - Fired when the element is ENTERING from the BOTTOM of the defined area
- **EXB**
    - Fired when the element is EXITING from the BOTTOM of the defined area
- **C**
    - Fired when the element is at the CENTER of the defined area
- **O**
    - Fired when the element is OVER the TOP of the defined area and inside the viewport
- **U**
    - Fired when the element is UNDER the BOTTOM of the defined area and inside the viewport


## Options
Options are sent to the plugin as an object.

Below you can find the name and definition of all the available options for this plugin.

---
```javascript
onlyFirstTime
```
_Boolean - Default: **false**_

Force the plugin to fire the events only once

---
```javascript
oncePerEvent
```
_Boolean - Default: **true**_

Force the plugin to fire the events only once

---
```javascript
showDemoLayout
```
_Boolean - Default: **false**_

Displays the area of effect of the plugin.

---
```javascript
lightBoxEffect
```
_Boolean - Default: **false**_

Activate the lightbox effect for the elements the plugin is enabled for

---
```javascript
backgroundColor
```
_CSS color value - Default: **#000000**_

NOTE: Option NO longer implemented - Will be removed in future versions of the plugin

---
```javascript
top
```
_Float - Default: **0.3**_

This value defines the top limit of the plugin's area of effect (calculated as percentage of the viewport - starting from the top)

I.E. A value of **0.3** means that the top limit is calculated at 30% of the viewport height, starting from the top.

---
```javascript
bottom
```
_Float - Default: **0.3**_

This value defines the bottom limit of the plugin's area of effect (calculated as percentage of the viewport - starting from the bottom)

I.E. A value of **0.3** means that the bottom limit is calculated at 30% of the viewport height, starting from the bottom.

---
```javascript
overlay: {
    backgroundColor: "#000000",
    opacity: "0",
    width: "100%",
    height: "100%",
    position: "fixed",
    top: "0",
    left: "0",
    zIndex: "9999",
    display: "none"
},
```
_Object - Default: **as defined above**_

The CSS properties of the overlay element used for the lightbox effect.

NOTE: for the best effect is advised to leave all the options with their default value.

---
```javascript
overlayId
```
_String - Default: **overlayStandout**_

The default ID used for the overlay element. You can change this if needed.

---
```javascript
enabled
```
_Boolean - Default: **false**_

NOTE: NOT YET IMPLEMENTED - Will be implemented in future versions of the plugin

Enable or disable the plugin.

---

## Requirements
jQuery >= 1.9.1


## Credits
Basic plugin structure from: https://github.com/alvinpascoe/jquery-boilerplate

Tips and technical support: www.manvitech.it

Moral support: Lois, my love
