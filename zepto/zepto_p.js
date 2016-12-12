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
				)



		}











})();

window.Zepto = Zepto;
window.$ === undefined && (window.$ = Zepto) 