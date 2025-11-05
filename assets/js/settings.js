(function ($) {
    function initMediaField() {
        let frame;
        const chooseButton = $('.l4p-settings__choose-logo');
        const removeButton = $('.l4p-settings__remove-logo');
        const input = $('#l4p_brand_logo_id');
        const preview = $('.l4p-settings__preview');

        chooseButton.on('click', function (event) {
            event.preventDefault();

            if (frame) {
                frame.open();
                return;
            }

            frame = wp.media({
                title: chooseButton.data('label') || chooseButton.text(),
                button: { text: chooseButton.data('label') || chooseButton.text() },
                library: { type: 'image' },
                multiple: false,
            });

            frame.on('select', function () {
                const attachment = frame.state().get('selection').first().toJSON();
                const thumb = attachment.sizes && attachment.sizes.thumbnail ? attachment.sizes.thumbnail.url : attachment.url;
                input.val(attachment.id);
                preview.empty().append($('<img />', { src: thumb, alt: attachment.alt || '' }));
                removeButton.prop('disabled', false);
            });

            frame.open();
        });

        removeButton.on('click', function (event) {
            event.preventDefault();
            input.val('');
            preview.empty();
            removeButton.prop('disabled', true);
        });
    }

    $(function () {
        $('.l4p-color-field').wpColorPicker();
        initMediaField();
    });
})(jQuery);
