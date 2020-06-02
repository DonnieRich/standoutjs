(function($){
    $.fn.standout = function(options){
        // This is the easiest way to have default options.
        let settings = $.extend({}, $.fn.standout.defaults, options);
        let obj = $(this);
        let id = obj.attr("id") + "_clone";
        duplicateElement(obj, settings);

        $(window).on("resize scroll", function(){
            obj.each(function(){
                let objProps = $.fn.standout.data;
                objProps.init(obj).update(obj, settings);
                if(objProps.isInViewport()) {
                    switch(objProps.status()) {
                        case "EB":
                        case "EXB":
                        case "ET":
                        case "EXT":
                            $("#overlayStandout").css({
                                "display": "block",
                                "opacity": objProps.percentage() < 0.75 ? objProps.percentage() : 0.75
                            });
                            $("#"+id).css({
                                "display": "block",
                                "position": "absolute",
                                "top": objProps.originalTop,
                                "left": objProps.originalLeft,
                                "z-index": "10000",
                                "width": objProps.elementWidth,
                                "height": objProps.elementHeight,
                                "opacity": objProps.percentage() < 1 ? objProps.percentage() : 1
                            });
                            break;
                        case "C":
                            $("#overlayStandout").css({
                                "display": "block",
                                "opacity": 0.75
                            });
                            $("#"+id).css({
                                "display": "block",
                                "position": "absolute",
                                "top": objProps.originalTop,
                                "left": objProps.originalLeft,
                                "z-index": "10000",
                                "width": objProps.elementWidth,
                                "height": objProps.elementHeight,
                                "opacity": 1
                            });
                            break;
                        case "O":
                        case "U":
                        default:
                            $("#overlayStandout").fadeOut();
                            $("#"+id).fadeOut();
                            break;
                    }
                }
            });
        });

        return this;
    };

    $.fn.standout.defaults = {
        // Change name of waypoint parameters to be more universal
        waypoint: false,
        waypointFunc: function(){},
        entering: function(){},
        center: function(){},
        exiting: function(){},
        under: function(){},
        over: function(){},
        backgroundColor: "#000000",
        top: 0.3,
        bottom: 0.6,
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
                if(this.elementCenterPosition <= this.viewportHeight/2) {
                    opacity = (this.elementCenterPosition)/(this.viewportBottomLimit);
                } else {
                    opacity = (this.viewportTopLimit)/(this.elementCenterPosition);
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
            this.viewportBottomLimit = this.viewportHeight - this.viewportHeight*opt.top;
            this.elementTopPosition = this.elementTop - this.viewportTop;
            this.elementCenterPosition = this.elementTopPosition + this.elementHeight/2;
            this.elementBottomPosition = this.elementTopPosition + this.elementHeight;
            return this;
        },
        init: function(el) {
            this.originalTop = el.offset().top;
            this.originalLeft = el.offset().left;
            return this;
        }
    };

    function duplicateElement(el, opt) {
        let html = getOuterHtml(el);
        let overlay = $("<div />").css(opt.overlay).attr("id", "overlayStandout");
        $("body").append(overlay);
        $("body").append(html);
        if(opt.waypoint){opt.waypointFunc()};
    }

    function getOuterHtml(el) {
        let id = el.attr("id") + "_clone";
        return $('<div />').append(el.eq(0).clone().css("display", "none").attr("id", id)).html();
    }
}(jQuery));
