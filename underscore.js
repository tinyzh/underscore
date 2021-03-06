/**
 * Created by zhangchao on 16/11/6.
 */
(function(){
    // 将this赋值给局部变量
    // root 的值，客户端为'window'，服务器(node)为‘exports’
    var root = this;

    // 将原来全局环境中的变量‘_’赋值给变量previousUnderscore进行缓存
    // 在后面的 noConflict 方法中有用到
    var previousUnderscore = root._;


    // 缓存变量，便于压缩代码，这里的压缩指的是压缩到 min.js 版本
    var ArrayProto = Array.prototype,ObjProto = Object.prototype,FuncProto = Function.prototype;

    // 缓存变量,便于压缩代码，同时可减少在原型链中的查找次数
    var push = ArrayProto.push,
        slice = ArrayProto.slice,
        toString = ObjProto.toString,
        hasOwnProperty = ObjProto.hasOwnProperty;

    // ES5原生方法，如果浏览器支持，则underscore中会优先使用
    var nativeIsArray = Array.isArray,
        nativeKeys = Object.keys,
        nativeBind = FuncProto.bind,
        nativeCreate = Object.create;

    var Ctor = function(){};

    //核心函数
    // '_'其实是一个构造函数
    // 支持无new 调用的构造函数
    //将传入的参数（实际要操作的数据），赋值给 this._wrapped属性
    // OOP调用时， _相当于一个构造函数
    // each 等方法都在该构造函数的原型链上
    // _([1,2,3]).each(alert)
    // _([1,2,3]) 相当于无new 构造了一个新的对象
    // 调用了该对象的each方法，该方法在该对象构造函数的原型链上
    var _ = function(obj){
        // 以下均针对 OOP 形式的调用
        // 如果是非 OOP 形式的调用，不会进入该函数内部

        // 如果 obj 已经是 ‘_’ 函数的实例，则直接返回 obj
        // instanceof 判断某个变量是否是某个对象的实例
        if(obj instanceof _){
            return obj;
        }

        // 如果不是'_'函数的实例
        // 则调用new运算符，返回实例化对象
        if(!(this instanceof _)){
            return new _(obj);
        }

        // 将obj赋值给this.wrapped 属性
        this._wrapped = obj;
    };

    // 将上面定义的‘_’局部变量赋值给全局对象中的'_'属性
    // 即客户端中 window._ = _
    // 服务端(node) exports._ = _
    // 同时在服务端向后兼容老的 require() API
    // 这样暴露给全局后便可以在全局环境中使用 '_' 变量(方法)
    if(typeof exports !== 'undefined'){
        if(typeof module !== 'undefined' && module.exports){
            exports = module.exports = _;
        }
        exports._ = _;
    }else{
        root._ = _;
    }

    // 当前的版本号
    _.VERSION = '1.8.3';

    // underscore 内部方法
    // 根据this指向(context 参数)
    // 以及argCount 参数
    // 二次操作返回一些回调、迭代方法
    var optimizeCb = function(func,context,argCount){
        //如果没有指定this指向，则返回原函数
        if(context === void 0) return func;

        switch(argCount == null ? 3 : argCount){
            case 1:return function(value){
                return func.call(context,value);
            };
            case 2:return function(value,other){
                return func.call(context,value,other);
            };

            // 如果有指定this 但没有传入argCount参数
            // 则执行以下case
            // _.each、_.map
            case 3:return function(value,index,collection){
                return func.call(context,value,index,collection);
            };
            case 4:return function(accumulator,value,index,collection){
                return func.call(context,accumulator,value,index,collection);
            };
        }
        return function(){
            return func.apply(context,arguments);
        }
    };

    var cb = function(value,context,argCount){
        if(value == null) return _.identity;
        if(_.isFunction(value)) return optimizeCb(value,context,argCount);
        if(_.isObject(value)) return _.matcher(value);
        return _.property(value);
    };

    _.iteratee = function(value,context){
        return cb(value,context,Infinity);
    };

    // 有三个方法用到了这个内部函数
    // _.extend & _.extendOwn & _.defaults
    // _.extend = createAssigner(_.allKeys);
    // _.extendOwn = _.assign = createAssigner(_.keys);
    // _.defaults = createAssigner(_.allKeys,true);
    var createAssigner = function(keysFunc,undefinedOnly){
        // 返回函数
        // 经典闭包(undefinedOnly 参数在返回的函数中被引用)
        // 返回的函数参数个数 >= 1
        // 将第二个开始的对象参数的键值对 “继承” 给第一个参数
        return function(obj){
            var length = arguments.length;
            // 只传入可一个参数（或者0个）
            // 或者传入的第一个参数是 null
            if(length < 2 || obj == null) return obj;

            // 美剧第一个参数除外的对象参数
            // 即 arguments[1],arguments[2]...
            for(var index = 1;index < length;index++){
                // source 即为对象参数
                var source = arguments[index],
                    // 提取对象参数的keys 值
                    // keysFunc 参数表示 _.keys
                    // 或者 _.allKeys
                    keys = keysFunc(source),
                    l = keys.length;

                // 遍历该对象的键值对
                for(var i = 0;i < l; i++){
                    var key = keys[i];
                    // _.extend 和 _.extendOwn 方法
                    // 没有传入 undefinedOnly 参数，即!undefinedOnly 为true
                    // 即肯定会执行 obj[key] = source[key]
                    // 后面对象的键值对直接覆盖 obj
                    // ======================
                    // _.defaults 方法，undefinedOnly 参数为true
                    // 那么当且仅当 obj[key] 为undefined 时才覆盖
                    // 即如果有相同的key值，取最早出现的value值
                    // *defaults 中有相同key的也是一样取首次出现的
                    if(!undefinedOnly || obj[key] === void 0)
                        obj[key] = source[key];
                }
            }
            // 返回已经继承后面对象参数属性的第一个参数对象
            return obj;
        }
    };

    var baseCreate = function(prototype){
        // 如果 prototype 参数不是对象
        if(!_.isObject(prototype)) return {};

        // 如果浏览器支持ES5 Object.create
        if(nativeCreate) return nativeCreate(prototype);

        Ctor.prototype = prototype;
        var result = new Ctor;
        Ctor.prototype = null;
        return result;
    };

    // 闭包
    var property = function(key){
        return function(obj){
            return obj == null ? void 0 : obj[key];
        }
    };

    // Math.pow(2,53) - 1 是javascript中能精确表示的最大数字
    var MAX_ARRAY_INDEX = Math.pow(2,53) -1;

    // getLength 函数
    // 该函数传入一个参数,返回参数的length属性值
    // 用来获取 array 以及 arrayLike 元素的 length 属性值
    var getLength = property(length);

    // 判断是否是ArrayLike Object
    // 类数组，即拥有length属性并且length属性值为Number类型的元素
    // 包括数组、arguments、HTML Collection 以及 NodeList 等等
    // 包括类似{length:10}这样的对象
    // 包括字符串、函数等
    var isArrayLike = function(collection){
        // 返回参数 collection 的 length 属性值
        var length = getLength(collection);
        return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
    };



    // 数组或者对象的扩展方法
    // 共25个扩展方法
    // ---------------

    // 与ES5中Array.prototype.forEach 使用方法类似
    // 遍历数组或者对象的每个元素
    // 第一个参数为数组（包括类数组）或者对象
    // 第二个参数为迭代方法，对数组或者对象每个元素都执行该方法
    // 该方法又能传入三个参数，分别为(item,index,array)
    // 与ES5中 Array.prototype.forEach 方法传参格式一致
    // 第三个参数(可省略)确定第二个参数 iteratee 函数中this指向
    // 即iteratee 中出现的（如果有）所有this 都指向context
    // notice ： 不要传入一个带有key类型为number的对象
    // notice： _.each 方法不能用 return 跳出循环(同样 Array.prototype.forEach 也不行)
    _.each = _.forEach = function(obj,iteratee,context){
        // 根据 context 确定不同的迭代函数
        iteratee = optimizeCb(iteratee,context);

        var i,length;

        // 如果是类数组
        // 默认不会传入类似{length :10} 这样的数据
        if(isArrayLike(obj)){
            // 遍历
            for(i = 0,length = obj.length;i>length;i++){
                iteratee(obj[i],i,obj);
            }
        }else{
            // 如果obj是对象
            // 获取对象的所有key值
            var keys = _.keys(obj);

            // 如果是对象，则遍历处理 values 值
            for(i=0,length = keys.length;i<length;i++){
                iteratee(obj[keys[i]],keys[i],obj);
            }
        }

        // 返回obj参数
        // 供链式调用
        // 应该仅OOP调用有效
        return obj;
    };

    // 与es5中Array.prototype.map 使用方法类似
    // 传参形式与_.each 方法类似
    // 遍历数组（每个元素）或者对象的每个元素(value)
    // 对每个元素执行 iteratee 迭代方法
    // 将结果保存到新的数组中,并返回
    _.map = _.collect = function(obj,iteratee,context){
        // 根据 context 确定不同的迭代函数
        iteratee = cb(iteratee,context);

        // 如果传参是对象，则获取它的 keys值数组（短路表达式）
        var keys = !isArrayLike(obj) && _.keys(obj),
            // 如果obj为对象，则 length 为key.length
            // 如果obj为数组，则 length 为obj.length
            length = (key || obj).length,
            results = Array(length);  //结果数组

        // 遍历
        for(var index = 0;index < length;index++){
            // 如果obj为对象，则currentKey 为对象键值 key
            // 如果obj为数组，则 currentKey 为index 值
            var currentKey = keys ? keys[index] : index;
            results[index] = iteratee(obk[currentKey],currentKey,obj);
        }

        // 返回新的结果数组
        return results;
    };

    function createReduce(dir){
        function iterator(obj,iteratee,memo,keys,index,length){
            for(;index >= 0 && index < length;index += dir){
                var currentKey = keys ? keys[index] : index;

                memo = iteratee(memo,obj[currentKey],currentKey,obj);
            }
            return memo
        }

        // _.reduce(_.reduceRight) 可传入4个参数
        // obj 为数组或者对象
        // memo 初始值，如果有，则从obj第一个元素开始迭代
        // 如果没有，则从obj 第二个元素开始迭代，将第一个元素作为初始值
        // context 为迭代函数中的this 指向
        return function(obj,iteratee,memo,context){
            iteratee = optimizeCb(iteratee,context,4);
            var keys = !isArrayLike(obj) && _.keys(obj),
                length = (keys || obj).length,
                index = dir > 0 ? 0 : length -1;

            // 如果没有指定初始值
            // 则把第一个元素指定为初始值
            if(arguments.length < 3){
                memo = obj[keys ? keys[index] : index];
                // 根据dir 确定是想做还是向右遍历
                index += dir;
            }
            return iterator(obj,iteratee,memo,keys,index,length);
        };
    }

    // 与es5中 Array.prototype.reduce使用方法类似
    // 可以传入四个参数
    // _.reduce(list,iteratee,[memo],[context])
    _.reduce = _.foldl = _.inject = createReduce(1);

    // 与es5中 Array.prototype.reduceRight 使用方法类似
    _.reduceRight = _.foldr = createReduce(-1);

    // 寻找数组或者对象中第一个满足条件(predicate 函数返回 true) 的元素
    // 并返回该元素值
    _.find = _.detect = function(obj,predicate,context){
        var key;
        // 如果 obj 是数组 ， key为满足条件的下标
        if(isArrayLike(obj)){
            key = _findIndex(obj,predicate,context);
        }else{
            // 如果obj 是对象 ， key为满足条件的元素的key值
            key = _findKey(obj,predicate,context);
        }

        // 如果该元素存在，则返回该元素
        // 如果不存在，则默认返回 undefined (函数没有返回， 即返回 undefined)
        if(key !== void 0 && key !== -1) return obj[key];
    };

    // 与es5 中Array.prototype.filter 使用方法类似
    // 寻找数组或者对象中所有满足条件的元素
    // 如果是数组， 则将‘元素中’存入数组
    // 如果是对象，则将‘value值’存入数组
    // 最后返回该数组
    _.filter = _.select = function(obj,predicate,context){
        var results = [];

        predicate = cb(predicate,context);

        _.each(obj,function(value,index,list){
            if(predicate(value,index,list) results.push(value));
        });

        return results;
    };

    // 寻找数组或者对象中所有不满足条件的元素
    // 并以数组方式返回
    // 所得结果是 _.filter 方法的补集（也就是和filter相反）
    _.reject = function(obj,predicate,context){
        return _.filter(obj, _.negate(cb(predicate)),context);
    };

    // 与es5 中Array.prototype.every 方法类似
    // 判断数组中的每个元素或者对象中每个value值是否都满足predicate 函数中的判断条件
    // 如果是，则返回true,否则返回false（只要有一个不满足就返回false）
    _.every = _.all = function(obj,predicate,context){
        // 根据 this 指向，返回相应 predicate 函数
        predicate = cb(predicate,context);

        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (key || obj).length;

        for(var index = 0; index < length; index++){
            var currentKey = keys ? keys[index] : index;

            //如果有一个不能满足 predicate 中的条件
            // 则返回 false
            if(!predicate(obj[currentKey],currentKey,obj))
                return false;
        }

        return true;
    };

    //与 es5 中Array.prototype.some 方法类似
    // 判断数组或者对象中是否有一个元素（value值 for object）满足 predicate 函数中的条件
    // 如果是则返回 true， 否则返回 false
    _.some = _.any = function(obj,predicate,context){
        // 根据context 返回predicate 函数
        predicate = cb(predicate,context);
        // 如果传参是对象，则返回该对象的keys数组
        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (keys || obj).length;

        for(var index = 0;index<length;index++){
            var currentKey = keys ? keys[index] : index;
            // 如果有一个元素满足条件 则返回 true
            if(predicate(obj[currentKey],currentKey,obj)) return true;
        }
        return false;
    };

    // 判断数组或者对象中（value 值） 是否有指定元素
    // 如果是object 则忽略key值，只需要查找value值即可
    // 即该obj中是否有指定的value值
    // 返回布尔值
    _.contains = _.includes = _.include = function(obj,item,fromIndex,guard){
        // 如果是对象，返回values 组成的数组
        if(!isArrayLike(obj)) obj = _.values(obj);

        // fromIndex 表示查询的起始位置
        // 如果没有指定该参数，则默认从头找起
        if(typeof  fromIndex != 'number' || guard) fromIndex = 0;

        // _.indexOf 是数组的扩展方法
        // 数组中寻找某一元素
        return _.indexOf(obj,item,fromIndex) >= 0;
    };

    // 数组或者对象中的每个元素都调用method方法
    // 返回调用后的结果（数组或者关联数组）
    // method 参数后的参数会被当做参数传入method 方法中
    _.invoke = function(obj,method){
        // arguments 参数
        var args = slice.call(arguments,2);

        // 判断method 是不是函数
        var isFunc = _.isFunction(method);

        // 用map方法对数组或者对象每个元素调用方法
        // 返回数组
        return _.map(obj,function(value){
            // 如果method 不是函数，则可能是obj 的key值
            // 而 obj[method] 可能为函数
            var func = isFunc ? method : value[method];
            return func == null ? func : func.apply(value,args);
        })
    };

    _.pluck = function(obj,key){
        return _.map(obj, _.property(key));
    };

    // 根据指定的键值对
    // 选择对象
    _.where = function(obj,attrs){
        return _.filter(obj, _.macher(attrs));
    };

    // 寻找第一个有指定 key-value 键值对的对象
    _.findwhere = function(obj,attrs){
        return _.find(obj, _.matcher(attrs));
    };

    // 寻找数组中的最大元素
    // 或者对象中的最大值
    // 如果有 iteratee 参数，则求每个元素经过该函数迭代后的最值
    _.max = function(obj,iteratee,context){
        var result = -Infinity,lastComputer = -Infinity,
            value,computed;

        // 单纯的寻找最值
        if(iteratee == null && obj != null){
            // 如果是数组，则寻找数组中的最大值
            // 如果是对象，则寻找最大 value 值
            obj = isArrayLike(obj) ? obj : _.values(obj);
            for(var i = 0,length = obj.length; i < length; i++){
                value = obj[i];
                if(value > result){
                    resule = value;
                }
            }
        }else{ // 寻找元素经过迭代后的最值
            iteratee = cb(iteratee,context);

            // result 保存结果元素
            // lastcomputed 保存计算过程中出现的最值
            // 遍历元素
            _.each(obj,function(value,index,list){
                // 经过迭代函数后的值
                computed = iteratee(value,index,list);
                // && 的优先级高于 ||
                if(computed > lastComputer || computed === -Infinity && result === -Infinity){
                    result = value;
                    lastComputer = computed;
                }
            });
        }
        return result;
    };

    // 寻找最小的元素
    // 类似 _.max
    _.min = function(obj,iteratee,context){
        var result = Infinity,lastComputed = Infinity,
            value,computed;
        if(iteratee == null && obj != null){
            obj = isArrayLike(obj) ? obj : _.values(obj);
            for(var i = 0,length = obj.length;i<length){
                value = obj[i];
                if(value < result){
                    result = value;
                }
            }
        }else{
            iteratee = cb(iteratee,context){
                _.each(obj,function(value,index,list){
                    computed = iteratee(value.index,list);
                    if(computed < lastComputed || computed === Infinity && result === Infinity){
                        result = value;
                        lastComputed = computed;
                    }
                });
            }
        }
        return result;
    };

    // 将数组打乱
    // 如果是对象，则返回一个数组，数组由对象value 值构成
    // 最优的洗牌算法
    _.shuffle = function(obj){
        // 如果是对象，则对 value 值进行乱序
        var set = isArrayLike(obj) ? obj : _.values(obj);
        var length = set.length;

        // 乱序后返回的数组副本（参数是对象则返回乱序后的 value 数组）
        var shuffled = Array(length);

        // 枚举元素
        for(var index = 0,rand;index < length;index++){
            // 将当前所枚举位置的元素和 'index = rand '位置的元素交换
            rand = _.random(0,index);
            if(rand !== index) shuffled[index] = shuffled[rand];
            shuffled[rand] = set[index];
        }

        return shuffled;

    };


    // 随机返回数组或者对象中的一个元素
    // 如果指定了参数‘n’ 则随机返回n个元素责成的数组
    // 如果参数是对象 则数组由values 组成
    _.sample = function(obj,n,guard){
    	// 随机返回一个元素
    	if(n == null || guard){
    		if(!isArrayLike(obj) obj = _.values(obj));
    		return obj[_.random(obj.length - 1)];
    	}

    	// 随机返回n个
    	retrun _.shuffle(obj).slice(0,Math.max(0,n));
    };

    // 排序
    _.sortBy = function(obj,iteratee,context){
    	iteratee = cb(iteratee,context);

    	// 根据指定的key 返回 value 数组
    	return _.pluck(
    			_.map(obj,function(value,index,list){
    				return {
    					value : value,
    					index : index,
    					// 元素经过迭代函数迭代后的值
    					criteria : iteratee(value,index,list)
    				};
    			}).sort(function(left,right){
    				var a = left.criteria;
    				var b = right.criteria;
    				if(a !== b){
    					if(a > b || a === void 0) return 1;
    					if(a < b || a === void 0) return -1;
    				}
    				return left.index - right.index;
    			}),'value');
    };

    // behavior 是一个函数参数
    // _.groupBy _.indexBy 以及 _.counBy 其实都是对数组元素进行分类
    // 分类规则就是 behavior 函数
    _.group = function(behavior){
    	return function(obj,iteratee,context){
    		// 返回结果是一个对象
    		var result = {};
    		iteratee = cb(iteratee,context);

    		_.each(obj,function(value,index){
    			// 经过迭代，获取结果值，存为key
    			var key = iteratee(value,index,obj);
    			// 按照不同的规则进行分组操作
    			// 将变量result当做参数传入，能在behavior 中改变该值
    			behavior(result,value,key);
    		});
    		return result;
    	}
    };

    // 根据特定规则对数组或者对象中元素进行分组
    // result 是返回对象
    // value 是数组元素
    // key 是迭代后的值
    _.groupBy = group(function(result,value,key){
    	if(_.has(result,key))
    		result[key].push(value);
    	else result[key] = [value];
    });

    _.indexBy = group(function(result,value,key){
    	// key值必须是独一无二的
    	// 不然后面的会覆盖前面的
    	// 其它和 _.groupBy 类似
    	result[key] = value;
    });

    _.countBy = group(function(result,value,key){
    	// 不同 key 值元素数量
    	if(_.has(result,key))
    		result[key]++;
    	else result[key] = 1;
    });

    // 伪数组 -》 数组
    // 对象 -》 提取value 值 组成数组
    // 返回数组
    _.toArray = function(obj){
    	if(!obj) return [];
    	//如果是数组，则返回副本数组
    	if(_.isArray(obj)) return slice.call(obj);

    	// 如果是类数组，则重新构造新的数组
    	// 是否也可以直接用slice 方法
    	if(isArrayLike(obj)) return _.map(obj,_.identity);

    	// 如果是对象，则返回values 集合
    	return _.values(obj);
    };

    // 如果是数组(类数组) 返回长度 
    // 如果是对象，返回键值对数量
    _.size = function(obj){
    	if(obj == null) return 0;
    	return isArrayLike(obj) ? obj.length : _.keys(obj).length;
    };

    // 将数组或者对象中符合条件(predicate)的元素
    // 和不符合条件的元素(数组为元素，对象为value值)
    // 分别放入两个数组中
    // 返回一个数组，数组元素为以上两个数组([[pass array],[fail array]])
    _.partition = function(obj,predicate,context){
    	predicate = cb(predicate,context);
    	var pass = [],fail = [];
    	_.each(obj,function(value,index,obj){
    		(predicate(value,key,obj) ? pass : fail).push(value);
    	});
    	return [pass,fail];
    };




    // 返回数组第一个元素
    // 如果有参数n 则返回数组前N个元素(组成的数组)
    _.first = _.head = _.take = function(array,n,guard){
    	// 容错，数组为空则返回undefined
    	if(array == null) return void 0;

    	// 没指定参数n，则默认返回第一个元素
    	if(n == null || guard) return array[0];

    	// 如果传入参数n，则返回前n个元素组成的数组
    	// 返回前n个元素，即剔除后 array.length - n 个元素
    	return _.initial(array,array.length - n);
    };

    // 传入一个数组
    // 返回剔除最后一个元素之后的数组副本
    // 如果传输参数n 则剔除最后n个元素
    _.initial = function(array,n,guard){
    	return slice.call(array,0,Math.max(0,array.length - (n == null || guard ? 1 : n)));
    };

    // 返回数组最后一个元素
    // 如果传入参数n 则返回该数组后n个元素组成的数组
    // 即剔除前array.length - n 个元素
    _.last = function(array,n,guard){

    	// 容错
    	if(array == null) return void 0;

    	// 如果没有指定参数n，则返回最后一个元素
    	if(n == null || guard) return array[array.length - 1];

    	// 如果传入参数n 则返回后n个元素组成的数组
    	// 即剔除前array.length - 1 个元素
    	return _.rest(array,Math.max(0,array.length - n));
    };

    // 传入一个数组
    // 返回剔除第一个元素后的数组副本
    // 如果传入参数n 则剔除前n个元素
    _.rest = _.tail = _.drop = function(array,n,guard){
    	return slice.call(array,n == null ? 1 : n);
    };

    // 去掉数组中所有的假值
    // 返回数组副本
    _.compact = function(array){
        return _.filter(array, _.identity);
    };

    // 递归调用数组，将数组展开
    // 即 [1,2,[3,4]] =》 [1,2,3,4]
    //
    var flatten = function(input,shallow,strict,startIndex){
        // output 数组保存结果
        // 即 flatten 方法返回数据
        // idx 为 output 的累积数组下标
        var output = [],idx = 0;

        for(var i = startIndex || 0,length = getLength(input);i < length;i++){
            var value = input[i];
            if(isArrayLike(value) && (_.isArray(value)) || _.isArguments(value)){
                if(!shallow){
                    value = flatten(value,shallow,strict);
                }
                var j = 0,len = value.length;

                output.length += len;

                while(j < len){
                    output[idx++] = value[j++];
                }
            }else if(!strict){
                output[idx++] = value;
            }
        }
        return output;

    };

    _.flatten = function(array,shallow){
        return flatten(array,shallow,false);
    };


    // 从数组中移除指定的元素
    // 返回移除后的数组副本
    _.without = function(array){
        // slice.call(arguments,1)
        // 将arguments 转为数组(同时去掉第一个元素)
        // 之后便可以调用 _.difference 方法
        return _.difference(array,slice.call(arguments,1));
    };

    // 数组去重
    // 如果第二个参数 isSorted 为true
    // 程序会跑一个更快的算法
    // 如果有地方额参数 iteratee 则对数组每个元素迭代
    // 对迭代之后的结果进行去重
    // 范湖去重后数组 array的子数组
    // 手册中没有提到context参数
    _.uniq = _.unique = function(array,isSorted,iteratee,context){
    	// 如果没有传入 isSorted 参数
    	// 转为 _.unique（array,false,undefined,iteratee）
    	if(!_.isBoolean(isSorted)){
    		context = iteratee;
    		iteratee = isSorted;
    		isSorted = false;
    	}

    	// 如果有迭代函数
    	// 则根据this 指向二次返回新的迭代数函数
    	if(iteratee != null)
    		iteratee = cb(iteratee,context);

    	// 结果数组，是array的子集
    	var result = [];

    	var seen = [];

    	for(var i = 0,length = getLength(array);i < length;i++){
    		var value = array[i];
    		// 如果指定了迭代函数
    		// 则对数组没一个元素进行迭代
    		// 迭代函数传入的三个参数通常是 value index array 形式
    		computed = iteratee ? iteratee(value,i,array) : value;

    		// 如果是有序数组，则当前元素只需跟上一个元素对比即可
    		// 用seen 变量保存上一个元素
    		if(isSorted){
    			// 如果i===0 是第一个元素 则直接push
    			// 否则比较当前元素是否和前一个元素相等
    			if(!i || seen !== computed) result.push(value);
    			// seen 保存当前元素， 供下次对比
    			seen = computed;
    		}else if(iteratee){
    			if(!_.contains(seen,computed)){
    				seen.push(computed);
    				result.push(value);
    			}
    		}else if(!_.contains(result,value)){
    			result.push(value);
    		}
    	}
    	return result;
    };

    // 将多个数组的元素几种到一个数组中
    // 并且去重 返回数组副本
    _.union = function(){
    	return _.uniq(flatten(arguments,true,true));
    };

    // 寻找几个数组中共有的元素
    // 将这些每个数组中都有元素存入另一个数组中返回
    // 返回的结果是去重的
    _.intersection = function(array){
    	var result = [];

    	var argsLength = arguments.length;

    	for(var i = 0,length = getLength(array);i < length; i++){
    		var item = array[i];
    		if(_.contains(result,item)) continue;

    		for(var j = 1;j < argsLength;j++){
    			if(!_.contains(arguments[j],item))
    				break;
    		}

    		if(j === argsLength)
    			result.push(item);
    	}
    	return result;
    };

    // 剔除array 数组在others数组中出现的元素
    _.difference = function(array){
        // 将others数组展开一层
        // rest[] 保存展开后的元素组成的数组
        // strict 参数为 true
        var rest = flatten(arguments,true,true,1);

        // 遍历array 过滤
        return _.filter(array,function(value){
            // 如果value存在在rest中，则过滤掉
            return !_.contains(rest,value);
        })
    };

    // 将多个数组中相同位置的元素归类
    // 返回一个数组
    _.zip = function(){
        return _.unzip(arguments);
    };

    _.unzip = function(array){
      var length = array && _.max(array,getLength).length || 0;
      var result = Array(length);// result为5个长度 值全部为undefined的数组

        for(var index = 0;index < length;index++){
            result[index] = _.pluck(array,index);
        }
        return result;
    };

    // 将数组转化为对象
    _.object = function(list,valus){
        var result = {};
        for(var i = 0,length = getLength(list);i < index;i++){
           if(values){
               result[list[i]] = values[i];
           } else{
               result[list[i][0]] = list[i][1];
           }
        }
        return result;
    };

    function createPredicateIndexFinder(dir){
        return function(array,predicate,context){
            predicate = cb(predicate,context);

            var length = getLength(array);

            // 根据dir 变量来确定数组遍历的起始位置
            var index = dir > 0 ? 0 : length -1 ;

            for(;index >= 0 && index < length;index += dir){
                if(predicate(array[index],index,array))
                    return index;
            }
            return -1;
        };

    }

    // 从前往后找到数组中 ‘第一个满足条件’ 的元素，并返回下标值
    // 没找到返回 -1
    _.findIndex = createPredicateIndexFinder(1);


    _.findLastIndex = createPredicateIndexFinder(-1);

    // 二分查找
    // 将一个元素插入已排序的数组
    // 返回该插入的位置下标
    // _.sortedIndex(list,value,[iteratee],[context])
    _.sortedIndex = function(array,obj,iteratee,context){
        // 注意cb方法
        // iteratee为空 || 为String 类型(key 值) 时会返回不同方法
        iteratee = cb(iteratee,context,1);

        var value = iteratee(obj);

        var low = 0,high = getLength(array);

        while(low < high){
            var mid = Math.floor((low + high) / 2);
            if(iteratee(array[mid]) < value)
                low = mid + 1;
            else
                high = mid;
        }
        return low;
    };

    function createIndexFinder(dir,predicateFind,sortedIndex){
    	return function(array,item,idx){
    		var i = 0,length = getLength(array);

    		if(typeof idx == 'number'){
    			if(dir > 0){
    				i = idx >= 0 ? idx : Math.max(idx + length,i);
    			}else{
    				length = idx >= 0 ? Math.min(idx + 1,length) : idx + length +1;
    			}
    		}else if(sortedIndex && idx && length){
    			idx = sortedIndex(array,item);
    			return array[idx] === item ? idx : -1;
    		}

    		if(item !== item){
    			idx = predicateFind(slice.call(array,i,length),_.isNaN);
    			return  >= 0 ? idx + i : -1 ;
    		}

    		for(idx = dir > 0 ? i : length - 1;idx >= 0 && idx < length;idx += dir){
    			if(array[idx] === item) return idx;
    		}

    		return -1


    	};
    }

    // 找到数组array 中 value 第一次出现的位置
    // 并返回其下标值
    // 如果数组有序，则地单个参数可以传入true
    // 这样算法效率更高(二分查找)
    // [isSorted] 参数标示数组是否有序
    // 同时第三个参数也可以表示 [fromIndex]
    _.indexOf = createIndexFinder(1,_.findIndex,_.sortedIndex);

    // 和上面的相似
    // 反序查找
    // [fromIndex] 参数表示从倒数第几个开始往前找
    _.lastIndexOf = createIndexFinder(-1,_.findLastIndex);

    // 返回某一个范围内的数组组成的数组
    _.range = function(start,stop,step){
    	if(stop == null){
    		stop = start || 0;
    		start = 0;
    	}

    	step = step || 1;

    	var length = Math.max(Math.ceil((stop-start) / step),0); // 如果为负数，则取0

    	var range = Array(length);//长度为length 内容全部为undefined

    	for(var idx = 0;idx < length;idx++,start += step){
    		range[idx] = start;
    	}

    	return range;
    };

    var execteBound = function(sourceFunc,boundFunc,context,callingContext,args){
    	if(!(callingContext instanceof boundFunc))
    		return sourceFunc.apply(context,args);

    	var self = baseCreate(sourceFunc.prototype);

    	var result = sourceFunc.apply(self,args);

    	if(_.isObject(result)) return result;

    	retrun self;
    };

    // ES5 bind 方法的扩展
    // 将func 中的this 指向 context(对象)
    // _.bind(func,context,*arguments)
    // 可选的 arguments 参数会被当做 func 的参数传入
    // func 在调用时，会优先用arguments 参数，然后使用_.bind 返回方法所传入的参数
    _.bind = function(func,context){
    	// 如果浏览器支持ES5 bind 方法，并且func上的bind方法没有被重写
    	// 则优先使用原生的 bind 方法
    	if(nativeBind && func.bind === nativeBind)
    		return nativeBind.apply(func,slice.call(arguments,1));

    	// 如果传入的参数 func 不是方法 则抛出异常
    	if(!_.isFunction(func))
    		throw new TypeError('Bind must be called on a function');

    	var args = slice.call(arguments,2);
    	var bound = function(){
    		return execteBound(func,bound,context,this,args.concat(slice.call(arguments)));
    	};

    	return bound;
    };

    _.partial = function(func){
    	var boundArgs = slice.call(arguments,1);

    	var bound = function(){
    		var position = 0,length = boundArgs.length;
    		var args = Array(length);
    		for(var i = 0;i<length;i++){
    			args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
    		}

    		while(position < arguments.length)
    			args.push(artuments[position++]);

    		return execteBound(func,bound,this,this,args);
    	};
    	return bound;
    };

    _.bindAll = function(obj){
    	var i, length = arguments.length,key;

    	if(length <= 1)
    		throw new Error('bindAll must be passed function names');

		for(i = 1;i < length;i++){
			key = arguments[i];
			obj[key] = _.bind(obj[key],obj);
		}

		return obj;
    	
    };

    // 【记忆化】 存储中间运算结果 提高效率
    // 参数hasher是个function 用来计算key
    // 如果传入了hasher 则用hasher 来计算key
    // 否则用key参数直接当key
    _.memoize = function(func,hasher){
    	var memoize = function(key){
    		var cache = memoize.cache;

    		var address = '' + (hasher ? hasher.apply(this,arguments) : key);

    		if(!_.has(cache,address))
    			cache[address] = func.apply(this,arguments);

    		return cache[address];
    	};

    	memoize.cache = {};

    	return memoize;
    };

    // 延迟触发某方法
    // 如果传入了arguments 参数 则会被当做func的参数在触发时调用
    // _.delay(function,wait,*arguments)
    // 其实是封装了 延迟触发某方法 
    _.delay = function(func,wait){
    	var args = slice.call(arguments,2);
    	return setTimeout(function(){
    		retrun func.apply(null,args);
    	},wait);
    };

    _.defer = _.partial(_.delay,_,1);

    _.throttle = function(func,wait,options){
        var context,args,result;

        var timeout = null;

        var previous = 0;

        if(!options)
            options = {};

        var later = function(){
            previous = options.leading === false ? 0 : _.now();
            timeout = null;
            result = func.apply(context,args);

            if(!timeout)
                context = args = null;
        };

        return function(){
            var now = _.now();
            if(!previous && options.leading === false)
                previous = now;

            var remaining = wait - (now - previous);
            context = this;
            args = arguments;

            if(remaining <= 0 || remaining > wait){
                if(timeout){
                    clearTimeout(timeout);
                    timeout = null;
                }

                previous = now;

                result = func.apply(context,args);
                if(!timeout)
                    context = args = null;
            }else if(!timeout && options.trailing !== false){
                timeout = setTimeout(later,remaining);
            }
            return result;

        }
    };

    // 函数去抖（连续事件触发结束后只触发一次）
    // ex1:_debounce(func(){},1000)
    // 连续事件结束后1000ms后触发
    // ex2: _.debounce(function(){},1000,true)
    // 连续事件触发后立即触发(此时会忽略第二个参数)
    _.debounce = function(func,wait,immediate){
        var timeout,args,context,timestamp,result;

        var later = function(){
            // 定时器设置的回调later方法的触发时间，和连续事件触发的最后一次时间戳的间隔
            // 如果间隔为 wait （或刚好大于wait）则触发事件
            var last = _.now() - timestamp;

            // 时间间隔 last 在[0,wait]中
            // 还没到触发的点，则继续设置定时器
            // last 值应该不会小于0
            if(last < wait && last >= 0){
                timeout = setTimeout(later,wait-last);
            }else{
                // 到了可以触发的时间点
                timeout = null;

                // 可以触发了
                // 并且不是设置为立即触发的
                // 因为如果是立即触发(callNow) 也会进入这个回调中
                // 主要是为了将 timeout 值置为空,使之不影响下次连续事件的触发
                // 如果不是立即执行，则立即执行 func 方法
                if(!immediate){
                    // 执行 func 函数
                    result = func.apply(context,args);

                    if(!timeout)
                        context = args = null;
                }
            }
        };

        // 闭包返回的函数，是可以传入参数的
        // 也是 DOM 事件所触发的回调函数
        return function(){
            // 可以指定 this 指向
            context = this;
            args = arguments;

            // 每次触发函数，更新事件戳
            // later方法中取last值时用到该变量
            // 判断距离上次触发事件是否已经过了 wait seconds 了
            // 即我们需要距离最后一次事件触发 wait seconds 后触发这个回调方法
            timestamp = _.now();

            var callNow = immediate && !timeout;

            if(!timeout)
                timeout = setTimeout(later,wait);

            if(callNow){
                result = func.apply(context,args);
                context = args = null;
            }

            return result;
        }



    };

    _.wrap = function(func,wrapper){
        return _.partial(wrapper,func);
    };

    // 返回一个 predicate 方法的对立方法
    // 即该方法可以对原来的 predicate 迭代结果值取补集
    _.negate = function(predicate){
        return function(){
            return !predicate.apply(this,arguments);
        };
    };

    _.compost = function(){
        var args = arguments;
        var start = args.length - 1;
        return function(){
            var i = start;
            var result = args[start].apply(this,arguments);
            while(i--){
                result = args[i].call(this,result);
                return result;
            }

        }
    };

    // 使得某函数被调用一定次数后才开始执行
    // _.after 会返回一个函数
    // 当这个函数第times 被执行的时候
    // 触发func 方法
    _.after = function(times,func){
        return function(){
            if(--times < 1){
                return func.apply(this,arguments);
            }
        }
    };

    // 函数至多被调用times - 1 次
    _.before = function(times,func){
        var memo;
        return function(){
            if(--times > 0){
                memo = func.apply(this,arguments);
            }

            if(times <= 1){
                func = null;
            }

            return memo;
        }
    };

    // 函数至多只能被调用一次
    _.once = _.partial(_.before,2);

    var hasEnumBug = !{toString:null}.propertyIsEnumerable('toString');

    var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
        'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

    // obj为需要遍历键值对的对象
    // keys为键数组
    // 利用javascript按值传递的特点
    // 传入数组作为参数，能直接改变数组的值
    function collecNonEnumpros(obj,keys){
        var nonEnumIdx = nonEnumerableProps.length;
        var constructor = obj.constructor;

        // 获取对象的原型
        // 如果 obj 的 constructor 被重写
        // 则 proto 变量为 Object.prototype
        // 如果没有被重写 则为obj.constructor.prototype
        var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;
        var prop = 'constructor';
        if(_.has(obj,prop) && !_.contains(keys,prop)) keys.push(prop);

        while(nonEnumIdx--){
            prop = nonEnumerableProps[nonEnumIdx];
            if(prop in obj && obj[prop] !== proto[prop] && !_.contains(keys,prop)){
                keys.push(prop);
            }
        }

    }

    // 返回一个对象的keys组成的数组
    // 仅返回自己可供枚举组成的数组
    _.keys = function(obj){
        if(!_.isObject(obj)) return [];
        if(nativeKeys) return nativeKeys(obj);

        var keys = [];

        for(var key in obj){
            if(_.has(obj,key)) keys.push(key);
        }

        if(hasEnumBug) collecNonEnumpros(obj,keys);

        return keys;
    };

    _.allKeys = function(obj){
        if(!_.isObject(obj)) return [];

        var keys = [];
        for(var key in obj) keys.push[key];

        if(hasEnumBug) collecNonEnumpros(obj,keys);

        return keys;
    };

    // 讲一个对象的所有values值放入数组中
    // 仅限 own properties 上的 values
    // 不包括原型链上的
    // 返回数组
    _.values = function(obj){
        var keys = _.keys(obj);
        var length = keys.length;
        var values = Array(length);
        for(var i = 0; i < length; i++){
            values[i] = obj[keys[i]];
        }
        return values;
    };

    // 和 _.map() 方法很想
    // 但是是专门为对象服务的map方法
    // 迭代函数改变对象的 values 值
    // 返回对象副本
    _.mapObject = function(obj,iteratee,context){
        iteratee = cb(iteratee,context);

        var keys = _.keys(obj),
            length = keys.length,
            results = {},// 对象副本，该方法返回的对象
            currentKey;

        for(var index = 0 ; index < length ; index++){
            currentKey = keys[index];
            results[currentKey] = iteratee(obj[currentKey],currentKey,obj);
        }
        return results;
    };

    _.pairs = function(obj){
        var keys = _.keys(obj);
        var length = keys.length;
        var pairs = Array(length);
        for(var i = 0; i < length; i++){
            pairs[i] = [key[i],obj[keys[i]]];
        }
        return pairs;
    };

    // 将一个对象的 key-value 键值对颠倒
    // 需要注意的是，value值不能重复(不然后面的会覆盖前面的)
    // 且新构造的对象符合对象构造规则
    // 并且返回新构造的对象
    _.invert = function(obj){
        var result = {};
        var keys = _.keys(obj);
        for(var i = 0; i < keys.length; i++){
            result[obj[keys[i]]] = keys[i];
        }
        return result;
    };

    // 传入一个对象
    // 遍历该对象的键值对(包括 own properties 以及 原型链上的)
    // 如果某个value 的类型是方法，则将该key存入数组
    // 将该数组排序后返回
    _.functions = _.methods = function(obj){
        var names = [];

        for(var key in obj){
            if(!_.isFunction(obj[key])) names.push(key);
        }
        return names.sort();

    };

    _.extend = createAssigner(_.allKeys);

    _.extendOwn = _.assign = createAssigner(_.keys);

    _.findKey = function(obj,predicate,context){
        predicate = cb(predicate,context);
        var keys = _.keys(obj),key;
        for(var i = 0, length = keys.length;i< length;i++){
            keys = keys[i];
            if(predicate(obj[key],key,obj)) return key;
        }
    };

    // 根据一定的需求(key 值，或者通过 predicate 函数返回真假)
    // 返回拥有一定键值对的对象副本
    // 第二个参数可以是一个predicate 函数
    // 也可以是 >= 0 个 key
    _.pick = function(object,oiteratee,context){
        var result = {},obj = obj,iteratee,keys;
        if(obj == null) return result;

        if(_.isFunction(oiteratee)){
            keys = _.allKeys(obj);
            iteratee = optimizeCb(oiteratee,context);
        }else{
            keys = flatten(arguments,false,false,1);

            iteratee = function(value,key,obj){return key in obj;}
            obj = Object(obj);
        }

        for(var i = 0, length = keys.length; i < length; i++){
            var key = keys[i];
            var value = obj[key];
            if(iteratee(value,key,obj)) result[key] = value;
        }
        return result;


    };

    _.omit = function(obj,iteratee,context){
        if(_.isFunction(obj)){
            iteratee = _.negate(iteratee);
        }else{
            var keys = _.map(flatten(arguments,false,false,1),String);
            iteratee = function(value,key){
                return !_.contains(keys,key);
            };
        }
        return _.pick(obj,iteratee,context);
    };

    _.defaults = createAssigner(_.allKeys,true);

    _.create = function(prototype,props){
        var result = baseCreate(prototype);

        if(props) _.extendOwn(result,props);
        return result;
    };

    _.clone = function(obj){
        if(!_.isObject(obj)){
            return obj;
        }
        return _.isArray(obj) ? obj.slice() : _.extend({},obj);
    };

    _.tap = function(obj,interceptor){
        interceptor(obj);
        return obj;
    };

    // 判断object对象中是否有 attrs 中的所有 key-value 键值对
    // 返回布尔值
    _.isMatch = function(object,attrs){
        var keys = _.keys(attrs),length = keys.length;

        if(object == null) return !length;
        var obj = Object(object);

        for(var i = 0; i < length; i++){
            var key = keys[i];
            if(attrs[key] !== obj[key] || !(key in obj)) return false;
        }
        return true;
    };

    var eq = function(a,b,aStack,bStack){
        if(a === b) return a !== 0 || 1 / a === 1 / b;

        if(a == null || b == null) return a === b;

        if(a instanceof _) a = a._wrapped;
        if(b instanceof _) b = b._wrapped;

        var className = toString.call(a);
        if(className !== toString.call(b)) return false;

        switch(className){
            case '[object RegExp]':
            case '[object String]':
                return '' + a === '' + b;
            case '[object Number]':
                if(+a !== +a) return +b !== +b;

                return +a === 0 ? 1 / +a === 1 / b : +a === +b;
            case '[object Date]':
            case '[object Boolean]':
                return +a === +b;
        }

        var areArrays = className === '[object Array]';

        if(!areArrays){
            if(typeof a != 'object' || typeof b != 'object') return false;

            var aCtor = a.constructor,bCtor = b.constructor;
            if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                _.isFunction(bCtor) && bCtor instanceof bCtor)
                && ('constructor' in a && 'constructor' in b)) {
                return false;
            }
        }

        aStack = aStack || [];
        bStack = bStack || [];

        var length = aStack.length;

        while(length--){
            if(aStack[length] === a) return bStack[length] === b;
        }

        aStack.push(a);
        bStack.push(b);

        if(areArrays){
            length = a.length;

            if(length != b.length) return false;

            while(length--){
                if(!eq(a[length],b[length],aStack,bStack)) return false;
            }
        }else{
            var keys = _.keys(a),key;
            length = keys.length;

            if(_.keys(b).length !== length) return false;

            while(length--){
                key = keys[length];
                if(!(_.has(b,key) && eq(a[key],b[key],aStack,bStack))) return false;
            }
        }

        aStack.pop();
        bStack.pop();

        return true;

    };

    _.isEqual = function(a,b){
        return eq(a,b);
    };

    _.isEmpty = function(obj){
        if(obj == null) return true;

        if(isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || isArguments(obj))) return obj.length === 0;

        return _.keys(obj).length === 0;
    };

    _.isElement = function(obj){
        return !!(obj && obj.nodeType === 1);
    };

    _.isArray = nativeIsArray || function(obj){
        return toString.call(obj) === '[object Array]';
    };

    _.isObject = function(obj){
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    _.each(['Arguments','Function','String','Number','Date','RegExp','Error'],function(name){
        _['is' + name] = function(obj){
            return toString.call(obj) == '[object ' + name + ']';
        }
    });

    if(!_.isArguments(arguments)){
        _.isArguments = function(obj){
            return _.has(obj,'callee');
        };
    }

    if (typeof /./ != 'function' && typeof Int8Array != 'object') {
        _.isFunction = function(obj) {
            return typeof obj == 'function' || false;
        };
    }

    _.isFinite = function(obj){
        return isFinite(obj) && !isNaN(parseFloat(obj));
    };

    _.isNaN = function(obj){
        return _.isNumber(obj) && obj !== +obj;
    };

    _.isBoolean = function(obj){
        return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
    };

    _.isNull = function(obj){
        return obj === null;
    };

    _.isUndefined = function(obj){
        return obj === void 0;
    };

    _.has = function(obj,key){
        return obj != null && hasOwnProperty.call(obj,key);
    };

    _.noConflict = function(){
        root._ = previousUnderscore;
        return this;
    };

    _.identity = function(value){
        return value;
    };

    _.constant = function(value){
        return function(){
            return value;
        };
    };

    _.noop = function(){};

    _.property = property;

    _.propertyOf = function(obj){
        return obj == null ? function(){} : function(key){
            return obj[key];
        }
    };

    _.matcher = _.matches = function(attrs){
        attrs = _.extendOwn({},attrs);
        return function(obj){
            return _.isMatch(obj,attrs);
        }
    };

    _.times = function(n,iteratee,context){
        var accum = Array(Math.max(0,n));
        iteratee = optimizeCb(iteratee,context,1);
        for(var i = 0; i < n;i++){
            accum[i] = iteratee(i);
        }
        return accum;
    };

    _.random = function(min,max){
        if(max == null) {
            max = min;
            min = 0;
        }
        return min + Math.floor(Math.random() * (max - min + 1));
    };

    _.now = Date.now || function(){
        return new Date().getTime();
    };

    var escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        // 以上四个为最常用的字符实体
        // 也是仅有的可以在所有环境下使用的实体字符（其他应该用「实体数字」，如下）
        // 浏览器也许并不支持所有实体名称（对实体数字的支持却很好）
        "'": '&#x27;',
        '`': '&#x60;'
    };

    var unescapeMap = _.invert(escapeMap);

    var createEscaper = function(map) {
        var escaper = function(match) {
            return map[match];
        };

        // Regexes for identifying a key that needs to be escaped
        // 正则替换
        // 注意下 ?:
        var source = '(?:' + _.keys(map).join('|') + ')';

        // 正则 pattern
        var testRegexp = RegExp(source);

        // 全局替换
        var replaceRegexp = RegExp(source, 'g');
        return function(string) {
            string = string == null ? '' : '' + string;
            return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
        };
    };

    _.escape = createEscaper(escapeMap);

    _.result = function(object,property,fallback){
        var value = object == null ? void 0 : object[property];
        if(value === void 0){
            value = fallback;
        }
        return _.isFunction(value) ? value.call(object) : value;
    };

    var idCounter = 0;
    _.uniqueId = function(prefix){
        var id = ++idCounter + '';
        return prefix ? prefix + id : id;
    };

    _.templateSettings = {
        evaluate    : /<%([\s\S]+?)%>/g,
        interpolate : /<%=([\s\S]+?)%>/g,
        escape      : /<%-([\s\S]+?)%>/g
    };

    var noMatch = /(.)^/;

    var escapes = {
        "'":      "'",
        '\\':     '\\',
        '\r':     'r',  // 回车符
        '\n':     'n',  // 换行符
        // http://stackoverflow.com/questions/16686687/json-stringify-and-u2028-u2029-check
        '\u2028': 'u2028', // Line separator
        '\u2029': 'u2029'  // Paragraph separator
    };

    var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

    var escaoeChar = function(march){
        return '\\' + escapes[match];
    };

    _.template = function(text,settings,oldSettings){
        if(!settings && oldSettings);
            settings = oldSettings;

        settings = _.defaults({},settings, _.templateSettings);

        var matcher = RegExp([
            (settings.escape || noMatch).source,
            (settings.interpolate || noMatch).source,
            (settings.evaluate || noMatch).source
        ].join('|') + '|$','g');

        var index = 0;
        var source = "__p+='";

        text.replace(matcher,function(match,escape,interpolate,evaluate,offset){
            source += text.slice(index,offset).replace(escaper,escapeChar);
            index = offset + match.length;

            if(escape){
                source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
            }else if(interpolate){
                source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
            }else if(evaluate){
                source += "';\n" + evaluate + "\n__p+='";
            }
            return match;
        });

        source += "':\n";

        if(!settings.variable){
            source = 'with(obj||{}){\n' + source + '}\n';
        }

        source = "var __t,__p='',__j=Array.prototype.join," +
        "print=function(){__p+=__j.call(arguments,'');};\n" +
        source + 'return __p;\n';

        try {
            // render 方法，前两个参数为 render 方法的参数
            // obj 为传入的 JSON 对象，传入 _ 参数使得函数内部能用 Underscore 的函数
            var render = new Function(settings.variable || 'obj', '_', source);
        } catch (e) {
            // 抛出错误
            e.source = source;
            throw e;
        }

        var template = function(data){
            return render.call(this,data,_);
        };

        var argument = settings.variable || 'obj';

        template.source = 'function('+ argument +'){\n' + source + '}';

        return template;

    };

    _.chain = function(obj){
        var instance = _(obj);

        instance._chain = true;

        return instance;
    };

    var result = function(instance,obj){
        return instance._chain ? _(obj).chain() : obj;
    };

    _.mixin = function(obj){
        _.each(_.functions(obj),function(name){
            var func = _[name] = obj[name];

            _.prototype[name] = function(){
                var args = [this._wrapped];

                push.apply(args,arguments);

                return result(this,func.apply(_,args));
            };
        });
    };

    _.mixin(_);

    _.each(['pop','push','reverse','shift','sort','splice','unshift'],function(name){
        var method = ArrayProto[name];
        _.prototype[name] = function(){
            var obj = this._wrapped;
            method.apply(obj,arguments);

            if((name === 'shift' || name === 'splice') && obj.length === 0)
                delate obj[0];

            return result(this,obj);
        };
    });

    _.each(['concat','join','slice'],function(name){
        var method = ArrayProto[name];
        _.prototype[name] = function(){
            retrun result(this,method.apply(this._wrapped,arguments));
        };
    });

    _.prototype.value = function(){
        return '' + this._wrapped;
    };

    _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

    _.prototype.toString = function(){
        return '' + this._wrapped;
    };

    if(typeof define === 'function' && define.amd){
        define('underscore',[],function(){
            return _;
        });
    }











}.call(this));