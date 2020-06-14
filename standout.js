(function($){
    $.fn.standout = function(options){
        // This is the easiest way to have default options.
        let settings = options.lightBoxEffect ? $.extend({}, $.fn.standout.defaults, options, $.fn.standout.defaultMethods) : $.extend({}, $.fn.standout.defaults, options);
        let i = 0;
        let init = false;

        if(settings.showDemoLayout) {
            demoLayout(settings);
        }

        return this.each(function(){
            let obj = $(this);
            let id = "standout_clone_" + i;
            obj.objProps = $.extend({}, $.fn.standout.data);
            obj.customId = id;
            init = initialize(obj, settings, i, init);
            i++;

            $(window).on("resize scroll", function(){
                obj.objProps.init(obj).update(obj, settings);
                if(obj.objProps.isInViewport()) {
                    obj.objProps.currentEvent = obj.objProps.status();
                    if((!settings.onlyFirstTime && obj.objProps.currentEvent === obj.objProps.lastEvent) || obj.objProps.currentEvent != obj.objProps.lastEvent) {
                        switch(obj.objProps.currentEvent) {
                            case "EB":
                                settings.enteringFromBottom(obj);
                                break;
                            case "EXB":
                                settings.exitingFromBottom(obj);
                                break;
                            case "ET":
                                settings.enteringFromTop(obj);
                                break;
                            case "EXT":
                                settings.exitingFromTop(obj);
                                break;
                            case "C":
                                settings.center(obj);
                                break;
                            case "O":
                                settings.over(obj);
                                break;
                            case "U":
                                settings.under(obj);
                                break;
                            default:
                                break;
                        }
                    }
                    obj.objProps.lastEvent = obj.objProps.currentEvent;
                }
            });
        });
    };

    $.fn.standout.defaultMethods = {
        enteringFromTop: function(obj){return obj.objProps.fading(obj);},
        exitingFromTop: function(obj){return obj.objProps.fading(obj);},
        center: function(obj){return obj.objProps.showing(obj);},
        enteringFromBottom: function(obj){return obj.objProps.fading(obj);},
        exitingFromBottom: function(obj){return obj.objProps.fading(obj);},
        under: function(obj){obj.objProps.fading(obj);},
        over: function(obj){obj.objProps.fading(obj);},
        onlyFirstTime: false
    }

    $.fn.standout.defaults = {
        // First two parameters allow the execution of code right after the element is cloned (ie. register waypoint event for the new content, etc...)
        // You should insert here the original function that will be executed only once after the element is appended at the body
        compatibility: false,
        dynamicContentListeners: function(){},
        enteringFromTop: function(){},
        exitingFromTop: function(){},
        center: function(){},
        enteringFromBottom: function(){},
        exitingFromBottom: function(){},
        under: function(){},
        over: function(){},
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

    $.fn.standout.data = {
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
            return this;
        },
        fading: function(obj) {
            $("#overlayStandout").css({
                "display": "block",
                "opacity": this.percentage() < 0.75 ? this.percentage() : 0.75
            });
            $("."+obj.customId).css({
                "display": "block",
                "position": "absolute",
                "top": this.originalTop,
                "left": this.originalLeft,
                "z-index": "10000",
                "width": this.elementWidth,
                "height": this.elementHeight,
                "opacity": this.percentage() < 1 ? this.percentage() : 1
            });
            return obj;
        },
        showing: function(obj){
            $("#overlayStandout").css({
                "display": "block",
                "opacity": 0.75
            });
            $("."+obj.customId).css({
                "display": "block",
                "position": "absolute",
                "top": this.originalTop,
                "left": this.originalLeft,
                "z-index": "10000",
                "width": this.elementWidth,
                "height": this.elementHeight,
                "opacity": 1
            });
            return obj;
        },
        hiding: function(obj) {
            return obj;
        }
    };

    function initialize(obj, settings, i, init) {
        if(settings.lightBoxEffect) {
            if(!init) {
                overlayElement(settings);
                init = true;
            }
            duplicateElement(obj, settings, i);
        }
        return init;
    }

    function overlayElement(opt) {
        let overlay = $("<div />").css(opt.overlay).attr("id", "overlayStandout");
        $("body").append(overlay);
    }

    function duplicateElement(el, opt, i) {
        let html = getOuterHtml(el, i);
        $("body").append(html);
        if(opt.compatibility){opt.dynamicContentListeners()};
    }

    function getOuterHtml(el, i) {
        let id = "standout_clone_" + i;
        return $('<div />').append(el.eq(0).clone().css("display", "none").addClass(id)).html();
    }

    function demoLayout(opt) {
        let overlay = $("<div />").css(opt.demoLayoutTop).css("height", "calc(100vh*" + opt.top + ")").attr("id", "demoLayoutTop");
        $("body").append(overlay);
        overlay = $("<div />").css(opt.demoLayoutCenter).css("top", "calc(100vh * " + opt.top + " + (100vh - (100vh * " + opt.top + " + 100vh * " + opt.bottom + "))/2)");
        $("body").append(overlay);
        overlay = $("<div />").css(opt.demoLayoutBottom).css("height", "calc(100vh*" + opt.bottom + ")").attr("id", "demoLayoutBottom");
        $("body").append(overlay);
    }
}(jQuery));
