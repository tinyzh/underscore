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

    _.map = _.collect = function(obj,iteratee,context){
        iteratee = cb(iteratee,context);

        var keys = !isArrayLike(obj) && _.keys(obj),
            length = (key || obj).length,
            results = Array(length);

        for(var index = 0;index < length;index++){
            var currentKey = keys ? keys[index] : index;
            results[index] = iteratee(obk[currentKey],currentKey,obj);
        }

        return results;
    }





}.call(this));