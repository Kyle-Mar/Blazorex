window.Blazorex = (() => {
    const _contexts = [],
        _refs = [],
        _images = [],
        _patterns = [];

    const initCanvas = (id, managedInstance) => {
        const canvas = document.getElementById(id);
        if (!canvas) {
            return;
        }

        _contexts[id] = {
            id: id,
            context: canvas.getContext("2d"),
            managedInstance
        };
    }, getRef = (ref) => {
        const pId = `_bl_${ref.Id}`,
            elem = _refs[pId] || document.querySelector(`[${pId}]`);
        _refs[pId] = elem;
        return elem;
    }, callMethod = (ctx, method, params) => {
        for (let p in params) {
            if (params[p] != null && params[p].IsRef) {
                params[p] = getRef(params[p]);
            }
        }

        const result = ctx[method](...params);
        return result;
    },
    setProperty = (ctx, property, value) => {
        const propValue = (property == 'fillStyle' ? _patterns[value] || value : value);
        ctx[property] = propValue;
    }, createImageData = (ctxId, width, height) => {
        const ctx = _contexts[ctxId].context,
            imageData = ctx.createImageData(width, height);
        _images[_images.length] = imageData;
        return _images.length - 1;
    }, putImageData = (ctxId, imageId, data, x, y) => {
        const ctx = _contexts[ctxId].context,
            imageData = _images[imageId];
        imageData.data.set( data );
        ctx.putImageData(imageData, x, y);
    },
    onFrameUpdate = (timeStamp) => {
        for (let ctx in _contexts) {
            _contexts[ctx].managedInstance.invokeMethodAsync('UpdateFrame', timeStamp);
        }
        window.requestAnimationFrame(onFrameUpdate);
    },
    processBatch = (ctxId, jsonBatch) => {
        const ctx = _contexts[ctxId].context;
        if (!ctx) {
            return;
        }
        const batch = JSON.parse(jsonBatch);

        for (const op of batch) {
            if (op.IsProperty)
                setProperty(ctx, op.MethodName, op.Args);
            else
                callMethod(ctx, op.MethodName, op.Args);
        }
    },
    directCall = (ctxId, methodName, jParams) => {
        const ctx = _contexts[ctxId].context;
        if (!ctx) {
            return;
        }
        const params = JSON.parse(jParams),
            result = callMethod(ctx, methodName, params);            

        if (methodName == 'createPattern') {
            const patternId = _patterns.length;
            _patterns.push(result);
            return patternId;
        }

        return result;
    },
    removeContext = (ctxId) => {
        const ctx = _contexts[ctxId].context; 
        if (!ctx){
            return ;
        }

        delete _contexts[ctxId]; 
    }
    ;

    window.onkeyup = (e) => {
        for (let ctx in _contexts) {
            _contexts[ctx].managedInstance.invokeMethodAsync('KeyReleased', e.keyCode);
        }
    };
    window.onkeydown = (e) => {
        for (let ctx in _contexts) {
            _contexts[ctx].managedInstance.invokeMethodAsync('KeyPressed', e.keyCode);
        }
    };
    window.onmousemove = (e) => {
        const coords = {
            X: e.offsetX,
            Y: e.offsetY
        };
        for (let ctx in _contexts) {
            _contexts[ctx].managedInstance.invokeMethodAsync('MouseMoved', coords);
        }
    };
    window.onresize = function () {
        for (let ctx in _contexts) {
            _contexts[ctx].managedInstance.invokeMethodAsync('Resized', window.innerWidth, window.innerHeight);
        }
    }

    window.ontouchstart = (e) => {
        for (let ctx in _contexts) {
            let bcr = document.getElementById(_contexts[ctx].id).getBoundingClientRect();
            // Adjust the touch coordinates to the canvas coordinates
            let points = [];
            for (let i = 0; i < e.changedTouches.length; i++) {

                points.push({
                    X: e.changedTouches[i].clientX - bcr.x,
                    Y: e.changedTouches[i].clientY - bcr.y
                });
            }
            _contexts[ctx].managedInstance.invokeMethodAsync('TouchStarted', points);
        }
    }

    return {
        initCanvas,
        onFrameUpdate,
        createImageData,
        putImageData,
        processBatch,
        directCall,
        removeContext
    };
})();

window.requestAnimationFrame(Blazorex.onFrameUpdate);



