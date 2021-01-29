;
(function($, window, document, undefined){
    'use strict';

    const pluginName = "standout";
    // Demo layout
    let demoInit = false;

    let allStandout = [];

    let defaults = {
        // Fire the function linked to the event just the first time and not at every subsequent scroll (it will still be fired if the last event is different from the current one)
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
            height: "100%",
            position: "fixed",
            top: "0",
            left: "0",
            zIndex: "9999",
            display: "none"
        },
        overlayId: "overlayStandout",
        enabled: true
    };

    let lightboxOptions = {
        onlyFirstTime: false,
        oncePerEvent: false
    };

    let objProps = {
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

    let demoLayout = {
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
            bottom: "0",
            left: "0",
            zIndex: "9999"
        }
    };

    function Standout(element, i, options, isLast) {
        this._name = pluginName;
        this.i = i;
        this.idx = 'standout_' + this.i;
        this.clonedId = this.idx + '_cloned';
        this.isLastElement = isLast;
        this.options = this._getOptions(options);
        this.element = element;
        this.enabled = this.options.enabled;
        allStandout[i] = this;
        this._init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend( Standout.prototype, {
        
        _init : function() {
            
            this._buildCache();
            this._bindEvents();

            if(this.options.showDemoLayout && !demoInit) {
                demoInit = true;
                this._setDemoLayout(this.options);
            }

            if(this.options.lightBoxEffect) {
                if($("#"+this.options.overlayId).length === 0) {
                    this._setOverlayLayout(this.options);
                }

                if($("." + this.clonedId).length === 0) {
                    this._duplicateElement(this.element, this.clonedId);
                }

                if(this.options.compatibility && this.isLastElement && typeof this.options.dynamicContentListeners === 'function'){
                    this.options._dynamicContentListeners();
                }

                this._registerLightboxEvents();
            }

        },

        _buildCache : function(){
            this.$element = this._getElement(this.i);
        },

        _bindEvents : function(){
            let obj = this;

            $(window).on("resize scroll", function(){
                //obj.$element.objProps.init(obj.$element, obj.i).update(obj.$element, obj.options);
                obj._initObj();
                obj._updateObj();

                // if(obj.$element.objProps._isInViewport()) {
                if(obj._isInViewport()) {
                    //obj.$element.objProps.currentEvent = obj.$element.objProps.status();
                    obj._setCurrentEvent();
                    if((!obj.options.oncePerEvent) || 
                    (obj.options.onlyFirstTime && obj.options.oncePerEvent && !obj._checkIfEventAlreadyTriggered()) ||
                    (obj.options.oncePerEvent && !obj.options.onlyFirstTime && !obj._checkIfLastEvent())) {
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

        _isInViewport : function() {
            return this.$element.objProps.elementBottom > this.$element.objProps.viewportTop && this.$element.objProps.elementTop < this.$element.objProps.viewportBottom && this.$element.objProps.initialized;
        },

        _setCurrentEvent : function() {
            let objProps = this.$element.objProps;
            let event = "U";
            if(objProps.lastViewportTop === 0) {objProps.lastViewportTop = objProps.viewportTop;}

            if(objProps.elementCenterPosition >= objProps.viewportTopLimit && objProps.elementCenterPosition <= objProps.viewportBottomLimit) {
                event = "C";
            } else {
                if(objProps.elementBottomPosition < objProps.viewportTopLimit) {
                    event = "O";
                } else {
                    if (objProps.elementBottomPosition > objProps.viewportTopLimit && objProps.elementCenterPosition < objProps.viewportTopLimit) {
                        if(objProps.viewportTop < objProps.lastViewportTop) {
                            event = "ET";
                        } else {
                            event = "EXT";
                        }
                    } else if (objProps.elementTopPosition < objProps.viewportBottomLimit && objProps.elementCenterPosition > objProps.viewportBottomLimit) {
                        if(objProps.viewportTop > objProps.lastViewportTop) {
                            event = "EB";
                        } else {
                            event = "EXB";
                        }
                    }
                }
            }

            objProps.lastViewportTop = objProps.viewportTop;
            //return event;
            objProps.currentEvent = event;
        },

        _getCurrentEvent : function() {
            return this.$element.objProps.currentEvent;
        },

        _setLastEvent : function() {
            this.$element.objProps.lastEvent = this.$element.objProps.currentEvent;
        },

        _getLastEvent : function() {
            return this.$element.objProps.lastEvent;
        },

        _getViewportBottomLimit : function() {
            return this.$element.objProps.viewportBottomLimit;
        },

        _getViewportTopLimit : function() {
            return this.$element.objProps.viewportTopLimit;
        },

        _getElementCenterPosition : function() {
            return this.$element.objProps.elementCenterPosition;
        },

        _getElementHeight : function() {
            return this.$element.objProps.elementHeight;
        },

        _checkIfLastEvent : function() {
            return this._getLastEvent() === this._getCurrentEvent();
        },

        _checkIfEventAlreadyTriggered : function() {
            return this.$element.objProps.eventsQueue.includes(this._getCurrentEvent());
        },

        _addEventToQueue : function() {
            if(!this._checkIfEventAlreadyTriggered()) {
                this.$element.objProps.eventsQueue.push(this._getCurrentEvent());
            }
        },

        _resetEvents : function() {
            this.$element.objProps.lastEvent = this.$element.objProps.currentEvent = "";
        },

        _initObj : function() {
            this.$element.objProps.originalTop = this.$element.offset().top;
            this.$element.objProps.originalLeft = this.$element.offset().left;
            this.$element.objProps.initialized = true;
        },

        _updateObj : function() {
            let objProps = this.$element.objProps;
            objProps.initialized = true;
            objProps.elementWidth = this.$element.width();
            objProps.elementHeight = this.$element.outerHeight();
            objProps.elementTop = this.$element.offset().top;
            objProps.elementCenter = objProps.elementTop + objProps.elementHeight/2;
            objProps.elementBottom = objProps.elementTop + objProps.elementHeight;
            objProps.viewportHeight = $(window).height();
            objProps.viewportTop = $(window).scrollTop();
            objProps.viewportBottom = objProps.viewportTop + $(window).height();
            objProps.viewportTopLimit = objProps.viewportHeight*this.options.top;
            objProps.viewportBottomLimit = objProps.viewportHeight - objProps.viewportHeight*this.options.bottom;
            objProps.viewportCenterLimit = objProps.viewportTopLimit + (objProps.viewportHeight * (1 - (this.options.top + this.options.bottom)) * 0.5);
            objProps.elementTopPosition = objProps.elementTop - objProps.viewportTop;
            objProps.elementCenterPosition = objProps.elementTopPosition + objProps.elementHeight/2;
            objProps.elementBottomPosition = objProps.elementTopPosition + objProps.elementHeight;
        },

        _calculateOpacityValue : function(limit) {
            let max = this._getElementHeight()/2;
            let current = Math.abs(limit - this._getElementCenterPosition());
            let opacity = (max - current) / max;
            return opacity;
        },

        _getCurrentElementOpacity : function() {
            let opacity = 0;
            let status = this._getCurrentEvent();

            switch(status) {
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

        _getPrevNextElementOpacity : function() {
            // Take the max value between current, next and prev elements in viewport
            let c, nxt, prev;
            c = nxt = prev = 0;

            let nxtObj = this._getNextElement(this.i);
            let prvObj = this._getPrevElement(this.i);

            c = this._getCurrentElementOpacity();

            if(typeof nxtObj !== "undefined" && nxtObj.$element.hasOwnProperty("objProps")) {
                nxt = nxtObj._getCurrentElementOpacity();
            }

            if(typeof prvObj !== "undefined" && prvObj.$element.hasOwnProperty("objProps")) {
                prev = prvObj._getCurrentElementOpacity();
            }

            return Math.max(c, nxt, prev);
        },

        
        _registerLightboxEvents : function(){
            let obj = this;

            /* LIGHTBOX EVENTS */        
            obj.$element.on("EB EXB ET EXT O  U C", function(){
                return obj._fading();
            });

        },

        _fading : function() {
            let objProps = this.$element.objProps;
            let overlayPercentage = this._getPrevNextElementOpacity();
            $("#overlayStandout").css({
                "display": "block",
                "opacity": overlayPercentage < 0.75 ? overlayPercentage : 0.75
            });
            $("." + this.clonedId).css({
                "display": "block",
                "position": "absolute",
                "top": objProps.originalTop,
                "left": objProps.originalLeft,
                "z-index": "10000",
                "width": objProps.elementWidth,
                "height": objProps.elementHeight,
                "margin": "0",
                "opacity": this._getCurrentElementOpacity() < 1 ? this._getCurrentElementOpacity() : 1
            });
        },

        
        _getOptions : function(options) {
            return options.lightBoxEffect ? $.extend({}, defaults, options, lightboxOptions) : $.extend({}, defaults, options);
        },

        
        _getElement : function(i) {
            let obj = false;
            if (typeof allStandout[i] !== 'undefined' && i > -1 && i < allStandout.length) {
                obj = $(allStandout[i].element);
                obj.objProps = $.extend({}, objProps);
            }
            return obj;
        },

        
        _getNextElement : function(i) {
            return allStandout[i+1];
        },

        
        _getPrevElement : function(i) {
            return allStandout[i-1];
        },

        _setDemoLayout : function(opt) {
            let overlay = $("<div />").css(demoLayout.demoLayoutTop).css("height", "calc(100vh*" + opt.top + ")").attr("id", "demoLayoutTop");
            $("body").append(overlay);
            overlay = $("<div />").css(demoLayout.demoLayoutCenter).css("top", "calc(100vh * " + opt.top + " + (100vh - (100vh * " + opt.top + " + 100vh * " + opt.bottom + "))/2)");
            $("body").append(overlay);
            overlay = $("<div />").css(demoLayout.demoLayoutBottom).css("height", "calc(100vh*" + opt.bottom + ")").attr("id", "demoLayoutBottom");
            $("body").append(overlay);
        },

        
        _setOverlayLayout : function(opt){
            let overlay = $("<div />").css(opt.overlay).attr("id", opt.overlayId);
            $("body").append(overlay);
        },

        
        _duplicateElement : function(el, c) {
            $(el).clone(true, true).addClass(c).css("display", "none").appendTo("body");
        },
    });


    $.fn[pluginName] = function(options) {
        if (options === undefined || typeof options === 'object') {
            let allElements = this;
            let lastIdx = allElements.length - 1;
            return this.each(function(i){
                // Only allow the plugin to be instantiated once,
                // so we check that the element has no plugin instantiation yet
                if (!$.data(this, 'plugin_' + pluginName)) {

                    // if it has no instance, create a new one,
                    // pass options to our plugin constructor,
                    // and store the plugin instance
                    // in the elements jQuery data object.
                    $.data(this, 'plugin_' + pluginName, new Standout( allElements[i], i, options, (i === lastIdx) ));
                }
            });
        } 
        // If the first parameter is a string and it doesn't start
        // with an underscore or "contains" the `init`-function,
        // treat this as a call to a public method.
        else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') { 
            // Allow instances to be destroyed via the 'destroy' method
            if (options === 'destroy') {
                $.data(this, 'plugin_' + pluginName, null);
            }
        } else {
            console.log("No public method available");
        }
    }

}(jQuery, window, document));
