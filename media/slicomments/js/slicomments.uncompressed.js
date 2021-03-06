(function($){

var charCount = new Class({

	options: {
		maxLength: 500
	},

	textarea: null,
	counter: null,

	initialize: function(textarea, counter, options) {
		this.textarea = $(textarea);
		this.counter = $(counter);

		this.textarea.store('charCount', this);

		this.options.maxLength = textarea.get('data-maxlength') || 500;

		var update = this.update_counter.bind(this);

		if (Browser.chrome || Browser.safari) {
			this.textarea.addListener('input', update);
		} else {
			this.textarea.addEvents({
				'blur': update,
				'change': update,
				'focus': update,
				'keydown': update,
				'keypress': update,
				'keyup': update,
				'paste': update
			});
			this.textarea.addListener('input', update);
		}

		update();
	},

	update_counter: function() {
		var remaining_chars = this.options.maxLength - this.textarea.value.length;
		this.counter.set('text', remaining_chars);
		if (remaining_chars <= 5) {
			this.counter.setStyle('color', '#900');
		} else {
			this.counter.setStyle('color', null);
		}
		if (remaining_chars < 0) {
			this.textarea.form.getElement('button').set('disabled', true)
		} else {
			this.textarea.form.getElement('button').set('disabled', false)
		}
	}
});

window.addEvent('domready', function(){
	var section = $('comments');
	section.removeClass('no-js');
	var comments_count = $('comments_counter');
	var list = $('comments_list');

	var req = function(onSuccess, onFailure){
		return function(e)
		{
			e.stop();
			new Request({
				url: this.get('href'),
				format: 'raw',
				method: 'get',
				onSuccess: onSuccess.bind(this),
				onFailure: function(xhr){
					alert(xhr.responseText);
				}
			}).send();
		}
	}

	var vote = req(function(response){
		var meta = this.getParent('.content-container').getElement('.metadata');
		var rating = meta.getElement('.rating') || new Element('span.rating').inject(meta);
		var total = (rating.get('text').toInt() || 0) + response.toInt();
		rating.set('text', total > 0 ? '+'+total : total)
			.removeClass('(?:positive|negative)')
			.addClass(total > 0 ? 'positive' : 'negative')
	});

	section.addEvents({
		'click:relay(.comment-delete)':
		req(function(response){
			this.getParent('li.comment').nix(true);
			comments_count.set('text', comments_count.get('text').toInt() - 1);
		}),
		'click:relay(.comment-like)': vote,
		'click:relay(.comment-dislike)': vote,
		'click:relay(.comment-flag)':
		req(function(response){
			alert(response);
		}),
		'click:relay(.slicomments-spoiler button)': function (){
			var p = this.getParent();
			if (p.hasClass('spoiler-hide')) {
				p.removeClass('spoiler-hide');
				this.set('text', this.get('data-hide'));
			} else {
				p.addClass('spoiler-hide');
				this.set('text', this.get('data-show'));
			}
		},
		'click:relay(.cancel-reply)': function (e){
			e.stop();
			this.getParent('.comment').getElement('.comment-reply').getParent().setStyle('display', null);
			this.getParent('form').destroy();
		}
	});

	var form = section.getElement('form');
	if (!form) return;

	var textarea = form.getElement('textarea'),
		counter = form.getElement('.chars-count');
	if (counter) {
		new charCount(textarea, counter);
	}

	var logged = form.get('data-logged') == 1 ? true : false;
	var lang = document.getElement('html').get('lang');

	// Make sure that the language is in the format xx-XX
	try {
	lang = lang.split('-');
	lang[1] = lang[1].toUpperCase();
	lang = lang.join('-');
	} catch(e){}

	if (Locale.list().contains(lang)) Locale.use(lang);

	var validate = function(form){
		var validator = form.retrieve('validator');
		if (!validator){
			validator = new Form.Validator.Inline(form, {
				scrollToErrorsOnSubmit: false,
				evaluateFieldsOnChange: false,
				evaluateFieldsOnBlur: false
			});
			form.store('validator', validator);
		}
		return validator.validate();
	}

	var originalHeight = textarea.getDimensions().y;
	textarea.addEvents({
		focus: function() {
			if (this.value.length == 0) this.tween('height', originalHeight, 100);
		},
		blur: function() {
			if (this.value.length == 0) this.tween('height', originalHeight);
		}
	});

	var placeholder_support = (function () {
		var i = document.createElement('input');
		return 'placeholder' in i;
	})();
	if (!textarea.get('disabled') || !placeholder_support) {
		$$('.comments_form_inputs li label').setStyle('display', 'none');
	}
	if (!placeholder_support) {
		var position = {offset: {x:7, y:4}};
		new OverText(textarea, {
			positionOptions: position,
			textOverride: textarea.get('placeholder')
		});
		if (!logged) {
			new OverText(form.name, {
				positionOptions: position,
				textOverride: form.name.get('placeholder')
			});
			new OverText(form.email, {
				positionOptions: position,
				textOverride: form.email.get('placeholder')
			});
		}
	}

	// Ajax

	section.addEvent('click:relay(.comment-submit)', function(e){
		e.stop();
		if (validate(this.form)) {
			new Request.HTML({
				url: this.form.get('action'),
				format: 'raw',
				method: 'post',
				data: this.form,
				onSuccess: function(responseTree){
						responseTree[0].inject(list, this.form.get('data-position'));
						comments_count.set('text', comments_count.get('text').toInt() + 1);
						if (this.form.hasClass('reply-form')){
							this.form.destroy();
						} else {
							this.form.reset();
							var counter = this.form.text.retrieve('charCount');
							if (counter) {
								counter.update_counter();
							}
							this.form.text.fireEvent('blur');
						}
						OverText.update();
				}.bind(this),
				onFailure: function(xhr){
					alert(xhr.responseText);
				},
				onComplete: function(){
					if (timer){
						clearInterval(timer);
						button.set('disabled', null);
						this.set('html', post);
					}
				}.bind(this)
			}).send();
			var button = this,
				i = 1,
				post = button.get('html'),
				sending = button.get('data-sending') || 'Sending';
			this.set('disabled', 'disabled');
			this.set('html', sending);
			var timer = (function (){
				var ellipsis = new Array(i++%4 + 1).join('.');
				button.set('html', sending + ellipsis)
			}).periodical(1000/3);
		}
	});

	section.addEvent('click:relay(.comment-reply)', function(e){
		e.stop();
		var replyForm = form.clone();
		replyForm.addClass('reply-form');
		replyForm.getElements('.validation-advice').destroy();
		var comment = this.getParent('.comment');
		var name = comment.getElement('.metadata .author').get('text').trim();
		replyForm.inject(comment.getElement('.clr'), 'before');
		var textarea = replyForm.getElement('textarea').addClass('init');
		textarea.set('value', '@'+name+' ').setCaretPosition("end");
		var counter = replyForm.getElement('.chars-count');
		if (counter) {
			new charCount(textarea, counter);
		}
		this.getParent().setStyle('display', 'none');
	});

	var avatar;
	if (!logged && (avatar = form.getElement('.profile-image'))) {
		var src = avatar.get('src');
		if (!!~src.indexOf('gravatar.com')){
			src = src.toURI();
			$('comments_form_email').addEvent('change', function(e){
				avatar.set('src', src.set('file', MD5.digest_s(this.get('value')))+'');
			});
		}
	}
});
})(document.id);
