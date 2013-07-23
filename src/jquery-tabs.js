/*
 * jquery-tabs
 * https://github.com/amazingSurge/jquery-tabs
 *
 * Copyright (c) 2013 Wowhoo
 * Licensed under the MIT license.
 */

;(function(window, document, $, undefined) {
    "use strict";

    //var css3Transition = true;
    var $doc = $(document);

    // Constructor
    var Tabs = $.Tabs = function(element, options) {
        var self = this;

        this.element = element;
        this.$element = $(element);

        // options
        var meta_data = [];
        $.each(this.$element.data(), function(k, v) {
            var re = new RegExp("^tabs", "i");
            if (re.test(k)) {
                meta_data[k.toLowerCase().replace(re, '')] = v;
            }
        });

        this.options = $.extend(true, {}, Tabs.defaults, options, meta_data);
        this.namespace = this.options.namespace;

        // Class
        this.classes = {
            activeTab: this.namespace + '_active',
            activePanes: this.namespace + '_active',
            effect: this.namespace + '-' + this.options.effect,
            show: this.namespace + '-' + this.options.effect + '_show',
            panes: this.namespace + '-panes',
            skin: this.namespace + '_' + this.options.skin
        };

        this.$tabs = this.$element.children();
        this.$panes = $(this.options.panes).addClass(this.classes.panes + ' ' + this.classes.effect);
        this.$panesItem = this.$panes.children();

        if (this.options.skin) {
            this.$tabs.addClass(this.classes.skin);
            this.$panes.addClass(this.classes.skin);
        }
        
        this.$loading = $('<span class="' + this.namespace + '-loading"></span>');

        if (this.options.ajax === true) {
            this.ajax = [];
            $.each(this.$tabs, function(i,v) {
                var obj = {};
                obj.href = $(v).data('href');
                self.ajax.push(obj);
            });
        }

        this.init();
    };


    // Default options for the plugin as a simple object
    Tabs.defaults = {
        namespace: 'tabs',

        panes: '.panes',

        skin: null,
        initialIndex: 0,
        
        effect: 'fade',

        ajax: false,
        cached: false,

        history: false,

        event: 'click'
    };

    Tabs.prototype = {
        constructor: Tabs,
        init: function() {
            var self = this;
            this.active(this.options.initialIndex);

            // Bind logic
            this.$tabs.on(this.options.event, function(e) {
                var index = $(e.target).index();
                self.active(index);
                return false;
            });

            $doc.trigger('tabs::init', this);
        },
        // This is a public function that users can call
        // Prototype methods are shared across all instances
        active: function(index) {
            var self = this;

            if (this.current === index) {
                return;
            }

            this.current = index;
            this.$tabs.eq(index).addClass(this.classes.activeTab).siblings().removeClass(this.classes.activeTab);
            this.$panesItem.eq(index).addClass(this.classes.activePanes).siblings().removeClass(this.classes.activePanes);

            this.$panesItem.removeClass(this.classes.show);
            $doc.trigger('tabs::active', this);

            if (this.options.ajax === true) {
                this.ajaxLoad(index);
            }

            // give a chance for css transition
            setTimeout(function() {
                self.$panesItem.eq(index).addClass(self.classes.show);
            }, 0);
        },

        ajaxLoad: function(index) {
            var self = this, dtd;
            if (this.options.cached === true && this.ajax[index].cached === true) {
                return;
            } else {
                this.showLoading();
                dtd = $.ajax({url: this.ajax[index].href});
                dtd.done(function(data) {
                    self.ajax[index].cached = true;
                    self.hideLoading();
                    self.$panesItem.eq(index).html(data);
                });
                dtd.fail(function() {
                    self.hideLoading();
                    self.$panesItem.eq(index).html('failed');
                });
            }
        },

        showLoading: function() {
            this.$loading.appendTo(this.$panes);
        },
        hideLoading: function() {
            this.$loading.remove();
        },

        getTabs: function() {
            return this.$tabs;
        },

        getPanes: function() {
            return this.$panesItem;
        },

        getCurrentPane: function() {
            return this.$panesItem.eq(this.current);
        },

        getCurrentTab: function() {
            return this.$tabs.eq(this.current);
        },

        getIndex: function() {
            return this.current;
        },

        next: function() {
            var len = this.$tabs.length,
                current = this.current;
            if (current < len - 1) {
                current++;
            } else {
                current = 0;
            }

            // (current < len-1) ? current++ : current = 0;

            this.active(current);
        },

        prev: function() {
            var len = this.$tabs.length,
                current = this.current;
            if (current === 0) {
                current = Math.abs(1 - len);
            } else {
                current = current - 1;
            }

            this.active(current);
        },

        destroy: function() {
            // console.log(this.$element)
            this.$element.remove();
            // this.$tabs.off(this.options.event).removeClass(this.classes.activeTab);
            // this.$panesItem.eq(this.current).removeClass(this.classes.activePanes); 
            // return this;
        }
    };

    // Collection method.
    $.fn.tabs = function(options) {
        if (typeof options === 'string') {
            var method = options;
            var method_arguments = arguments.length > 1 ? Array.prototype.slice.call(arguments, 1) : undefined;

            if (/^(getTabs|getPanes|getCurrentPane|getCurrentTab|getIndex)$/.test(method)) {
                var api = this.first().data('tabs');
                if (api && typeof api[method] === 'function') {
                    return api[method].apply(api, method_arguments);
                }
            } else {
                return this.each(function() {
                    var api = $.data(this, 'tabs');
                    if (api && typeof api[method] === 'function') {
                        api[method].apply(api, method_arguments);
                    }
                });
            }
        } else {
            return this.each(function() {
                if (!$.data(this, 'tabs')) {
                    $.data(this, 'tabs', new Tabs(this, options));
                }
            });
        }
    };
}(window, document, jQuery));

