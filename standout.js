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
                objProps.init(obj).update(obj);
                if(objProps.isInViewport()) {
                    switch(objProps.status(settings)) {
                        case "E":
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
                                "opacity": objProps.percentage()
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
        waypoint: false,
        waypointFunc: function(){},
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
        elementBottom: 0,
        elementTopPosition: 0,
        elementBottomPosition: 0,
        viewportHeight: 0,
        viewportTop: 0,
        viewportBottom: 0,
        isInViewport: function() {
            return this.elementBottom > this.viewportTop && this.elementTop < this.viewportBottom && this.initialized;
        },
        status: function(opt) {
            let status = "E";
            if(this.elementTopPosition >= this.viewportHeight*opt.top && this.elementBottomPosition <= this.viewportHeight*opt.bottom) {
                status = "C";
            } else if(this.elementTopPosition < this.viewportHeight*opt.bottom && this.elementBottomPosition < this.viewportHeight*opt.top) {
                status = "O";
            } else if(this.elementTopPosition > this.viewportHeight*opt.bottom && this.elementBottomPosition > this.viewportHeight*opt.top) {
                status = "U";
            }
            return status;
        },
        percentage: function() {
                if(this.elementTopPosition+(this.elementHeight/2) <= this.viewportHeight/2) {
                    opacity = (this.elementTopPosition+(this.elementHeight/2))/(this.viewportTop/2);
                } else {
                    opacity = (this.viewportTop/2)/(this.elementTopPosition-(this.elementHeight/2));
                }
                return opacity.toFixed(2);
        },
        update: function(el) {
            this.initialized = true;
            this.elementWidth = el.width();
            this.elementHeight = el.outerHeight();
            this.elementTop = el.offset().top;
            this.elementBottom = this.elementTop + el.outerHeight();
            this.viewportHeight = $(window).height();
            this.viewportTop = $(window).scrollTop();
            this.viewportBottom = this.viewportTop + $(window).height();
            this.elementTopPosition = this.elementTop - this.viewportTop;
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
