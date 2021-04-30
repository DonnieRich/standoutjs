/*!-----------------------------------------------------------------------------
 * A jQuery plugin that creates events when a certain DOM element is in a position relative to a selected portion of the viewport.
 * v3.1.0 - built 2021-04-30
 * Licensed under the MIT License.
 * https://github.com/DonnieRich/standoutjs
 * ----------------------------------------------------------------------------
 * Copyright (C) 2020-2021 Donato Pasquale Riccio
 * https://designaddicted.eu/
 * --------------------------------------------------------------------------*/
(function(jQuery, window, document, undefined) {

    "use strict";

    const pluginName = "standout";
    // Demo layout
    let demoInit = false;

    const allStandout = [];

    const defaults = {
        // Fire the function linked to the event just the first time and not at
        // every subsequent scroll (it will still be fired if the last event is different from the current one)
        onlyFirstTime: false,
        oncePerEvent: true,
        showDemoLayout: false,
        lightBoxEffect: false,
        backgroundColor: "#000000",
        top: 0.3,
        bottom: 0.3,
        overlay: {
            backgroundColor: "#000000",
            opacity: "0",
            width: "100%",
            height: "100vh",
            position: "fixed",
            top: "0",
            left: "0",
            zIndex: "9999",
            display: "none"
        },
        overlayId: "overlayStandout",
        enabled: true,
        window,
        body: "body"
    };

    const lightboxOptions = {
        onlyFirstTime: false,
        oncePerEvent: false
    };

    const objProps = {
        initialized: false,
        originalTop: 0,
        originalLeft: 0,
        elementWidth: 0,
        elementHeight: 0,
        elementTop: 0,
        elementCenter: 0,
        elementBottom: 0,
        elementTopPosition: 0,
        elementCenterPosition: 0,
        elementBottomPosition: 0,
        viewportHeight: 0,
        viewportTop: 0,
        viewportBottom: 0,
        lastViewportTop: 0,
        lastEvent: "",
        currentEvent: "",
        eventsQueue: [],
        maxEventsInQueue: 7
    };

    const demoLayout = {
        demoLayoutTop: {
            backgroundColor: "#000000",
            opacity: "0.75",
            width: "100%",
            position: "fixed",
            top: "0",
            left: "0",
            zIndex: "9999"
        },
        demoLayoutCenter: {
            backgroundColor: "#000000",
            opacity: "0.75",
            width: "100%",
            position: "fixed",
            left: "0",
            zIndex: "9999",
            height: "5px",
            transform: "translateY(-50%)"
        },
        demoLayoutBottom: {
            backgroundColor: "#000000",
            opacity: "0.75",
            width: "100%",
            position: "fixed",
            top: "0",
            left: "0",
            zIndex: "9999"
        }
    };

    function Standout(element, i, options, isLast) {

        this._name = pluginName;
        this.i = i;
        this.idx = `standout_${this.i}`;
        this.clonedId = `${this.idx}_cloned`;
        this.isLastElement = isLast;
        this.options = this._getOptions(options);
        this.element = element;
        this.enabled = this.options.enabled;
        allStandout[i] = this;
        this._init();

    }

    // Avoid Plugin.prototype conflicts
    jQuery.extend(Standout.prototype, {

        _init() {

            const offset = this._isWindow() ? 0 : jQuery(this.options.window).offset().top;
            this._buildCache();
            this._initViewport(offset);
            this._initObj(offset);
            this._bindEvents();

            if (this.options.showDemoLayout && !demoInit) {

                demoInit = true;
                this._setDemoLayout(this.options, offset);

            }

            if (this.options.lightBoxEffect) {

                if (jQuery(`#${this.options.overlayId}`).length === 0) {

                    this._setOverlayLayout(this.options);

                }

                if (jQuery(`.${this.clonedId}`).length === 0) {

                    this._duplicateElement(this.element, this.clonedId, this.options);

                }

                if (this.options.compatibility && this.isLastElement && typeof this.options.dynamicContentListeners === "function") {

                    this.options._dynamicContentListeners();

                }

                this._registerLightboxEvents();

            }

        },

        _buildCache() {

            this.$element = this._getElement(this.i);

        },

        _bindEvents() {

            const obj = this;

            jQuery(obj.options.window).on("resize scroll", function() {

                obj._updateObj();

                if (obj._isInViewport()) {

                    obj._setCurrentEvent();
                    if ((!obj.options.oncePerEvent)
                    || (obj.options.onlyFirstTime && obj.options.oncePerEvent && !obj._checkIfEventAlreadyTriggered())
                    || (obj.options.oncePerEvent && !obj.options.onlyFirstTime && !obj._checkIfLastEvent())) {

                        // triggering the event passing along the current object
                        obj.$element.trigger(obj.$element.objProps.currentEvent, [obj]);

                    }
                    obj._setLastEvent();
                    obj._addEventToQueue();

                } else {

                    // Reset current event when element is not in viewport
                    obj._resetEvents();

                }

            });

        },

        _isInViewport() {

            return this.$element.objProps.elementBottomPosition > this.$element.objProps.extremeTop
                && this.$element.objProps.elementTopPosition < this.$element.objProps.extremeBottom
                && this.$element.objProps.initialized;

        },

        _setCurrentEvent() {

            const props = this.$element.objProps;
            let event = "U";
            if (props.lastViewportTop === 0) {

                props.lastViewportTop = props.viewportTop;

            }

            if (props.elementCenterPosition >= props.viewportTopLimit && props.elementCenterPosition <= props.viewportBottomLimit) {

                event = "C";

            } else {

                if (props.elementBottomPosition <= props.viewportTopLimit) {

                    event = "O";

                } else {

                    if (props.elementBottomPosition > props.viewportTopLimit && props.elementCenterPosition < props.viewportTopLimit) {

                        if (props.viewportTop < props.lastViewportTop) {

                            event = "ET";

                        } else {

                            event = "EXT";

                        }

                    } else if (props.elementTopPosition < props.viewportBottomLimit && props.elementCenterPosition > props.viewportBottomLimit) {

                        if (props.viewportTop > props.lastViewportTop) {

                            event = "EB";

                        } else {

                            event = "EXB";

                        }

                    }

                }

            }

            props.lastViewportTop = props.viewportTop;
            props.currentEvent = event;

        },

        _getCurrentEvent() {

            return this.$element.objProps.currentEvent;

        },

        _setLastEvent() {

            this.$element.objProps.lastEvent = this.$element.objProps.currentEvent;

        },

        _getLastEvent() {

            return this.$element.objProps.lastEvent;

        },

        _getViewportBottomLimit() {

            return this.$element.objProps.viewportBottomLimit;

        },

        _getViewportTopLimit() {

            return this.$element.objProps.viewportTopLimit;

        },

        _getElementCenterPosition() {

            return this.$element.objProps.elementCenterPosition;

        },

        _getElementHeight() {

            return this.$element.objProps.elementHeight;

        },

        _checkIfLastEvent() {

            return this._getLastEvent() === this._getCurrentEvent();

        },

        _checkIfEventAlreadyTriggered() {

            return this.$element.objProps.eventsQueue.includes(this._getCurrentEvent());

        },

        _addEventToQueue() {

            if (!this._checkIfEventAlreadyTriggered()) {

                this.$element.objProps.eventsQueue.push(this._getCurrentEvent());

            }

        },

        _resetEvents() {

            this.$element.objProps.lastEvent = "";
            this.$element.objProps.currentEvent = "";

        },

        _initViewport() {

            const isWindow = this._isWindow();
            const offset = isWindow ? 0 : jQuery(this.options.window).offset().top;
            this._updateViewport();
            this.$element.objProps.viewportHeight = jQuery(this.options.window).height();
            this.$element.objProps.viewportWidth = jQuery(this.options.window).width();
            this.$element.objProps.viewportBottom = this.$element.objProps.viewportTop + this.$element.objProps.viewportHeight;
            this.$element.objProps.viewportLeft = isWindow ? 0 : jQuery(this.options.window).offset().left;

            /* NEW METHOD */
            this.$element.objProps.centerLimit = ((this.$element.objProps.viewportHeight * this.options.top) + offset)
                                                    + (this.$element.objProps.viewportHeight * (1 - (this.options.top + this.options.bottom)) * 0.5);
            this.$element.objProps.distanceTop = this.$element.objProps.centerLimit - (this.$element.objProps.viewportHeight * (1 - (this.options.top + this.options.bottom)) * 0.5);
            this.$element.objProps.distanceBottom = this.$element.objProps.centerLimit + (this.$element.objProps.viewportHeight * (1 - (this.options.top + this.options.bottom)) * 0.5);

            this.$element.objProps.extremeTop = this.$element.objProps.distanceTop - (this.$element.objProps.viewportHeight * this.options.top);
            this.$element.objProps.extremeBottom = this.$element.objProps.distanceBottom + (this.$element.objProps.viewportHeight * this.options.bottom);

            this.$element.objProps.viewportTopLimit = this.$element.objProps.distanceTop;
            this.$element.objProps.viewportBottomLimit = this.$element.objProps.distanceBottom;
            this.$element.objProps.viewportCenterLimit = this.$element.objProps.centerLimit;

        },

        _updateViewport() {

            this.$element.objProps.viewportTop = jQuery(this.options.window).scrollTop();

        },

        _isWindow() {

            return this.options.window === window;

        },

        _initObj() {

            this.$element.objProps.originalTop = this.$element.offset().top;
            this.$element.objProps.originalLeft = this.$element.offset().left;
            this.$element.objProps.initialized = true;

        },

        _updateObj() {

            const props = this.$element.objProps;
            const isWindow = this._isWindow();
            this._updateViewport();
            props.initialized = true;
            props.display = this.$element.css("display");
            props.elementWidth = this.$element.outerWidth();
            props.elementHeight = this.$element.outerHeight();
            props.elementTop = this.$element.offset().top;
            props.elementCenter = props.elementTop + props.elementHeight / 2;
            props.elementBottom = props.elementTop + props.elementHeight;

            if (isWindow) {

                props.elementTopPosition = props.elementTop - props.viewportTop;
                props.elementCenterPosition = props.elementTopPosition + props.elementHeight / 2;
                props.elementBottomPosition = props.elementTopPosition + props.elementHeight;

            } else {

                props.elementTopPosition = props.elementTop;
                props.elementCenterPosition = props.elementCenter;
                props.elementBottomPosition = props.elementBottom;

            }

            // Check this for future offset more stable fix
            // https://stackoverflow.com/questions/30875646/jquery-offset-top-slightly-off-every-other-time

        },

        _calculateOpacityValue(limit) {

            const max = this._getElementHeight() / 2;
            const current = Math.abs(limit - this._getElementCenterPosition());
            const opacity = (max - current) / max;
            return opacity;

        },

        _getCurrentElementOpacity() {

            let opacity = 0;
            const status = this._getCurrentEvent();

            switch (status) {

                case "C":
                    opacity = 1;
                    break;
                case "EB":
                case "EXB":
                    opacity = this._calculateOpacityValue(this._getViewportBottomLimit());
                    break;
                case "ET":
                case "EXT":
                    opacity = this._calculateOpacityValue(this._getViewportTopLimit());
                    break;
                default:
                    break;

            }

            return opacity.toFixed(2);

        },

        _getPrevNextElementOpacity() {

            // Take the max value between current, next and prev elements in viewport
            let c = 0;
            let nxt = 0;
            let prev = 0;

            const nxtObj = this._getNextElement(this.i);
            const prvObj = this._getPrevElement(this.i);

            c = this._getCurrentElementOpacity();

            if (typeof nxtObj !== "undefined" && nxtObj.$element.hasOwnProperty("objProps")) {

                nxt = nxtObj._getCurrentElementOpacity();

            }

            if (typeof prvObj !== "undefined" && prvObj.$element.hasOwnProperty("objProps")) {

                prev = prvObj._getCurrentElementOpacity();

            }

            return Math.max(c, nxt, prev);

        },

        _registerLightboxEvents() {

            const obj = this;

            /* LIGHTBOX EVENTS */
            obj.$element.on("EB EXB ET EXT O  U C", function() {

                return obj._fading();

            });

        },

        _fading() {

            const props = this.$element.objProps;
            const overlayPercentage = this._getPrevNextElementOpacity();
            const displayOverlay = overlayPercentage <= 0 ? "none" : "block";
            const displayElement = this._getCurrentElementOpacity() <= 0 ? "none" : props.display;

            jQuery("#overlayStandout").css({
                "display": displayOverlay,
                "opacity": overlayPercentage < 0.75 ? overlayPercentage : 0.75
            });
            jQuery(`.${this.clonedId}`).css({
                "display": displayElement,
                "position": "absolute",
                "top": props.originalTop,
                "left": props.originalLeft,
                "z-index": "10000",
                "width": props.elementWidth,
                "height": props.elementHeight,
                "margin": "0",
                "opacity": this._getCurrentElementOpacity() < 1 ? this._getCurrentElementOpacity() : 1
            });

        },

        _getOptions(options) {

            return options.lightBoxEffect ? jQuery.extend({}, defaults, options, lightboxOptions) : jQuery.extend({}, defaults, options);

        },

        _getElement(i) {

            let obj = false;
            if (typeof allStandout[i] !== "undefined" && i > -1 && i < allStandout.length) {

                obj = jQuery(allStandout[i].element);
                obj.objProps = jQuery.extend({}, objProps);

            }
            return obj;

        },

        _getNextElement(i) {

            return allStandout[i + 1];

        },

        _getPrevElement(i) {

            return allStandout[i - 1];

        },

        _setDemoLayout(opt, offset) {

            const props = this.$element.objProps;
            demoLayout.demoLayoutTop.top = offset <= 0 ? offset : props.viewportTop + offset;
            demoLayout.demoLayoutBottom.top = this._getDemoLayoutBottomTopPosition(offset, props, opt);
            demoLayout.demoLayoutTop.width = props.viewportWidth;
            demoLayout.demoLayoutCenter.width = props.viewportWidth;
            demoLayout.demoLayoutBottom.width = props.viewportWidth;
            demoLayout.demoLayoutTop.left = props.viewportLeft;
            demoLayout.demoLayoutCenter.left = props.viewportLeft;
            demoLayout.demoLayoutBottom.left = props.viewportLeft;

            let height = props.viewportHeight * opt.top;
            let overlay = jQuery("<div />").css(demoLayout.demoLayoutTop).css("height", height).attr("id", "demoLayoutTop");
            jQuery(opt.body).append(overlay);
            const top = (demoLayout.demoLayoutTop.top + props.viewportHeight * opt.top) + (props.viewportHeight - (props.viewportHeight * opt.top + props.viewportHeight * opt.bottom)) / 2;
            overlay = jQuery("<div />").css(demoLayout.demoLayoutCenter).css("top", top);
            jQuery(opt.body).append(overlay);
            height = props.viewportHeight * opt.bottom;
            overlay = jQuery("<div />").css(demoLayout.demoLayoutBottom).css("height", height).attr("id", "demoLayoutBottom");
            jQuery(opt.body).append(overlay);

        },

        _getDemoLayoutBottomTopPosition(offset, props, opt) {

            let topPosition = (props.viewportBottom + offset) - props.viewportHeight * opt.bottom;

            if (offset <= 0) {

                topPosition = props.viewportHeight - props.viewportHeight * opt.bottom;

            }

            return topPosition;

        },

        _setOverlayLayout(opt) {

            const overlay = jQuery("<div />").css(opt.overlay).attr("id", opt.overlayId);
            jQuery(opt.body).append(overlay);

        },

        _duplicateElement(el, c, opt) {

            jQuery(el).clone(true, true).addClass(c).css("display", "none")
            .appendTo(opt.body);

        },
    });

    /* eslint-disable */
    jQuery.fn[pluginName] = function(options) {
    /* eslint-enable */

        if (options === undefined || typeof options === "object") {

            const allElements = this;
            const lastIdx = allElements.length - 1;
            return this.each(function(i) {

                // Only allow the plugin to be instantiated once,
                // so we check that the element has no plugin instantiation yet
                if (!jQuery.data(this, `plugin_${pluginName}`)) {

                    // if it has no instance, create a new one,
                    // pass options to our plugin constructor,
                    // and store the plugin instance
                    // in the elements jQuery data object.
                    jQuery.data(this, `plugin_${pluginName}`, new Standout(allElements[i], i, options, (i === lastIdx)));

                }

            });

        }

        // If the first parameter is a string and it doesn't start
        // with an underscore or "contains" the `init`-function,
        // treat this as a call to a public method.
        if (typeof options === "string" && options[0] !== "_" && options !== "init") {

            // Allow instances to be destroyed via the 'destroy' method
            if (options === "destroy") {

                jQuery.data(this, `plugin_${pluginName}`, null);

            }

        } else {

            console.log("No public method available");

        }

    };

}(jQuery, window, document));
