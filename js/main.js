jQuery(function() {
	var $sideblogs = $('.sideblogs'),
		$content = $('.content'),
		$tutorial = $('.tutorial-content'),
		$window = $(window),
		offset = $content.offset().top + 60;

	var found = true;

	var $el;

	var href = $sideblogs.find('a').first().attr("href");

	if (href !== undefined && href.charAt(0) === "#") {
		setActiveSideblogsLink();

		$(window).on("scroll", function() {
			throttle(function(){
				setActiveSideblogsLink();
				setSideblogs();
			}, 100)();
		});
	}

	function setSideblogs() {
		var offset = 85,
			bottom = $tutorial.offset().top + $tutorial.outerHeight() - $sideblogs.outerHeight() - offset;
		if (window.scrollY > bottom) {
			$sideblogs.css("position", "absolute").css("top", $tutorial.outerHeight() - $sideblogs.outerHeight());
		} else if (window.scrollY > $tutorial.offset().top) {
			$sideblogs.css("position", "fixed").css("top", offset);
		} else {
			$sideblogs.css("position", "absolute").css("top", offset);
		}
	}

	function setActiveSideblogsLink() {
		$('.sideblogs a').removeClass('active');
		var $closest = getClosestHeader();
		$closest.addClass('active');
	}
});

function getClosestHeader() {
	var $links = $('.sideblogs a'),
	top = window.scrollY,
	$last = $links.first(),
	$content = $(".tutorial-content");

	console.log(top);

	if (top < 300) {
		return $last;
	}

	if (top + window.innerHeight >= $content.offset().top + $content.height()) {
		return $links.last();
	}

	for (var i = 0; i < $links.length; i++) {
		var $link = $links.eq(i),
		href = $link.attr("href");

		if (href !== undefined && href.charAt(0) === "#" && href.length > 1) {
			var $anchor = $(href);

			if ($anchor.length > 0) {
				var offset = $anchor.offset();

				if (top < offset.top - (window.innerHeight / 2)) {
					return $last;
				}

				$last = $link;
			}
		}
	}
	return $last;
}

function throttle (callback, limit) {

	var wait = false;
	return function () {
		if (!wait) {

			callback.apply(null, arguments);
			wait = true;
			setTimeout(function () {
				wait = false;
			}, limit);
		}
	};
}