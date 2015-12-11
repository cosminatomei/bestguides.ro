function simulatePlaceholderFocus(el) {
	if(el.value === "your@email.com") el.value = '';
}
function simulatePlaceholderBlur(el) {
	if(el.value === '') el.value = "your@email.com";
}
function signUp(el) {
	// ajax to server
	$('#modal').fadeIn();
}

(function() {

	/*
	var HEADER_IMAGES_NUMBER = 6;

	// preload header images
	for(var i = 1; i <= HEADER_IMAGES_NUMBER; i ++) {
	    var img = new Image();
	    img.src = "imgs/castle" + i + ".jpg";
	}

	// header carousels
	setInterval(function() {
		var id = $('header').data('id') !== undefined ? $('header').data('id') : 1;
		$('header').removeClass('slide-' + id);
		id = id < HEADER_IMAGES_NUMBER ? id + 1 : 1;
		$('header').data('id', id).addClass('slide-' + id);
	}, 3000);
	*/	

	$('.btn-cta').click(function(e) {   
        var $parent = $(this).parent(),
            $e = $parent.find('input[name="email"]'),
            vld = true;

        if ($e.val() === '') {
            vld = false;
            $e.addClass('error');
        }

        if (vld) {
            var data = {
                email: $e.val()
            };
            $.post( "ajax/subscribe", data, function(data) {
                data = JSON.parse(data);
                console.log(data);
                if (data) {
                    $('.modal h2').text('Thank You!');
                    $('.modal h3').text('you just won a Free spot in our Beta');
                } else {
                    $('.modal h2').text('Hi again!');
                    $('.modal h3').text('we see you\'ve already subscribed');
				}
                $('.modal').fadeIn(150);
            });
        }
    });

	$('#btn-subscribe-1').click(function() {
		signUp($('#email-1'));
	});

	$('#btn-subscribe-2').click(function() {
		signUp($('#email-2'));
	});

	$('#modal').click(function() {
		$('#modal').fadeOut();
	});
})();