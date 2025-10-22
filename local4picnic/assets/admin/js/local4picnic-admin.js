(function ($) {
    'use strict';

    $(document).ready(function () {
        $('.local4picnic-settings input[type="checkbox"]').each(function () {
            var $checkbox = $(this);
            var $row = $checkbox.closest('tr');

            $row.toggleClass('local4picnic-enabled', $checkbox.is(':checked'));

            $checkbox.on('change', function () {
                $row.toggleClass('local4picnic-enabled', $checkbox.is(':checked'));
            });
        });
    });
})(jQuery);
