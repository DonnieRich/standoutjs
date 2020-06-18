;
(function($, window, document, undefined){
    'use strict';

    const pluginName = "standout";
    // Demo layout
    let demoInit = false;
    // Area Of Effect
    let aoeDefined = false;
    let allStandout = [];

    function Standout(element, i, options, isLast) {
        this._name = pluginName;
        this.i = i;
        this.idx = 'standout_' + this.i;
        this.clonedId = this.idx + '_cloned';
        this.isLastElement = isLast;
        this.options = this.getOptions(options);
        this.element = element; //Standout.getElement(elements, i);
        this.enabled = this.options.enabled;
        allStandout[i] = this;
        this.init();
    }

    /* Private */
    Standout.prototype.init = function() {

        if(this.options.showDemoLayout && !demoInit) {
            demoInit = true;
            Standout.setDemoLayout(this.options);
        }

        if(this.options.lightBoxEffect) {
            if($("#"+this.options.overlayId).length === 0) {
                Standout.setOverlayLayout(this.options);
            }

            if($("." + this.clonedId).length === 0) {
                Standout.duplicateElement(this.element, this.clonedId);
            }

            if(this.options.compatibility && this.isLastElement && typeof this.options.dynamicContentListeners === 'function'){
                this.options.dynamicContentListeners();
            }
        }

        this.buildCache();
        this.bindEvents();
    }

    /* Private */
    Standout.prototype.buildCache = function(){
        this.$element = this.getElement(this.i);
    }

    /* Private */
    Standout.prototype.bindEvents = function(){
        let obj = this;
        let prev = this.getPrevElement(this.i);
        let nxt = this.getNextElement(this.i);

        $(window).on("resize scroll", function(){
            obj.$element.objProps.init(obj.$element, obj.i).update(obj.$element, obj.options);

            if(prev) {
                prev.$element.objProps.init(prev.$element).update(prev.$element, prev.options);
            }

            if(nxt) {
                nxt.$element.objProps.init(nxt.$element).update(nxt.$element, nxt.options);
            }

            if(obj.$element.objProps.isInViewport()) {
                obj.$element.objProps.currentEvent = obj.$element.objProps.status();
                if((!obj.options.onlyFirstTime && obj.$element.objProps.currentEvent === obj.$element.objProps.lastEvent) || obj.$element.objProps.currentEvent != obj.$element.objProps.lastEvent) {
                    Standout.fireEvent(obj, nxt, prev);
                }
                obj.$element.objProps.lastEvent = obj.$element.objProps.currentEvent;
            }
        });
    }

    /* Private */
    Standout.fireEvent = function(obj, nxtObj, prvObj){
        switch(obj.$element.objProps.currentEvent) {
            case "EB":
                obj.options.enteringFromBottom(obj, nxtObj, prvObj);
                break;
            case "EXB":
                obj.options.exitingFromBottom(obj, nxtObj, prvObj);
                break;
            case "ET":
                obj.options.enteringFromTop(obj, nxtObj, prvObj);
                break;
            case "EXT":
                obj.options.exitingFromTop(obj, nxtObj, prvObj);
                break;
            case "C":
                obj.options.center(obj);
                break;
            case "O":
                obj.options.over(obj, nxtObj, prvObj);
                break;
            case "U":
                obj.options.under(obj, nxtObj, prvObj);
                break;
            default:
                break;
        }
    }

    /* Public */
    Standout.prototype.destroy = function() {
         this.$element.removeData();
    }

    /* Private */
    Standout.prototype.getOptions = function(options) {
        return options.lightBoxEffect ? $.extend({}, Standout.defaults, options, Standout.lightboxMethods) : $.extend({}, Standout.defaults, options);
    }

    /* Private */
    Standout.prototype.getElement = function(i) {
        let obj = false;
        if (typeof allStandout[i] !== 'undefined' && i > -1 && i < allStandout.length) {
            obj = $(allStandout[i].element);
            obj.objProps = $.extend({}, Standout.objProps);
        }
        return obj;
    }

    /* Private */
    Standout.prototype.getNextElement = function(i) {
        return allStandout[i+1];
    }

    /* Private */
    Standout.prototype.getPrevElement = function(i) {
        return allStandout[i-1];
    }

    /* Private */
    Standout.setDemoLayout = function(opt) {
        let overlay = $("<div />").css(Standout.demoLayout.demoLayoutTop).css("height", "calc(100vh*" + opt.top + ")").attr("id", "demoLayoutTop");
        $("body").append(overlay);
        overlay = $("<div />").css(Standout.demoLayout.demoLayoutCenter).css("top", "calc(100vh * " + opt.top + " + (100vh - (100vh * " + opt.top + " + 100vh * " + opt.bottom + "))/2)");
        $("body").append(overlay);
        overlay = $("<div />").css(Standout.demoLayout.demoLayoutBottom).css("height", "calc(100vh*" + opt.bottom + ")").attr("id", "demoLayoutBottom");
        $("body").append(overlay);
    }

    /* Private */
    Standout.defaults = {
        // First two parameters allow the execution of code right after the element is cloned (ie. register waypoint event for the new content, etc...)
        // You should insert here the original function that will be executed only once after the element is appended at the body
        compatibility: false,
        dynamicContentListeners: false,
        enteringFromTop: false,
        exitingFromTop: false,
        center: false,
        enteringFromBottom: false,
        exitingFromBottom: false,
        under: false,
        over: false,
        // Fire the function linked to the event just the first time and not at every subsequent scroll (it will still be fired if the last event is different from the current one)
        onlyFirstTime: true,
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
    }

    /* Private */
    Standout.lightboxMethods = {
        enteringFromTop: function(obj, nxtObj, prvObj){return obj.$element.objProps.fading(obj, nxtObj, prvObj);},
        exitingFromTop: function(obj, nxtObj, prvObj){return obj.$element.objProps.fading(obj, nxtObj, prvObj);},
        center: function(obj){return obj.$element.objProps.showing(obj);},
        enteringFromBottom: function(obj, nxtObj, prvObj){return obj.$element.objProps.fading(obj, nxtObj, prvObj);},
        exitingFromBottom: function(obj, nxtObj, prvObj){return obj.$element.objProps.fading(obj, nxtObj, prvObj);},
        under: function(obj, nxtObj, prvObj){obj.$element.objProps.fading(obj, nxtObj, prvObj);},
        over: function(obj, nxtObj, prvObj){obj.$element.objProps.fading(obj, nxtObj, prvObj);},
        onlyFirstTime: false
    }

    /* Private */
    Standout.objProps = {
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
        isInViewport: function() {
            return this.elementBottom > this.viewportTop && this.elementTop < this.viewportBottom && this.initialized;
        },
        status: function() {
            let status = "U";
            if(this.lastViewportTop === 0) {this.lastViewportTop = this.viewportTop;}
            if(this.elementCenterPosition >= this.viewportTopLimit && this.elementCenterPosition <= this.viewportBottomLimit) {
                status = "C";
            }  else if (this.elementBottomPosition > this.viewportTopLimit && this.elementCenterPosition < this.viewportTopLimit &&
                this.viewportTop < this.lastViewportTop) {
                    status = "ET";
                } else if (this.elementTopPosition < this.viewportBottomLimit && this.elementCenterPosition > this.viewportBottomLimit &&
                    this.viewportTop > this.lastViewportTop) {
                        status = "EB";
                    } else if(this.elementBottomPosition > this.viewportTopLimit && this.elementCenterPosition < this.viewportTopLimit &&
                        this.viewportTop > this.lastViewportTop) {
                            status = "EXT";
                        } else if (this.elementTopPosition < this.viewportBottomLimit && this.elementCenterPosition > this.viewportBottomLimit &&
                            this.viewportTop < this.lastViewportTop) {
                                status = "EXB";
                            } else if(this.elementBottomPosition < this.viewportTopLimit) {
                                status = "O";
                            }
                            this.lastViewportTop = this.viewportTop;
                            return status;
                        },
        percentage: function() {
            let opacity = 0;
            if(this.elementCenterPosition >= this.viewportCenterLimit) {
                if(this.elementCenterPosition <= this.viewportBottomLimit) {
                    opacity = 1;
                } else {
                    let max = this.elementHeight/2;
                    let current = Math.abs(this.viewportBottomLimit - this.elementCenterPosition);
                    opacity = 1 - current/max;
                }
            } else {
                if(this.elementCenterPosition >= this.viewportTopLimit) {
                    opacity = 1;
                } else {
                    let max = this.elementHeight/2;
                    let current = Math.abs(this.viewportTopLimit - this.elementCenterPosition);
                    opacity = 1 - current/max;
                }
            }
            return opacity.toFixed(2);
        },
        update: function(el, opt) {
            this.initialized = true;
            this.elementWidth = el.width();
            this.elementHeight = el.outerHeight();
            this.elementTop = el.offset().top;
            this.elementCenter = this.elementTop + this.elementHeight/2;
            this.elementBottom = this.elementTop + this.elementHeight;
            this.viewportHeight = $(window).height();
            this.viewportTop = $(window).scrollTop();
            this.viewportBottom = this.viewportTop + $(window).height();
            this.viewportTopLimit = this.viewportHeight*opt.top;
            this.viewportBottomLimit = this.viewportHeight - this.viewportHeight*opt.bottom;
            this.viewportCenterLimit = this.viewportTopLimit + (this.viewportHeight * (1 - (opt.top + opt.bottom)) * 0.5);
            this.elementTopPosition = this.elementTop - this.viewportTop;
            this.elementCenterPosition = this.elementTopPosition + this.elementHeight/2;
            this.elementBottomPosition = this.elementTopPosition + this.elementHeight;
            return this;
        },
        init: function(el) {
            this.originalTop = el.offset().top;
            this.originalLeft = el.offset().left;
            this.initialized = true;
            return this;
        },
        fading: function(obj, nxtObj, prvObj) {
            let overlayPercentage = this.getCorrectOverlayPercentage(nxtObj, prvObj);
            $("#overlayStandout").css({
                "display": "block",
                "opacity": overlayPercentage < 0.75 ? overlayPercentage : 0.75
            });
            $("."+obj.clonedId).css({
                "display": "block",
                "position": "absolute",
                "top": this.originalTop,
                "left": this.originalLeft,
                "z-index": "10000",
                "width": this.elementWidth,
                "height": this.elementHeight,
                "margin": "0",
                "opacity": this.percentage() < 1 ? this.percentage() : 1
            });
            // console.log("IS FADING");
            return this;
        },
        showing: function(obj) {
            $("#overlayStandout").css({
                "display": "block",
                "opacity": this.percentage() > 0.75 ? 0.75 : this.percentage()
            });
            $("."+obj.clonedId).css({
                "display": "block",
                "position": "absolute",
                "top": this.originalTop,
                "left": this.originalLeft,
                "z-index": "10000",
                "width": this.elementWidth,
                "height": this.elementHeight,
                "opacity": this.percentage() > 1 ? 1 : this.percentage()
            });
            // console.log("IS SHOWING");
            return this;
        },
        hiding: function() {
            return this;
        },
        getCorrectOverlayPercentage: function(nxtObj, prvObj){
            // Take the max value between current, next and prev elements in viewport
            let c, nxt, prev;
            c = nxt = prev = 0;

            c = this.percentage();
            if(typeof nxtObj !== "undefined" && nxtObj.$element.hasOwnProperty("objProps")) {
                console.log("NNNN");
                nxt = nxtObj.$element.objProps.percentage();
            }

            if(typeof prvObj !== "undefined" && prvObj.$element.hasOwnProperty("objProps")) {
                prev = prvObj.$element.objProps.percentage();
            }

            // console.log("Current:" + c);
            // console.log("Nxt:" + nxt);
            // console.log("Prev:" + prev);

            return Math.max(c, nxt, prev);
        }
    }

    /* Private */
    Standout.demoLayout = {
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
    }

    /* Private */
    Standout.setOverlayLayout = function(opt){
        let overlay = $("<div />").css(opt.overlay).attr("id", opt.overlayId);
        $("body").append(overlay);
    }

    /* Private */
    Standout.getOuterHtml = function(el, c){
        el = $(el);
        return $('<div />').append(el.eq(0).clone().css("display", "none").addClass(c)).html();
    }

    /* Private */
    Standout.duplicateElement = function(el, c) {
        let html = Standout.getOuterHtml(el, c);
        $("body").append(html);
    }

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
        } else {
            console.log("No public methods availables");
        }
    }

}(jQuery, window, document));
