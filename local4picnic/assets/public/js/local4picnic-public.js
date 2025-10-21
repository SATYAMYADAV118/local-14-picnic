(function ($) {
    'use strict';

    $(document).ready(function () {
        $('.local4picnic-badge').each(function () {
            var $badge = $(this);
            var text = $badge.text();
            $badge.attr('aria-label', text + ' - Local 4 Picnic highlight');
        });
    });
})(jQuery);
