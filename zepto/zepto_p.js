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












})();

window.Zepto = Zepto;
window.$ === undefined && (window.$ = Zepto) 