
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.4' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    let isMobile = writable(false);

    /* src/shared/SocialBox.svelte generated by Svelte v3.29.4 */

    const { console: console_1 } = globals;
    const file = "src/shared/SocialBox.svelte";

    // (42:0) {:else}
    function create_else_block(ctx) {
    	let div;
    	let a0;
    	let svg0;
    	let path0;
    	let a0_href_value;
    	let t0;
    	let a1;
    	let svg1;
    	let path1;
    	let path2;
    	let path3;
    	let path4;
    	let path5;
    	let a1_href_value;
    	let t1;
    	let a2;
    	let svg2;
    	let path6;
    	let a2_href_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			a0 = element("a");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t0 = space();
    			a1 = element("a");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			t1 = space();
    			a2 = element("a");
    			svg2 = svg_element("svg");
    			path6 = svg_element("path");
    			attr_dev(path0, "d", "M11.75,0a11.8,11.8,0,0,0-2,23.42V14.26H7V11H9.79V8.53c0-2.82,1.72-4.35,4.22-4.35a23.11,23.11,0,0,1,2.53.13V7.25H14.8c-1.36,0-1.62.65-1.62,1.61V11h3.25L16,14.26H13.18V23.5A11.8,11.8,0,0,0,11.75,0Z");
    			set_style(path0, "fill", /*socialIconColor*/ ctx[1]);
    			add_location(path0, file, 44, 93, 1764);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "width", "24");
    			attr_dev(svg0, "height", "24");
    			attr_dev(svg0, "viewBox", "0 0 23.5 23.5");
    			add_location(svg0, file, 44, 6, 1677);
    			attr_dev(a0, "href", a0_href_value = `https://www.facebook.com/sharer/sharer.php?u=${/*shareUrl*/ ctx[0]}`);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "class", "px-2 hover-opacity");
    			add_location(a0, file, 43, 4, 1558);
    			attr_dev(path1, "d", "M18.8,0H5.2A5.2,5.2,0,0,0,0,5.2V18.8A5.2,5.2,0,0,0,5.2,24H18.8A5.2,5.2,0,0,0,24,18.8V5.2A5.2,5.2,0,0,0,18.8,0Zm0,15.31A28.29,28.29,0,0,1,12,20.38c-.93.39-.79-.25-.76-.47s.13-.75.13-.75a1.76,1.76,0,0,0,0-.79c-.1-.24-.48-.37-.77-.43-4.2-.55-7.31-3.49-7.31-7C3.22,7,7.14,3.85,12,3.85S20.7,7,20.7,10.94a6.34,6.34,0,0,1-1.87,4.37Z");
    			set_style(path1, "fill", /*socialIconColor*/ ctx[1]);
    			add_location(path1, file, 50, 89, 2244);
    			attr_dev(path2, "d", "M10.19,9.06H9.57a.17.17,0,0,0-.17.17V13a.17.17,0,0,0,.17.17h.62a.17.17,0,0,0,.17-.17V9.23a.17.17,0,0,0-.17-.17");
    			set_style(path2, "fill", /*socialIconColor*/ ctx[1]);
    			add_location(path2, file, 54, 8, 2650);
    			attr_dev(path3, "d", "M14.4,9.06h-.61a.17.17,0,0,0-.17.17v2.26L11.88,9.13l0,0h-.74a.17.17,0,0,0-.17.17V13a.17.17,0,0,0,.17.17h.61a.17.17,0,0,0,.18-.17V10.77l1.74,2.36a.1.1,0,0,0,0,0h.7a.16.16,0,0,0,.17-.17V9.23a.16.16,0,0,0-.17-.17");
    			set_style(path3, "fill", /*socialIconColor*/ ctx[1]);
    			add_location(path3, file, 58, 8, 2841);
    			attr_dev(path4, "d", "M8.71,12.25H7v-3a.16.16,0,0,0-.17-.17H6.26a.17.17,0,0,0-.17.17V13a.17.17,0,0,0,0,.12h0a.21.21,0,0,0,.12,0H8.71A.17.17,0,0,0,8.88,13v-.61a.18.18,0,0,0-.17-.17");
    			set_style(path4, "fill", /*socialIconColor*/ ctx[1]);
    			add_location(path4, file, 62, 8, 3131);
    			attr_dev(path5, "d", "M17.79,10A.18.18,0,0,0,18,9.84V9.23a.17.17,0,0,0-.17-.17H15.34a.16.16,0,0,0-.12,0h0a.17.17,0,0,0-.05.12V13a.17.17,0,0,0,.05.12h0a.17.17,0,0,0,.12,0h2.45A.17.17,0,0,0,18,13v-.61a.18.18,0,0,0-.17-.17H16.12v-.64h1.67a.18.18,0,0,0,.17-.17v-.62a.18.18,0,0,0-.17-.17H16.12V10Z");
    			set_style(path5, "fill", /*socialIconColor*/ ctx[1]);
    			add_location(path5, file, 66, 8, 3369);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "width", "24");
    			attr_dev(svg1, "height", "24");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			add_location(svg1, file, 50, 6, 2161);
    			attr_dev(a1, "href", a1_href_value = `https://lineit.line.me/share/ui?url=${/*shareUrl*/ ctx[0]}`);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "class", "px-2 hover-opacity");
    			add_location(a1, file, 49, 4, 2051);
    			attr_dev(path6, "d", "M162.49,38.91A65.42,65.42,0,0,1,143.93,44a32.21,32.21,0,0,0,14.2-17.74A64.79,64.79,0,0,1,137.63,34a32.2,32.2,0,0,0-55,29.19A92,92,0,0,1,16.14,29.77a31.87,31.87,0,0,0,10,42.74,32.77,32.77,0,0,1-14.64-4v.38a32.09,32.09,0,0,0,25.88,31.38,32.35,32.35,0,0,1-8.48,1.15,34.5,34.5,0,0,1-6.08-.59A32.32,32.32,0,0,0,53,123.05a65.16,65.16,0,0,1-40.09,13.69,61.75,61.75,0,0,1-7.69-.45,92.23,92.23,0,0,0,49.48,14.36c59.36,0,91.84-48.75,91.84-91,0-1.38-.05-2.77-.11-4.13a63.63,63.63,0,0,0,16.11-16.57");
    			attr_dev(path6, "transform", "translate(-5.17 -23.92)");
    			set_style(path6, "fill", /*socialIconColor*/ ctx[1]);
    			add_location(path6, file, 72, 97, 3926);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "width", "24");
    			attr_dev(svg2, "height", "24");
    			attr_dev(svg2, "viewBox", "0 0 157.32 126.73");
    			add_location(svg2, file, 72, 6, 3835);
    			attr_dev(a2, "href", a2_href_value = `https://twitter.com/share?url=${/*shareUrl*/ ctx[0]}`);
    			attr_dev(a2, "target", "_blank");
    			attr_dev(a2, "class", "px-2 hover-opacity");
    			add_location(a2, file, 71, 4, 3731);
    			attr_dev(div, "class", "flex mx-auto");
    			add_location(div, file, 42, 2, 1527);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a0);
    			append_dev(a0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div, t0);
    			append_dev(div, a1);
    			append_dev(a1, svg1);
    			append_dev(svg1, path1);
    			append_dev(svg1, path2);
    			append_dev(svg1, path3);
    			append_dev(svg1, path4);
    			append_dev(svg1, path5);
    			append_dev(div, t1);
    			append_dev(div, a2);
    			append_dev(a2, svg2);
    			append_dev(svg2, path6);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*socialIconColor*/ 2) {
    				set_style(path0, "fill", /*socialIconColor*/ ctx[1]);
    			}

    			if (dirty & /*shareUrl*/ 1 && a0_href_value !== (a0_href_value = `https://www.facebook.com/sharer/sharer.php?u=${/*shareUrl*/ ctx[0]}`)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*socialIconColor*/ 2) {
    				set_style(path1, "fill", /*socialIconColor*/ ctx[1]);
    			}

    			if (dirty & /*socialIconColor*/ 2) {
    				set_style(path2, "fill", /*socialIconColor*/ ctx[1]);
    			}

    			if (dirty & /*socialIconColor*/ 2) {
    				set_style(path3, "fill", /*socialIconColor*/ ctx[1]);
    			}

    			if (dirty & /*socialIconColor*/ 2) {
    				set_style(path4, "fill", /*socialIconColor*/ ctx[1]);
    			}

    			if (dirty & /*socialIconColor*/ 2) {
    				set_style(path5, "fill", /*socialIconColor*/ ctx[1]);
    			}

    			if (dirty & /*shareUrl*/ 1 && a1_href_value !== (a1_href_value = `https://lineit.line.me/share/ui?url=${/*shareUrl*/ ctx[0]}`)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*socialIconColor*/ 2) {
    				set_style(path6, "fill", /*socialIconColor*/ ctx[1]);
    			}

    			if (dirty & /*shareUrl*/ 1 && a2_href_value !== (a2_href_value = `https://twitter.com/share?url=${/*shareUrl*/ ctx[0]}`)) {
    				attr_dev(a2, "href", a2_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(42:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (34:0) {#if $isMobile && !isFacebookApp()}
    function create_if_block(ctx) {
    	let div;
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M18.33,15a4.36,4.36,0,0,0-2.72.95L10.93,13a4.35,4.35,0,0,0,0-1.9l4.68-2.92A4.38,4.38,0,1,0,14,4.78a4.26,4.26,0,0,0,.11,1L9.38,8.65a4.38,4.38,0,1,0,0,6.86l4.68,2.92a4.33,4.33,0,0,0-.11.95A4.38,4.38,0,1,0,18.33,15Z");
    			attr_dev(path, "transform", "translate(-2.27 -0.4)");
    			set_style(path, "fill", /*socialIconColor*/ ctx[1]);
    			add_location(path, file, 35, 93, 1181);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 20.44 23.36");
    			add_location(svg, file, 35, 4, 1092);
    			attr_dev(div, "class", "px-2");
    			attr_dev(div, "id", "mobile-share-icon");
    			add_location(div, file, 34, 2, 1046);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*socialIconColor*/ 2) {
    				set_style(path, "fill", /*socialIconColor*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(34:0) {#if $isMobile && !isFacebookApp()}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let show_if;
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (show_if == null || dirty & /*$isMobile*/ 4) show_if = !!(/*$isMobile*/ ctx[2] && !isFacebookApp());
    		if (show_if) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function isFacebookApp() {
    	var ua = navigator.userAgent || navigator.vendor || window.opera;
    	return ua.indexOf("FBAN") > -1 || ua.indexOf("FBAV") > -1;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $isMobile;
    	validate_store(isMobile, "isMobile");
    	component_subscribe($$self, isMobile, $$value => $$invalidate(2, $isMobile = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SocialBox", slots, []);
    	let { shareUrl } = $$props;
    	let { tnlDomainPageId } = $$props;
    	let { socialIconColor = "#484748" } = $$props;
    	let webShareIcon;

    	onMount(() => {
    		// if user is on mobile device add event listener to 'mobile-share-icon' element
    		if ($isMobile && !isFacebookApp()) {
    			webShareIcon = document.getElementById("mobile-share-icon");

    			webShareIcon.addEventListener("click", async () => {
    				if (navigator.share) {
    					navigator.share({ url: tnlDomainPageId }).then(() => console.log("successful share!")).catch(error => console.log("error sharing!", error));
    				}
    			});
    		}
    	});

    	const writable_props = ["shareUrl", "tnlDomainPageId", "socialIconColor"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<SocialBox> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("shareUrl" in $$props) $$invalidate(0, shareUrl = $$props.shareUrl);
    		if ("tnlDomainPageId" in $$props) $$invalidate(3, tnlDomainPageId = $$props.tnlDomainPageId);
    		if ("socialIconColor" in $$props) $$invalidate(1, socialIconColor = $$props.socialIconColor);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		isMobile,
    		shareUrl,
    		tnlDomainPageId,
    		socialIconColor,
    		webShareIcon,
    		isFacebookApp,
    		$isMobile
    	});

    	$$self.$inject_state = $$props => {
    		if ("shareUrl" in $$props) $$invalidate(0, shareUrl = $$props.shareUrl);
    		if ("tnlDomainPageId" in $$props) $$invalidate(3, tnlDomainPageId = $$props.tnlDomainPageId);
    		if ("socialIconColor" in $$props) $$invalidate(1, socialIconColor = $$props.socialIconColor);
    		if ("webShareIcon" in $$props) webShareIcon = $$props.webShareIcon;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [shareUrl, socialIconColor, $isMobile, tnlDomainPageId];
    }

    class SocialBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			shareUrl: 0,
    			tnlDomainPageId: 3,
    			socialIconColor: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SocialBox",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*shareUrl*/ ctx[0] === undefined && !("shareUrl" in props)) {
    			console_1.warn("<SocialBox> was created without expected prop 'shareUrl'");
    		}

    		if (/*tnlDomainPageId*/ ctx[3] === undefined && !("tnlDomainPageId" in props)) {
    			console_1.warn("<SocialBox> was created without expected prop 'tnlDomainPageId'");
    		}
    	}

    	get shareUrl() {
    		throw new Error("<SocialBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shareUrl(value) {
    		throw new Error("<SocialBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tnlDomainPageId() {
    		throw new Error("<SocialBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tnlDomainPageId(value) {
    		throw new Error("<SocialBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get socialIconColor() {
    		throw new Error("<SocialBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set socialIconColor(value) {
    		throw new Error("<SocialBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const contentDataUrl = 'https://datastore.thenewslens.com/infographic/QA-AIDS-2020/QA-AIDS-2020.json?2w233132322';

    const ContentDataStore = writable(null, async set => {
      const res = await fetch(contentDataUrl);
      const data = await res.json();
      console.log(data);
      set(data);
      return () => {};
    });

    /* src/shared/Header.svelte generated by Svelte v3.29.4 */
    const file$1 = "src/shared/Header.svelte";

    function create_fragment$1(ctx) {
    	let header;
    	let div0;
    	let a;
    	let figure;
    	let img;
    	let img_src_value;
    	let t;
    	let div1;
    	let socialbox;
    	let current;

    	socialbox = new SocialBox({
    			props: {
    				shareUrl: /*shareUrl*/ ctx[2],
    				tnlDomainPageId: /*tnlDomainPageId*/ ctx[3],
    				socialIconColor: /*socialIconColor*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			header = element("header");
    			div0 = element("div");
    			a = element("a");
    			figure = element("figure");
    			img = element("img");
    			t = space();
    			div1 = element("div");
    			create_component(socialbox.$$.fragment);
    			if (img.src !== (img_src_value = "https://image3.thenewslens.com/assets/web/publisher-photo-1.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Tne News Lens logo");
    			attr_dev(img, "class", "svelte-fpaa3l");
    			add_location(img, file$1, 25, 8, 610);
    			attr_dev(figure, "class", "ml-2");
    			add_location(figure, file$1, 24, 6, 580);
    			attr_dev(a, "href", /*homePageUrl*/ ctx[0]);
    			add_location(a, file$1, 23, 4, 551);
    			attr_dev(div0, "class", "inline-block");
    			add_location(div0, file$1, 22, 2, 520);
    			attr_dev(div1, "class", "inline-block");
    			add_location(div1, file$1, 29, 2, 749);
    			attr_dev(header, "class", "flex justify-between bg-white py-2 px-2 shadow");
    			add_location(header, file$1, 21, 0, 454);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div0);
    			append_dev(div0, a);
    			append_dev(a, figure);
    			append_dev(figure, img);
    			append_dev(header, t);
    			append_dev(header, div1);
    			mount_component(socialbox, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*homePageUrl*/ 1) {
    				attr_dev(a, "href", /*homePageUrl*/ ctx[0]);
    			}

    			const socialbox_changes = {};
    			if (dirty & /*shareUrl*/ 4) socialbox_changes.shareUrl = /*shareUrl*/ ctx[2];
    			if (dirty & /*tnlDomainPageId*/ 8) socialbox_changes.tnlDomainPageId = /*tnlDomainPageId*/ ctx[3];
    			if (dirty & /*socialIconColor*/ 2) socialbox_changes.socialIconColor = /*socialIconColor*/ ctx[1];
    			socialbox.$set(socialbox_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(socialbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(socialbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(socialbox);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $ContentDataStore;
    	validate_store(ContentDataStore, "ContentDataStore");
    	component_subscribe($$self, ContentDataStore, $$value => $$invalidate(4, $ContentDataStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	let { homePageUrl = "https://www.thenewslens.com/" } = $$props;
    	let { socialIconColor = "#807F80" } = $$props;
    	let shareUrl = "#";
    	let tnlDomainPageId = "#";

    	if ($ContentDataStore) {
    		shareUrl = $ContentDataStore.article_url;
    		tnlDomainPageId = $ContentDataStore.tnl_page_id;
    	}

    	const writable_props = ["homePageUrl", "socialIconColor"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("homePageUrl" in $$props) $$invalidate(0, homePageUrl = $$props.homePageUrl);
    		if ("socialIconColor" in $$props) $$invalidate(1, socialIconColor = $$props.socialIconColor);
    	};

    	$$self.$capture_state = () => ({
    		SocialBox,
    		ContentDataStore,
    		homePageUrl,
    		socialIconColor,
    		shareUrl,
    		tnlDomainPageId,
    		$ContentDataStore
    	});

    	$$self.$inject_state = $$props => {
    		if ("homePageUrl" in $$props) $$invalidate(0, homePageUrl = $$props.homePageUrl);
    		if ("socialIconColor" in $$props) $$invalidate(1, socialIconColor = $$props.socialIconColor);
    		if ("shareUrl" in $$props) $$invalidate(2, shareUrl = $$props.shareUrl);
    		if ("tnlDomainPageId" in $$props) $$invalidate(3, tnlDomainPageId = $$props.tnlDomainPageId);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [homePageUrl, socialIconColor, shareUrl, tnlDomainPageId];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { homePageUrl: 0, socialIconColor: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get homePageUrl() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set homePageUrl(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get socialIconColor() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set socialIconColor(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/utils/MobileDetector.svelte generated by Svelte v3.29.4 */

    function create_fragment$2(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MobileDetector", slots, []);
    	let { minWidth = 640 } = $$props;

    	// media query event handler
    	if (matchMedia) {
    		const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    		mq.addListener(WidthSizeChange);
    		WidthSizeChange(mq);
    	}

    	// mobile detector when window's width size change
    	function WidthSizeChange(mq) {
    		if (mq.matches) {
    			isMobile.set(false);
    		} else {
    			isMobile.set(true);
    		}
    	}

    	const writable_props = ["minWidth"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MobileDetector> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("minWidth" in $$props) $$invalidate(0, minWidth = $$props.minWidth);
    	};

    	$$self.$capture_state = () => ({ isMobile, minWidth, WidthSizeChange });

    	$$self.$inject_state = $$props => {
    		if ("minWidth" in $$props) $$invalidate(0, minWidth = $$props.minWidth);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [minWidth];
    }

    class MobileDetector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { minWidth: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MobileDetector",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get minWidth() {
    		throw new Error("<MobileDetector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minWidth(value) {
    		throw new Error("<MobileDetector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // set css variables helper function
    function setCssVariables(node, variables) {
      for (const name in variables) {
        node.style.setProperty(`--${name}`, variables[name]);
      }
    }

    // svelte action function for setting css variables
    function cssVariables(node, variables) {
      setCssVariables(node, variables);
      
      return {
        update(variables) {
          setCssVariables(node, variables);
        }
      }
    }

    // helper function that help answer click to change card height
    function changeCardSectionHeight(questNumber) {
      const section = document.getElementById('qa-no-' + questNumber);
      const newSectionHeight = document.querySelector('#qa-no-' + questNumber + ' > div').getBoundingClientRect().height + 'px';
      const originalSectionHeight = section.style.height;

      if (+newSectionHeight.replace('px', '') > +originalSectionHeight.replace('px', '')) {
        section.style.height = newSectionHeight;
      }
    }

    // get all sections' height
    function getAllSectionsHeight(){
      let sectionHeightList = [];
      const sections = document.querySelectorAll('[id^="qa-no-"]');
      
      for (let i = 0; i < sections.length; i++) {
        sectionHeightList.push(sections[i].getBoundingClientRect().height);
      }
      return(sectionHeightList)
    }

    function quintOut(t) {
        return --t * t * t * t * t + 1;
    }

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                store.set(value = target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    let QAStatus = writable(null);
    let QAFinalPage = writable(1);
    let QASectionsHeight = writable(null);
    let QAProgress = writable(1);
    let RightAnswerCalc = writable(0);
    let QAProgressArray = writable(null);

    /* src/shared/BasicParagraphs.svelte generated by Svelte v3.29.4 */
    const file$2 = "src/shared/BasicParagraphs.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i].type;
    	child_ctx[4] = list[i].value;
    	return child_ctx;
    }

    // (43:2) {#if $ContentDataStore}
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let each_value = /*basicPragraphsData*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*basicPragraphsData*/ 1) {
    				each_value = /*basicPragraphsData*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(43:2) {#if $ContentDataStore}",
    		ctx
    	});

    	return block;
    }

    // (49:33) 
    function create_if_block_3(ctx) {
    	let figure;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let figcaption;
    	let t1_value = /*value*/ ctx[4].note + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			figure = element("figure");
    			img = element("img");
    			t0 = space();
    			figcaption = element("figcaption");
    			t1 = text(t1_value);
    			t2 = space();
    			if (img.src !== (img_src_value = /*value*/ ctx[4].url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*value*/ ctx[4].discription);
    			add_location(img, file$2, 50, 10, 1202);
    			attr_dev(figcaption, "class", "svelte-18blbr1");
    			add_location(figcaption, file$2, 51, 10, 1260);
    			attr_dev(figure, "class", "img-wrapper");
    			add_location(figure, file$2, 49, 8, 1163);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, figure, anchor);
    			append_dev(figure, img);
    			append_dev(figure, t0);
    			append_dev(figure, figcaption);
    			append_dev(figcaption, t1);
    			append_dev(figure, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*basicPragraphsData*/ 1 && img.src !== (img_src_value = /*value*/ ctx[4].url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*basicPragraphsData*/ 1 && img_alt_value !== (img_alt_value = /*value*/ ctx[4].discription)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*basicPragraphsData*/ 1 && t1_value !== (t1_value = /*value*/ ctx[4].note + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(figure);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(49:33) ",
    		ctx
    	});

    	return block;
    }

    // (47:36) 
    function create_if_block_2(ctx) {
    	let h3;
    	let t_value = /*value*/ ctx[4] + "";
    	let t;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t = text(t_value);
    			add_location(h3, file$2, 47, 8, 1104);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*basicPragraphsData*/ 1 && t_value !== (t_value = /*value*/ ctx[4] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(47:36) ",
    		ctx
    	});

    	return block;
    }

    // (45:6) {#if type === 'text'}
    function create_if_block_1(ctx) {
    	let p;
    	let t_value = /*value*/ ctx[4] + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			add_location(p, file$2, 45, 8, 1044);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*basicPragraphsData*/ 1 && t_value !== (t_value = /*value*/ ctx[4] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(45:6) {#if type === 'text'}",
    		ctx
    	});

    	return block;
    }

    // (44:4) {#each basicPragraphsData as { type, value }}
    function create_each_block(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*type*/ ctx[3] === "text") return create_if_block_1;
    		if (/*type*/ ctx[3] === "subtitle") return create_if_block_2;
    		if (/*type*/ ctx[3] === "image") return create_if_block_3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(44:4) {#each basicPragraphsData as { type, value }}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let if_block = /*$ContentDataStore*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "basic-p-container");
    			add_location(div, file$2, 40, 0, 842);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$ContentDataStore*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $ContentDataStore;
    	validate_store(ContentDataStore, "ContentDataStore");
    	component_subscribe($$self, ContentDataStore, $$value => $$invalidate(1, $ContentDataStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BasicParagraphs", slots, []);
    	let { sectionName = "testing" } = $$props;
    	let basicPragraphsData;
    	const writable_props = ["sectionName"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BasicParagraphs> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("sectionName" in $$props) $$invalidate(2, sectionName = $$props.sectionName);
    	};

    	$$self.$capture_state = () => ({
    		ContentDataStore,
    		sectionName,
    		basicPragraphsData,
    		$ContentDataStore
    	});

    	$$self.$inject_state = $$props => {
    		if ("sectionName" in $$props) $$invalidate(2, sectionName = $$props.sectionName);
    		if ("basicPragraphsData" in $$props) $$invalidate(0, basicPragraphsData = $$props.basicPragraphsData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$ContentDataStore, sectionName*/ 6) {
    			// check store has fetched content data from GCS
    			 if ($ContentDataStore) {
    				$$invalidate(0, basicPragraphsData = $ContentDataStore[sectionName]);
    			}
    		}
    	};

    	return [basicPragraphsData, $ContentDataStore, sectionName];
    }

    class BasicParagraphs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { sectionName: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BasicParagraphs",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get sectionName() {
    		throw new Error("<BasicParagraphs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sectionName(value) {
    		throw new Error("<BasicParagraphs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/shared/Footer.svelte generated by Svelte v3.29.4 */

    const file$3 = "src/shared/Footer.svelte";

    function create_fragment$4(ctx) {
    	let footer;
    	let div1;
    	let a;
    	let figure;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div1 = element("div");
    			a = element("a");
    			figure = element("figure");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text("Copyright © 2020 The News Lens 關鍵評論");
    			attr_dev(img, "class", "mx-auto my-2");
    			attr_dev(img, "width", "250px");
    			if (img.src !== (img_src_value = `${/*tnlLogoUrl*/ ctx[4]}?utm_source=TNL-interactive&utm_medium=footer&utm_campaign=${/*projectName*/ ctx[1]}`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "tnl-white-logo");
    			add_location(img, file$3, 12, 8, 485);
    			attr_dev(figure, "class", "mx-auto my-2");
    			add_location(figure, file$3, 11, 6, 447);
    			attr_dev(a, "href", /*homePageUrl*/ ctx[3]);
    			add_location(a, file$3, 10, 4, 418);
    			attr_dev(div0, "class", "text-xs md:text-sm pt-2");
    			set_style(div0, "color", /*copyRightColor*/ ctx[2]);
    			add_location(div0, file$3, 20, 4, 721);
    			attr_dev(div1, "class", "text-center p-8 text-white font-light tracking-wide");
    			set_style(div1, "background-color", /*bgColor*/ ctx[0]);
    			add_location(div1, file$3, 9, 2, 311);
    			add_location(footer, file$3, 8, 0, 300);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div1);
    			append_dev(div1, a);
    			append_dev(a, figure);
    			append_dev(figure, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*tnlLogoUrl, projectName*/ 18 && img.src !== (img_src_value = `${/*tnlLogoUrl*/ ctx[4]}?utm_source=TNL-interactive&utm_medium=footer&utm_campaign=${/*projectName*/ ctx[1]}`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*homePageUrl*/ 8) {
    				attr_dev(a, "href", /*homePageUrl*/ ctx[3]);
    			}

    			if (dirty & /*copyRightColor*/ 4) {
    				set_style(div0, "color", /*copyRightColor*/ ctx[2]);
    			}

    			if (dirty & /*bgColor*/ 1) {
    				set_style(div1, "background-color", /*bgColor*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	let { bgColor = "black" } = $$props;
    	let { projectName = "" } = $$props;
    	let { copyRightColor = "white" } = $$props;
    	let { homePageUrl = "https://www.thenewslens.com/" } = $$props;
    	let { tnlLogoUrl = "https://datastore.thenewslens.com/infographic/assets/tnl-logo/tnl-footer-dark-bg-logo.png" } = $$props;
    	const writable_props = ["bgColor", "projectName", "copyRightColor", "homePageUrl", "tnlLogoUrl"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("bgColor" in $$props) $$invalidate(0, bgColor = $$props.bgColor);
    		if ("projectName" in $$props) $$invalidate(1, projectName = $$props.projectName);
    		if ("copyRightColor" in $$props) $$invalidate(2, copyRightColor = $$props.copyRightColor);
    		if ("homePageUrl" in $$props) $$invalidate(3, homePageUrl = $$props.homePageUrl);
    		if ("tnlLogoUrl" in $$props) $$invalidate(4, tnlLogoUrl = $$props.tnlLogoUrl);
    	};

    	$$self.$capture_state = () => ({
    		bgColor,
    		projectName,
    		copyRightColor,
    		homePageUrl,
    		tnlLogoUrl
    	});

    	$$self.$inject_state = $$props => {
    		if ("bgColor" in $$props) $$invalidate(0, bgColor = $$props.bgColor);
    		if ("projectName" in $$props) $$invalidate(1, projectName = $$props.projectName);
    		if ("copyRightColor" in $$props) $$invalidate(2, copyRightColor = $$props.copyRightColor);
    		if ("homePageUrl" in $$props) $$invalidate(3, homePageUrl = $$props.homePageUrl);
    		if ("tnlLogoUrl" in $$props) $$invalidate(4, tnlLogoUrl = $$props.tnlLogoUrl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [bgColor, projectName, copyRightColor, homePageUrl, tnlLogoUrl];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			bgColor: 0,
    			projectName: 1,
    			copyRightColor: 2,
    			homePageUrl: 3,
    			tnlLogoUrl: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get bgColor() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get projectName() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set projectName(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get copyRightColor() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set copyRightColor(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get homePageUrl() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set homePageUrl(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tnlLogoUrl() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tnlLogoUrl(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/shared/AnswerHeader.svelte generated by Svelte v3.29.4 */
    const file$4 = "src/shared/AnswerHeader.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i].question_number;
    	child_ctx[5] = list[i].status;
    	return child_ctx;
    }

    // (32:4) {#if $QAProgressArray}
    function create_if_block_1$1(ctx) {
    	let each_1_anchor;
    	let each_value = /*$QAProgressArray*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$QAProgressArray, progressColorChecker, questNumber*/ 9) {
    				each_value = /*$QAProgressArray*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(32:4) {#if $QAProgressArray}",
    		ctx
    	});

    	return block;
    }

    // (44:8) {:else}
    function create_else_block$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "rounded-full h-4 w-4 mx-2 border-2 border-black");
    			set_style(div, "background-color", progressColorChecker(/*status*/ ctx[5]));
    			set_style(div, "opacity", /*status*/ ctx[5] === "wrong" ? 0.3 : 1);
    			add_location(div, file$4, 44, 10, 1332);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$QAProgressArray*/ 8) {
    				set_style(div, "background-color", progressColorChecker(/*status*/ ctx[5]));
    			}

    			if (dirty & /*$QAProgressArray*/ 8) {
    				set_style(div, "opacity", /*status*/ ctx[5] === "wrong" ? 0.3 : 1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(44:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (34:8) {#if +question_number == +questNumber}
    function create_if_block_2$1(ctx) {
    	let div1;
    	let div0;
    	let t;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = space();
    			attr_dev(div0, "class", "rounded-full bg-black h-4 w-4");

    			set_style(div0, "background-color", /*status*/ ctx[5] === "unanswered"
    			? "#000000"
    			: progressColorChecker(/*status*/ ctx[5]));

    			set_style(div0, "opacity", /*status*/ ctx[5] === "wrong" ? 0.3 : 1);
    			add_location(div0, file$4, 38, 12, 1067);
    			attr_dev(div1, "class", "flex justify-center items-center rounded-full h-6 w-6 mx-2 border-2 border-black");
    			set_style(div1, "opacity", /*status*/ ctx[5] === "wrong" ? 0.3 : 1);
    			add_location(div1, file$4, 34, 10, 877);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$QAProgressArray*/ 8) {
    				set_style(div0, "background-color", /*status*/ ctx[5] === "unanswered"
    				? "#000000"
    				: progressColorChecker(/*status*/ ctx[5]));
    			}

    			if (dirty & /*$QAProgressArray*/ 8) {
    				set_style(div0, "opacity", /*status*/ ctx[5] === "wrong" ? 0.3 : 1);
    			}

    			if (dirty & /*$QAProgressArray*/ 8) {
    				set_style(div1, "opacity", /*status*/ ctx[5] === "wrong" ? 0.3 : 1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(34:8) {#if +question_number == +questNumber}",
    		ctx
    	});

    	return block;
    }

    // (33:6) {#each $QAProgressArray as { question_number, status }}
    function create_each_block$1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (+/*question_number*/ ctx[4] == +/*questNumber*/ ctx[0]) return create_if_block_2$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(33:6) {#each $QAProgressArray as { question_number, status }}",
    		ctx
    	});

    	return block;
    }

    // (54:0) {#if !finalPage}
    function create_if_block$2(ctx) {
    	let div2;
    	let div0;
    	let svg;
    	let path;
    	let t0;
    	let div1;
    	let span;
    	let t1;
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			div1 = element("div");
    			span = element("span");
    			t1 = text(/*questNumber*/ ctx[0]);
    			t2 = text("/");
    			t3 = text(/*maxQuestion*/ ctx[1]);
    			attr_dev(path, "d", "M7.856 0.0399995C9.088 0.0399995 10.184 0.256 11.144 0.688C12.104 1.12 12.912 1.704 13.568 2.44C14.224 3.176 14.72 4.032 15.056 5.008C15.408 5.984 15.584 7.008 15.584 8.08C15.584 9.104 15.432 10.096 15.128 11.056C14.824 12 14.368 12.848 13.76 13.6C13.168 14.336 12.432 14.944 11.552 15.424C10.672 15.904 9.656 16.176 8.504 16.24C9.32 16.256 10.04 16.352 10.664 16.528C11.288 16.72 11.872 16.92 12.416 17.128C12.976 17.352 13.528 17.552 14.072 17.728C14.616 17.904 15.2 17.992 15.824 17.992C16.048 17.992 16.312 17.96 16.616 17.896C16.936 17.848 17.272 17.72 17.624 17.512L17.696 17.56L18.032 18.232L18.008 18.328C17.64 18.792 17.192 19.184 16.664 19.504C16.136 19.824 15.544 19.984 14.888 19.984C14.344 19.984 13.784 19.856 13.208 19.6C12.648 19.36 12.056 19.088 11.432 18.784C10.808 18.496 10.16 18.224 9.488 17.968C8.816 17.728 8.112 17.608 7.376 17.608C6.752 17.608 6.144 17.712 5.552 17.92C4.976 18.128 4.552 18.352 4.28 18.592L4.208 18.568L3.944 17.632L3.968 17.56C4.32 17.32 4.792 17.056 5.384 16.768C5.976 16.48 6.616 16.312 7.304 16.264C6.12 16.248 5.08 16.024 4.184 15.592C3.288 15.16 2.536 14.584 1.928 13.864C1.336 13.128 0.888 12.28 0.584 11.32C0.28 10.36 0.128 9.344 0.128 8.272C0.128 7.136 0.304 6.072 0.656 5.08C1.008 4.072 1.512 3.2 2.168 2.464C2.824 1.712 3.632 1.12 4.592 0.688C5.552 0.256 6.64 0.0399995 7.856 0.0399995ZM7.832 14.272C8.616 14.272 9.312 14.112 9.92 13.792C10.544 13.456 11.064 13.016 11.48 12.472C11.896 11.912 12.216 11.264 12.44 10.528C12.664 9.776 12.776 8.976 12.776 8.128C12.776 7.264 12.656 6.464 12.416 5.728C12.192 4.976 11.856 4.328 11.408 3.784C10.976 3.24 10.448 2.816 9.824 2.512C9.2 2.192 8.496 2.032 7.712 2.032C6.944 2.032 6.264 2.184 5.672 2.488C5.08 2.792 4.584 3.216 4.184 3.76C3.784 4.304 3.48 4.952 3.272 5.704C3.064 6.44 2.96 7.24 2.96 8.104C2.96 9.048 3.08 9.904 3.32 10.672C3.56 11.424 3.896 12.072 4.328 12.616C4.76 13.144 5.272 13.552 5.864 13.84C6.456 14.128 7.112 14.272 7.832 14.272Z");
    			attr_dev(path, "fill", "black");
    			add_location(path, file$4, 57, 8, 1809);
    			attr_dev(svg, "width", "19");
    			attr_dev(svg, "height", "20");
    			attr_dev(svg, "viewBox", "0 0 19 20");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$4, 56, 6, 1705);
    			attr_dev(div0, "class", "sm:invisible");
    			add_location(div0, file$4, 55, 4, 1672);
    			attr_dev(span, "class", "text-xs tracking-wider text-white mx-2 my-1");
    			add_location(span, file$4, 64, 6, 3867);
    			attr_dev(div1, "class", "bg-black");
    			add_location(div1, file$4, 63, 4, 3838);
    			attr_dev(div2, "class", "flex justify-between items-center mx-3 sm:mx-10 mt-1");
    			add_location(div2, file$4, 54, 2, 1601);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, svg);
    			append_dev(svg, path);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, span);
    			append_dev(span, t1);
    			append_dev(span, t2);
    			append_dev(span, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*questNumber*/ 1) set_data_dev(t1, /*questNumber*/ ctx[0]);
    			if (dirty & /*maxQuestion*/ 2) set_data_dev(t3, /*maxQuestion*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(54:0) {#if !finalPage}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div1;
    	let div0;
    	let div1_class_value;
    	let t;
    	let if_block1_anchor;
    	let if_block0 = /*$QAProgressArray*/ ctx[3] && create_if_block_1$1(ctx);
    	let if_block1 = !/*finalPage*/ ctx[2] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(div0, "class", "flex justify-between items-center progress mx-auto svelte-t8tksi");
    			add_location(div0, file$4, 30, 2, 666);
    			attr_dev(div1, "class", div1_class_value = "text-center " + (/*finalPage*/ ctx[2] ? "border-none" : "border-b-2") + " border-black mt-6 mb-2 pb-3 mx-3 sm:mx-10");
    			add_location(div1, file$4, 29, 0, 553);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if (if_block0) if_block0.m(div0, null);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$QAProgressArray*/ ctx[3]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*finalPage*/ 4 && div1_class_value !== (div1_class_value = "text-center " + (/*finalPage*/ ctx[2] ? "border-none" : "border-b-2") + " border-black mt-6 mb-2 pb-3 mx-3 sm:mx-10")) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (!/*finalPage*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function progressColorChecker(status) {
    	if (status == "correct") {
    		return "#1AD71A";
    	} else if (status == "wrong") {
    		return "#FF0000";
    	} else if (status == "unanswered") {
    		return "#FFFFFF";
    	}
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $QAProgressArray;
    	validate_store(QAProgressArray, "QAProgressArray");
    	component_subscribe($$self, QAProgressArray, $$value => $$invalidate(3, $QAProgressArray = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AnswerHeader", slots, []);
    	let { questNumber } = $$props;
    	let { maxQuestion } = $$props;
    	let { finalPage = false } = $$props;
    	const writable_props = ["questNumber", "maxQuestion", "finalPage"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AnswerHeader> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("questNumber" in $$props) $$invalidate(0, questNumber = $$props.questNumber);
    		if ("maxQuestion" in $$props) $$invalidate(1, maxQuestion = $$props.maxQuestion);
    		if ("finalPage" in $$props) $$invalidate(2, finalPage = $$props.finalPage);
    	};

    	$$self.$capture_state = () => ({
    		QAProgressArray,
    		questNumber,
    		maxQuestion,
    		finalPage,
    		progressColorChecker,
    		$QAProgressArray
    	});

    	$$self.$inject_state = $$props => {
    		if ("questNumber" in $$props) $$invalidate(0, questNumber = $$props.questNumber);
    		if ("maxQuestion" in $$props) $$invalidate(1, maxQuestion = $$props.maxQuestion);
    		if ("finalPage" in $$props) $$invalidate(2, finalPage = $$props.finalPage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [questNumber, maxQuestion, finalPage, $QAProgressArray];
    }

    class AnswerHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			questNumber: 0,
    			maxQuestion: 1,
    			finalPage: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AnswerHeader",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*questNumber*/ ctx[0] === undefined && !("questNumber" in props)) {
    			console.warn("<AnswerHeader> was created without expected prop 'questNumber'");
    		}

    		if (/*maxQuestion*/ ctx[1] === undefined && !("maxQuestion" in props)) {
    			console.warn("<AnswerHeader> was created without expected prop 'maxQuestion'");
    		}
    	}

    	get questNumber() {
    		throw new Error("<AnswerHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set questNumber(value) {
    		throw new Error("<AnswerHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxQuestion() {
    		throw new Error("<AnswerHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxQuestion(value) {
    		throw new Error("<AnswerHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get finalPage() {
    		throw new Error("<AnswerHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set finalPage(value) {
    		throw new Error("<AnswerHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/shared/FinalCardBackground.svelte generated by Svelte v3.29.4 */

    const file$5 = "src/shared/FinalCardBackground.svelte";

    function create_fragment$6(ctx) {
    	let div0;
    	let svg0;
    	let g0;
    	let path0;
    	let rect0;
    	let t;
    	let div1;
    	let svg1;
    	let g1;
    	let rect1;
    	let path1;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			svg0 = svg_element("svg");
    			g0 = svg_element("g");
    			path0 = svg_element("path");
    			rect0 = svg_element("rect");
    			t = space();
    			div1 = element("div");
    			svg1 = svg_element("svg");
    			g1 = svg_element("g");
    			rect1 = svg_element("rect");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", "M0,122a58.77,58.77,0,0,0,42.07-17.87A61.77,61.77,0,0,0,59.5,61,61.77,61.77,0,0,0,42.07,17.87,58.77,58.77,0,0,0,0,0V122Z");
    			set_style(path0, "fill", "#1d4aba");
    			add_location(path0, file$5, 12, 6, 191);
    			attr_dev(rect0, "x", "206.5");
    			attr_dev(rect0, "y", "179");
    			attr_dev(rect0, "width", "114");
    			attr_dev(rect0, "height", "59");
    			set_style(rect0, "fill", "#c13838");
    			add_location(rect0, file$5, 16, 6, 373);
    			add_location(g0, file$5, 11, 4, 181);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "width", "100vw");
    			attr_dev(svg0, "viewBox", "0 0 320.5 238");
    			add_location(svg0, file$5, 10, 2, 98);
    			attr_dev(div0, "class", "absolute top-0 svelte-azq93q");
    			add_location(div0, file$5, 9, 0, 67);
    			attr_dev(rect1, "width", "56");
    			attr_dev(rect1, "height", "180");
    			set_style(rect1, "fill", "#ffc736");
    			add_location(rect1, file$5, 22, 6, 592);
    			attr_dev(path1, "d", "M227,51l93,93H227Z");
    			set_style(path1, "fill", "#1d4aba");
    			add_location(path1, file$5, 23, 6, 652);
    			add_location(g1, file$5, 21, 4, 582);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "width", "100vw");
    			attr_dev(svg1, "viewBox", "0 0 320 180");
    			add_location(svg1, file$5, 20, 2, 501);
    			attr_dev(div1, "class", "absolute bottom-0 svelte-azq93q");
    			add_location(div1, file$5, 19, 0, 467);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, svg0);
    			append_dev(svg0, g0);
    			append_dev(g0, path0);
    			append_dev(g0, rect0);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, svg1);
    			append_dev(svg1, g1);
    			append_dev(g1, rect1);
    			append_dev(g1, path1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FinalCardBackground", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FinalCardBackground> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class FinalCardBackground extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FinalCardBackground",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/shared/Spinner.svelte generated by Svelte v3.29.4 */

    const file$6 = "src/shared/Spinner.svelte";

    function create_fragment$7(ctx) {
    	let svg;
    	let circle;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			attr_dev(circle, "class", "path svelte-1b7swrt");
    			attr_dev(circle, "cx", "25");
    			attr_dev(circle, "cy", "25");
    			attr_dev(circle, "r", "20");
    			attr_dev(circle, "fill", "none");
    			attr_dev(circle, "stroke-width", "5");
    			add_location(circle, file$6, 63, 41, 1279);
    			attr_dev(svg, "class", "spinner svelte-1b7swrt");
    			attr_dev(svg, "viewBox", "0 0 50 50");
    			add_location(svg, file$6, 63, 0, 1238);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, circle);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Spinner", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Spinner> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Spinner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Spinner",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/shared/ArticleList.svelte generated by Svelte v3.29.4 */
    const file$7 = "src/shared/ArticleList.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i].article_title;
    	child_ctx[3] = list[i].article_img_url;
    	child_ctx[4] = list[i].article_url;
    	return child_ctx;
    }

    // (36:2) {:catch error}
    function create_catch_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "An error occurred!";
    			attr_dev(p, "class", "text-center");
    			add_location(p, file$7, 36, 4, 1093);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(36:2) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (15:2) {:then articleData}
    function create_then_block(ctx) {
    	let each_1_anchor;
    	let each_value = /*articleData*/ ctx[1].slice(0, 6);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*articleData, projectName*/ 3) {
    				each_value = /*articleData*/ ctx[1].slice(0, 6);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(15:2) {:then articleData}",
    		ctx
    	});

    	return block;
    }

    // (16:4) {#each articleData.slice(0, 6) as { article_title, article_img_url, article_url }}
    function create_each_block$2(ctx) {
    	let div1;
    	let div0;
    	let a0;
    	let img;
    	let img_src_value;
    	let a0_href_value;
    	let t0;
    	let a1;
    	let h3;
    	let t1_value = /*article_title*/ ctx[2] + "";
    	let t1;
    	let a1_href_value;
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			img = element("img");
    			t0 = space();
    			a1 = element("a");
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(img, "class", "article-lists-img hover:scale-110");
    			if (img.src !== (img_src_value = /*article_img_url*/ ctx[3])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$7, 23, 12, 655);
    			attr_dev(a0, "href", a0_href_value = `${/*article_url*/ ctx[4]}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${/*projectName*/ ctx[0]}`);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noopener noreferrer");
    			add_location(a0, file$7, 18, 10, 447);
    			attr_dev(div0, "class", "overflow-hidden");
    			add_location(div0, file$7, 17, 8, 407);
    			attr_dev(h3, "class", "article-lists-h3 hover-opacity");
    			add_location(h3, file$7, 31, 10, 970);
    			attr_dev(a1, "href", a1_href_value = `${/*article_url*/ ctx[4]}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${/*projectName*/ ctx[0]}`);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "rel", "noopener noreferrer");
    			add_location(a1, file$7, 26, 8, 772);
    			attr_dev(div1, "class", "my-4");
    			add_location(div1, file$7, 16, 6, 380);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(a0, img);
    			append_dev(div1, t0);
    			append_dev(div1, a1);
    			append_dev(a1, h3);
    			append_dev(h3, t1);
    			append_dev(div1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*articleData*/ 2 && img.src !== (img_src_value = /*article_img_url*/ ctx[3])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*articleData, projectName*/ 3 && a0_href_value !== (a0_href_value = `${/*article_url*/ ctx[4]}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${/*projectName*/ ctx[0]}`)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*articleData*/ 2 && t1_value !== (t1_value = /*article_title*/ ctx[2] + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*articleData, projectName*/ 3 && a1_href_value !== (a1_href_value = `${/*article_url*/ ctx[4]}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${/*projectName*/ ctx[0]}`)) {
    				attr_dev(a1, "href", a1_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(16:4) {#each articleData.slice(0, 6) as { article_title, article_img_url, article_url }}",
    		ctx
    	});

    	return block;
    }

    // (11:22)      <div class="w-64 h-64">       <Spinner />     </div>   {:then articleData}
    function create_pending_block(ctx) {
    	let div;
    	let spinner;
    	let current;
    	spinner = new Spinner({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(spinner.$$.fragment);
    			attr_dev(div, "class", "w-64 h-64");
    			add_location(div, file$7, 11, 4, 212);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(spinner, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(spinner.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(spinner.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(spinner);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(11:22)      <div class=\\\"w-64 h-64\\\">       <Spinner />     </div>   {:then articleData}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 1,
    		error: 7,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*articleData*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			div = element("div");
    			info.block.c();
    			attr_dev(div, "class", "relative article-list-grid-template pb-10");
    			add_location(div, file$7, 9, 0, 129);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*articleData*/ 2 && promise !== (promise = /*articleData*/ ctx[1]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[1] = child_ctx[7] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ArticleList", slots, []);
    	let { projectName } = $$props;
    	let { articleData } = $$props;
    	const writable_props = ["projectName", "articleData"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ArticleList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("projectName" in $$props) $$invalidate(0, projectName = $$props.projectName);
    		if ("articleData" in $$props) $$invalidate(1, articleData = $$props.articleData);
    	};

    	$$self.$capture_state = () => ({ Spinner, projectName, articleData });

    	$$self.$inject_state = $$props => {
    		if ("projectName" in $$props) $$invalidate(0, projectName = $$props.projectName);
    		if ("articleData" in $$props) $$invalidate(1, articleData = $$props.articleData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [projectName, articleData];
    }

    class ArticleList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { projectName: 0, articleData: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ArticleList",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*projectName*/ ctx[0] === undefined && !("projectName" in props)) {
    			console.warn("<ArticleList> was created without expected prop 'projectName'");
    		}

    		if (/*articleData*/ ctx[1] === undefined && !("articleData" in props)) {
    			console.warn("<ArticleList> was created without expected prop 'articleData'");
    		}
    	}

    	get projectName() {
    		throw new Error("<ArticleList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set projectName(value) {
    		throw new Error("<ArticleList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get articleData() {
    		throw new Error("<ArticleList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set articleData(value) {
    		throw new Error("<ArticleList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/shared/SocialBoxInArticle.svelte generated by Svelte v3.29.4 */

    const file$8 = "src/shared/SocialBoxInArticle.svelte";

    function create_fragment$9(ctx) {
    	let div;
    	let a0;
    	let svg0;
    	let circle0;
    	let path0;
    	let a0_href_value;
    	let t0;
    	let a1;
    	let svg1;
    	let path1;
    	let path2;
    	let path3;
    	let path4;
    	let path5;
    	let path6;
    	let a1_href_value;
    	let t1;
    	let a2;
    	let svg2;
    	let circle1;
    	let path7;
    	let a2_href_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			a0 = element("a");
    			svg0 = svg_element("svg");
    			circle0 = svg_element("circle");
    			path0 = svg_element("path");
    			t0 = space();
    			a1 = element("a");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			t1 = space();
    			a2 = element("a");
    			svg2 = svg_element("svg");
    			circle1 = svg_element("circle");
    			path7 = svg_element("path");
    			attr_dev(circle0, "cx", "32");
    			attr_dev(circle0, "cy", "32");
    			attr_dev(circle0, "r", "26");
    			attr_dev(circle0, "fill", "#3B5998");
    			add_location(circle0, file$8, 10, 6, 320);
    			attr_dev(path0, "fill-rule", "evenodd");
    			attr_dev(path0, "clip-rule", "evenodd");
    			attr_dev(path0, "d", "M38.7534 23.2771C37.9223 23.1108 36.7998 22.9867 36.0938 22.9867C34.1823 22.9867 34.0581 23.8178 34.0581 25.1476V27.5148H38.8365L38.42 32.4183H34.0581V47.3333H28.0751V32.4183H25V27.5148H28.0751V24.4817C28.0751 20.3271 30.0277 18 34.9303 18C36.6336 18 37.8802 18.2493 39.5004 18.5818L38.7534 23.2771Z");
    			attr_dev(path0, "fill", "white");
    			add_location(path0, file$8, 11, 6, 375);
    			attr_dev(svg0, "width", "40");
    			attr_dev(svg0, "height", "40");
    			attr_dev(svg0, "viewBox", "0 0 64 64");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg0, file$8, 9, 4, 218);
    			attr_dev(a0, "href", a0_href_value = `https://www.facebook.com/sharer/sharer.php?u=${/*shareUrl*/ ctx[0]}`);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "class", "px-4 hover-opacity");
    			add_location(a0, file$8, 8, 2, 101);
    			attr_dev(path1, "d", "M32 58C46.3594 58 58 46.3594 58 32C58 17.6406 46.3594 6 32 6C17.6406 6 6 17.6406 6 32C6 46.3594 17.6406 58 32 58Z");
    			attr_dev(path1, "fill", "#00B900");
    			add_location(path1, file$8, 21, 6, 1009);
    			attr_dev(path2, "d", "M49.2944 30.4401C49.2944 22.7008 41.5377 16.4044 32 16.4044C22.4667 16.4044 14.7057 22.7008 14.7057 30.4401C14.7057 37.3778 20.859 43.1888 29.1704 44.2851C29.7337 44.4064 30.5007 44.6578 30.6957 45.1388C30.869 45.5764 30.8084 46.2611 30.752 46.7031C30.752 46.7031 30.5484 47.9251 30.505 48.1851C30.4314 48.6228 30.1584 49.8968 32.0044 49.1168C33.8504 48.3411 41.9624 43.2538 45.5937 39.0764C48.094 36.3248 49.2944 33.5341 49.2944 30.4401Z");
    			attr_dev(path2, "fill", "white");
    			add_location(path2, file$8, 25, 6, 1179);
    			attr_dev(path3, "d", "M28.4857 26.7007H27.2724C27.0861 26.7007 26.9344 26.8523 26.9344 27.0387V34.5743C26.9344 34.7607 27.0861 34.9123 27.2724 34.9123H28.4857C28.6721 34.9123 28.8237 34.7607 28.8237 34.5743V27.0344C28.8237 26.8524 28.6721 26.7007 28.4857 26.7007Z");
    			attr_dev(path3, "fill", "#00B900");
    			add_location(path3, file$8, 29, 6, 1672);
    			attr_dev(path4, "d", "M36.836 26.7007H35.6227C35.4364 26.7007 35.2847 26.8523 35.2847 27.0387V31.515L31.831 26.8523C31.8224 26.8393 31.8137 26.8307 31.805 26.8177C31.805 26.8177 31.805 26.8177 31.8007 26.8133C31.792 26.8047 31.7877 26.8003 31.779 26.7917C31.7747 26.7917 31.7747 26.7874 31.7747 26.7874C31.7704 26.783 31.7617 26.7787 31.7574 26.7743C31.753 26.77 31.753 26.77 31.7487 26.7657C31.7444 26.7613 31.7357 26.757 31.7314 26.7527C31.727 26.7483 31.7227 26.7484 31.7227 26.7484C31.7184 26.744 31.7097 26.7397 31.7054 26.7397C31.701 26.7397 31.6967 26.7353 31.6967 26.7353C31.6924 26.731 31.6837 26.731 31.6794 26.7267C31.675 26.7267 31.6707 26.7223 31.6664 26.7223C31.6577 26.718 31.6534 26.718 31.6447 26.7137C31.6404 26.7137 31.636 26.7137 31.6317 26.7094C31.623 26.7094 31.6187 26.705 31.6144 26.705C31.61 26.705 31.6057 26.705 31.6014 26.705C31.597 26.705 31.5884 26.705 31.584 26.7007C31.5797 26.7007 31.571 26.7007 31.5667 26.7007C31.5624 26.7007 31.558 26.7007 31.5537 26.7007H30.3404C30.154 26.7007 30.0024 26.8523 30.0024 27.0387V34.5744C30.0024 34.7607 30.154 34.9124 30.3404 34.9124H31.5537C31.74 34.9124 31.8917 34.7607 31.8917 34.5744V30.098L35.3497 34.7694C35.3714 34.804 35.4017 34.83 35.4364 34.8517C35.4364 34.8517 35.4407 34.8517 35.4407 34.856C35.4494 34.8604 35.4537 34.8647 35.4624 34.869C35.4667 34.869 35.4667 34.8734 35.471 34.8734C35.4754 34.8777 35.4797 34.8777 35.4884 34.882C35.4927 34.8864 35.497 34.8864 35.5057 34.8907C35.51 34.8907 35.5144 34.895 35.5144 34.895C35.523 34.8994 35.5317 34.8994 35.536 34.9037H35.5404C35.5664 34.9124 35.5967 34.9167 35.627 34.9167H36.8404C37.0267 34.9167 37.1784 34.765 37.1784 34.5787V27.0344C37.174 26.8524 37.0224 26.7007 36.836 26.7007Z");
    			attr_dev(path4, "fill", "#00B900");
    			add_location(path4, file$8, 33, 6, 1970);
    			attr_dev(path5, "d", "M25.5607 33.0186H22.2631V27.0343C22.2631 26.848 22.1114 26.6963 21.9251 26.6963H20.7117C20.5254 26.6963 20.3737 26.848 20.3737 27.0343V34.57C20.3737 34.661 20.4084 34.7433 20.4691 34.804L20.4734 34.8083L20.4777 34.8126C20.5384 34.869 20.6207 34.908 20.7117 34.908H25.5564C25.7427 34.908 25.8944 34.7563 25.8944 34.57V33.3566C25.8987 33.1703 25.7471 33.0186 25.5607 33.0186Z");
    			attr_dev(path5, "fill", "#00B900");
    			add_location(path5, file$8, 37, 6, 3717);
    			attr_dev(path6, "d", "M43.5354 28.5857C43.7217 28.5857 43.8734 28.4341 43.8734 28.2477V27.0344C43.8734 26.8481 43.7217 26.6964 43.5354 26.6964H38.6907C38.5997 26.6964 38.5174 26.7311 38.4567 26.7917L38.4524 26.7961C38.4524 26.8004 38.4481 26.8004 38.4481 26.8004C38.3917 26.8611 38.3527 26.9434 38.3527 27.0344V34.5701C38.3527 34.6611 38.3874 34.7434 38.4481 34.8041L38.4524 34.8084L38.4567 34.8127C38.5174 34.8691 38.5997 34.9081 38.6907 34.9081H43.5354C43.7217 34.9081 43.8734 34.7564 43.8734 34.5701V33.3567C43.8734 33.1704 43.7217 33.0187 43.5354 33.0187H40.2377V31.7447H43.5354C43.7217 31.7447 43.8734 31.5931 43.8734 31.4067V30.1934C43.8734 30.0071 43.7217 29.8554 43.5354 29.8554H40.2377V28.5814H43.5354V28.5857Z");
    			attr_dev(path6, "fill", "#00B900");
    			add_location(path6, file$8, 41, 6, 4147);
    			attr_dev(svg1, "width", "40");
    			attr_dev(svg1, "height", "40");
    			attr_dev(svg1, "viewBox", "0 0 64 64");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file$8, 20, 4, 907);
    			attr_dev(a1, "href", a1_href_value = `https://lineit.line.me/share/ui?url=${/*shareUrl*/ ctx[0]}`);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "class", "px-4 hover-opacity");
    			add_location(a1, file$8, 19, 2, 799);
    			attr_dev(circle1, "cx", "32");
    			attr_dev(circle1, "cy", "32");
    			attr_dev(circle1, "r", "26");
    			attr_dev(circle1, "fill", "#1DA1F2");
    			add_location(circle1, file$8, 49, 6, 5119);
    			attr_dev(path7, "fill-rule", "evenodd");
    			attr_dev(path7, "clip-rule", "evenodd");
    			attr_dev(path7, "d", "M48 22.0782C46.8235 22.6008 45.5575 22.9528 44.2296 23.1117C45.5852 22.299 46.6262 21.0127 47.1158 19.48C45.8487 20.233 44.4418 20.778 42.9475 21.0735C41.7498 19.7978 40.0421 19 38.1553 19C34.53 19 31.5904 21.9395 31.5904 25.5649C31.5904 26.079 31.6491 26.5803 31.7611 27.0613C26.3044 26.7883 21.4674 24.1741 18.2292 20.2021C17.6639 21.1716 17.3407 22.299 17.3407 23.5021C17.3407 25.7793 18.498 27.7888 20.261 28.9663C19.1838 28.9321 18.1727 28.6367 17.2863 28.145V28.2271C17.2863 31.4088 19.5507 34.0614 22.5521 34.6662C22.0017 34.8155 21.4215 34.8965 20.8231 34.8965C20.3997 34.8965 19.988 34.8549 19.587 34.7781C20.4221 37.386 22.8475 39.2845 25.7199 39.3379C23.4736 41.0977 20.6429 42.1483 17.5668 42.1483C17.0357 42.1483 16.513 42.1174 16 42.0555C18.9054 43.9178 22.3558 45.0057 26.0633 45.0057C38.1383 45.0057 44.7415 35.0021 44.7415 26.3275C44.7415 26.0427 44.7362 25.759 44.7224 25.4785C46.0065 24.5506 47.1201 23.3944 48 22.0782Z");
    			attr_dev(path7, "fill", "white");
    			add_location(path7, file$8, 50, 6, 5174);
    			attr_dev(svg2, "width", "40");
    			attr_dev(svg2, "height", "40");
    			attr_dev(svg2, "viewBox", "0 0 64 64");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg2, file$8, 48, 4, 5017);
    			attr_dev(a2, "href", a2_href_value = `https://twitter.com/share?url=${/*shareUrl*/ ctx[0]}`);
    			attr_dev(a2, "target", "_blank");
    			attr_dev(a2, "class", "px-4 hover-opacity");
    			add_location(a2, file$8, 47, 2, 4915);
    			attr_dev(div, "class", "flex justify-center my-3");
    			add_location(div, file$8, 7, 0, 60);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a0);
    			append_dev(a0, svg0);
    			append_dev(svg0, circle0);
    			append_dev(svg0, path0);
    			append_dev(div, t0);
    			append_dev(div, a1);
    			append_dev(a1, svg1);
    			append_dev(svg1, path1);
    			append_dev(svg1, path2);
    			append_dev(svg1, path3);
    			append_dev(svg1, path4);
    			append_dev(svg1, path5);
    			append_dev(svg1, path6);
    			append_dev(div, t1);
    			append_dev(div, a2);
    			append_dev(a2, svg2);
    			append_dev(svg2, circle1);
    			append_dev(svg2, path7);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*shareUrl*/ 1 && a0_href_value !== (a0_href_value = `https://www.facebook.com/sharer/sharer.php?u=${/*shareUrl*/ ctx[0]}`)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*shareUrl*/ 1 && a1_href_value !== (a1_href_value = `https://lineit.line.me/share/ui?url=${/*shareUrl*/ ctx[0]}`)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*shareUrl*/ 1 && a2_href_value !== (a2_href_value = `https://twitter.com/share?url=${/*shareUrl*/ ctx[0]}`)) {
    				attr_dev(a2, "href", a2_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SocialBoxInArticle", slots, []);
    	let { shareUrl } = $$props;
    	const writable_props = ["shareUrl"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SocialBoxInArticle> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("shareUrl" in $$props) $$invalidate(0, shareUrl = $$props.shareUrl);
    	};

    	$$self.$capture_state = () => ({ shareUrl });

    	$$self.$inject_state = $$props => {
    		if ("shareUrl" in $$props) $$invalidate(0, shareUrl = $$props.shareUrl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [shareUrl];
    }

    class SocialBoxInArticle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { shareUrl: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SocialBoxInArticle",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*shareUrl*/ ctx[0] === undefined && !("shareUrl" in props)) {
    			console.warn("<SocialBoxInArticle> was created without expected prop 'shareUrl'");
    		}
    	}

    	get shareUrl() {
    		throw new Error("<SocialBoxInArticle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shareUrl(value) {
    		throw new Error("<SocialBoxInArticle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const ThemeStore = readable({
      "1": ['#272727', '#6C6C6C', '#CACACA'],
      "2": ['#A52222', '#E51F1F', '#FFC736'],
      "3": ['#2274A5', '#1DB1BA', '#FF9A51'],
      "4": ['#1D4ABA', '#3699FF', '#FFC736']
    });

    /* src/shared/AnswerMessage.svelte generated by Svelte v3.29.4 */

    const file$9 = "src/shared/AnswerMessage.svelte";

    // (48:0) {:else}
    function create_else_block$2(ctx) {
    	let div;
    	let span0;
    	let svg0;
    	let circle0;
    	let path0;
    	let t0;
    	let span1;
    	let t2;
    	let span2;
    	let svg1;
    	let circle1;
    	let path1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			svg0 = svg_element("svg");
    			circle0 = svg_element("circle");
    			path0 = svg_element("path");
    			t0 = space();
    			span1 = element("span");
    			span1.textContent = "答錯了";
    			t2 = space();
    			span2 = element("span");
    			svg1 = svg_element("svg");
    			circle1 = svg_element("circle");
    			path1 = svg_element("path");
    			attr_dev(circle0, "cx", "11");
    			attr_dev(circle0, "cy", "11");
    			attr_dev(circle0, "r", "11");
    			set_style(circle0, "fill", "#dd4b4b");
    			add_location(circle0, file$9, 50, 93, 2007);
    			attr_dev(path0, "d", "M6,7.2,7.2,6A.61.61,0,0,1,8,6l3,3,3-3a.61.61,0,0,1,.8,0L16,7.2A.61.61,0,0,1,16,8l-3,3,3,3a.61.61,0,0,1,0,.8L14.8,16a.61.61,0,0,1-.8,0l-3-3L8,16a.61.61,0,0,1-.8,0L6,14.8A.61.61,0,0,1,6,14l3-3L6,8A.61.61,0,0,1,6,7.2Z");
    			set_style(path0, "fill", "#fff");
    			add_location(path0, file$9, 56, 8, 2118);
    			attr_dev(svg0, "width", "22px");
    			attr_dev(svg0, "height", "22px");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "viewBox", "0 0 22 22");
    			add_location(svg0, file$9, 50, 6, 1920);
    			attr_dev(span0, "class", "mx-3 svelte-1hzutpa");
    			add_location(span0, file$9, 49, 4, 1894);
    			attr_dev(span1, "class", "text-lg sm:text-2xl font-black response svelte-1hzutpa");
    			add_location(span1, file$9, 61, 4, 2414);
    			attr_dev(circle1, "cx", "11");
    			attr_dev(circle1, "cy", "11");
    			attr_dev(circle1, "r", "11");
    			set_style(circle1, "fill", "#dd4b4b");
    			add_location(circle1, file$9, 63, 93, 2596);
    			attr_dev(path1, "d", "M6,7.2,7.2,6A.61.61,0,0,1,8,6l3,3,3-3a.61.61,0,0,1,.8,0L16,7.2A.61.61,0,0,1,16,8l-3,3,3,3a.61.61,0,0,1,0,.8L14.8,16a.61.61,0,0,1-.8,0l-3-3L8,16a.61.61,0,0,1-.8,0L6,14.8A.61.61,0,0,1,6,14l3-3L6,8A.61.61,0,0,1,6,7.2Z");
    			set_style(path1, "fill", "#fff");
    			add_location(path1, file$9, 69, 8, 2707);
    			attr_dev(svg1, "width", "22px");
    			attr_dev(svg1, "height", "22px");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "viewBox", "0 0 22 22");
    			add_location(svg1, file$9, 63, 6, 2509);
    			attr_dev(span2, "class", "mx-3 svelte-1hzutpa");
    			add_location(span2, file$9, 62, 4, 2483);
    			attr_dev(div, "class", "flex justify-between items-center mx-3 sm:mx-auto mt-8 pb-2 width-desk svelte-1hzutpa");
    			add_location(div, file$9, 48, 2, 1805);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, svg0);
    			append_dev(svg0, circle0);
    			append_dev(svg0, path0);
    			append_dev(div, t0);
    			append_dev(div, span1);
    			append_dev(div, t2);
    			append_dev(div, span2);
    			append_dev(span2, svg1);
    			append_dev(svg1, circle1);
    			append_dev(svg1, path1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(48:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (24:0) {#if explainStatus === 'explain_correct'}
    function create_if_block$3(ctx) {
    	let div;
    	let span0;
    	let svg0;
    	let path0;
    	let path1;
    	let t0;
    	let span1;
    	let t2;
    	let span2;
    	let svg1;
    	let path2;
    	let path3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			t0 = space();
    			span1 = element("span");
    			span1.textContent = "答對了";
    			t2 = space();
    			span2 = element("span");
    			svg1 = svg_element("svg");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			attr_dev(path0, "d", "M20.7,5.8A10.87,10.87,0,0,0,18,2.5,10.7,10.7,0,0,0,11,0,11,11,0,0,0,0,11a10.7,10.7,0,0,0,2.5,7,11.8,11.8,0,0,0,3.2,2.7A11.86,11.86,0,0,0,11,22a11.12,11.12,0,0,0,5.2-1.3,11,11,0,0,0,4.4-4.4,11.65,11.65,0,0,0,.1-10.5Z");
    			set_style(path0, "fill", "#1ad71a");
    			add_location(path0, file$9, 26, 93, 584);
    			attr_dev(path1, "d", "M9.7,16.8l8.2-8.2a.67.67,0,0,0,0-1l-1-1a.67.67,0,0,0-1,0L9.2,13.3,6.1,10.2a.67.67,0,0,0-1,0l-1,1a.67.67,0,0,0,0,1l4.6,4.6A.67.67,0,0,0,9.7,16.8Z");
    			set_style(path1, "fill", "#fff");
    			add_location(path1, file$9, 30, 8, 870);
    			attr_dev(svg0, "width", "22px");
    			attr_dev(svg0, "height", "22px");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "viewBox", "0 0 22 22");
    			add_location(svg0, file$9, 26, 6, 497);
    			attr_dev(span0, "class", "mx-3 svelte-1hzutpa");
    			add_location(span0, file$9, 25, 4, 471);
    			attr_dev(span1, "class", "text-lg sm:text-2xl font-black response svelte-1hzutpa");
    			add_location(span1, file$9, 35, 4, 1096);
    			attr_dev(path2, "d", "M20.7,5.8A10.87,10.87,0,0,0,18,2.5,10.7,10.7,0,0,0,11,0,11,11,0,0,0,0,11a10.7,10.7,0,0,0,2.5,7,11.8,11.8,0,0,0,3.2,2.7A11.86,11.86,0,0,0,11,22a11.12,11.12,0,0,0,5.2-1.3,11,11,0,0,0,4.4-4.4,11.65,11.65,0,0,0,.1-10.5Z");
    			set_style(path2, "fill", "#1ad71a");
    			add_location(path2, file$9, 37, 93, 1278);
    			attr_dev(path3, "d", "M9.7,16.8l8.2-8.2a.67.67,0,0,0,0-1l-1-1a.67.67,0,0,0-1,0L9.2,13.3,6.1,10.2a.67.67,0,0,0-1,0l-1,1a.67.67,0,0,0,0,1l4.6,4.6A.67.67,0,0,0,9.7,16.8Z");
    			set_style(path3, "fill", "#fff");
    			add_location(path3, file$9, 41, 8, 1564);
    			attr_dev(svg1, "width", "22px");
    			attr_dev(svg1, "height", "22px");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "viewBox", "0 0 22 22");
    			add_location(svg1, file$9, 37, 6, 1191);
    			attr_dev(span2, "class", "mx-3 svelte-1hzutpa");
    			add_location(span2, file$9, 36, 4, 1165);
    			attr_dev(div, "class", "flex justify-between items-center mx-3 sm:mx-auto mt-12 pb-2  width-desk svelte-1hzutpa");
    			add_location(div, file$9, 24, 2, 380);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, svg0);
    			append_dev(svg0, path0);
    			append_dev(svg0, path1);
    			append_dev(div, t0);
    			append_dev(div, span1);
    			append_dev(div, t2);
    			append_dev(div, span2);
    			append_dev(span2, svg1);
    			append_dev(svg1, path2);
    			append_dev(svg1, path3);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(24:0) {#if explainStatus === 'explain_correct'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*explainStatus*/ ctx[0] === "explain_correct") return create_if_block$3;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AnswerMessage", slots, []);
    	let { explainStatus } = $$props;
    	const writable_props = ["explainStatus"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AnswerMessage> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("explainStatus" in $$props) $$invalidate(0, explainStatus = $$props.explainStatus);
    	};

    	$$self.$capture_state = () => ({ explainStatus });

    	$$self.$inject_state = $$props => {
    		if ("explainStatus" in $$props) $$invalidate(0, explainStatus = $$props.explainStatus);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [explainStatus];
    }

    class AnswerMessage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { explainStatus: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AnswerMessage",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*explainStatus*/ ctx[0] === undefined && !("explainStatus" in props)) {
    			console.warn("<AnswerMessage> was created without expected prop 'explainStatus'");
    		}
    	}

    	get explainStatus() {
    		throw new Error("<AnswerMessage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set explainStatus(value) {
    		throw new Error("<AnswerMessage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/shared/QATemplate.svelte generated by Svelte v3.29.4 */
    const file$a = "src/shared/QATemplate.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i].discription;
    	child_ctx[12] = list[i].correct;
    	child_ctx[13] = list[i].i;
    	return child_ctx;
    }

    // (110:0) {#if $ContentDataStore}
    function create_if_block$4(ctx) {
    	let div6;
    	let div5;
    	let t0;
    	let div4;
    	let answerheader;
    	let t1;
    	let div2;
    	let div0;
    	let svg;
    	let path;
    	let t2;
    	let div1;
    	let t3_value = /*QASet*/ ctx[3].question + "";
    	let t3;
    	let t4;
    	let div3;
    	let t5;
    	let div6_class_value;
    	let current;
    	let if_block0 = /*userHasClickedAnswer*/ ctx[4] && !/*$isMobile*/ ctx[6] && create_if_block_4(ctx);

    	answerheader = new AnswerHeader({
    			props: {
    				questNumber: /*questNumber*/ ctx[0],
    				maxQuestion: /*maxQuestion*/ ctx[1]
    			},
    			$$inline: true
    		});

    	let each_value = /*QASet*/ ctx[3].answer;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	let if_block1 = /*userHasClickedAnswer*/ ctx[4] && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div5 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div4 = element("div");
    			create_component(answerheader.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			div0 = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t2 = space();
    			div1 = element("div");
    			t3 = text(t3_value);
    			t4 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(path, "d", "M7.856 0.0399995C9.088 0.0399995 10.184 0.256 11.144 0.688C12.104 1.12 12.912 1.704 13.568 2.44C14.224 3.176 14.72 4.032 15.056 5.008C15.408 5.984 15.584 7.008 15.584 8.08C15.584 9.104 15.432 10.096 15.128 11.056C14.824 12 14.368 12.848 13.76 13.6C13.168 14.336 12.432 14.944 11.552 15.424C10.672 15.904 9.656 16.176 8.504 16.24C9.32 16.256 10.04 16.352 10.664 16.528C11.288 16.72 11.872 16.92 12.416 17.128C12.976 17.352 13.528 17.552 14.072 17.728C14.616 17.904 15.2 17.992 15.824 17.992C16.048 17.992 16.312 17.96 16.616 17.896C16.936 17.848 17.272 17.72 17.624 17.512L17.696 17.56L18.032 18.232L18.008 18.328C17.64 18.792 17.192 19.184 16.664 19.504C16.136 19.824 15.544 19.984 14.888 19.984C14.344 19.984 13.784 19.856 13.208 19.6C12.648 19.36 12.056 19.088 11.432 18.784C10.808 18.496 10.16 18.224 9.488 17.968C8.816 17.728 8.112 17.608 7.376 17.608C6.752 17.608 6.144 17.712 5.552 17.92C4.976 18.128 4.552 18.352 4.28 18.592L4.208 18.568L3.944 17.632L3.968 17.56C4.32 17.32 4.792 17.056 5.384 16.768C5.976 16.48 6.616 16.312 7.304 16.264C6.12 16.248 5.08 16.024 4.184 15.592C3.288 15.16 2.536 14.584 1.928 13.864C1.336 13.128 0.888 12.28 0.584 11.32C0.28 10.36 0.128 9.344 0.128 8.272C0.128 7.136 0.304 6.072 0.656 5.08C1.008 4.072 1.512 3.2 2.168 2.464C2.824 1.712 3.632 1.12 4.592 0.688C5.552 0.256 6.64 0.0399995 7.856 0.0399995ZM7.832 14.272C8.616 14.272 9.312 14.112 9.92 13.792C10.544 13.456 11.064 13.016 11.48 12.472C11.896 11.912 12.216 11.264 12.44 10.528C12.664 9.776 12.776 8.976 12.776 8.128C12.776 7.264 12.656 6.464 12.416 5.728C12.192 4.976 11.856 4.328 11.408 3.784C10.976 3.24 10.448 2.816 9.824 2.512C9.2 2.192 8.496 2.032 7.712 2.032C6.944 2.032 6.264 2.184 5.672 2.488C5.08 2.792 4.584 3.216 4.184 3.76C3.784 4.304 3.48 4.952 3.272 5.704C3.064 6.44 2.96 7.24 2.96 8.104C2.96 9.048 3.08 9.904 3.32 10.672C3.56 11.424 3.896 12.072 4.328 12.616C4.76 13.144 5.272 13.552 5.864 13.84C6.456 14.128 7.112 14.272 7.832 14.272Z");
    			attr_dev(path, "fill", "black");
    			add_location(path, file$a, 128, 14, 8745);
    			attr_dev(svg, "width", "106");
    			attr_dev(svg, "height", "139");
    			attr_dev(svg, "viewBox", "0 0 19 20");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$a, 127, 12, 8633);
    			attr_dev(div0, "class", "hidden sm:block");
    			add_location(div0, file$a, 126, 10, 8591);
    			attr_dev(div1, "class", "noselect ml-4 svelte-1333tma");
    			add_location(div1, file$a, 134, 10, 10810);
    			attr_dev(div2, "class", "flex items-center QA-question-font py-2 mx-3 sm:mx-10 mt-2");
    			add_location(div2, file$a, 125, 8, 8508);
    			attr_dev(div3, "class", "mt-8");
    			add_location(div3, file$a, 136, 8, 10883);
    			attr_dev(div4, "class", "w-full");
    			add_location(div4, file$a, 123, 6, 8426);
    			attr_dev(div5, "class", "QA-wrapper relative h-full rounded-2xl border-4 border-black bg-white mx-auto pb-0 sm:pb-4");
    			add_location(div5, file$a, 111, 4, 3530);
    			attr_dev(div6, "class", div6_class_value = "h-auto-sp sm:h-" + (/*userHasClickedAnswer*/ ctx[4] ? "auto" : "full") + "-sp py-6 sm:pb-24 mx-3");
    			add_location(div6, file$a, 110, 2, 3434);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div5);
    			if (if_block0) if_block0.m(div5, null);
    			append_dev(div5, t0);
    			append_dev(div5, div4);
    			mount_component(answerheader, div4, null);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			append_dev(div2, div0);
    			append_dev(div0, svg);
    			append_dev(svg, path);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, t3);
    			append_dev(div4, t4);
    			append_dev(div4, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			append_dev(div4, t5);
    			if (if_block1) if_block1.m(div4, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*userHasClickedAnswer*/ ctx[4] && !/*$isMobile*/ ctx[6]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(div5, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			const answerheader_changes = {};
    			if (dirty & /*questNumber*/ 1) answerheader_changes.questNumber = /*questNumber*/ ctx[0];
    			if (dirty & /*maxQuestion*/ 2) answerheader_changes.maxQuestion = /*maxQuestion*/ ctx[1];
    			answerheader.$set(answerheader_changes);
    			if ((!current || dirty & /*QASet*/ 8) && t3_value !== (t3_value = /*QASet*/ ctx[3].question + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*answerType, QASet, checkAnswer*/ 392) {
    				each_value = /*QASet*/ ctx[3].answer;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div3, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*userHasClickedAnswer*/ ctx[4]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*userHasClickedAnswer*/ 16) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div4, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*userHasClickedAnswer*/ 16 && div6_class_value !== (div6_class_value = "h-auto-sp sm:h-" + (/*userHasClickedAnswer*/ ctx[4] ? "auto" : "full") + "-sp py-6 sm:pb-24 mx-3")) {
    				attr_dev(div6, "class", div6_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(answerheader.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(answerheader.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			if (if_block0) if_block0.d();
    			destroy_component(answerheader);
    			destroy_each(each_blocks, detaching);
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(110:0) {#if $ContentDataStore}",
    		ctx
    	});

    	return block;
    }

    // (113:6) {#if userHasClickedAnswer && !$isMobile}
    function create_if_block_4(ctx) {
    	let div;
    	let svg;
    	let path0;
    	let path1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", "M11.804 4.468V3.892L1.208 3.892V4.468L5.972 4.468L5.972 13.864L6.572 13.864L6.572 7.192C8.048 7.936 9.776 8.992 10.7 9.676L11.072 9.172C10.1 8.464 8.192 7.348 6.692 6.628L6.572 6.772V4.468L11.804 4.468ZM3.464 23.672C3.008 23.312 2.108 22.784 1.412 22.436L1.076 22.844C1.784 23.216 2.672 23.756 3.128 24.128L3.464 23.672ZM1.976 29.672C2.564 28.604 3.284 27.068 3.812 25.832L3.368 25.496C2.804 26.816 2.012 28.4 1.448 29.324L1.976 29.672ZM1.664 19.556C2.444 20 3.404 20.672 3.884 21.116L4.244 20.66C3.776 20.228 2.792 19.604 2.024 19.172L1.664 19.556ZM10.64 24.224H5.288L5.288 26.312C5.288 27.308 5.192 28.628 4.388 29.612C4.508 29.684 4.724 29.864 4.82 29.972C5.684 28.916 5.84 27.416 5.84 26.312L5.84 24.716H10.088V26.888C8.576 27.176 7.076 27.488 6.044 27.668L6.26 28.184C7.34 27.968 8.72 27.668 10.088 27.356L10.088 29.204C10.088 29.348 10.04 29.396 9.872 29.408C9.704 29.42 9.128 29.42 8.432 29.396C8.516 29.552 8.588 29.744 8.612 29.9C9.488 29.9 10.004 29.888 10.292 29.792C10.556 29.708 10.64 29.552 10.64 29.192L10.64 24.224ZM6.428 25.928C7.448 26.06 8.732 26.384 9.44 26.66L9.596 26.18C8.912 25.892 7.616 25.616 6.596 25.508L6.428 25.928ZM5.948 19.964H10.028V20.924H7.652V22.724H5.948V19.964ZM10.028 22.724H8.168V21.38H10.028V22.724ZM10.58 22.724V19.472H5.408V22.724H4.076V24.608H4.628V23.216H11.312V24.608H11.864V22.724H10.58ZM2.54 58.636C2.564 58.288 2.576 57.94 2.576 57.64L2.576 57.184H5.624L5.624 58.636H2.54ZM5.624 55.24V56.692H2.576V55.24H5.624ZM6.176 54.724H2.036L2.036 57.64C2.036 58.864 1.94 60.424 1.124 61.576C1.244 61.636 1.472 61.828 1.556 61.924C2.132 61.144 2.384 60.112 2.492 59.128H5.624V61.06C5.624 61.24 5.576 61.288 5.384 61.288C5.228 61.3 4.64 61.3 3.944 61.276C4.028 61.444 4.1 61.672 4.148 61.816C5 61.816 5.516 61.816 5.804 61.708C6.092 61.612 6.176 61.444 6.176 61.072L6.176 54.724ZM10.328 61.036C10.328 61.216 10.268 61.264 10.076 61.276C9.884 61.288 9.212 61.288 8.42 61.276C8.504 61.432 8.612 61.672 8.648 61.84C9.584 61.84 10.148 61.828 10.484 61.732C10.784 61.624 10.892 61.456 10.892 61.024L10.892 54.448H10.328L10.328 61.036ZM8.444 54.844H7.904L7.904 59.74H8.444L8.444 54.844ZM3.2 51.196C3.668 51.736 4.184 52.492 4.4 52.972L4.952 52.744C4.712 52.264 4.184 51.52 3.704 50.992L3.2 51.196ZM8.78 52.972C9.164 52.432 9.596 51.748 9.944 51.16L9.344 50.932C9.068 51.532 8.564 52.396 8.144 52.972H1.208L1.208 53.512H11.78V52.972H8.78ZM8.72 68.948C8.528 68.432 8.048 67.58 7.604 66.956L7.088 67.172C7.52 67.808 7.988 68.66 8.168 69.2L8.72 68.948ZM3.644 67.04C3.104 67.916 2.06 68.936 1.112 69.572C1.208 69.668 1.364 69.896 1.436 70.028C2.468 69.32 3.56 68.24 4.196 67.244L3.644 67.04ZM3.848 69.716C3.152 71 2.036 72.26 0.944 73.088C1.064 73.196 1.256 73.472 1.316 73.592C1.82 73.184 2.324 72.68 2.792 72.14L2.792 77.876H3.368L3.368 71.432C3.74 70.94 4.088 70.424 4.364 69.908L3.848 69.716ZM8.396 76.928L8.396 73.46H11.24V72.908H8.396V69.872H11.624V69.32H4.628V69.872H7.808V72.908H5.06V73.46H7.808L7.808 76.928H4.292V77.48H11.936V76.928H8.396ZM11.804 84.468V83.892H1.208V84.468H5.972L5.972 93.864H6.572L6.572 87.192C8.048 87.936 9.776 88.992 10.7 89.676L11.072 89.172C10.1 88.464 8.192 87.348 6.692 86.628L6.572 86.772L6.572 84.468H11.804ZM1.088 103.996L1.088 104.632H11.96V103.996H1.088ZM10.712 118.784H7.448L7.448 117.704H10.712V118.784ZM10.712 120.356H7.448V119.264H10.712V120.356ZM10.712 121.928H7.448V120.812H10.712V121.928ZM6.908 117.224L6.908 122.408H11.264V117.224H8.912C9.044 116.9 9.164 116.504 9.284 116.132H11.816L11.816 115.64H6.404V116.132H8.72C8.636 116.48 8.516 116.888 8.408 117.224H6.908ZM9.584 122.96C10.268 123.404 11.096 124.088 11.492 124.58L11.924 124.268C11.504 123.812 10.688 123.128 9.98 122.708L9.584 122.96ZM7.928 122.696C7.436 123.284 6.632 123.848 5.864 124.22C5.984 124.304 6.2 124.52 6.26 124.616C7.028 124.184 7.904 123.5 8.432 122.852L7.928 122.696ZM5.132 117.104H2.42V116H5.132V117.104ZM5.132 118.688H2.42L2.42 117.56H5.132V118.688ZM5.684 115.532H1.892L1.892 119.156H5.684L5.684 115.532ZM8.3 125.072C6.608 125.072 5.168 124.964 4.088 124.436V122.624H6.284V122.132H4.088V120.656H6.488V120.164H1.088V120.656H3.56L3.56 124.124C3.128 123.8 2.768 123.392 2.492 122.852C2.552 122.372 2.6 121.892 2.624 121.424H2.084C2.036 122.912 1.784 124.64 1.028 125.528C1.172 125.612 1.352 125.78 1.436 125.888C1.916 125.312 2.216 124.448 2.384 123.512C3.524 125.276 5.504 125.6 8.3 125.6H11.756C11.792 125.432 11.9 125.192 11.996 125.072H8.3Z");
    			attr_dev(path0, "fill", "#CACACA");
    			add_location(path0, file$a, 115, 12, 3862);
    			attr_dev(path1, "d", "M6 134L6 187");
    			attr_dev(path1, "stroke", "#E1E1E1");
    			add_location(path1, file$a, 119, 12, 8333);
    			attr_dev(svg, "width", "100%");
    			attr_dev(svg, "viewBox", "0 0 12 187");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$a, 114, 10, 3763);
    			attr_dev(div, "class", "absolute w-3.5");
    			set_style(div, "bottom", "40px");
    			set_style(div, "right", "40px");
    			add_location(div, file$a, 113, 8, 3690);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(113:6) {#if userHasClickedAnswer && !$isMobile}",
    		ctx
    	});

    	return block;
    }

    // (138:10) {#each QASet.answer as { discription, correct, i }}
    function create_each_block$3(ctx) {
    	let div;
    	let t0_value = /*discription*/ ctx[11] + "";
    	let t0;
    	let t1;
    	let div_class_value;
    	let div_data_correct_value;
    	let div_answer_index_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", div_class_value = "" + (/*answerType*/ ctx[7] + " rounded-2xl py-3 px-3 mb-3 mx-3 sm:mx-auto cursor-pointer answer-hover width-desk" + " svelte-1333tma"));
    			attr_dev(div, "data-correct", div_data_correct_value = /*correct*/ ctx[12]);
    			attr_dev(div, "answer-index", div_answer_index_value = /*i*/ ctx[13]);
    			add_location(div, file$a, 138, 12, 10976);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*checkAnswer*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*QASet*/ 8 && t0_value !== (t0_value = /*discription*/ ctx[11] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*QASet*/ 8 && div_data_correct_value !== (div_data_correct_value = /*correct*/ ctx[12])) {
    				attr_dev(div, "data-correct", div_data_correct_value);
    			}

    			if (dirty & /*QASet*/ 8 && div_answer_index_value !== (div_answer_index_value = /*i*/ ctx[13])) {
    				attr_dev(div, "answer-index", div_answer_index_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(138:10) {#each QASet.answer as { discription, correct, i }}",
    		ctx
    	});

    	return block;
    }

    // (149:8) {#if userHasClickedAnswer}
    function create_if_block_1$2(ctx) {
    	let answermessage;
    	let t0;
    	let div;
    	let html_tag;
    	let raw_value = /*QASet*/ ctx[3][/*explainStatus*/ ctx[2]] + "";
    	let t1;
    	let t2;
    	let if_block1_anchor;
    	let current;

    	answermessage = new AnswerMessage({
    			props: { explainStatus: /*explainStatus*/ ctx[2] },
    			$$inline: true
    		});

    	let if_block0 = /*QASet*/ ctx[3].explain_source && create_if_block_3$1(ctx);
    	let if_block1 = /*$isMobile*/ ctx[6] && create_if_block_2$2(ctx);

    	const block = {
    		c: function create() {
    			create_component(answermessage.$$.fragment);
    			t0 = space();
    			div = element("div");
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			html_tag = new HtmlTag(t1);
    			attr_dev(div, "class", "noselect text-left text-base sm:border-none pt-6 pb-10 sm:pb-6 mx-3 sm:mx-auto width-desk svelte-1333tma");
    			add_location(div, file$a, 150, 10, 11386);
    		},
    		m: function mount(target, anchor) {
    			mount_component(answermessage, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			html_tag.m(raw_value, div);
    			append_dev(div, t1);
    			if (if_block0) if_block0.m(div, null);
    			insert_dev(target, t2, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const answermessage_changes = {};
    			if (dirty & /*explainStatus*/ 4) answermessage_changes.explainStatus = /*explainStatus*/ ctx[2];
    			answermessage.$set(answermessage_changes);
    			if ((!current || dirty & /*QASet, explainStatus*/ 12) && raw_value !== (raw_value = /*QASet*/ ctx[3][/*explainStatus*/ ctx[2]] + "")) html_tag.p(raw_value);

    			if (/*QASet*/ ctx[3].explain_source) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3$1(ctx);
    					if_block0.c();
    					if_block0.m(div, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*$isMobile*/ ctx[6]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2$2(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(answermessage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(answermessage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(answermessage, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t2);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(149:8) {#if userHasClickedAnswer}",
    		ctx
    	});

    	return block;
    }

    // (153:12) {#if QASet.explain_source}
    function create_if_block_3$1(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*QASet*/ ctx[3].explain_source + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("資料來源：");
    			t1 = text(t1_value);
    			attr_dev(p, "class", "pt-3 sm:pt-5 text-sm");
    			set_style(p, "color", "#515151");
    			add_location(p, file$a, 153, 14, 11584);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*QASet*/ 8 && t1_value !== (t1_value = /*QASet*/ ctx[3].explain_source + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(153:12) {#if QASet.explain_source}",
    		ctx
    	});

    	return block;
    }

    // (158:10) {#if $isMobile}
    function create_if_block_2$2(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let svg0;
    	let path0;
    	let t0;
    	let div1;

    	let t1_value = (/*questNumber*/ ctx[0] == /*maxQuestion*/ ctx[1]
    	? "答題結束，下滑看結果"
    	: "下滑，前往下一題") + "";

    	let t1;
    	let t2;
    	let div2;
    	let svg1;
    	let path1;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t0 = space();
    			div1 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			div2 = element("div");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", "M10.308 16.7923C9.89735 16.3826 9.89735 15.7179 10.308 15.3073C10.7176 14.8976 11.3823 14.8976 11.793 15.3073L16.0501 19.5653L20.3072 15.3073C20.7178 14.8976 21.3825 14.8976 21.7922 15.3073C22.2028 15.7179 22.2028 16.3826 21.7922 16.7923L16.7925 21.7929C16.3828 22.2026 15.7172 22.2026 15.3075 21.7929L10.308 16.7923ZM10.308 10.7923C9.89735 10.3826 9.89735 9.71788 10.308 9.30726C10.7176 8.89758 11.3823 8.89758 11.793 9.30726L16.0501 13.5653L20.3072 9.30726C20.7178 8.89758 21.3825 8.89758 21.7922 9.30726C22.2028 9.71788 22.2028 10.3826 21.7922 10.7923L16.7925 15.7929C16.3828 16.2026 15.7172 16.2026 15.3075 15.7929L10.308 10.7923Z");
    			attr_dev(path0, "fill", "white");
    			add_location(path0, file$a, 164, 20, 12091);
    			attr_dev(svg0, "width", "32");
    			attr_dev(svg0, "height", "32");
    			attr_dev(svg0, "viewBox", "0 0 32 32");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg0, file$a, 163, 18, 11975);
    			add_location(div0, file$a, 162, 16, 11951);
    			attr_dev(div1, "class", "inline-block");
    			add_location(div1, file$a, 170, 16, 12880);
    			attr_dev(path1, "d", "M10.308 16.7923C9.89735 16.3826 9.89735 15.7179 10.308 15.3073C10.7176 14.8976 11.3823 14.8976 11.793 15.3073L16.0501 19.5653L20.3072 15.3073C20.7178 14.8976 21.3825 14.8976 21.7922 15.3073C22.2028 15.7179 22.2028 16.3826 21.7922 16.7923L16.7925 21.7929C16.3828 22.2026 15.7172 22.2026 15.3075 21.7929L10.308 16.7923ZM10.308 10.7923C9.89735 10.3826 9.89735 9.71788 10.308 9.30726C10.7176 8.89758 11.3823 8.89758 11.793 9.30726L16.0501 13.5653L20.3072 9.30726C20.7178 8.89758 21.3825 8.89758 21.7922 9.30726C22.2028 9.71788 22.2028 10.3826 21.7922 10.7923L16.7925 15.7929C16.3828 16.2026 15.7172 16.2026 15.3075 15.7929L10.308 10.7923Z");
    			attr_dev(path1, "fill", "white");
    			add_location(path1, file$a, 175, 20, 13161);
    			attr_dev(svg1, "width", "32");
    			attr_dev(svg1, "height", "32");
    			attr_dev(svg1, "viewBox", "0 0 32 32");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file$a, 174, 18, 13045);
    			add_location(div2, file$a, 173, 16, 13021);
    			attr_dev(div3, "class", "text-white text-center");
    			add_location(div3, file$a, 161, 14, 11898);
    			attr_dev(div4, "class", "absolte flex justify-between items-center  bottom-0 w-full rounded-b-lg text-center bg-black py-4");
    			add_location(div4, file$a, 158, 12, 11745);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, svg1);
    			append_dev(svg1, path1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*questNumber, maxQuestion*/ 3 && t1_value !== (t1_value = (/*questNumber*/ ctx[0] == /*maxQuestion*/ ctx[1]
    			? "答題結束，下滑看結果"
    			: "下滑，前往下一題") + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(158:10) {#if $isMobile}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$ContentDataStore*/ ctx[5] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$ContentDataStore*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$ContentDataStore*/ 32) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $ContentDataStore;
    	let $RightAnswerCalc;
    	let $isMobile;
    	validate_store(ContentDataStore, "ContentDataStore");
    	component_subscribe($$self, ContentDataStore, $$value => $$invalidate(5, $ContentDataStore = $$value));
    	validate_store(RightAnswerCalc, "RightAnswerCalc");
    	component_subscribe($$self, RightAnswerCalc, $$value => $$invalidate(10, $RightAnswerCalc = $$value));
    	validate_store(isMobile, "isMobile");
    	component_subscribe($$self, isMobile, $$value => $$invalidate(6, $isMobile = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("QATemplate", slots, []);
    	let { questNumber } = $$props;
    	let { maxQuestion } = $$props;
    	let explainStatus, QASet, Answers;
    	let answerType = "answer-normal";
    	let userHasClickedAnswer = false;

    	function checkAnswer(e) {
    		const selectedAnswer = e.target.dataset.correct;
    		$$invalidate(9, Answers = e.target.parentElement.children);

    		// if user's clicked answer is correct:
    		// 1. apply correct style to each answer
    		// 2. show corresponded explain text to user
    		// 3. add accumulated answer number to QA info
    		if (selectedAnswer == 1) {
    			$$invalidate(4, userHasClickedAnswer = true);
    			$$invalidate(2, explainStatus = "explain_correct");
    			e.target.classList.add("answer-correct");
    			RightAnswerCalc.update(() => $RightAnswerCalc + 1);

    			// update progress array
    			QAProgressArray.update(currentData => {
    				let tmpArray = currentData;
    				tmpArray[questNumber - 1].status = "correct";
    				return tmpArray;
    			});
    		} else {
    			e.target.classList.add("answer-wrong");
    			$$invalidate(4, userHasClickedAnswer = true);
    			$$invalidate(2, explainStatus = "explain_wrong");

    			// update progress array
    			QAProgressArray.update(currentData => {
    				let tmpArray = currentData;
    				tmpArray[questNumber - 1].status = "wrong";
    				return tmpArray;
    			});
    		}

    		// handle each answer style
    		for (let i = 0; i < Answers.length; i++) {
    			if (Answers[i].dataset.correct == 1) {
    				Answers[i].classList.remove("answer-hover");
    				Answers[i].classList.remove("answer-normal");
    				Answers[i].classList.add("answer-correct");
    			} else {
    				$$invalidate(9, Answers[i].style.opacity = 0.3, Answers);
    				Answers[i].classList.remove("answer-hover");
    			}
    		}

    		// unlock next question card
    		document.getElementById("qa-no-" + (questNumber + 1)).style.display = "block";

    		QAFinalPage.update(() => questNumber + 1);

    		// change section height if expain text is too long
    		setTimeout(
    			() => {
    				changeCardSectionHeight(questNumber);
    				QASectionsHeight.update(() => getAllSectionsHeight());
    			},
    			200
    		);

    		// update question progress
    		QAProgress.update(() => questNumber + 1);
    	}

    	const writable_props = ["questNumber", "maxQuestion"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<QATemplate> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("questNumber" in $$props) $$invalidate(0, questNumber = $$props.questNumber);
    		if ("maxQuestion" in $$props) $$invalidate(1, maxQuestion = $$props.maxQuestion);
    	};

    	$$self.$capture_state = () => ({
    		QAFinalPage,
    		QASectionsHeight,
    		QAProgress,
    		RightAnswerCalc,
    		QAProgressArray,
    		changeCardSectionHeight,
    		getAllSectionsHeight,
    		AnswerMessage,
    		AnswerHeader,
    		ContentDataStore,
    		isMobile,
    		questNumber,
    		maxQuestion,
    		explainStatus,
    		QASet,
    		Answers,
    		answerType,
    		userHasClickedAnswer,
    		checkAnswer,
    		$ContentDataStore,
    		$RightAnswerCalc,
    		$isMobile
    	});

    	$$self.$inject_state = $$props => {
    		if ("questNumber" in $$props) $$invalidate(0, questNumber = $$props.questNumber);
    		if ("maxQuestion" in $$props) $$invalidate(1, maxQuestion = $$props.maxQuestion);
    		if ("explainStatus" in $$props) $$invalidate(2, explainStatus = $$props.explainStatus);
    		if ("QASet" in $$props) $$invalidate(3, QASet = $$props.QASet);
    		if ("Answers" in $$props) $$invalidate(9, Answers = $$props.Answers);
    		if ("answerType" in $$props) $$invalidate(7, answerType = $$props.answerType);
    		if ("userHasClickedAnswer" in $$props) $$invalidate(4, userHasClickedAnswer = $$props.userHasClickedAnswer);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$ContentDataStore, questNumber*/ 33) {
    			// check store has fetched content data from GCS
    			 if ($ContentDataStore) {
    				$$invalidate(3, QASet = $ContentDataStore["question_sets"][questNumber - 1]);
    			}
    		}

    		if ($$self.$$.dirty & /*userHasClickedAnswer, Answers*/ 528) {
    			// remove event listener when user clicked
    			 if (userHasClickedAnswer) {
    				for (let i = 0; i < Answers.length; i++) {
    					Answers[i].removeEventListener("click", checkAnswer);
    				}
    			}
    		}
    	};

    	return [
    		questNumber,
    		maxQuestion,
    		explainStatus,
    		QASet,
    		userHasClickedAnswer,
    		$ContentDataStore,
    		$isMobile,
    		answerType,
    		checkAnswer
    	];
    }

    class QATemplate extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { questNumber: 0, maxQuestion: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QATemplate",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*questNumber*/ ctx[0] === undefined && !("questNumber" in props)) {
    			console.warn("<QATemplate> was created without expected prop 'questNumber'");
    		}

    		if (/*maxQuestion*/ ctx[1] === undefined && !("maxQuestion" in props)) {
    			console.warn("<QATemplate> was created without expected prop 'maxQuestion'");
    		}
    	}

    	get questNumber() {
    		throw new Error("<QATemplate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set questNumber(value) {
    		throw new Error("<QATemplate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxQuestion() {
    		throw new Error("<QATemplate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxQuestion(value) {
    		throw new Error("<QATemplate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/shared/QASections.svelte generated by Svelte v3.29.4 */

    const { console: console_1$1 } = globals;
    const file$b = "src/shared/QASections.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[41] = list[i].question_number;
    	child_ctx[43] = i;
    	return child_ctx;
    }

    // (339:0) {#if $ContentDataStore}
    function create_if_block$5(ctx) {
    	let div10;
    	let t0;
    	let div9;
    	let div3;
    	let t1;
    	let div2;
    	let div1;
    	let answerheader;
    	let t2;
    	let div0;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let img;
    	let img_src_value;
    	let t7;
    	let div4;
    	let basicparagraphs;
    	let t8;
    	let div5;
    	let t9;
    	let h2;
    	let t11;
    	let articlelist;
    	let t12;
    	let t13;
    	let socialboxinarticle;
    	let t14;
    	let div8;
    	let div6;
    	let t15;
    	let t16_value = /*$ContentDataStore*/ ctx[2].team + "";
    	let t16;
    	let t17;
    	let div7;
    	let t18;
    	let t19_value = /*$ContentDataStore*/ ctx[2].sub_editor + "";
    	let t19;
    	let t20;
    	let footer;
    	let div9_id_value;
    	let cssVariables_action;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*$ContentDataStore*/ ctx[2].question_sets;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block0 = /*$isMobile*/ ctx[4] && create_if_block_3$2(ctx);

    	answerheader = new AnswerHeader({
    			props: {
    				questNumber: "0",
    				finalPage: true,
    				maxQuestion: null
    			},
    			$$inline: true
    		});

    	basicparagraphs = new BasicParagraphs({
    			props: { sectionName: "ending" },
    			$$inline: true
    		});

    	function select_block_type(ctx, dirty) {
    		if (/*$isMobile*/ ctx[4]) return create_if_block_2$3;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);

    	articlelist = new ArticleList({
    			props: {
    				projectName: /*$ContentDataStore*/ ctx[2].project_name,
    				articleData: /*$ContentDataStore*/ ctx[2].read_more_articles
    			},
    			$$inline: true
    		});

    	let if_block2 = /*$ContentDataStore*/ ctx[2].final_shared_text && create_if_block_1$3(ctx);

    	socialboxinarticle = new SocialBoxInArticle({
    			props: {
    				shareUrl: /*$ContentDataStore*/ ctx[2].article_url
    			},
    			$$inline: true
    		});

    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			div10 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			div9 = element("div");
    			div3 = element("div");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			create_component(answerheader.$$.fragment);
    			t2 = space();
    			div0 = element("div");
    			t3 = text("共答對了");
    			t4 = text(/*$RightAnswerCalc*/ ctx[5]);
    			t5 = text("題");
    			t6 = space();
    			img = element("img");
    			t7 = space();
    			div4 = element("div");
    			create_component(basicparagraphs.$$.fragment);
    			t8 = space();
    			div5 = element("div");
    			if_block1.c();
    			t9 = space();
    			h2 = element("h2");
    			h2.textContent = "推薦文章";
    			t11 = space();
    			create_component(articlelist.$$.fragment);
    			t12 = space();
    			if (if_block2) if_block2.c();
    			t13 = space();
    			create_component(socialboxinarticle.$$.fragment);
    			t14 = space();
    			div8 = element("div");
    			div6 = element("div");
    			t15 = text("製作團隊｜");
    			t16 = text(t16_value);
    			t17 = space();
    			div7 = element("div");
    			t18 = text("核稿編輯｜");
    			t19 = text(t19_value);
    			t20 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(div0, "class", "bg-black text-xl sm:text-3xl tracking-widest sm:tracking-widesttt text-white text-center py-4 sm:mx-10");
    			add_location(div0, file$b, 369, 12, 12825);
    			attr_dev(img, "class", "mt-3 mb-3 sm:mb-6 px-3 mx-auto sm:px-10 svelte-11p83rh");
    			if (img.src !== (img_src_value = /*$ContentDataStore*/ ctx[2].ending_image_url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "ending");
    			add_location(img, file$b, 374, 12, 13038);
    			attr_dev(div1, "class", "w-full");
    			add_location(div1, file$b, 367, 10, 12711);
    			attr_dev(div2, "class", "QA-wrapper h-full rounded-2xl border-4 border-black bg-white mx-auto z-10");
    			add_location(div2, file$b, 366, 8, 12613);
    			attr_dev(div3, "class", "relative pt-16 h-auto");
    			add_location(div3, file$b, 362, 6, 12497);
    			attr_dev(div4, "class", "pt-6 px-6 bg-white sm:py-10 mb-6 sm:mb-0 ");
    			add_location(div4, file$b, 382, 6, 13253);
    			attr_dev(h2, "class", "relative text-center text-white text-3xl pt-12");
    			add_location(h2, file$b, 410, 8, 14956);
    			attr_dev(div5, "class", "relative bg-white pb-16");
    			add_location(div5, file$b, 385, 6, 13377);
    			add_location(div6, file$b, 420, 8, 15568);
    			attr_dev(div7, "class", "pt-2");
    			add_location(div7, file$b, 421, 8, 15617);
    			attr_dev(div8, "class", "text-center pb-20 mx-6 bg-white");
    			set_style(div8, "word-break", "keep-all");
    			add_location(div8, file$b, 419, 6, 15484);
    			attr_dev(div9, "class", "qa-section basic-p-container  svelte-11p83rh");
    			attr_dev(div9, "id", div9_id_value = "qa-no-" + (/*$ContentDataStore*/ ctx[2].question_sets.length + 1));
    			set_style(div9, "display", "none");
    			set_style(div9, "height", "auto");
    			add_location(div9, file$b, 357, 4, 12331);
    			attr_dev(div10, "class", " svelte-11p83rh");
    			attr_dev(div10, "id", "qa-container");
    			add_location(div10, file$b, 339, 2, 11749);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div10, null);
    			}

    			append_dev(div10, t0);
    			append_dev(div10, div9);
    			append_dev(div9, div3);
    			if (if_block0) if_block0.m(div3, null);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			mount_component(answerheader, div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, t3);
    			append_dev(div0, t4);
    			append_dev(div0, t5);
    			append_dev(div1, t6);
    			append_dev(div1, img);
    			append_dev(div9, t7);
    			append_dev(div9, div4);
    			mount_component(basicparagraphs, div4, null);
    			append_dev(div9, t8);
    			append_dev(div9, div5);
    			if_block1.m(div5, null);
    			append_dev(div5, t9);
    			append_dev(div5, h2);
    			append_dev(div5, t11);
    			mount_component(articlelist, div5, null);
    			append_dev(div5, t12);
    			if (if_block2) if_block2.m(div5, null);
    			append_dev(div5, t13);
    			mount_component(socialboxinarticle, div5, null);
    			append_dev(div9, t14);
    			append_dev(div9, div8);
    			append_dev(div8, div6);
    			append_dev(div6, t15);
    			append_dev(div6, t16);
    			append_dev(div8, t17);
    			append_dev(div8, div7);
    			append_dev(div7, t18);
    			append_dev(div7, t19);
    			append_dev(div9, t20);
    			mount_component(footer, div9, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(cssVariables_action = cssVariables.call(null, div10, { transleteY: /*transleteY*/ ctx[3] })),
    					listen_dev(div10, "mousedown", stop_propagation(/*handleMovementDown*/ ctx[9]), false, false, true),
    					listen_dev(div10, "touchstart", stop_propagation(/*handleMovementDown*/ ctx[9]), { passive: true }, false, true),
    					listen_dev(div10, "wheel", stop_propagation(/*handleScrollWrapper*/ ctx[10]), { passive: true }, false, true)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$ContentDataStore, windowHeight, maxQuestion*/ 262) {
    				each_value = /*$ContentDataStore*/ ctx[2].question_sets;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div10, t0);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*$isMobile*/ ctx[4]) {
    				if (if_block0) {
    					if (dirty[0] & /*$isMobile*/ 16) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3$2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div3, t1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*$RightAnswerCalc*/ 32) set_data_dev(t4, /*$RightAnswerCalc*/ ctx[5]);

    			if (!current || dirty[0] & /*$ContentDataStore*/ 4 && img.src !== (img_src_value = /*$ContentDataStore*/ ctx[2].ending_image_url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div5, t9);
    				}
    			}

    			const articlelist_changes = {};
    			if (dirty[0] & /*$ContentDataStore*/ 4) articlelist_changes.projectName = /*$ContentDataStore*/ ctx[2].project_name;
    			if (dirty[0] & /*$ContentDataStore*/ 4) articlelist_changes.articleData = /*$ContentDataStore*/ ctx[2].read_more_articles;
    			articlelist.$set(articlelist_changes);

    			if (/*$ContentDataStore*/ ctx[2].final_shared_text) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1$3(ctx);
    					if_block2.c();
    					if_block2.m(div5, t13);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			const socialboxinarticle_changes = {};
    			if (dirty[0] & /*$ContentDataStore*/ 4) socialboxinarticle_changes.shareUrl = /*$ContentDataStore*/ ctx[2].article_url;
    			socialboxinarticle.$set(socialboxinarticle_changes);
    			if ((!current || dirty[0] & /*$ContentDataStore*/ 4) && t16_value !== (t16_value = /*$ContentDataStore*/ ctx[2].team + "")) set_data_dev(t16, t16_value);
    			if ((!current || dirty[0] & /*$ContentDataStore*/ 4) && t19_value !== (t19_value = /*$ContentDataStore*/ ctx[2].sub_editor + "")) set_data_dev(t19, t19_value);

    			if (!current || dirty[0] & /*$ContentDataStore*/ 4 && div9_id_value !== (div9_id_value = "qa-no-" + (/*$ContentDataStore*/ ctx[2].question_sets.length + 1))) {
    				attr_dev(div9, "id", div9_id_value);
    			}

    			if (cssVariables_action && is_function(cssVariables_action.update) && dirty[0] & /*transleteY*/ 8) cssVariables_action.update.call(null, { transleteY: /*transleteY*/ ctx[3] });
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block0);
    			transition_in(answerheader.$$.fragment, local);
    			transition_in(basicparagraphs.$$.fragment, local);
    			transition_in(articlelist.$$.fragment, local);
    			transition_in(socialboxinarticle.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block0);
    			transition_out(answerheader.$$.fragment, local);
    			transition_out(basicparagraphs.$$.fragment, local);
    			transition_out(articlelist.$$.fragment, local);
    			transition_out(socialboxinarticle.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			destroy_each(each_blocks, detaching);
    			if (if_block0) if_block0.d();
    			destroy_component(answerheader);
    			destroy_component(basicparagraphs);
    			if_block1.d();
    			destroy_component(articlelist);
    			if (if_block2) if_block2.d();
    			destroy_component(socialboxinarticle);
    			destroy_component(footer);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(339:0) {#if $ContentDataStore}",
    		ctx
    	});

    	return block;
    }

    // (348:4) {#each $ContentDataStore.question_sets as { question_number }
    function create_each_block$4(ctx) {
    	let div;
    	let qatemplate;
    	let div_id_value;
    	let current;

    	qatemplate = new QATemplate({
    			props: {
    				maxQuestion: /*maxQuestion*/ ctx[1],
    				questNumber: /*i*/ ctx[43] + 1
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(qatemplate.$$.fragment);
    			attr_dev(div, "class", "qa-section svelte-11p83rh");
    			attr_dev(div, "id", div_id_value = `qa-no-` + /*question_number*/ ctx[41]);
    			set_style(div, "display", /*i*/ ctx[43] === 0 ? "block" : "none");
    			set_style(div, "height", /*windowHeight*/ ctx[8] + "px");
    			add_location(div, file$b, 348, 6, 12083);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(qatemplate, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const qatemplate_changes = {};
    			if (dirty[0] & /*maxQuestion*/ 2) qatemplate_changes.maxQuestion = /*maxQuestion*/ ctx[1];
    			qatemplate.$set(qatemplate_changes);

    			if (!current || dirty[0] & /*$ContentDataStore*/ 4 && div_id_value !== (div_id_value = `qa-no-` + /*question_number*/ ctx[41])) {
    				attr_dev(div, "id", div_id_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(qatemplate.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(qatemplate.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(qatemplate);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(348:4) {#each $ContentDataStore.question_sets as { question_number }",
    		ctx
    	});

    	return block;
    }

    // (364:8) {#if $isMobile}
    function create_if_block_3$2(ctx) {
    	let finalcardbackground;
    	let current;
    	finalcardbackground = new FinalCardBackground({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(finalcardbackground.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(finalcardbackground, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(finalcardbackground.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(finalcardbackground.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(finalcardbackground, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(364:8) {#if $isMobile}",
    		ctx
    	});

    	return block;
    }

    // (399:8) {:else}
    function create_else_block$3(ctx) {
    	let div0;
    	let svg0;
    	let path0;
    	let path1;
    	let t;
    	let div1;
    	let svg1;
    	let path2;
    	let path2_fill_value;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			t = space();
    			div1 = element("div");
    			svg1 = svg_element("svg");
    			path2 = svg_element("path");
    			attr_dev(path0, "d", "M1440,0H180L0,180V310H1440Z");
    			set_style(path0, "fill", /*$ThemeStore*/ ctx[6][/*themeNum*/ ctx[0]][1]);
    			set_style(path0, "fill-rule", "evenodd");
    			add_location(path0, file$b, 401, 14, 14400);
    			attr_dev(path1, "d", "M1200,309A240,240,0,0,1,1440,69V309Z");
    			set_style(path1, "fill", /*$ThemeStore*/ ctx[6][/*themeNum*/ ctx[0]][2]);
    			add_location(path1, file$b, 402, 14, 14513);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "width", "100vw");
    			attr_dev(svg0, "viewBox", "0 0 1440 310");
    			add_location(svg0, file$b, 400, 12, 14308);
    			attr_dev(div0, "class", "absolute overflow-hidden");
    			set_style(div0, "min-height", "160px");
    			set_style(div0, "max-height", "180px");
    			add_location(div0, file$b, 399, 10, 14211);
    			attr_dev(path2, "d", "M0 136L135 -2.11598e-05L135 136L0 136Z");
    			attr_dev(path2, "fill", path2_fill_value = /*$ThemeStore*/ ctx[6][/*themeNum*/ ctx[0]][0]);
    			add_location(path2, file$b, 406, 14, 14814);
    			attr_dev(svg1, "width", "135");
    			attr_dev(svg1, "height", "136");
    			attr_dev(svg1, "viewBox", "0 0 135 136");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file$b, 405, 12, 14700);
    			attr_dev(div1, "class", "absolute right-0");
    			set_style(div1, "top", "-136px");
    			add_location(div1, file$b, 404, 10, 14636);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, svg0);
    			append_dev(svg0, path0);
    			append_dev(svg0, path1);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, svg1);
    			append_dev(svg1, path2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$ThemeStore, themeNum*/ 65) {
    				set_style(path0, "fill", /*$ThemeStore*/ ctx[6][/*themeNum*/ ctx[0]][1]);
    			}

    			if (dirty[0] & /*$ThemeStore, themeNum*/ 65) {
    				set_style(path1, "fill", /*$ThemeStore*/ ctx[6][/*themeNum*/ ctx[0]][2]);
    			}

    			if (dirty[0] & /*$ThemeStore, themeNum*/ 65 && path2_fill_value !== (path2_fill_value = /*$ThemeStore*/ ctx[6][/*themeNum*/ ctx[0]][0])) {
    				attr_dev(path2, "fill", path2_fill_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(399:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (387:8) {#if $isMobile}
    function create_if_block_2$3(ctx) {
    	let div0;
    	let svg0;
    	let path0;
    	let path1;
    	let t;
    	let div1;
    	let svg1;
    	let path2;
    	let path2_fill_value;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			t = space();
    			div1 = element("div");
    			svg1 = svg_element("svg");
    			path2 = svg_element("path");
    			attr_dev(path0, "d", "M320,0H102L0,102V211H320Z");
    			set_style(path0, "fill", /*$ThemeStore*/ ctx[6][/*themeNum*/ ctx[0]][1]);
    			set_style(path0, "fill-rule", "evenodd");
    			add_location(path0, file$b, 389, 14, 13639);
    			attr_dev(path1, "d", "M216,210.5A104.52,104.52,0,0,1,320.5,106V210.5Z");
    			set_style(path1, "fill", /*$ThemeStore*/ ctx[6][/*themeNum*/ ctx[0]][2]);
    			add_location(path1, file$b, 390, 14, 13750);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "width", "100vw");
    			attr_dev(svg0, "viewBox", "0 0 320.5 211");
    			add_location(svg0, file$b, 388, 12, 13546);
    			attr_dev(div0, "class", "absolute overflow-hidden");
    			set_style(div0, "min-height", "200px");
    			set_style(div0, "max-height", "220px");
    			add_location(div0, file$b, 387, 10, 13449);
    			attr_dev(path2, "d", "M0 77L76 -3.32207e-06L76 77L0 77Z");
    			attr_dev(path2, "fill", path2_fill_value = /*$ThemeStore*/ ctx[6][/*themeNum*/ ctx[0]][0]);
    			add_location(path2, file$b, 395, 14, 14070);
    			attr_dev(svg1, "width", "76");
    			attr_dev(svg1, "height", "77");
    			attr_dev(svg1, "viewBox", "0 0 76 77");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file$b, 394, 12, 13960);
    			attr_dev(div1, "class", "absolute right-0");
    			set_style(div1, "top", "-77px");
    			add_location(div1, file$b, 393, 10, 13897);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, svg0);
    			append_dev(svg0, path0);
    			append_dev(svg0, path1);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, svg1);
    			append_dev(svg1, path2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$ThemeStore, themeNum*/ 65) {
    				set_style(path0, "fill", /*$ThemeStore*/ ctx[6][/*themeNum*/ ctx[0]][1]);
    			}

    			if (dirty[0] & /*$ThemeStore, themeNum*/ 65) {
    				set_style(path1, "fill", /*$ThemeStore*/ ctx[6][/*themeNum*/ ctx[0]][2]);
    			}

    			if (dirty[0] & /*$ThemeStore, themeNum*/ 65 && path2_fill_value !== (path2_fill_value = /*$ThemeStore*/ ctx[6][/*themeNum*/ ctx[0]][0])) {
    				attr_dev(path2, "fill", path2_fill_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(387:8) {#if $isMobile}",
    		ctx
    	});

    	return block;
    }

    // (413:8) {#if $ContentDataStore.final_shared_text}
    function create_if_block_1$3(ctx) {
    	let div;
    	let t_value = /*$ContentDataStore*/ ctx[2].final_shared_text + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "text-center font-bold text-xl sm:text-2xl mx-auto px-12 pb-3 sm:p-0");
    			set_style(div, "max-width", "500px");
    			add_location(div, file$b, 413, 10, 15205);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$ContentDataStore*/ 4 && t_value !== (t_value = /*$ContentDataStore*/ ctx[2].final_shared_text + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(413:8) {#if $ContentDataStore.final_shared_text}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$ContentDataStore*/ ctx[2] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*$ContentDataStore*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*$ContentDataStore*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let $ContentDataStore;
    	let $progress;
    	let $isMobile;
    	let $QAFinalPage;
    	let $QASectionsHeight;
    	let $QAProgress;
    	let $RightAnswerCalc;
    	let $ThemeStore;
    	validate_store(ContentDataStore, "ContentDataStore");
    	component_subscribe($$self, ContentDataStore, $$value => $$invalidate(2, $ContentDataStore = $$value));
    	validate_store(isMobile, "isMobile");
    	component_subscribe($$self, isMobile, $$value => $$invalidate(4, $isMobile = $$value));
    	validate_store(QAFinalPage, "QAFinalPage");
    	component_subscribe($$self, QAFinalPage, $$value => $$invalidate(26, $QAFinalPage = $$value));
    	validate_store(QASectionsHeight, "QASectionsHeight");
    	component_subscribe($$self, QASectionsHeight, $$value => $$invalidate(27, $QASectionsHeight = $$value));
    	validate_store(QAProgress, "QAProgress");
    	component_subscribe($$self, QAProgress, $$value => $$invalidate(28, $QAProgress = $$value));
    	validate_store(RightAnswerCalc, "RightAnswerCalc");
    	component_subscribe($$self, RightAnswerCalc, $$value => $$invalidate(5, $RightAnswerCalc = $$value));
    	validate_store(ThemeStore, "ThemeStore");
    	component_subscribe($$self, ThemeStore, $$value => $$invalidate(6, $ThemeStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("QASections", slots, []);
    	const progress = tweened(0, { duration: 800, easing: quintOut });
    	validate_store(progress, "progress");
    	component_subscribe($$self, progress, value => $$invalidate(25, $progress = value));
    	let themeNum = "1";

    	// click&touch movement handler initial setting variables
    	let maxQuestion = 0; // the total question user need to answer

    	let currentPage = 1; // the initail page when enter QA sections
    	let mouseDown = false; // true if user mousedown
    	let isMoving = false; // true if user click and move their mouse
    	let windowHeight = window.innerHeight; // screen height

    	let movementDownY = 0,
    		moveY = 0,
    		moveDiff = 0,
    		newMovementY = 0,
    		overflowHeight = 0,
    		moveOverflowDiff = 0,
    		scrollOverflowTick = 0,
    		scrollSpeed = 41,
    		clickUpMovementY = newMovementY; // the y-coordinate when user click down
    	// the y-coordinate when user move
    	// the distance that user move (movementDownY - moveY)
    	// the y-coordinate after user click up

    	let pageChangeThreshold = 0.1;

    	// update QAsectionHeight initially
    	QASectionsHeight.update(() => windowHeight);

    	// scroll-liked movement initial setting variables
    	let validToScroll = true; // is wheel event fire now?

    	let scrollLimit = false;

    	onMount(() => {
    		// get all QA sections' height
    		QASectionsHeight.update(() => getAllSectionsHeight());

    		setTimeout(
    			() => {
    				$$invalidate(1, maxQuestion = document.querySelectorAll("[id^=\"qa-no-\"]").length - 1);

    				QAProgressArray.update(() => {
    					let QAarray = $ContentDataStore.question_sets.map(d => {
    						let obj = {};
    						obj["question_number"] = d.question_number;
    						obj["status"] = "unanswered";
    						return obj;
    					});

    					return QAarray;
    				});
    			},
    			600
    		);
    	});

    	// function statement zone
    	// the handler that click&touch down event & add event listener to qa-container
    	function handleMovementDown(e) {
    		const QAcontainer = document.getElementById("qa-container");
    		mouseDown = true;

    		// prevent error message mouse event trigger when user click nested button
    		if (!e.touches && $isMobile) return;

    		movementDownY = $isMobile ? e.touches[0].clientY : e.clientY;

    		// add mousemove, mouseup event to `qa-container`
    		QAcontainer.addEventListener("mousemove", handleMove);

    		QAcontainer.addEventListener("mouseup", handleMovementUp);
    		QAcontainer.addEventListener("touchmove", handleMove, { passive: true });
    		QAcontainer.addEventListener("touchend", handleMovementUp);
    	}

    	// the handler of click&touch move event
    	function handleMove(e) {
    		e.stopPropagation();

    		if (mouseDown) {
    			isMoving = true;
    			moveY = $isMobile ? e.touches[0].clientY : e.clientY;
    			$$invalidate(16, moveDiff = (moveY - movementDownY) * 0.5); // moveDiff * 0.6 can prevent decrease distance that user move

    			// check overflowHeight
    			updateOverflowInfo();

    			newMovementY = clickUpMovementY + moveDiff;
    			progress.set(newMovementY, { duration: 0 }); // update the latest coordinate to progress store
    		}
    	}

    	// the handler of click&touch up event
    	function handleMovementUp(e) {
    		e.stopPropagation();
    		const QAcontainer = document.getElementById("qa-container");

    		// reset setting varialbes when movement ending
    		isMoving = false;

    		mouseDown = false;
    		moveY = 0;
    		movementDownY = 0;

    		// detect if there's a overflow height section
    		if (checkOverflowSection()) {
    			clickUpMovementY = newMovementY;
    			progress.set(newMovementY, { duration: 0 });
    			$$invalidate(16, moveDiff = 0);
    		} else {
    			// if not, use normal scroll mode
    			if (Math.abs(moveDiff) > windowHeight * pageChangeThreshold && !isOnQAsectionsTopOrEnd()) {
    				moveToNextPage();
    				$$invalidate(16, moveDiff = 0);
    			} else {
    				// improve user experience when scroll over the valid zone
    				progress.set(newMovementY, { duration: 0 });

    				progress.set(-totalSectionsHeight(0, currentPage - 1));
    				newMovementY = -totalSectionsHeight(0, currentPage - 1);
    				clickUpMovementY = newMovementY;
    				$$invalidate(16, moveDiff = 0);
    			}
    		}

    		// remove event listener after mouse up
    		QAcontainer.removeEventListener("mouseup", handleMovementUp);

    		QAcontainer.removeEventListener("mousemove", handleMove);
    		QAcontainer.removeEventListener("touchend", handleMovementUp);
    		QAcontainer.removeEventListener("touchmove", handleMove);
    	}

    	function moveToNextPage() {
    		// 1. when moveDiff > (height of each page) * 0.3 => transition to next page
    		// 2. also need to detect scrolling/touching direction.
    		if (moveDirection === "down") {
    			currentPage += 1;
    			progress.set(newMovementY, { duration: 0 });
    			progress.set(-totalSectionsHeight(0, currentPage - 1));
    			newMovementY = -totalSectionsHeight(0, currentPage - 1);

    			// prevent user need to scroll & touch, so here need to re-locate clickUpMovementY
    			clickUpMovementY = newMovementY;
    		} else {
    			currentPage -= 1;
    			progress.set(newMovementY, { duration: 0 });
    			progress.set(-totalSectionsHeight(0, currentPage - 1));
    			newMovementY = -totalSectionsHeight(0, currentPage - 1);

    			// prevent user need to scroll & touch, so here need to re-locate clickUpMovementY
    			clickUpMovementY = newMovementY;
    		}
    	}

    	// scroll limiter function
    	function handleScrollWrapper(e) {
    		if (scrollLimit !== true) {
    			handleScroll(e);
    			scrollLimit = true;
    		}
    	}

    	// scroll/wheel event handler setting
    	function handleScroll(e) {
    		setTimeout(
    			() => {
    				scrollLimit = false;
    			},
    			100
    		);

    		if (!scrollLimit) {
    			updateOverflowInfo();
    			console.log(`x:${e.deltaX} y:${e.deltaY}`);

    			if (e.deltaY > 0) {
    				moveDirection = "down";
    			} else {
    				moveDirection = "up";
    			}

    			if (checkScrollOverflowSection() === true && validToScroll) {
    				if (currentPage == $QAFinalPage) {
    					scrollSpeed = 71;
    				} else {
    					scrollSpeed = 25;
    				}

    				clickUpMovementY = newMovementY + (moveDirection == "down" ? -scrollSpeed : scrollSpeed);
    				newMovementY = newMovementY + (moveDirection == "down" ? -scrollSpeed : scrollSpeed);
    				progress.set(newMovementY, { duration: 100 });
    			} else if (checkScrollOverflowSection() === false && validToScroll) {
    				validToScroll = false;
    				scrollToNextPage();
    			} else if (checkScrollOverflowSection() === "static") ; // do nothing
    		}
    	}

    	// the function let qa-container scroll to next page
    	function scrollToNextPage() {
    		if (moveDirection === "down") {
    			currentPage += 1;
    			progress.set(newMovementY, { duration: 0 });
    			progress.set(-totalSectionsHeight(0, currentPage - 1), { duration: 1000 });
    			newMovementY = -totalSectionsHeight(0, currentPage - 1);
    			clickUpMovementY = newMovementY;

    			// the timer is to prevent excution of continuous scrollToNextPage
    			setTimeout(
    				() => {
    					validToScroll = true;
    				},
    				1300
    			);
    		} else if (moveDirection === "up") {
    			currentPage -= 1;
    			progress.set(newMovementY, { duration: 0 });
    			progress.set(-totalSectionsHeight(0, currentPage - 1), { duration: 1000 });
    			newMovementY = -totalSectionsHeight(0, currentPage - 1);
    			clickUpMovementY = newMovementY;

    			// the timer is to prevent excution of continuous scrollToNextPage
    			setTimeout(
    				() => {
    					validToScroll = true;
    				},
    				1300
    			);
    		}
    	}

    	// the function check if the situation can scroll (the situation like if you move in the first page, you can't scroll on previous page)
    	function isOnQAsectionsTopOrEnd() {
    		if (moveDirection === "up" && currentPage === 1 || moveDirection === "down" && currentPage === $QAFinalPage) {
    			return true;
    		} else {
    			return false;
    		}
    	}

    	//check overflow explain content
    	function checkOverflowSection() {
    		// crazy logic code ...
    		if (moveOverflowDiff < overflowHeight && moveDirection === "down") {
    			if (currentPage === $QAFinalPage) {
    				return true;
    			} else {
    				return !isOnQAsectionsTopOrEnd();
    			}
    		} else if (moveOverflowDiff > overflowHeight && moveDirection === "down") {
    			return false;
    		} else if (moveOverflowDiff < overflowHeight && moveDirection === "up") {
    			if (newMovementY >= 0 && currentPage === 1) {
    				return false;
    			} else if (newMovementY >= 0 && currentPage !== 1) {
    				return true;
    			} else if (newMovementY > -$QASectionsHeight[currentPage - 1] && currentPage === 1) {
    				return true;
    			} else if (newMovementY > -totalSectionsHeight(0, currentPage - 1) && currentPage !== 1) {
    				return false;
    			} else if (newMovementY < -totalSectionsHeight(0, currentPage - 1) && currentPage !== 1) {
    				return true;
    			}
    		} else if (moveOverflowDiff > overflowHeight && moveDirection === "up") {
    			return !isOnQAsectionsTopOrEnd();
    		}
    	}

    	// scroll overflow checker
    	function checkScrollOverflowSection() {
    		// crazy logic code ...
    		console.log(currentPage, moveDirection);

    		console.log("debug", moveOverflowDiff, overflowHeight);

    		if (currentPage === 1 && moveDirection === "up") {
    			if (newMovementY >= 0) {
    				return "static";
    			} else if (moveOverflowDiff < overflowHeight) {
    				return true;
    			} else if (moveOverflowDiff > overflowHeight) {
    				return true;
    			}
    		} else if (moveDirection === "down" && currentPage < $QAProgress) {
    			if (moveOverflowDiff === overflowHeight) {
    				return false;
    			} else if (moveOverflowDiff < overflowHeight) {
    				return true;
    			} else if (moveOverflowDiff > overflowHeight) {
    				return false;
    			}
    		} else if (currentPage !== 1 && moveDirection === "up") {
    			if (newMovementY < -totalSectionsHeight(0, currentPage - 1)) {
    				return true;
    			} else if (newMovementY >= -totalSectionsHeight(0, currentPage - 1)) {
    				return false;
    			}
    		} else if (moveOverflowDiff < overflowHeight && moveDirection === "down" && currentPage === $QAFinalPage) {
    			return true;
    		}
    	}

    	// get selected section height
    	function totalSectionsHeight(start, end) {
    		const totalHeight = $QASectionsHeight.slice(start, end).reduce((a, b) => a + b, 0);
    		return totalHeight;
    	}

    	// update overflow value
    	function updateOverflowInfo() {
    		overflowHeight = Math.abs(totalSectionsHeight(currentPage - 1, currentPage)) - windowHeight;
    		moveOverflowDiff = Math.abs(newMovementY) - Math.abs(totalSectionsHeight(0, currentPage - 1));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<QASections> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		cssVariables,
    		getAllSectionsHeight,
    		isMobile,
    		tweened,
    		quintOut,
    		onMount,
    		QAFinalPage,
    		QASectionsHeight,
    		QAProgress,
    		RightAnswerCalc,
    		QAProgressArray,
    		BasicParagraphs,
    		Footer,
    		AnswerHeader,
    		FinalCardBackground,
    		ArticleList,
    		SocialBoxInArticle,
    		ContentDataStore,
    		ThemeStore,
    		QATemplate,
    		progress,
    		themeNum,
    		maxQuestion,
    		currentPage,
    		mouseDown,
    		isMoving,
    		windowHeight,
    		movementDownY,
    		moveY,
    		moveDiff,
    		newMovementY,
    		overflowHeight,
    		moveOverflowDiff,
    		scrollOverflowTick,
    		scrollSpeed,
    		clickUpMovementY,
    		pageChangeThreshold,
    		validToScroll,
    		scrollLimit,
    		handleMovementDown,
    		handleMove,
    		handleMovementUp,
    		moveToNextPage,
    		handleScrollWrapper,
    		handleScroll,
    		scrollToNextPage,
    		isOnQAsectionsTopOrEnd,
    		checkOverflowSection,
    		checkScrollOverflowSection,
    		totalSectionsHeight,
    		updateOverflowInfo,
    		$ContentDataStore,
    		moveDirection,
    		transleteY,
    		$progress,
    		$isMobile,
    		$QAFinalPage,
    		$QASectionsHeight,
    		$QAProgress,
    		$RightAnswerCalc,
    		$ThemeStore
    	});

    	$$self.$inject_state = $$props => {
    		if ("themeNum" in $$props) $$invalidate(0, themeNum = $$props.themeNum);
    		if ("maxQuestion" in $$props) $$invalidate(1, maxQuestion = $$props.maxQuestion);
    		if ("currentPage" in $$props) currentPage = $$props.currentPage;
    		if ("mouseDown" in $$props) mouseDown = $$props.mouseDown;
    		if ("isMoving" in $$props) isMoving = $$props.isMoving;
    		if ("windowHeight" in $$props) $$invalidate(8, windowHeight = $$props.windowHeight);
    		if ("movementDownY" in $$props) movementDownY = $$props.movementDownY;
    		if ("moveY" in $$props) moveY = $$props.moveY;
    		if ("moveDiff" in $$props) $$invalidate(16, moveDiff = $$props.moveDiff);
    		if ("newMovementY" in $$props) newMovementY = $$props.newMovementY;
    		if ("overflowHeight" in $$props) overflowHeight = $$props.overflowHeight;
    		if ("moveOverflowDiff" in $$props) moveOverflowDiff = $$props.moveOverflowDiff;
    		if ("scrollOverflowTick" in $$props) scrollOverflowTick = $$props.scrollOverflowTick;
    		if ("scrollSpeed" in $$props) scrollSpeed = $$props.scrollSpeed;
    		if ("clickUpMovementY" in $$props) clickUpMovementY = $$props.clickUpMovementY;
    		if ("pageChangeThreshold" in $$props) pageChangeThreshold = $$props.pageChangeThreshold;
    		if ("validToScroll" in $$props) validToScroll = $$props.validToScroll;
    		if ("scrollLimit" in $$props) scrollLimit = $$props.scrollLimit;
    		if ("moveDirection" in $$props) moveDirection = $$props.moveDirection;
    		if ("transleteY" in $$props) $$invalidate(3, transleteY = $$props.transleteY);
    	};

    	let moveDirection;
    	let transleteY;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*$ContentDataStore*/ 4) {
    			 if ($ContentDataStore) {
    				$$invalidate(0, themeNum = $ContentDataStore["theme"]);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*moveDiff*/ 65536) {
    			// detect click&toych direction
    			 moveDirection = moveDiff <= 0 ? "down" : "up";
    		}

    		if ($$self.$$.dirty[0] & /*$progress*/ 33554432) {
    			// y-coordinate that qa-container need to translate (just like normal scroll effect)
    			 $$invalidate(3, transleteY = $progress);
    		}
    	};

    	return [
    		themeNum,
    		maxQuestion,
    		$ContentDataStore,
    		transleteY,
    		$isMobile,
    		$RightAnswerCalc,
    		$ThemeStore,
    		progress,
    		windowHeight,
    		handleMovementDown,
    		handleScrollWrapper
    	];
    }

    class QASections extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QASections",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/shared/MobileLandingIntro.svelte generated by Svelte v3.29.4 */
    const file$c = "src/shared/MobileLandingIntro.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i].text;
    	return child_ctx;
    }

    // (50:0) {#if $ContentDataStore}
    function create_if_block$6(ctx) {
    	let div5;
    	let div0;
    	let svg0;
    	let path0;
    	let t0;
    	let div1;
    	let svg1;
    	let path1;
    	let t1;
    	let div2;
    	let svg2;
    	let path2;
    	let t2;
    	let div4;
    	let div3;
    	let t3;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t4;
    	let h1;
    	let t5_value = /*introData*/ ctx[0].title + "";
    	let t5;
    	let t6;
    	let div6;
    	let each_value = /*introData*/ ctx[0].content;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t0 = space();
    			div1 = element("div");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t1 = space();
    			div2 = element("div");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t2 = space();
    			div4 = element("div");
    			div3 = element("div");
    			t3 = space();
    			img = element("img");
    			t4 = space();
    			h1 = element("h1");
    			t5 = text(t5_value);
    			t6 = space();
    			div6 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(path0, "d", "M80,0H0V320H240L80,160H240V87.84A80,80,0,0,1,160.38,160V0A80,80,0,0,1,240,72.16V0H80Zm0,0V160A80,80,0,0,1,80,0Zm0,160V320a80,80,0,0,1,0-160Z");
    			set_style(path0, "fill", /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][1]);
    			set_style(path0, "fill-rule", "evenodd");
    			add_location(path0, file$c, 52, 81, 1239);
    			attr_dev(svg0, "width", "75vw");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "viewBox", "0 0 240 320");
    			add_location(svg0, file$c, 52, 6, 1164);
    			attr_dev(div0, "class", "absolute left-0");
    			add_location(div0, file$c, 51, 4, 1128);
    			attr_dev(path1, "d", "M240,0H160V160H0L160,320V160h80Z");
    			set_style(path1, "fill", /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][0]);
    			set_style(path1, "fill-rule", "evenodd");
    			add_location(path1, file$c, 58, 81, 1612);
    			attr_dev(svg1, "width", "75vw");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "viewBox", "0 0 240 320");
    			add_location(svg1, file$c, 58, 6, 1537);
    			attr_dev(div1, "class", "absolute right-0");
    			add_location(div1, file$c, 57, 4, 1500);
    			attr_dev(path2, "d", "M49.39,6.09A80,80,0,0,1,80,0V160A80,80,0,0,1,49.39,6.09ZM240,240l80,80V240Z");
    			set_style(path2, "fill", /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][2]);
    			set_style(path2, "fill-rule", "evenodd");
    			add_location(path2, file$c, 64, 82, 1870);
    			attr_dev(svg2, "width", "100vw");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "viewBox", "0 0 320 320");
    			add_location(svg2, file$c, 64, 6, 1794);
    			attr_dev(div2, "class", "absolute");
    			add_location(div2, file$c, 63, 4, 1765);
    			attr_dev(div3, "class", "absolute bg-black h-full w-full svelte-5hqays");
    			attr_dev(div3, "id", "intro-img-shadow");
    			add_location(div3, file$c, 70, 6, 2132);
    			attr_dev(img, "class", "absolute border-4 border-black h-full w-full svelte-5hqays");
    			if (img.src !== (img_src_value = /*introData*/ ctx[0].cover_image.url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*introData*/ ctx[0].cover_image.discription);
    			attr_dev(img, "id", "intro-img");
    			add_location(img, file$c, 71, 6, 2208);
    			attr_dev(div4, "class", "relative");
    			set_style(div4, "width", "82.5%");
    			set_style(div4, "height", "82.5%");
    			add_location(div4, file$c, 69, 4, 2066);
    			attr_dev(div5, "class", "flex relative justify-center items-center intro-img-container svelte-5hqays");
    			add_location(div5, file$c, 50, 2, 1048);
    			attr_dev(h1, "class", "px-4 pt-4");
    			add_location(h1, file$c, 79, 2, 2416);
    			attr_dev(div6, "class", "basic-p-container");
    			add_location(div6, file$c, 80, 2, 2463);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div5, t0);
    			append_dev(div5, div1);
    			append_dev(div1, svg1);
    			append_dev(svg1, path1);
    			append_dev(div5, t1);
    			append_dev(div5, div2);
    			append_dev(div2, svg2);
    			append_dev(svg2, path2);
    			append_dev(div5, t2);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div4, t3);
    			append_dev(div4, img);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t5);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div6, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div6, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$ThemeStore, themeNum*/ 10) {
    				set_style(path0, "fill", /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][1]);
    			}

    			if (dirty & /*$ThemeStore, themeNum*/ 10) {
    				set_style(path1, "fill", /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][0]);
    			}

    			if (dirty & /*$ThemeStore, themeNum*/ 10) {
    				set_style(path2, "fill", /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][2]);
    			}

    			if (dirty & /*introData*/ 1 && img.src !== (img_src_value = /*introData*/ ctx[0].cover_image.url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*introData*/ 1 && img_alt_value !== (img_alt_value = /*introData*/ ctx[0].cover_image.discription)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*introData*/ 1 && t5_value !== (t5_value = /*introData*/ ctx[0].title + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*introData*/ 1) {
    				each_value = /*introData*/ ctx[0].content;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div6, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div6);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(50:0) {#if $ContentDataStore}",
    		ctx
    	});

    	return block;
    }

    // (82:4) {#each introData.content as { text }}
    function create_each_block$5(ctx) {
    	let p;
    	let t_value = /*text*/ ctx[4] + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "pt-4");
    			add_location(p, file$c, 82, 6, 2543);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*introData*/ 1 && t_value !== (t_value = /*text*/ ctx[4] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(82:4) {#each introData.content as { text }}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let t0;
    	let div0;
    	let button;
    	let t1;
    	let t2;
    	let div1;
    	let mounted;
    	let dispose;
    	let if_block = /*$ContentDataStore*/ ctx[2] && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			div0 = element("div");
    			button = element("button");
    			t1 = text("開始作答");
    			t2 = space();
    			div1 = element("div");
    			attr_dev(button, "class", "block w-full rounded-lg border text-white text-xl tracking-widest bg-black mb-6 py-3 svelte-5hqays");
    			set_style(button, "background-color", /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][0]);
    			add_location(button, file$c, 87, 2, 2626);
    			attr_dev(div0, "class", "px-4 mx-auto");
    			add_location(div0, file$c, 86, 0, 2597);
    			attr_dev(div1, "class", "px-4 pb-5 mb-3 mx-4 svelte-5hqays");
    			attr_dev(div1, "id", "intro-sp-line");
    			add_location(div1, file$c, 93, 0, 2839);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, button);
    			append_dev(button, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", handleClick, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$ContentDataStore*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*$ThemeStore, themeNum*/ 10) {
    				set_style(button, "background-color", /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handleClick() {
    	document.querySelector("#qa-sections").style.display = "block";
    	document.querySelector("#qa-no-1").scrollIntoView({ behavior: "smooth" });
    	document.querySelector("body").style.overflow = "hidden";
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $ContentDataStore;
    	let $ThemeStore;
    	validate_store(ContentDataStore, "ContentDataStore");
    	component_subscribe($$self, ContentDataStore, $$value => $$invalidate(2, $ContentDataStore = $$value));
    	validate_store(ThemeStore, "ThemeStore");
    	component_subscribe($$self, ThemeStore, $$value => $$invalidate(3, $ThemeStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MobileLandingIntro", slots, []);
    	let introData;
    	let themeNum = "1";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MobileLandingIntro> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		ContentDataStore,
    		ThemeStore,
    		introData,
    		themeNum,
    		handleClick,
    		$ContentDataStore,
    		$ThemeStore
    	});

    	$$self.$inject_state = $$props => {
    		if ("introData" in $$props) $$invalidate(0, introData = $$props.introData);
    		if ("themeNum" in $$props) $$invalidate(1, themeNum = $$props.themeNum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$ContentDataStore*/ 4) {
    			// check store has fetched content data from GCS
    			 if ($ContentDataStore) {
    				$$invalidate(0, introData = $ContentDataStore["intro"]);
    				$$invalidate(1, themeNum = $ContentDataStore["theme"]);
    			}
    		}
    	};

    	return [introData, themeNum, $ContentDataStore, $ThemeStore];
    }

    class MobileLandingIntro extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MobileLandingIntro",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src/shared/DesktopLandingIntro.svelte generated by Svelte v3.29.4 */
    const file$d = "src/shared/DesktopLandingIntro.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i].text;
    	return child_ctx;
    }

    // (43:0) {#if $ContentDataStore}
    function create_if_block$7(ctx) {
    	let div10;
    	let div0;
    	let svg0;
    	let rect0;
    	let path0;
    	let path1;
    	let path2;
    	let t0;
    	let div1;
    	let svg1;
    	let path3;
    	let path3_fill_value;
    	let t1;
    	let div2;
    	let svg2;
    	let defs;
    	let clipPath;
    	let rect1;
    	let g;
    	let circle;
    	let t2;
    	let div3;
    	let svg3;
    	let rect2;
    	let rect2_fill_value;
    	let t3;
    	let div9;
    	let div6;
    	let div5;
    	let div4;
    	let t4;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t5;
    	let div8;
    	let h1;
    	let t6_value = /*introData*/ ctx[0].title + "";
    	let t6;
    	let t7;
    	let div7;
    	let t8;
    	let button;
    	let t9;
    	let mounted;
    	let dispose;
    	let each_value = /*introData*/ ctx[0].content;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div0 = element("div");
    			svg0 = svg_element("svg");
    			rect0 = svg_element("rect");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			t0 = space();
    			div1 = element("div");
    			svg1 = svg_element("svg");
    			path3 = svg_element("path");
    			t1 = space();
    			div2 = element("div");
    			svg2 = svg_element("svg");
    			defs = svg_element("defs");
    			clipPath = svg_element("clipPath");
    			rect1 = svg_element("rect");
    			g = svg_element("g");
    			circle = svg_element("circle");
    			t2 = space();
    			div3 = element("div");
    			svg3 = svg_element("svg");
    			rect2 = svg_element("rect");
    			t3 = space();
    			div9 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			t4 = space();
    			img = element("img");
    			t5 = space();
    			div8 = element("div");
    			h1 = element("h1");
    			t6 = text(t6_value);
    			t7 = space();
    			div7 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			button = element("button");
    			t9 = text("開始作答");
    			attr_dev(rect0, "id", "rec");
    			attr_dev(rect0, "width", "540");
    			attr_dev(rect0, "height", "720");
    			set_style(rect0, "fill", /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][1]);
    			add_location(rect0, file$d, 45, 82, 1231);
    			attr_dev(path0, "id", "yellow");
    			attr_dev(path0, "d", "M218.34,10.31A134.54,134.54,0,0,1,270,0V271A135.62,135.62,0,0,1,174.54,39.69,134.92,134.92,0,0,1,218.34,10.31ZM675,675,540,540H675Zm-270,0v45H135V675Z");
    			set_style(path0, "fill", /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][2]);
    			set_style(path0, "fill-rule", "evenodd");
    			add_location(path0, file$d, 51, 8, 1370);
    			attr_dev(path1, "id", "darkblue");
    			attr_dev(path1, "d", "M540.08,0h135V405h-135ZM124.72,456.58A134.89,134.89,0,0,0,135,404.92H0v135a134.89,134.89,0,0,0,51.66-10.28,135.06,135.06,0,0,0,43.8-29.26A134.9,134.9,0,0,0,124.72,456.58ZM270,405,540,675V405ZM0,0,135,135V0Z");
    			set_style(path1, "fill", /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][0]);
    			set_style(path1, "fill-rule", "evenodd");
    			add_location(path1, file$d, 56, 8, 1650);
    			attr_dev(path2, "d", "M500.46,230.46A135,135,0,0,1,405,270V0a135,135,0,0,1,95.46,230.46ZM135,404,0,270H135Zm135,0a135.5,135.5,0,0,0,0,271V404Z");
    			set_style(path2, "fill", "#fff");
    			set_style(path2, "fill-rule", "evenodd");
    			add_location(path2, file$d, 61, 8, 1988);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "height", "100%");
    			attr_dev(svg0, "viewBox", "0 0 676 720");
    			add_location(svg0, file$d, 45, 6, 1155);
    			attr_dev(div0, "class", "absolute");
    			set_style(div0, "height", "calc(100vh - 40.56px)");
    			set_style(div0, "max-width", "46.875%");
    			set_style(div0, "overflow", "hidden");
    			add_location(div0, file$d, 44, 4, 1049);
    			attr_dev(path3, "d", "M270.5 0L0 270H270.5V0Z");
    			attr_dev(path3, "fill", path3_fill_value = /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][2]);
    			add_location(path3, file$d, 68, 8, 2375);
    			attr_dev(svg1, "width", "162");
    			attr_dev(svg1, "height", "270");
    			attr_dev(svg1, "viewBox", "0 0 162 270");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file$d, 67, 6, 2267);
    			attr_dev(div1, "class", "absolute");
    			set_style(div1, "right", "0");
    			set_style(div1, "bottom", "20vh");
    			add_location(div1, file$d, 66, 4, 2207);
    			attr_dev(rect1, "width", "270");
    			attr_dev(rect1, "height", "180");
    			set_style(rect1, "fill", "none");
    			add_location(rect1, file$d, 74, 12, 2659);
    			attr_dev(clipPath, "id", "clip-path");
    			add_location(clipPath, file$d, 73, 10, 2621);
    			add_location(defs, file$d, 72, 80, 2604);
    			attr_dev(circle, "cx", "135");
    			attr_dev(circle, "cy", "135");
    			attr_dev(circle, "r", "135");
    			set_style(circle, "fill", /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][1]);
    			add_location(circle, file$d, 78, 10, 2805);
    			set_style(g, "clip-path", "url(#clip-path)");
    			add_location(g, file$d, 77, 8, 2757);
    			attr_dev(svg2, "width", "270");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "viewBox", "0 0 270 180");
    			add_location(svg2, file$d, 72, 6, 2530);
    			attr_dev(div2, "class", "absolute bottom-0");
    			set_style(div2, "right", "30vw");
    			add_location(div2, file$d, 71, 4, 2472);
    			attr_dev(rect2, "x", "270");
    			attr_dev(rect2, "width", "71");
    			attr_dev(rect2, "height", "270");
    			attr_dev(rect2, "transform", "rotate(90 270 0)");
    			attr_dev(rect2, "fill", rect2_fill_value = /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][0]);
    			add_location(rect2, file$d, 83, 8, 3077);
    			attr_dev(svg3, "width", "270");
    			attr_dev(svg3, "height", "71");
    			attr_dev(svg3, "viewBox", "0 0 270 71");
    			attr_dev(svg3, "fill", "none");
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg3, file$d, 82, 6, 2971);
    			attr_dev(div3, "class", "absolute top-0");
    			set_style(div3, "right", "20vw");
    			add_location(div3, file$d, 81, 4, 2916);
    			attr_dev(div4, "class", "absolute bg-black h-full w-full svelte-1eqilmd");
    			attr_dev(div4, "id", "intro-img-shadow");
    			add_location(div4, file$d, 89, 10, 3462);
    			attr_dev(img, "class", "absolute border-4 border-black h-full w-full svelte-1eqilmd");
    			if (img.src !== (img_src_value = /*introData*/ ctx[0].cover_image.url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*introData*/ ctx[0].cover_image.discription);
    			attr_dev(img, "id", "intro-img");
    			add_location(img, file$d, 90, 10, 3542);
    			attr_dev(div5, "class", "relative");
    			set_style(div5, "width", "45.13vw");
    			set_style(div5, "height", "23.62vw");
    			set_style(div5, "margin-left", "10vw");
    			add_location(div5, file$d, 88, 8, 3369);
    			attr_dev(div6, "lass", "flex justify-center items-center intro-img-container");
    			add_location(div6, file$d, 87, 6, 3295);
    			attr_dev(h1, "class", "mx-4");
    			add_location(h1, file$d, 99, 8, 3809);
    			attr_dev(div7, "class", "basic-p-container");
    			add_location(div7, file$d, 100, 8, 3857);
    			attr_dev(button, "class", "block w-64 rounded-lg border text-white text-xl tracking-widest mb-6 py-3 mx-auto shadow-sp svelte-1eqilmd");
    			set_style(button, "background-color", /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][0]);
    			add_location(button, file$d, 105, 8, 4017);
    			attr_dev(div8, "class", "mx-8");
    			add_location(div8, file$d, 98, 6, 3782);
    			attr_dev(div9, "class", "absolute inline-flex justify-center items-center");
    			set_style(div9, "top", "15vh");
    			add_location(div9, file$d, 86, 4, 3207);
    			attr_dev(div10, "class", "relative w-full");
    			set_style(div10, "height", "calc(100vh - 40.56px)");
    			add_location(div10, file$d, 43, 2, 977);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div0);
    			append_dev(div0, svg0);
    			append_dev(svg0, rect0);
    			append_dev(svg0, path0);
    			append_dev(svg0, path1);
    			append_dev(svg0, path2);
    			append_dev(div10, t0);
    			append_dev(div10, div1);
    			append_dev(div1, svg1);
    			append_dev(svg1, path3);
    			append_dev(div10, t1);
    			append_dev(div10, div2);
    			append_dev(div2, svg2);
    			append_dev(svg2, defs);
    			append_dev(defs, clipPath);
    			append_dev(clipPath, rect1);
    			append_dev(svg2, g);
    			append_dev(g, circle);
    			append_dev(div10, t2);
    			append_dev(div10, div3);
    			append_dev(div3, svg3);
    			append_dev(svg3, rect2);
    			append_dev(div10, t3);
    			append_dev(div10, div9);
    			append_dev(div9, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div5, t4);
    			append_dev(div5, img);
    			append_dev(div9, t5);
    			append_dev(div9, div8);
    			append_dev(div8, h1);
    			append_dev(h1, t6);
    			append_dev(div8, t7);
    			append_dev(div8, div7);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div7, null);
    			}

    			append_dev(div8, t8);
    			append_dev(div8, button);
    			append_dev(button, t9);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", handleClick$1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$ThemeStore, themeNum*/ 10) {
    				set_style(rect0, "fill", /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][1]);
    			}

    			if (dirty & /*$ThemeStore, themeNum*/ 10) {
    				set_style(path0, "fill", /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][2]);
    			}

    			if (dirty & /*$ThemeStore, themeNum*/ 10) {
    				set_style(path1, "fill", /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][0]);
    			}

    			if (dirty & /*$ThemeStore, themeNum*/ 10 && path3_fill_value !== (path3_fill_value = /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][2])) {
    				attr_dev(path3, "fill", path3_fill_value);
    			}

    			if (dirty & /*$ThemeStore, themeNum*/ 10) {
    				set_style(circle, "fill", /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][1]);
    			}

    			if (dirty & /*$ThemeStore, themeNum*/ 10 && rect2_fill_value !== (rect2_fill_value = /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][0])) {
    				attr_dev(rect2, "fill", rect2_fill_value);
    			}

    			if (dirty & /*introData*/ 1 && img.src !== (img_src_value = /*introData*/ ctx[0].cover_image.url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*introData*/ 1 && img_alt_value !== (img_alt_value = /*introData*/ ctx[0].cover_image.discription)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*introData*/ 1 && t6_value !== (t6_value = /*introData*/ ctx[0].title + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*introData*/ 1) {
    				each_value = /*introData*/ ctx[0].content;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div7, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*$ThemeStore, themeNum*/ 10) {
    				set_style(button, "background-color", /*$ThemeStore*/ ctx[3][/*themeNum*/ ctx[1]][0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(43:0) {#if $ContentDataStore}",
    		ctx
    	});

    	return block;
    }

    // (102:10) {#each introData.content as { text }}
    function create_each_block$6(ctx) {
    	let p;
    	let t_value = /*text*/ ctx[4] + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "pt-4");
    			add_location(p, file$d, 102, 12, 3949);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*introData*/ 1 && t_value !== (t_value = /*text*/ ctx[4] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(102:10) {#each introData.content as { text }}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let if_block_anchor;
    	let if_block = /*$ContentDataStore*/ ctx[2] && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$ContentDataStore*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$7(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handleClick$1() {
    	document.querySelector("#qa-sections").style.display = "block";
    	document.querySelector("#qa-no-1").scrollIntoView({ behavior: "smooth" });
    	document.querySelector("body").style.overflow = "hidden";
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let $ContentDataStore;
    	let $ThemeStore;
    	validate_store(ContentDataStore, "ContentDataStore");
    	component_subscribe($$self, ContentDataStore, $$value => $$invalidate(2, $ContentDataStore = $$value));
    	validate_store(ThemeStore, "ThemeStore");
    	component_subscribe($$self, ThemeStore, $$value => $$invalidate(3, $ThemeStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DesktopLandingIntro", slots, []);
    	let introData;
    	let themeNum = "1";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DesktopLandingIntro> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		ContentDataStore,
    		ThemeStore,
    		introData,
    		themeNum,
    		handleClick: handleClick$1,
    		$ContentDataStore,
    		$ThemeStore
    	});

    	$$self.$inject_state = $$props => {
    		if ("introData" in $$props) $$invalidate(0, introData = $$props.introData);
    		if ("themeNum" in $$props) $$invalidate(1, themeNum = $$props.themeNum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$ContentDataStore*/ 4) {
    			// check store has fetched content data from GCS
    			 if ($ContentDataStore) {
    				$$invalidate(0, introData = $ContentDataStore["intro"]);
    				$$invalidate(1, themeNum = $ContentDataStore["theme"]);
    			}
    		}
    	};

    	return [introData, themeNum, $ContentDataStore, $ThemeStore];
    }

    class DesktopLandingIntro extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DesktopLandingIntro",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.4 */
    const file$e = "src/App.svelte";

    // (37:6) {:else}
    function create_else_block$4(ctx) {
    	let desktoplandingintro;
    	let current;
    	desktoplandingintro = new DesktopLandingIntro({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(desktoplandingintro.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(desktoplandingintro, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(desktoplandingintro.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(desktoplandingintro.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(desktoplandingintro, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(37:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (35:6) {#if $isMobile}
    function create_if_block_1$4(ctx) {
    	let mobilelandingintro;
    	let current;
    	mobilelandingintro = new MobileLandingIntro({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(mobilelandingintro.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(mobilelandingintro, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mobilelandingintro.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mobilelandingintro.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(mobilelandingintro, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(35:6) {#if $isMobile}",
    		ctx
    	});

    	return block;
    }

    // (46:6) {#if !$isMobile}
    function create_if_block$8(ctx) {
    	let div0;
    	let svg0;
    	let path0;
    	let path0_fill_value;
    	let t0;
    	let div1;
    	let svg1;
    	let path1;
    	let path1_fill_value;
    	let t1;
    	let div2;
    	let svg2;
    	let path2;
    	let path2_fill_value;
    	let t2;
    	let div3;
    	let svg3;
    	let rect;
    	let rect_fill_value;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t0 = space();
    			div1 = element("div");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t1 = space();
    			div2 = element("div");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t2 = space();
    			div3 = element("div");
    			svg3 = svg_element("svg");
    			rect = svg_element("rect");
    			attr_dev(path0, "d", "M-1.00003 272C34.4569 272 69.5666 264.964 102.325 251.295C135.082 237.626 164.847 217.591 189.919 192.333C214.991 167.075 234.879 137.09 248.447 104.09C262.016 71.0893 269 35.7195 269 0L-1.00001 6.91343e-06L-1.00003 272Z");
    			attr_dev(path0, "fill", path0_fill_value = /*$ThemeStore*/ ctx[2][/*themeNum*/ ctx[0]][0]);
    			add_location(path0, file$e, 48, 12, 1490);
    			attr_dev(svg0, "width", "269");
    			attr_dev(svg0, "height", "272");
    			attr_dev(svg0, "viewBox", "0 0 269 272");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg0, file$e, 47, 10, 1378);
    			attr_dev(div0, "class", "absolute left-0 top-0");
    			add_location(div0, file$e, 46, 8, 1332);
    			attr_dev(path1, "d", "M270.5 0L0 270H270.5V0Z");
    			attr_dev(path1, "fill", path1_fill_value = /*$ThemeStore*/ ctx[2][/*themeNum*/ ctx[0]][2]);
    			add_location(path1, file$e, 56, 12, 1998);
    			attr_dev(svg1, "width", "162");
    			attr_dev(svg1, "height", "270");
    			attr_dev(svg1, "viewBox", "0 0 162 270");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg1, file$e, 55, 10, 1886);
    			attr_dev(div1, "class", "absolute right-0 bottom-0");
    			add_location(div1, file$e, 54, 8, 1836);
    			attr_dev(path2, "d", "M227 0C197.19 -3.56265e-07 167.672 5.88446 140.131 17.3174C112.59 28.7504 87.5657 45.5079 66.4868 66.6332C45.4079 87.7585 28.6872 112.838 17.2793 140.44C5.87153 168.041 -9.47558e-07 197.624 0 227.5C9.47558e-07 257.376 5.87153 286.959 17.2794 314.56C28.6872 342.162 45.4079 367.241 66.4868 388.367C87.5657 409.492 112.59 426.25 140.131 437.683C167.672 449.116 197.19 455 227 455L227 227.5V0Z");
    			attr_dev(path2, "fill", path2_fill_value = /*$ThemeStore*/ ctx[2][/*themeNum*/ ctx[0]][2]);
    			add_location(path2, file$e, 61, 12, 2286);
    			attr_dev(svg2, "width", "227");
    			attr_dev(svg2, "height", "455");
    			attr_dev(svg2, "viewBox", "0 0 227 455");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg2, file$e, 60, 10, 2174);
    			attr_dev(div2, "class", "absolute");
    			set_style(div2, "bottom", "20vh");
    			set_style(div2, "left", "19vw");
    			add_location(div2, file$e, 59, 8, 2107);
    			attr_dev(rect, "y", "240");
    			attr_dev(rect, "width", "240");
    			attr_dev(rect, "height", "814");
    			attr_dev(rect, "transform", "rotate(-90 0 240)");
    			attr_dev(rect, "fill", rect_fill_value = /*$ThemeStore*/ ctx[2][/*themeNum*/ ctx[0]][1]);
    			add_location(rect, file$e, 69, 12, 2977);
    			attr_dev(svg3, "width", "814");
    			attr_dev(svg3, "height", "240");
    			attr_dev(svg3, "viewBox", "0 0 814 240");
    			attr_dev(svg3, "fill", "none");
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg3, file$e, 68, 10, 2865);
    			attr_dev(div3, "class", "absolute right-0");
    			set_style(div3, "bottom", "50vh");
    			add_location(div3, file$e, 67, 8, 2802);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, svg0);
    			append_dev(svg0, path0);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, svg1);
    			append_dev(svg1, path1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, svg2);
    			append_dev(svg2, path2);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, svg3);
    			append_dev(svg3, rect);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$ThemeStore, themeNum*/ 5 && path0_fill_value !== (path0_fill_value = /*$ThemeStore*/ ctx[2][/*themeNum*/ ctx[0]][0])) {
    				attr_dev(path0, "fill", path0_fill_value);
    			}

    			if (dirty & /*$ThemeStore, themeNum*/ 5 && path1_fill_value !== (path1_fill_value = /*$ThemeStore*/ ctx[2][/*themeNum*/ ctx[0]][2])) {
    				attr_dev(path1, "fill", path1_fill_value);
    			}

    			if (dirty & /*$ThemeStore, themeNum*/ 5 && path2_fill_value !== (path2_fill_value = /*$ThemeStore*/ ctx[2][/*themeNum*/ ctx[0]][2])) {
    				attr_dev(path2, "fill", path2_fill_value);
    			}

    			if (dirty & /*$ThemeStore, themeNum*/ 5 && rect_fill_value !== (rect_fill_value = /*$ThemeStore*/ ctx[2][/*themeNum*/ ctx[0]][1])) {
    				attr_dev(rect, "fill", rect_fill_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(46:6) {#if !$isMobile}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let mobiledetector;
    	let t0;
    	let header;
    	let t1;
    	let main;
    	let article;
    	let section0;
    	let current_block_type_index;
    	let if_block0;
    	let t2;
    	let section1;
    	let t3;
    	let qasections;
    	let current;
    	mobiledetector = new MobileDetector({ $$inline: true });
    	header = new Header({ $$inline: true });
    	const if_block_creators = [create_if_block_1$4, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$isMobile*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = !/*$isMobile*/ ctx[1] && create_if_block$8(ctx);
    	qasections = new QASections({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(mobiledetector.$$.fragment);
    			t0 = space();
    			create_component(header.$$.fragment);
    			t1 = space();
    			main = element("main");
    			article = element("article");
    			section0 = element("section");
    			if_block0.c();
    			t2 = space();
    			section1 = element("section");
    			if (if_block1) if_block1.c();
    			t3 = space();
    			create_component(qasections.$$.fragment);
    			attr_dev(section0, "class", "container-width mx-auto grid-full-cols svelte-gu3le");
    			add_location(section0, file$e, 33, 4, 971);
    			attr_dev(section1, "class", "relative container-width mx-auto grid-full-cols overflow-hidden svelte-gu3le");
    			attr_dev(section1, "id", "qa-sections");
    			set_style(section1, "display", "none");
    			add_location(section1, file$e, 40, 4, 1158);
    			attr_dev(article, "class", "main-grid-template");
    			add_location(article, file$e, 32, 2, 930);
    			attr_dev(main, "class", "bg-white");
    			add_location(main, file$e, 31, 0, 904);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(mobiledetector, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(header, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, article);
    			append_dev(article, section0);
    			if_blocks[current_block_type_index].m(section0, null);
    			append_dev(article, t2);
    			append_dev(article, section1);
    			if (if_block1) if_block1.m(section1, null);
    			append_dev(section1, t3);
    			mount_component(qasections, section1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(section0, null);
    			}

    			if (!/*$isMobile*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$8(ctx);
    					if_block1.c();
    					if_block1.m(section1, t3);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mobiledetector.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(qasections.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mobiledetector.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(qasections.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(mobiledetector, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
    			destroy_component(qasections);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let $ContentDataStore;
    	let $isMobile;
    	let $ThemeStore;
    	validate_store(ContentDataStore, "ContentDataStore");
    	component_subscribe($$self, ContentDataStore, $$value => $$invalidate(3, $ContentDataStore = $$value));
    	validate_store(isMobile, "isMobile");
    	component_subscribe($$self, isMobile, $$value => $$invalidate(1, $isMobile = $$value));
    	validate_store(ThemeStore, "ThemeStore");
    	component_subscribe($$self, ThemeStore, $$value => $$invalidate(2, $ThemeStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let themeNum = "1";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Header,
    		MobileDetector,
    		QAsections: QASections,
    		BasicParagraphs,
    		ArticleList,
    		MobileLandingIntro,
    		DesktopLandingIntro,
    		QAStatus,
    		isMobile,
    		ThemeStore,
    		ContentDataStore,
    		themeNum,
    		$ContentDataStore,
    		$isMobile,
    		$ThemeStore
    	});

    	$$self.$inject_state = $$props => {
    		if ("themeNum" in $$props) $$invalidate(0, themeNum = $$props.themeNum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$ContentDataStore*/ 8) {
    			 if ($ContentDataStore) {
    				$$invalidate(0, themeNum = $ContentDataStore["theme"]);
    			}
    		}
    	};

    	return [themeNum, $isMobile, $ThemeStore];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
