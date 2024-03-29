((global) => {
    function checkClassArray(node, cls) {
		for (const item of cls)
		    if (!node.classList.contains(item))
			    return false;
		return true;
	}

	function arrayToValue(val) {
		if (val.length == 0)
			return;
		if (val.length == 1)
			return val[0];
		return val;
	}

	function keyValueSetterGetter(tinyjqObj, setter, getter, key, value = null) {
		let val = [];
		if (typeof key == 'object') {
			tinyjqObj.each((_, node) => {
				for (const [prop, propVal] of Object.entries(key))
				    setter.apply(node, [node, prop, propVal]);
			});
		} else {
			tinyjqObj.each((_, node) => {
				if (value == null)
					val.push(getter.apply(node, [key]));
				else
				    setter.apply(node, [node, key, value]);
			});
		}

		return arrayToValue(val);
	}
	
	function getPath(node) {
		let path = '';
		while(node != document.documentElement) {
			let name = node.localName;
			if (!name)
				break;

			name = name.toLowerCase();
			if (node.parentNode.childNodes.length > 1) {
				const index = Array.prototype.indexOf.call(node.parentNode.childNodes, node) + 1; 
				if (index > 1)
					name += ':nth-child(' + index + ')';
			}

			path = name + (path != '' ? '>' + path : '');
			node = node.parentNode;
		}

		return path;
	}

	class Position {
		constructor(t, l) {
			this.top = t;
			this.left = l;
		}
	}

	class TinyJqExt {
		#root = null

		constructor(root) {
			this.#root = root;
		}
		
		getPaths() {
			let out = [];
			this.#root.each((_, node) => out.push(getPath(node)));
			return out;
		}
		
		classes() {
			let classes = new Set();
			this.#root.each((_, node) => {
				for (const item of node.classList)
				    classes.add(item);
			});
			
			return classes;
		}
		
		insert(tag, attrs = {}, html = '') {
			if (tag)
				this.#root.each((_, node) => {
					let el = document.createElement(tag);
				    for (const [prop, propVal] of Object.entries(attrs))
					    el.setAttribute(prop, propVal);
					el.innerHTML = html
					node.appendChild(el);
				});
            return this;
		}
	}

    class TinyJq {
        #node = []

		constructor(element) {
            this.#node = ((element instanceof TinyJq) ? element.#node : (element ? ('length' in element ? element : [element]) : []));
			this.tinyjq = new TinyJqExt(this);
        }

		$(selector) {
			if (!selector)
			    return new TinyJq();
			if (selector instanceof HTMLElement || selector instanceof NodeList ||
				selector instanceof DocumentFragment || selector instanceof Document)
				return new TinyJq(selector);

			let results = [];
			for (const item of this.#node)
			    results = results.concat(Array.from(item.querySelectorAll(selector)));

			return new TinyJq(results);
		}

		hasClass() {
			if (arguments.length <= 0)
			    return false;
			for (const item of this.#node)
				if (!checkClassArray(item, arguments))
					return false;
			return true;
		}
		
		addClass() {
			if (arguments.length <= 0)
			    return this;
			this.each((_, node) => {
				node.classList.add.apply(node.classList, arguments);
			});
			return this;
		}
		
		removeClass() {
			if (arguments.length <= 0)
			    return this;
		    this.each((_, node) => {
				node.classList.remove.apply(node.classList, arguments);
			});
			return this;
		}
		
		html(htmlText = undefined) {
			if (htmlText || htmlText === '')
			    return this.each((_, node) => node.innerHTML = htmlText);

            let val = [];
            this.each((_, node) => val.push(node.innerHTML));
			return arrayToValue(val);
		}

		append(htmlText = undefined) {
			if (htmlText)
			    this.each((_, node) => node.innerHTML += htmlText);
			return this;
		}

		prepend(htmlText = undefined) {
			if (htmlText)
			    this.each((_, node) => node.innerHTML = htmlText + node.innerHTML);
			return this;
		}

		empty() {
			this.each((_, node) => node.innerHTML = '');
			return this;
		}
		
		css(key, value = null) {
			const isObject = (typeof key == 'object');
			let actualKey = (isObject ? {} : $.tinyjq.camelCase(key));
			if (isObject)
			    for (const [prop, propVal] of Object.entries(attrs))
				    actualKey[$.tinyjq.camelCase(prop)] = propVal;

			return keyValueSetterGetter(this, (node, prop, val) => node.style[prop] = val,
										      (node, prop) => node.style[prop], actualKey, value);
		}
		
		on(type, callback, useCaptureOptions = undefined) {
			this.each((_, node) => node.addEventListener(type, callback, useCaptureOptions));
			return this;
		}
		
		off(type, callback, useCaptureOptions = undefined) {
			this.each((_, node) => node.removeEventListener(type, callback, useCaptureOptions));
			return this;
		}
		
		each(callback) {
			let i = 0;
			for (const item of this.#node) {
			    callback.call(item, i, item);
				++i;
			}
			return this;
		}

		hide() {
			this.each((_, node) => {
				const displayVal = node.style.display.toLowerCase();
				if (displayVal != '' && displayVal != 'none')
					node.dataset.hidedDisplay = displayVal;
				node.style.display = 'none';
			});
			return this;
		}

		show() {
			this.each((_, node) => {
				let old = node.dataset.hidedDisplay;
				if (!old)
				    old = '';
				else 
				    delete node.dataset.hidedDisplay;
				node.style.display = old;
			});
			return this;
		}

		size() {
			return this.#node.length;
		}
		
		attr(key, value = null) {
			return keyValueSetterGetter(this, (node, prop, val) => node.setAttribute(prop, val),
										      (node, prop) => node.getAttribute(prop), key, value);
		}

		get(index = 0) {
			return this.#node[index];
		}

		first() {
			return new TinyJq(this.#node[0]);
		}

		next(selector) {
			let items = [];
			this.each((_, node) => {
				let nextSibling = node.nextSibling;
				while (nextSibling) {
					if (!!selector && nextSibling.matches(selector))
					    break;
					while(nextSibling && nextSibling.nodeType != 1)
						nextSibling = nextSibling.nextSibling;
				}
				items.push(nextSibling);
			});
			return new TinyJq(items);
		}

		prev(selector) {
			let items = [];
			this.each((_, node) => {
				let previousSibling = node.previousSibling ;
				while (previousSibling) {
					if (!!selector && previousSibling .matches(selector))
					    break;
					while(previousSibling && previousSibling.nodeType != 1)
					    previousSibling = previousSibling.previousSibling;
				}
				items.push(previousSibling);
			});
			return new TinyJq(items);
		}
	
		offset(coordiantes = undefined) {
            if (!coordiantes || ((!('top' in coordiantes)) && (!('left' in coordiantes)))) {
				const item = this.#node[0];
				if (!item)
					return;
				const rect = item.getBoundingClientRect();
				return new Position(rect.top + document.body.scrollTop,
									rect.left + document.body.scrollLeft);
			}

			if (typeof coordiantes == 'function') {
			    this.each((i, node) => {
					const rect = node.getBoundingClientRect();
					const selfCoords = new Position(rect.top + document.body.scrollTop,
										            rect.left + document.body.scrollLeft);
					let newCoords = coordiantes(i, selfCoords);
					if ('top' in newCoords)
					    node.style.top = newCoords.top + 'px';
					if ('left' in newCoords)
					    node.style.left = newCoords.left + 'px';
				});
				return;
			}

			this.each((_, node) => {
				if ('top' in coordiantes)
					node.style.top = newCoords.top + 'px';
				if ('left' in coordiantes)
					node.style.left = newCoords.left + 'px';
			});
		}

		is(selector) {
			if (!selector)
			    return false;
			const check = (typeof selector == 'function' ? selector : (el) => el.matches(selector));
			for (const item of this.#node)
			    if (check(item))
				    return true;
			return false;
		}
    }

	class TinyJqStaticExt {
		constructor() {}

		id(selector) {
			return new TinyJq(document.getElementById(selector));
		}
		
		tag(selector) {
			return new TinyJq(document.getElementsByTagName(selector));
		}
		
		cls(selector) {
			return new TinyJq(document.getElementsByClassName(selector));
		}

		camelCase(input) { 
			return input.toLowerCase().replace(/-(.)/g, (match, group1) =>  group1.toUpperCase());
		}
		
		write(text) {
			document.write(text);
		}
		
		sprintf() {
			let str = arguments[0].replace(/\{\{([^\}]+)\}\}/g, (match, group1) => eval(group1));
			let arr = null;
			if (arguments.length == 2) {
				let second = arguments[1];
				if (Array.isArray(second)) {
					arr = second;
				} else if (typeof second == 'object') {
					str = str.replace(new RegExp('%([^%]*)%', 'g'), (match, group1) => {
						if (group1.length == 0)
							return '&#37+;';
						const keys = group1.split('.');
						let ret = ''
						for (const key of keys)
						    ret += second[key];
						return ret;
					});
					str = str.replace('&#37+;', '%');
					return str;
				} else {
					arr = [(typeof second == 'string' ? second : second.toString())];
				}
			} else {
				arr = arguments.slice(1);
			}
	
			for (const val of arr) {
				if (typeof val == 'string')
				    str = str.replace('%s', val);
				else if (typeof val == 'number')
				    str = str.replace('%d', val);
			}
	
			return str;
		}
	
		query(obj) {
			return new URLSearchParams(obj).toString();
		}

		isCSSProperty(property) {
			property = this.camelCase(property);
			if (property == 'cssText' || property == 'length' || property == 'parentRule')
				return false;
	
			return document.body.style.hasOwnProperty(property) &&
				   typeof document.body.style[property] != 'function';
		}

		// note: if we listener by two selectors for one element
		// then handler will be called twise	
		// handle events whose target matches a selector
		// works even on elements created after the event listener was added:
		#listening = new Map();

		on(selector, eventType, handler, context = null) {
			// map selectors by type
			let types = null;
			let newReg = false;
			if (!this.#listening.has(eventType)) {
				types = new Map();
				this.#listening.set(eventType, types);
				newReg = true;
			} else {
				types = this.#listening.get(eventType);
			}

			// save handler
			let handlersSet = null;
			if (!types.has(selector)) {
				handlersSet = new Set();
				types.set(selector, handlersSet);
			} else {
				handlersSet = types.get(selector);
			}

			handlersSet.add(handler);

			// check scope is listener
			if (newReg) {
				// add listener
				document.addEventListener(eventType, (event) => {
					for (const [key, value] of types) {
						const listeningTarget = event.target.closest(key);
						if (listeningTarget != null)
							for (const h of value)
								h.call(listeningTarget, event, context);
					}
				});
			}
		}

		off(selector, eventType, handler = null) {
			if (this.#listening.has(eventType)) {
				let types = this.#listening.get(eventType);
				if (types.has(selector)) {
					if (handler == null) {
						types.delete(selector);
					} else {
						let hs = types.get(selector);
						if (hs.has(handler)) {
							hs.delete(handler);
							if (hs.size <= 0)
								types.delete(selector);
						}
					}
				}
			}
		}
	}

    function $() {
		if (arguments.length == 0)
		    return new TinyJq();
		
		if (arguments.length == 1) {
			let selector = arguments[0];
            if (typeof selector == 'function')
				return document.addEventListener('DOMContentLoaded', selector);
			if (!selector)
			    return new TinyJq();
			if (selector instanceof HTMLElement || selector instanceof NodeList ||
				selector instanceof DocumentFragment || selector instanceof Document)
				return new TinyJq(selector);
			return new TinyJq(document.querySelectorAll(selector));
		}

		if ((arguments.length == 2 || arguments.length == 3) && ('browser_module' in global))
			global['browser_module'].export(arguments[0], arguments[1], Boolean(arguments[3]));
	}

	$.tinyjq = new TinyJqStaticExt();

	// NOTE: missing jq opts = [cache, contents, context, converters, crossDomain, dataFilter,
	// global, headers, ifModified, isLocal, jsonp, jsonpCallback, processData, scriptAttrs,
	// scriptCharset, statusCode, traditional, type, xhr, xhrFields]
	$.ajax = (url, opts = null) => {
        if (typeof url == 'object') {
			opts = url;
			url = opts.url;
		}

		async = opts ? opts.async : true;
        success = opts ? opts.success : null;
        error = opts ? opts.error : null;
        complete = opts ? opts.complete : null;
        contentType = opts ? opts.contentType : 'application/x-www-form-urlencoded; charset=UTF-8';
		dataType = opts ? opts.dataType : 'text';
		data = opts ? opts.data : '';
		method = opts ? opts.method : 'GET';
		mimeType = opts ? opts.mimeType : false;
		password = opts ? opts.password : undefined;
		username = opts ? opts.username : undefined;
		timeout = opts ? opts.timeout : 10000;

		let xmlhttp = new XMLHttpRequest();
		if (contentType)
		    xmlhttp.setRequestHeader('Content-Type', contentType);
		if (mimeType)
		    xmlhttp.overrideMimeType(mimeType);

		if (method == 'GET') {
			if (typeof data == 'object')
				data = $.tinyjq.query(data);
			url += '?' + data;
		} else {
			if (typeof data == 'object')
				data = JSON.stringify(data);
		}

		xmlhttp.open(method, url, async, username, password);
		if (dataType)
		    xmlhttp.responseType = dataType;

		xmlhttp.onreadystatechange = () => {
		    if (xmlhttp.readyState !== 4)
			    return;
		    clearTimeout(timer);

		    if (xmlhttp.status == 200 && xmlhttp.response != null) {
				if (typeof success == 'function')
			        success(xmlhttp.response, xmlhttp.statusText, xmlhttp);
		    } else {
				if (typeof error == 'function')
			        error(xmlhttp, xmlhttp.statusText);
			}
			
			if (typeof complete == 'function')
			    complete(xmlhttp, xmlhttp.statusText);
		}

		if (opts && opts.beforeSend && typeof opts.beforeSend == 'function')
		    opts.beforeSend(xmlhttp, opts);

		xmlhttp.send(method == 'GET' ? null : data);

		let timer = setTimeout(() => {
			xmlhttp.abort();
			error(xmlhttp, 'timeout');
		}, timeout);
	}

    if ('browser_module' in global) {
        global['browser_module'].export('tinyjq', () => $);
        global['browser_module'].export('$', () => $);
    } else {
        if ('tinyjq' in global)
            console.warn('Module "tinyjq" is already exported! Ignore loading!');
        else
            global['tinyjq'] = $;
        if (!('$' in global))
		    global['$'] = $;
    }
}) (this)