// history
(function(document, undefined) {
    var $doc = $(document);
    var history = {
        states: {},
        reflash: false,
        pushState: function(state) {
            for (id in state) {
                this.states[id] = state[id];
            }
            this.reflash = false;
            setTimeout($.proxy(this.changeStates,this), 0);
        },
        changeStates: function() {
            var hash = '';
            if (this.reflash === true) {
                return;
            }

            $.each(this.states, function(id,index) {
                hash += id + '=' + index + '&';
            });

            window.location.hash =  hash.substr(0, hash.length - 1);
            this.reflash = true;
        },
        getState: function() {
            var hash = window.location.hash.replace('#','').replace('!',''),
                queryString, param = {};

            if (hash ==='') {
                return;
            }

            queryString = hash.split("&");

            $.each(queryString, function(i,v) {
                if (v == false) {
                    return;
                }
                var args = v.match("#?(.*)=(.*)");
                
                if (args) {
                    param[args[1]] = args[2];
                }
                
            });

            return param;
        },
        reset: function() {
            if (this.reflash === true) {
                return;
            }
            this.states = {};
            window.location.hash = "#/";

            this.reflash = true;
        }
    };

    $doc.on('tabs::init', function(event, instance) {

        if (instance.options.history === false) {
            return;
        }

        $(window).on('hashchange.tabs', function(e) {
            var states = history.getState(),
                tabs,
                id = instance.$element.attr('id'); 

            if (states[id]) {
                tabs = $('#'+id).data('tabs');
                if (tabs) {
                    tabs.active(states[id]);
                }
            }
        });   
    });

    $doc.on('tabs::active', function(event, instance) {
        var index = instance.current, state = {},
            id = instance.$element.attr('id'); 

        if (instance.options.history === false) {
            return;
        }
        state[id] = index;
        history.pushState(state);
    });

    setTimeout(function() {
        $(window).trigger('hashchange.tabs');
    },0);
    

})(document);

// keyboard
(function(document,undefined) {
    var $doc = $(document);
    var keyboard = {
        keys: {
            'UP': 38,
            'DOWN': 40,
            'LEFT': 37,
            'RIGHT': 39,
            'RETURN': 13,
            'ESCAPE': 27,
            'BACKSPACE': 8,
            'SPACE': 32
        },
        map: {},
        bound: false,
        press: function(e) {
            var key = e.keyCode || e.which;
            if (key in keyboard.map && typeof keyboard.map[key] === 'function') {
                keyboard.map[key].call(self, e);
            }
        },
        attach: function(map) {
            var key, up;
            for (key in map) {
                if (map.hasOwnProperty(key)) {
                    up = key.toUpperCase();
                    if (up in keyboard.keys) {
                        keyboard.map[keyboard.keys[up]] = map[key];
                    } else {
                        keyboard.map[up] = map[key];
                    }
                }
            }
            if (!keyboard.bound) {
                keyboard.bound = true;
                $doc.bind('keydown', keyboard.press);
            }
        },
        detach: function() {
            keyboard.bound = false;
            keyboard.map = {};
            $doc.unbind('keydown', keyboard.press);
        }
    };
})(document);
