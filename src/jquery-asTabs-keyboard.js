// jquery asTabs keyboard
(function(window, document, $, undefined) {
    "use strict";

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
                e.preventDefault();
                return keyboard.map[key].call(this, e);
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

    $doc.on('asTabs::init', function(event, instance) {
        if (instance.options.keyboard === false) {
            return;
        }

        // make ul div etc. get focus
        instance.$element.add(instance.$panes_wrap).attr('tabindex', '0').on('focus', function() {
            keyboard.attach({
                left: $.proxy(instance.prev, instance),
                right: $.proxy(instance.next, instance)
            });
            return false;
        }).on('blur', function() {
            keyboard.detach();
            return false;
        });

        instance.$panes.attr('tabindex', '0').on('focus', function(e) {
            keyboard.attach({
                left: $.proxy(instance.prev, instance),
                right: $.proxy(instance.next, instance)
            });
            e.preventDefault();
            return false;
        }).on('blur', function(e) {
            keyboard.detach();
            e.preventDefault();
            return false;
        });
    });
})(window, document, jQuery);
