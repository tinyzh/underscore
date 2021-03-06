var Zepto = (function(){
	var undefined, key , $ , classList,

		emptyArray = [], slice = emptyArray.slice,filter = emptyArray.filter,
		document = window.document,
		elementDisplay = {},classCache = {},
		cssNumber = {
			'column-count' : 1,
			'columns' : 1,
			'font-weight' : 1,
			'line-height' : 1,
			'opacity' : 1,
			'z-index' : 1,
			'zoom' : 1
		},


		fragmentRE = /^\s*<(\w+|!)[^>]*>/,
		singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
		tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
		rootNodeRE = /^(?:body|html)$/i,//匹配body或者html 但是不捕获，也不给此分组分配组号
		capitalRE = /([A-Z])/g,

		methodAttributes = ['val','css','html','text','data','width','height','offset'],
		adjacencyOperators = ['after','prepend','before','append'],
		table = document.createElement('table'),
		tableRow = document.createElement('tr'),

		containers = {
			'tr' : document.createElement('tbody'),
			'tbody' : table,
			'thead' : table,
			'tfoot' : table,
			'td' : tableRow,
			'th' : tableRow,
			'*' : document.createElement('div')
		},

		readyRE = /complete|loaded|interactive/,
		simpleSelectorRE = /^[\w-]*$/,//匹配一个包含（字母、数字、下划线、-、汉字）的字符串

		class2type = {},
		toString = class2type.toString,

		zepto = {},
		camelize,uniq,
		tempParent = document.createElement('div'),

		propMap = {
			'tabindex' : 'tabIndex',
			'readonly' : 'readOnly',
			'for' : 'htmlFor',
			'class' : 'className',
			'maxlength' : 'maxLength',
			'cellspacing' : 'cellSpacing',
			'cellpadding' : 'cellPadding',
			'rowspan' : 'rowSpan',
			'colspan' : 'colSpan',
			'usemap' : 'useMap',
			'frameborder' : 'frameBorder',
			'contenteditable' : 'contentEditable'
		},

		isArray = Array.isArray || function(object){return object instance Array};

		zepto.matches = function(element,selector){
			//element是普通dom节点 selector有值 element有值
			if(!selector || !element || element.nodeType !== 1) return false

			var matchesSelector = element.webkitMatchesSelector ||
				element.mozMatchesSelector ||
				element.oMatchesSelector ||
				element.matchesSelector

			//如果当前元素能被指定的css选择器查找到,则返回true,否则返回false.
			//https://developer.mozilla.org/zh-CN/docs/Web/API/Element/matches
			if(matchesSelector) return matchesSelector.call(element,selector)

			var match,
				parent = element.parentNode,
				temp = !parent

			//tempParent document.createElement('div'),	 如果没有parent,parent赋值为一个div。然后将当前元素加入到这个div中
			if(temp){
				parent = tempParent;
				tempParent.appendChild(element);
			}

			match = ~zepto.qsa(parent,selector).indexOf(element)
			if(temp){
				tempParent.removeChild(element);
			}

			return match;

		}

		function type(obj){
			return obj == null ?
				String(obj) : 
				class2type[toString.call(obj)] || 'object'
		}

		function isFunction(value){return type(value) == 'function'}

		//window.window === window
		function isWindow(obj){return obj != null && obj == obj.window}

		//document.nodeType === 9
		//elem.DOCUMENT_NODE 也等于9
		function isDocument(obj){return obj != null && obj.nodeType == obj.DOCUMENT_NODE}

		function isObject(obj){
			return type(obj) == 'object';
		}

		function isPlainObject(obj){
			//object.getPtototypeOf 方法返回指定对象的原型
			return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
		}

		//数组或者对象数组
		function likeArray(obj){
			return typeof obj.length == 'numbe';
		}

		//筛选数组，剔除null undefined元素
		function compact(array){
			return filter.call(array,function(item){
				return item != null
			});
		}

		function flatten(array){
			return array.length > 0 ? $.fn.concat.apply([],array) : array;
		}

		//background-image -> backgroundImage  类似这种
		camelize = function(str){
			//首先找到-  然后匹配任何字符串   如果正则是全局匹配，后面的函数会多次调用
			return str.replace(/-+(.)?/g,function(match,chr){
				// console.log(chr);
				// match 是匹配到的字符串
				// chr 代表第n个括号匹配的字符串
				return chr ? chr.toUpperCase() : '';
			})
		}

		function dasherize(str){
			return str.replace(/::/g,'/')
					.replace(/([A-Z]+)([A-Z][a-z])/g,'$1_$2')
					.replace(/([a-z\d])([A-Z])/g,'$1_$2')
					.replace(/_/g,'-')
					.toLowerCase()
		}

		uniq = function(array){
			return filter.call(array,function(item,idx){
				return array.indexOf(item) == idx
			});
		}

		function classRE(name){
			return name in classCache ?
				classCache[name] :
				(classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
		}


		// 传入一个css的name和value，判断这个value 是否需要增加 'px'
		function maybeAddPx(name,value){
			return (typeof value == 'number' && !cssNumber[dasherize(name)]) ? value + 'px' : value
		}

		//获取一个元素的默认display样式值，可能的结果是： inline block inline-block table (none 转换为 block)
		function defaultDisplay(nodeName){
			var element , display

			if(!elementDisplay[nodeName]){
				element = document.createElement(nodeName);
				document.body.appendChild(element);
				display = getComputedStyle(element,'').getPropertyValue('display');

				element.parentNode.removeChild(element);
				display = 'none' && (display = 'block')
				elementDisplay[nodeName] = display
			}

			return elementDisplay[nodeName]
		}

		// 返回一个元素的子元素，数组形式
		function children(element){
			// 有些浏览器支持elem.children 获取子元素，有些不支持
			return 'children' in element ? 
				//将对象数组转换为真数组
				slice.call(element.children) : 
				$.map(element.childNodes,function(node){
					if(node.nodeType == 1) return node
				})
		}

		zepto.fragment = function(html,name,properties){
			var dom, nodes, containers

			// 如果html是单标签，则直接用该标签创建元素
			if(singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

			if(!dom){
				if(html.replace) html = html.replace(tagExpanderRE,'<$1></$2>');

				if(name === undefined) name = fragmentRE.test(html) && RegExp.$1

				if(!(name in containers)) name = '*';

				containers = containers[name];
				containers.innerHTML = '' + html;//转换为字符串的快捷方式

				dom = $.each(slice.call(containers.childNodes),function(){
					containers.removeChile(this);
				})
			}

			if(isPlainObject(properties)){
				nodes = $(dom);
				$.each(properties,function(key,value){
					if(methodAttributes.indexOf(key) > -1){
						nodes[key](value);
					}else{
						nodes.attr(key,value)
					}
				})
			}

			return dom
		}

		zepto.Z = function(dom,selector){
			dom = dom || [];
			dom.__proto__ = $.fn;
			dom.selector = selector || '';
			return dom;
		}

		zepto.isZ = function(object){
			return object instanceof zepto.Z;
		}

		zepto.init = function(selector,context){
			var dom;
			if(!selector) return zepto.Z;
			else if(typeof selector == 'string'){
				selector == selector.trim();
				if(selector[0] == '<' && fragmentRE.test(selector)){
					dom = zepto.fragment(selector,RegExp.$1,context), selector = null;
				}else if(context !== undefined){
					return $(context).find(selector);
				}else{
					dom = zepto.qsa(document,selector);
				}
			}else if(isFunction(selector)){
				return $(document).ready(selector);
			}else if(zepto.isZ(selector)){
				return selector;
			}else{
				if(isArray(selector)){
					dom = compact(selector);
				}else if(isObject(selector)){
					dom = [selector],selector = null;
				}else if(fragmentRE.test(selector)){
					dom = zepto.fragment(selector.trim(),RegExp.$1,context),selector = null;
				}else if(context !== undefined){
					return $(context).find(selector);
				}else{
					dom = zepto.qsa(document,selector)
				}
			}

			return zepto.Z(dom,selector)
		}

		$ = function(selector,context){
			return zepto.init(selector,context)
		}

		function extend(target,source,deep){
			for(var key in source){
				if(deep && (isPlainObject(cource[key]) || isArray(source[key]))){
					if(isPlainObject(source[key]) && !isPlainObject(target[key])){
						target[key] = {}
					}
					if(isArray(source[key]) && !isArray(target[key])){
						target[key] = [];
					}
					extend(target[key],source[key],deep);
				}else if(source[key] !== undefined){
					target[key] = source[key]
				}
			}

		}

		$.extend = function(target){
			var deep, args = slice.call(arguments,1);
			if(typeof target == 'boolean'){
				deep = target
				target = args.shift();
			}

			args.forEach(function(arg){
				extend(target,arg,deep)
			})
			return target;
		}

		zepto.qsa = function(element,selector){
			var found,
				maybeID = selector[0] == '#',
				maybeClass = !maybeID && selector[0] == '.',
				nameOnly = maybeID || maybeClass ? selector.slice(1) : selector
				isSimple = simpleSelectorRE.test(nameOnly);

			return (isDocument(element) && isSimple && maybeID) ?
				((found = element.getElementById(nameOnly)) ?
					[found] :
					[]
				) :
				(element.nodeType !== 1 && element.nodeType !== 9) ?
					[] :
					slice.call(
						isSimple && !maybeID
						?
						maybeClass ?
							element.getElementsByClassName(nameOnly) :
							element.getElementByTagName(selector)
						:
						element.querySelectorAll(selector)	
					)


		}

		function filtered(nodes,selector){
			return selector == null ? $(nodes) : $(nodes).filter(selector);
		}

		$.contains = document.documentElement.contains ? 
			function(parent,node){
				return parent !== node && parent.contains(node)
			} :
			function(parent,node){
				while(node && (node = node.parentNode))
					if(node === parent) return true
				return false
			}	

		function funcArg(context.arg,idx,payload){
			return isFunction(args) ? arg.call(context,idx,payload) : arg
		}

		function setAttribute(node,name,value){
			value == null ? node.removeAttribute(name) : node.setAttribute(name,value)
		}

		function className(node,value){
			var klass = node.className || '',
				svg = klass && klass.baseVal !== undefined;

			if(value === undefined) return svg ? klass.baseVal : klass;

			svg ? (klass.baseVal = value) : (node.className = value)
		}

		function deserializeValue(value){
			try{
				return value ?
				value == 'true' || 
				(
					value == 'false' ? false :
						value == 'null' ? null :
							+value + '' == value ? +value :
								/^[\[\{]/.test(value) ? $.parseJSON(value) :
									value
				)
				:value
			}catch(e){
				return value
			}
		}

		$.type = type;
		$.isFunction = isFunction;
		$.isWindow = isWindow;
		$.isArray = isArray;
		$.isPlainObject = isPlainObject;

		$.isEmptyObject = function(obj){
			var name;
			for(name in obj) return false
			return true
		};

		$.inArray = function(elem,array,i){
			return emptyArray.indexOf.call(array,elem,i);
		}

		$.camelCase = camelize;
		$.trim = function(str){
			return str == null ? '' : String.prototype.trim.call(str)
		}

		$.uuid = 0;
		$.support = { };
		$.expr = { };

		$.map = function(elements,callback){
			var value, values = [], i, key;

			if(likeArray(elements)){
				for(i  = 0; i < elements.length; i++){
					value = callback(elements[i],i)
					if(value != null) values.push(value)
				}
			}else{
				for(key in elements){
					value = callback(elements[key],key)
					if(value != null) values.push(value)
				}
			}

			return flatten(values);

		}

		$.each = function(elements,callback){
			var i, key;
			if(likeArray(eleemnts)){
				for(i = 0; i < elements.length; i++){
					if(callback.call(elements[i],i,elements[i]) === false) return elements
				}
			}else{
				for(key in elements){
					if(callback.call(elements[key],key,elements[key]) === false) return elements
				}
			}
			return elements;
		}

		$.grep = function(elements,callback){
			return filter.call(elements,callback);
		}

		if(window.JSON) $.parseJSON = JSON.parse;

		$.each('Boolean Number String Function Array Date Object Error'.split(' '),function(i,name){
			class2type["[Oject " + name + "]" ] = name.toLowerCase();
		});

		$.fn = {
			forEach: emptyArray.forEach,
	        reduce: emptyArray.reduce,  // 方法何用？？？？
	        push: emptyArray.push,
	        sort: emptyArray.sort,
	        indexOf: emptyArray.indexOf,
	        concat: emptyArray.concat,

	        map : function(fn){
	        	return $(
	        			$.map(this,function(el,i){return fn.call(el,i,el)})
	        		)
	        },
	        slice : function(){
	        	return $(slice.apply(this,arguments));
	        },
	        ready : function(callback){
	        	if(readyRE.test(document.readyState) && document.body) callback($)
	        	else document.addEventListener('DOMContentLoaded',function(){callback($)},false)
	        	
	        	return this;	
	        },
	        get : function(idx){
	        	return idx === undefined ?
	        		slice.call(this) : 
	        		this[
	        			idx >= 0 ? idx : idx + this.length//大于0 就返回本身  小于0(idx=-1 长度为5  返回4-》最后一个元素)
	        		]
	        },
	        toArray : function(){
	        	return this.get()
	        },
	        size : function(){
	        	return this.length
	        },
	        remove : function(){
	        	return this.each(function(){
	        		if(this.parentNode != null){
	        			this.parentNode.removeChild(this);
	        		}
	        	})
	        },
	        each : function(callback){
	        	emptyArray.every.call(this,function(el,idx){
	        		return callback.call(el,idx,el) !== false
	        	})

	        	return this;
	        },
	        filter : function(selector){
	        	if(isFunction(selector) return this.not(this.not(selector)))

	        	return $(filter.call(this,function(element){
	        		return zepto.matches(element,selector)
	        	}))
	        },
	        add : function(selector,context){
	        	return $(uniq(this.concat($(selector,context))))
	        },
	        is : function(selector){
	        	return this.length > 0 && zepto.matches(this[0],selector);
	        },
	        not : function(selector){
	        	var nodes = [];
	        	if(isFunction(selector) && selector.call !== undefined){
	        		this.each(function(idx){
	        			if(!selector.call(this,idx)) nodes.push(this);
	        		})
	        	}else{
	        		var excludes = 
	        			typeof selector == 'string' ? this.filter(selector) :
	        				(likeArray(selector) && isFunction(selector.item)) ? slice.call(selector)
	        				: $(selector);

	        		this.forEach(function(el){
	        			if(excludes.indexOf(el) < 0) nodes.push(el);
	        		})
	        	}

	        	return $(nodes)

	        },
	        has : function(selector){
	        	return this.filter(function(){
	        		return isObject(selector) ? 
	        			$.contains(this,selector) : 
	        			$(this).find(selector).size();
	        	})
	        },
	        eq : function(idx){
	        	return idx === -1 ? this.slice(idx) : this.slice(idx, idx + 1);
	        },
	        first : function(){
	        	var el = this[0];

	        	return el && !isObject(el) ? el : $(el)
	        },
	        last : function(){
	        	var el = this[this.length - 1];
	        	return el && !isObject(el) ? el : $(el);
	        },
	        find : function(selector){
	        	var result, $this = this;

	        	if(!selector){
	        		result = $();
	        	}else if(typeof selector == 'object'){
	        		var node = this;
	        		return emptyArray.some.call($this,function(parent){
	        			return $.contains(parent,node);
	        		})
	        	}else if(this.length == 1){
	        		result = $(zepto.qsa(this[0],selector))
	        	}else{
	        		result = this.map(function(){
	        			return zepto.qsa(this,selector)
	        		})
	        	}

	        	return result;

	        },
	        closest : function(selector,context){
	        	var node = this[0],collection = false;

	        	if(typeof selector == 'object'){
	        		collection = $(selector);
	        	}

	        	while(
	        		node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node,selector));
	        	){
	        		node = node !== context && !isDocument(node) && node.parentNode;
	        	}

	        	return $(node);
	        },
	        parents : function(selector){
	        	var ancestors = [], nodes = this;
	        	while(nodes.length > 0){
	        		nodes = $.map(nodes,function(node){
	        			if((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0){
	        				ancestors.push(node);
	        				return node
	        			}
	        		})
	        	}

	        	return filtered(ancestors,selector);
	        },
	        parent : function(selector){
	        	return filtered(uniq(this.pluck('parentNode')),selector);
	        },
	        children : function(selector){
	        	return filtered(
	        		this.map(function(){return children(this)}),selector
	        	)
	        }





		}










})();

window.Zepto = Zepto;
window.$ === undefined && (window.$ = Zepto) 