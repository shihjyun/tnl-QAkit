
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
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
    				shareUrl: /*shareUrl*/ ctx[1],
    				tnlDomainPageId: /*tnlDomainPageId*/ ctx[2],
    				socialIconColor: /*socialIconColor*/ ctx[3]
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
    			add_location(img, file$1, 19, 8, 437);
    			attr_dev(figure, "class", "ml-2");
    			add_location(figure, file$1, 18, 6, 407);
    			attr_dev(a, "href", /*homePageUrl*/ ctx[0]);
    			add_location(a, file$1, 17, 4, 378);
    			attr_dev(div0, "class", "inline-block");
    			add_location(div0, file$1, 16, 2, 347);
    			attr_dev(div1, "class", "inline-block");
    			add_location(div1, file$1, 23, 2, 576);
    			attr_dev(header, "class", "flex justify-between bg-white py-2 px-2 shadow");
    			add_location(header, file$1, 15, 0, 281);
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
    			if (dirty & /*shareUrl*/ 2) socialbox_changes.shareUrl = /*shareUrl*/ ctx[1];
    			if (dirty & /*tnlDomainPageId*/ 4) socialbox_changes.tnlDomainPageId = /*tnlDomainPageId*/ ctx[2];
    			if (dirty & /*socialIconColor*/ 8) socialbox_changes.socialIconColor = /*socialIconColor*/ ctx[3];
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	let { homePageUrl = "https://www.thenewslens.com/" } = $$props;
    	let { shareUrl = "#" } = $$props;
    	let { tnlDomainPageId = "#" } = $$props;
    	let { socialIconColor = "#807F80" } = $$props;
    	const writable_props = ["homePageUrl", "shareUrl", "tnlDomainPageId", "socialIconColor"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("homePageUrl" in $$props) $$invalidate(0, homePageUrl = $$props.homePageUrl);
    		if ("shareUrl" in $$props) $$invalidate(1, shareUrl = $$props.shareUrl);
    		if ("tnlDomainPageId" in $$props) $$invalidate(2, tnlDomainPageId = $$props.tnlDomainPageId);
    		if ("socialIconColor" in $$props) $$invalidate(3, socialIconColor = $$props.socialIconColor);
    	};

    	$$self.$capture_state = () => ({
    		SocialBox,
    		homePageUrl,
    		shareUrl,
    		tnlDomainPageId,
    		socialIconColor
    	});

    	$$self.$inject_state = $$props => {
    		if ("homePageUrl" in $$props) $$invalidate(0, homePageUrl = $$props.homePageUrl);
    		if ("shareUrl" in $$props) $$invalidate(1, shareUrl = $$props.shareUrl);
    		if ("tnlDomainPageId" in $$props) $$invalidate(2, tnlDomainPageId = $$props.tnlDomainPageId);
    		if ("socialIconColor" in $$props) $$invalidate(3, socialIconColor = $$props.socialIconColor);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [homePageUrl, shareUrl, tnlDomainPageId, socialIconColor];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			homePageUrl: 0,
    			shareUrl: 1,
    			tnlDomainPageId: 2,
    			socialIconColor: 3
    		});

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

    	get shareUrl() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shareUrl(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tnlDomainPageId() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tnlDomainPageId(value) {
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
    	let { minWidth = 500 } = $$props;

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
        sectionHeightList.push(sections[i].style.height);
      }
      return(sectionHeightList.map(d => +d.replace('px', '')))
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

    const contentDataUrl = 'https://datastore.thenewslens.com/infographic/QA-AIDS-2020/QA-AIDS-2020.json?s2w12sww';

    const ContentDataStore = writable(null, async set => {
      const res = await fetch(contentDataUrl);
      const data = await res.json();
      console.log(data);
      set(data);
      return () => {};
    });

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

    /* src/shared/TeamCreatorList.svelte generated by Svelte v3.29.4 */

    const file$4 = "src/shared/TeamCreatorList.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i].work;
    	child_ctx[5] = list[i].name;
    	return child_ctx;
    }

    // (31:6) {#each creators as { work, name }}
    function create_each_block$1(ctx) {
    	let div0;
    	let t0_value = /*work*/ ctx[4] + "";
    	let t0;
    	let t1;
    	let div1;
    	let html_tag;
    	let raw_value = /*name*/ ctx[5] + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			attr_dev(div0, "class", "col-start-1 col-end-2 ml-auto pt-1");
    			add_location(div0, file$4, 31, 8, 847);
    			html_tag = new HtmlTag(t2);
    			attr_dev(div1, "class", "col-start-2 col-end-3 mr-auto pt-1");
    			set_style(div1, "word-break", "keep-all");
    			add_location(div1, file$4, 32, 8, 916);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			html_tag.m(raw_value, div1);
    			append_dev(div1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*creators*/ 4 && t0_value !== (t0_value = /*work*/ ctx[4] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*creators*/ 4 && raw_value !== (raw_value = /*name*/ ctx[5] + "")) html_tag.p(raw_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(31:6) {#each creators as { work, name }}",
    		ctx
    	});

    	return block;
    }

    // (38:4) {#if !englishVersion}
    function create_if_block$2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "（姓名依筆劃排序）";
    			attr_dev(span, "class", "block text-sm sm:text-base mt-3");
    			add_location(span, file$4, 37, 25, 1083);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(38:4) {#if !englishVersion}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div2;
    	let div1;
    	let h4;
    	let t1;
    	let div0;
    	let t2;
    	let each_value = /*creators*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	let if_block = !/*englishVersion*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			h4 = element("h4");
    			h4.textContent = `${/*teamText*/ ctx[3]}`;
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(h4, "class", "text-lg sm:text-2xl leading-normal tracking-wide text-white font-light pb-3");
    			add_location(h4, file$4, 28, 4, 599);
    			attr_dev(div0, "class", "creator-grid inline-block text-left text-sm sm:text-base px-4 content-center svelte-7pxywl");
    			add_location(div0, file$4, 29, 4, 707);
    			attr_dev(div1, "class", "text-center text-white font-light pt-6 pb-6");
    			add_location(div1, file$4, 27, 2, 537);
    			attr_dev(div2, "class", "mx-auto");
    			set_style(div2, "background-color", /*bgColor*/ ctx[0]);
    			add_location(div2, file$4, 26, 0, 476);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, h4);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div1, t2);
    			if (if_block) if_block.m(div1, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*creators*/ 4) {
    				each_value = /*creators*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (!/*englishVersion*/ ctx[1]) {
    				if (if_block) ; else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*bgColor*/ 1) {
    				set_style(div2, "background-color", /*bgColor*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
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

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TeamCreatorList", slots, []);
    	let { bgColor = "#4D4D4D" } = $$props;
    	let { englishVersion = false } = $$props;

    	let { creators = [
    		{
    			work: "製作",
    			name: ["Steven Yeo、Steven Yeo"]
    		},
    		{
    			work: "監製",
    			name: ["Steven Yeo、Steven Yeo"]
    		}
    	] } = $$props;

    	const teamText = englishVersion ? "Production Team" : "製作團隊";
    	const writable_props = ["bgColor", "englishVersion", "creators"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TeamCreatorList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("bgColor" in $$props) $$invalidate(0, bgColor = $$props.bgColor);
    		if ("englishVersion" in $$props) $$invalidate(1, englishVersion = $$props.englishVersion);
    		if ("creators" in $$props) $$invalidate(2, creators = $$props.creators);
    	};

    	$$self.$capture_state = () => ({
    		bgColor,
    		englishVersion,
    		creators,
    		teamText
    	});

    	$$self.$inject_state = $$props => {
    		if ("bgColor" in $$props) $$invalidate(0, bgColor = $$props.bgColor);
    		if ("englishVersion" in $$props) $$invalidate(1, englishVersion = $$props.englishVersion);
    		if ("creators" in $$props) $$invalidate(2, creators = $$props.creators);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [bgColor, englishVersion, creators, teamText];
    }

    class TeamCreatorList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			bgColor: 0,
    			englishVersion: 1,
    			creators: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TeamCreatorList",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get bgColor() {
    		throw new Error("<TeamCreatorList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<TeamCreatorList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get englishVersion() {
    		throw new Error("<TeamCreatorList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set englishVersion(value) {
    		throw new Error("<TeamCreatorList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get creators() {
    		throw new Error("<TeamCreatorList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set creators(value) {
    		throw new Error("<TeamCreatorList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/shared/AnswerMessage.svelte generated by Svelte v3.29.4 */

    const file$5 = "src/shared/AnswerMessage.svelte";

    // (38:0) {:else}
    function create_else_block$1(ctx) {
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
    			add_location(circle0, file$5, 40, 93, 1783);
    			attr_dev(path0, "d", "M6,7.2,7.2,6A.61.61,0,0,1,8,6l3,3,3-3a.61.61,0,0,1,.8,0L16,7.2A.61.61,0,0,1,16,8l-3,3,3,3a.61.61,0,0,1,0,.8L14.8,16a.61.61,0,0,1-.8,0l-3-3L8,16a.61.61,0,0,1-.8,0L6,14.8A.61.61,0,0,1,6,14l3-3L6,8A.61.61,0,0,1,6,7.2Z");
    			set_style(path0, "fill", "#fff");
    			add_location(path0, file$5, 46, 8, 1894);
    			attr_dev(svg0, "width", "22px");
    			attr_dev(svg0, "height", "22px");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "viewBox", "0 0 22 22");
    			add_location(svg0, file$5, 40, 6, 1696);
    			attr_dev(span0, "class", "mx-3 svelte-8ubhnr");
    			add_location(span0, file$5, 39, 4, 1670);
    			attr_dev(span1, "class", "text-lg font-black svelte-8ubhnr");
    			add_location(span1, file$5, 51, 4, 2190);
    			attr_dev(circle1, "cx", "11");
    			attr_dev(circle1, "cy", "11");
    			attr_dev(circle1, "r", "11");
    			set_style(circle1, "fill", "#dd4b4b");
    			add_location(circle1, file$5, 53, 93, 2351);
    			attr_dev(path1, "d", "M6,7.2,7.2,6A.61.61,0,0,1,8,6l3,3,3-3a.61.61,0,0,1,.8,0L16,7.2A.61.61,0,0,1,16,8l-3,3,3,3a.61.61,0,0,1,0,.8L14.8,16a.61.61,0,0,1-.8,0l-3-3L8,16a.61.61,0,0,1-.8,0L6,14.8A.61.61,0,0,1,6,14l3-3L6,8A.61.61,0,0,1,6,7.2Z");
    			set_style(path1, "fill", "#fff");
    			add_location(path1, file$5, 59, 8, 2462);
    			attr_dev(svg1, "width", "22px");
    			attr_dev(svg1, "height", "22px");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "viewBox", "0 0 22 22");
    			add_location(svg1, file$5, 53, 6, 2264);
    			attr_dev(span2, "class", "mx-3 svelte-8ubhnr");
    			add_location(span2, file$5, 52, 4, 2238);
    			attr_dev(div, "class", "flex justify-between items-center mx-3 mt-8 pb-2 svelte-8ubhnr");
    			add_location(div, file$5, 38, 2, 1603);
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(38:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:0) {#if explainStatus === 'explain_correct'}
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
    			add_location(path0, file$5, 16, 93, 403);
    			attr_dev(path1, "d", "M9.7,16.8l8.2-8.2a.67.67,0,0,0,0-1l-1-1a.67.67,0,0,0-1,0L9.2,13.3,6.1,10.2a.67.67,0,0,0-1,0l-1,1a.67.67,0,0,0,0,1l4.6,4.6A.67.67,0,0,0,9.7,16.8Z");
    			set_style(path1, "fill", "#fff");
    			add_location(path1, file$5, 20, 8, 689);
    			attr_dev(svg0, "width", "22px");
    			attr_dev(svg0, "height", "22px");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "viewBox", "0 0 22 22");
    			add_location(svg0, file$5, 16, 6, 316);
    			attr_dev(span0, "class", "mx-3 svelte-8ubhnr");
    			add_location(span0, file$5, 15, 4, 290);
    			attr_dev(span1, "class", "text-lg font-black svelte-8ubhnr");
    			add_location(span1, file$5, 25, 4, 915);
    			attr_dev(path2, "d", "M20.7,5.8A10.87,10.87,0,0,0,18,2.5,10.7,10.7,0,0,0,11,0,11,11,0,0,0,0,11a10.7,10.7,0,0,0,2.5,7,11.8,11.8,0,0,0,3.2,2.7A11.86,11.86,0,0,0,11,22a11.12,11.12,0,0,0,5.2-1.3,11,11,0,0,0,4.4-4.4,11.65,11.65,0,0,0,.1-10.5Z");
    			set_style(path2, "fill", "#1ad71a");
    			add_location(path2, file$5, 27, 93, 1076);
    			attr_dev(path3, "d", "M9.7,16.8l8.2-8.2a.67.67,0,0,0,0-1l-1-1a.67.67,0,0,0-1,0L9.2,13.3,6.1,10.2a.67.67,0,0,0-1,0l-1,1a.67.67,0,0,0,0,1l4.6,4.6A.67.67,0,0,0,9.7,16.8Z");
    			set_style(path3, "fill", "#fff");
    			add_location(path3, file$5, 31, 8, 1362);
    			attr_dev(svg1, "width", "22px");
    			attr_dev(svg1, "height", "22px");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "viewBox", "0 0 22 22");
    			add_location(svg1, file$5, 27, 6, 989);
    			attr_dev(span2, "class", "mx-3 svelte-8ubhnr");
    			add_location(span2, file$5, 26, 4, 963);
    			attr_dev(div, "class", "flex justify-between items-center mx-3 mt-8 pb-2 svelte-8ubhnr");
    			add_location(div, file$5, 14, 2, 223);
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
    		source: "(14:0) {#if explainStatus === 'explain_correct'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*explainStatus*/ ctx[0] === "explain_correct") return create_if_block$3;
    		return create_else_block$1;
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { explainStatus: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AnswerMessage",
    			options,
    			id: create_fragment$6.name
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

    /* src/shared/AnswerHeader.svelte generated by Svelte v3.29.4 */

    const { console: console_1$1 } = globals;
    const file$6 = "src/shared/AnswerHeader.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i].question_number;
    	child_ctx[4] = list[i].status;
    	return child_ctx;
    }

    // (27:4) {#if $QAProgressArray}
    function create_if_block$4(ctx) {
    	let each_1_anchor;
    	let each_value = /*$QAProgressArray*/ ctx[2];
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
    			if (dirty & /*$QAProgressArray, progressColorChecker, questNumber*/ 5) {
    				each_value = /*$QAProgressArray*/ ctx[2];
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
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(27:4) {#if $QAProgressArray}",
    		ctx
    	});

    	return block;
    }

    // (36:8) {:else}
    function create_else_block$2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "rounded-full h-4 w-4 mx-2 border-2 border-black");
    			set_style(div, "background-color", progressColorChecker(/*status*/ ctx[4]));
    			add_location(div, file$6, 36, 10, 1094);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$QAProgressArray*/ 4) {
    				set_style(div, "background-color", progressColorChecker(/*status*/ ctx[4]));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(36:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (29:8) {#if +question_number == +questNumber}
    function create_if_block_1$1(ctx) {
    	let div1;
    	let div0;
    	let t;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = space();
    			attr_dev(div0, "class", "rounded-full bg-black h-4 w-4");

    			set_style(div0, "background-color", /*status*/ ctx[4] === "unanswered"
    			? "#000000"
    			: progressColorChecker(/*status*/ ctx[4]));

    			add_location(div0, file$6, 30, 12, 870);
    			attr_dev(div1, "class", "flex justify-center items-center rounded-full h-6 w-6 mx-2 border-2 border-black");
    			add_location(div1, file$6, 29, 10, 763);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$QAProgressArray*/ 4) {
    				set_style(div0, "background-color", /*status*/ ctx[4] === "unanswered"
    				? "#000000"
    				: progressColorChecker(/*status*/ ctx[4]));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(29:8) {#if +question_number == +questNumber}",
    		ctx
    	});

    	return block;
    }

    // (28:6) {#each $QAProgressArray as { question_number, status }}
    function create_each_block$2(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (+/*question_number*/ ctx[3] == +/*questNumber*/ ctx[0]) return create_if_block_1$1;
    		return create_else_block$2;
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
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(28:6) {#each $QAProgressArray as { question_number, status }}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let div4;
    	let div2;
    	let svg;
    	let path;
    	let t1;
    	let div3;
    	let span;
    	let t2;
    	let t3;
    	let t4;
    	let if_block = /*$QAProgressArray*/ ctx[2] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			div4 = element("div");
    			div2 = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t1 = space();
    			div3 = element("div");
    			span = element("span");
    			t2 = text(/*questNumber*/ ctx[0]);
    			t3 = text("/");
    			t4 = text(/*maxQuestion*/ ctx[1]);
    			attr_dev(div0, "class", "flex justify-between items-center progress mx-auto svelte-x28mq0");
    			add_location(div0, file$6, 25, 2, 552);
    			attr_dev(div1, "class", "text-center border-b-2 border-black mt-6 mb-2 pb-3 mx-3");
    			add_location(div1, file$6, 24, 0, 480);
    			attr_dev(path, "d", "M7.856 0.0399995C9.088 0.0399995 10.184 0.256 11.144 0.688C12.104 1.12 12.912 1.704 13.568 2.44C14.224 3.176 14.72 4.032 15.056 5.008C15.408 5.984 15.584 7.008 15.584 8.08C15.584 9.104 15.432 10.096 15.128 11.056C14.824 12 14.368 12.848 13.76 13.6C13.168 14.336 12.432 14.944 11.552 15.424C10.672 15.904 9.656 16.176 8.504 16.24C9.32 16.256 10.04 16.352 10.664 16.528C11.288 16.72 11.872 16.92 12.416 17.128C12.976 17.352 13.528 17.552 14.072 17.728C14.616 17.904 15.2 17.992 15.824 17.992C16.048 17.992 16.312 17.96 16.616 17.896C16.936 17.848 17.272 17.72 17.624 17.512L17.696 17.56L18.032 18.232L18.008 18.328C17.64 18.792 17.192 19.184 16.664 19.504C16.136 19.824 15.544 19.984 14.888 19.984C14.344 19.984 13.784 19.856 13.208 19.6C12.648 19.36 12.056 19.088 11.432 18.784C10.808 18.496 10.16 18.224 9.488 17.968C8.816 17.728 8.112 17.608 7.376 17.608C6.752 17.608 6.144 17.712 5.552 17.92C4.976 18.128 4.552 18.352 4.28 18.592L4.208 18.568L3.944 17.632L3.968 17.56C4.32 17.32 4.792 17.056 5.384 16.768C5.976 16.48 6.616 16.312 7.304 16.264C6.12 16.248 5.08 16.024 4.184 15.592C3.288 15.16 2.536 14.584 1.928 13.864C1.336 13.128 0.888 12.28 0.584 11.32C0.28 10.36 0.128 9.344 0.128 8.272C0.128 7.136 0.304 6.072 0.656 5.08C1.008 4.072 1.512 3.2 2.168 2.464C2.824 1.712 3.632 1.12 4.592 0.688C5.552 0.256 6.64 0.0399995 7.856 0.0399995ZM7.832 14.272C8.616 14.272 9.312 14.112 9.92 13.792C10.544 13.456 11.064 13.016 11.48 12.472C11.896 11.912 12.216 11.264 12.44 10.528C12.664 9.776 12.776 8.976 12.776 8.128C12.776 7.264 12.656 6.464 12.416 5.728C12.192 4.976 11.856 4.328 11.408 3.784C10.976 3.24 10.448 2.816 9.824 2.512C9.2 2.192 8.496 2.032 7.712 2.032C6.944 2.032 6.264 2.184 5.672 2.488C5.08 2.792 4.584 3.216 4.184 3.76C3.784 4.304 3.48 4.952 3.272 5.704C3.064 6.44 2.96 7.24 2.96 8.104C2.96 9.048 3.08 9.904 3.32 10.672C3.56 11.424 3.896 12.072 4.328 12.616C4.76 13.144 5.272 13.552 5.864 13.84C6.456 14.128 7.112 14.272 7.832 14.272Z");
    			attr_dev(path, "fill", "black");
    			add_location(path, file$6, 48, 6, 1475);
    			attr_dev(svg, "width", "19");
    			attr_dev(svg, "height", "20");
    			attr_dev(svg, "viewBox", "0 0 19 20");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$6, 47, 4, 1373);
    			add_location(div2, file$6, 46, 2, 1363);
    			attr_dev(span, "class", "text-xs tracking-wider text-white mx-2 my-1");
    			add_location(span, file$6, 55, 4, 3519);
    			attr_dev(div3, "class", "bg-black");
    			add_location(div3, file$6, 54, 2, 3492);
    			attr_dev(div4, "class", "flex justify-between items-center mx-3 mt-1");
    			add_location(div4, file$6, 45, 0, 1303);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if (if_block) if_block.m(div0, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div2);
    			append_dev(div2, svg);
    			append_dev(svg, path);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, span);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			append_dev(span, t4);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$QAProgressArray*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*questNumber*/ 1) set_data_dev(t2, /*questNumber*/ ctx[0]);
    			if (dirty & /*maxQuestion*/ 2) set_data_dev(t4, /*maxQuestion*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div4);
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

    function progressColorChecker(status) {
    	if (status == "correct") {
    		return "#1AD71A";
    	} else if (status == "wrong") {
    		return "#FF0000";
    	} else if (status == "unanswered") {
    		return "#FFFFFF";
    	}
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $QAProgressArray;
    	validate_store(QAProgressArray, "QAProgressArray");
    	component_subscribe($$self, QAProgressArray, $$value => $$invalidate(2, $QAProgressArray = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AnswerHeader", slots, []);
    	let { questNumber } = $$props;
    	let { maxQuestion } = $$props;
    	const writable_props = ["questNumber", "maxQuestion"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<AnswerHeader> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("questNumber" in $$props) $$invalidate(0, questNumber = $$props.questNumber);
    		if ("maxQuestion" in $$props) $$invalidate(1, maxQuestion = $$props.maxQuestion);
    	};

    	$$self.$capture_state = () => ({
    		QAProgressArray,
    		questNumber,
    		maxQuestion,
    		progressColorChecker,
    		$QAProgressArray
    	});

    	$$self.$inject_state = $$props => {
    		if ("questNumber" in $$props) $$invalidate(0, questNumber = $$props.questNumber);
    		if ("maxQuestion" in $$props) $$invalidate(1, maxQuestion = $$props.maxQuestion);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$QAProgressArray*/ 4) {
    			 console.log("header", $QAProgressArray);
    		}
    	};

    	return [questNumber, maxQuestion, $QAProgressArray];
    }

    class AnswerHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { questNumber: 0, maxQuestion: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AnswerHeader",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*questNumber*/ ctx[0] === undefined && !("questNumber" in props)) {
    			console_1$1.warn("<AnswerHeader> was created without expected prop 'questNumber'");
    		}

    		if (/*maxQuestion*/ ctx[1] === undefined && !("maxQuestion" in props)) {
    			console_1$1.warn("<AnswerHeader> was created without expected prop 'maxQuestion'");
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
    }

    /* src/shared/QATemplate.svelte generated by Svelte v3.29.4 */
    const file$7 = "src/shared/QATemplate.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i].discription;
    	child_ctx[11] = list[i].correct;
    	child_ctx[12] = list[i].i;
    	return child_ctx;
    }

    // (103:0) {#if $ContentDataStore}
    function create_if_block$5(ctx) {
    	let div3;
    	let div2;
    	let answerheader;
    	let t0;
    	let div0;
    	let t1_value = /*QASet*/ ctx[3].question + "";
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let current;

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

    	let if_block = /*userHasClickedAnswer*/ ctx[4] && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			create_component(answerheader.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "noselect QA-question-font py-2 px-3 mt-2 svelte-rcqz8q");
    			add_location(div0, file$7, 106, 6, 3431);
    			attr_dev(div1, "class", "mt-8");
    			add_location(div1, file$7, 107, 6, 3514);
    			attr_dev(div2, "class", "w-full");
    			add_location(div2, file$7, 104, 4, 3353);
    			attr_dev(div3, "class", "QA-wrapper rounded-2xl border-4 border-black mx-auto");
    			add_location(div3, file$7, 103, 2, 3282);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			mount_component(answerheader, div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, div0);
    			append_dev(div0, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div2, t3);
    			if (if_block) if_block.m(div2, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const answerheader_changes = {};
    			if (dirty & /*questNumber*/ 1) answerheader_changes.questNumber = /*questNumber*/ ctx[0];
    			if (dirty & /*maxQuestion*/ 2) answerheader_changes.maxQuestion = /*maxQuestion*/ ctx[1];
    			answerheader.$set(answerheader_changes);
    			if ((!current || dirty & /*QASet*/ 8) && t1_value !== (t1_value = /*QASet*/ ctx[3].question + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*answerType, QASet, checkAnswer*/ 200) {
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
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*userHasClickedAnswer*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*userHasClickedAnswer*/ 16) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div2, null);
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
    			transition_in(answerheader.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(answerheader.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(answerheader);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(103:0) {#if $ContentDataStore}",
    		ctx
    	});

    	return block;
    }

    // (109:8) {#each QASet.answer as { discription, correct, i }}
    function create_each_block$3(ctx) {
    	let div;
    	let t0_value = /*discription*/ ctx[10] + "";
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
    			attr_dev(div, "class", div_class_value = "" + (/*answerType*/ ctx[6] + " rounded-2xl py-3 px-3 mb-3 cursor-pointer mx-3 answer-hover" + " svelte-rcqz8q"));
    			attr_dev(div, "data-correct", div_data_correct_value = /*correct*/ ctx[11]);
    			attr_dev(div, "answer-index", div_answer_index_value = /*i*/ ctx[12]);
    			add_location(div, file$7, 109, 10, 3603);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*checkAnswer*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*QASet*/ 8 && t0_value !== (t0_value = /*discription*/ ctx[10] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*QASet*/ 8 && div_data_correct_value !== (div_data_correct_value = /*correct*/ ctx[11])) {
    				attr_dev(div, "data-correct", div_data_correct_value);
    			}

    			if (dirty & /*QASet*/ 8 && div_answer_index_value !== (div_answer_index_value = /*i*/ ctx[12])) {
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
    		source: "(109:8) {#each QASet.answer as { discription, correct, i }}",
    		ctx
    	});

    	return block;
    }

    // (120:6) {#if userHasClickedAnswer}
    function create_if_block_1$2(ctx) {
    	let answermessage;
    	let t0;
    	let div0;
    	let raw_value = /*QASet*/ ctx[3][/*explainStatus*/ ctx[2]] + "";
    	let t1;
    	let div1;
    	let current;

    	answermessage = new AnswerMessage({
    			props: { explainStatus: /*explainStatus*/ ctx[2] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(answermessage.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "下一題";
    			attr_dev(div0, "class", "noselect text-left text-base border-b-2 border-black pt-6 pb-6 mx-3 svelte-rcqz8q");
    			add_location(div0, file$7, 121, 8, 3967);
    			attr_dev(div1, "class", "text-center text-xs my-2");
    			add_location(div1, file$7, 124, 8, 4111);
    		},
    		m: function mount(target, anchor) {
    			mount_component(answermessage, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			div0.innerHTML = raw_value;
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const answermessage_changes = {};
    			if (dirty & /*explainStatus*/ 4) answermessage_changes.explainStatus = /*explainStatus*/ ctx[2];
    			answermessage.$set(answermessage_changes);
    			if ((!current || dirty & /*QASet, explainStatus*/ 12) && raw_value !== (raw_value = /*QASet*/ ctx[3][/*explainStatus*/ ctx[2]] + "")) div0.innerHTML = raw_value;		},
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
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(120:6) {#if userHasClickedAnswer}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$ContentDataStore*/ ctx[5] && create_if_block$5(ctx);

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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $ContentDataStore;
    	let $RightAnswerCalc;
    	validate_store(ContentDataStore, "ContentDataStore");
    	component_subscribe($$self, ContentDataStore, $$value => $$invalidate(5, $ContentDataStore = $$value));
    	validate_store(RightAnswerCalc, "RightAnswerCalc");
    	component_subscribe($$self, RightAnswerCalc, $$value => $$invalidate(9, $RightAnswerCalc = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("QATemplate", slots, []);
    	let { questNumber } = $$props;
    	let { maxQuestion } = $$props;
    	let explainStatus, QASet, Answers;
    	let answerType = "answer-normal";
    	let userHasClickedAnswer = false;

    	function checkAnswer(e) {
    		const selectedAnswer = e.target.dataset.correct;
    		$$invalidate(8, Answers = e.target.parentElement.children);

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
    				$$invalidate(8, Answers[i].style.opacity = 0.3, Answers);
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
    		questNumber,
    		maxQuestion,
    		explainStatus,
    		QASet,
    		Answers,
    		answerType,
    		userHasClickedAnswer,
    		checkAnswer,
    		$ContentDataStore,
    		$RightAnswerCalc
    	});

    	$$self.$inject_state = $$props => {
    		if ("questNumber" in $$props) $$invalidate(0, questNumber = $$props.questNumber);
    		if ("maxQuestion" in $$props) $$invalidate(1, maxQuestion = $$props.maxQuestion);
    		if ("explainStatus" in $$props) $$invalidate(2, explainStatus = $$props.explainStatus);
    		if ("QASet" in $$props) $$invalidate(3, QASet = $$props.QASet);
    		if ("Answers" in $$props) $$invalidate(8, Answers = $$props.Answers);
    		if ("answerType" in $$props) $$invalidate(6, answerType = $$props.answerType);
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

    		if ($$self.$$.dirty & /*userHasClickedAnswer, Answers*/ 272) {
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
    		answerType,
    		checkAnswer
    	];
    }

    class QATemplate extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { questNumber: 0, maxQuestion: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QATemplate",
    			options,
    			id: create_fragment$8.name
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

    const { console: console_1$2 } = globals;
    const file$8 = "src/shared/QASections.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[35] = list[i].question_number;
    	child_ctx[37] = i;
    	return child_ctx;
    }

    // (301:0) {#if $ContentDataStore}
    function create_if_block$6(ctx) {
    	let div1;
    	let t0;
    	let div0;
    	let p;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let basicparagraphs;
    	let t5;
    	let footer;
    	let div0_id_value;
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

    	basicparagraphs = new BasicParagraphs({
    			props: { sectionName: "ending" },
    			$$inline: true
    		});

    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			div0 = element("div");
    			p = element("p");
    			t1 = text("你一共答對了 ");
    			t2 = text(/*$RightAnswerCalc*/ ctx[3]);
    			t3 = text(" 題");
    			t4 = space();
    			create_component(basicparagraphs.$$.fragment);
    			t5 = space();
    			create_component(footer.$$.fragment);
    			add_location(p, file$8, 325, 6, 11536);
    			attr_dev(div0, "class", "qa-section basic-p-container bg-white  svelte-1x5sqzv");
    			attr_dev(div0, "id", div0_id_value = "qa-no-" + (/*$ContentDataStore*/ ctx[2].question_sets.length + 1));
    			set_style(div0, "display", "none");
    			set_style(div0, "height", /*windowHeight*/ ctx[5] + "px");
    			add_location(div0, file$8, 320, 4, 11349);
    			attr_dev(div1, "class", " svelte-1x5sqzv");
    			attr_dev(div1, "id", "qa-container");
    			add_location(div1, file$8, 301, 2, 10722);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(div0, t4);
    			mount_component(basicparagraphs, div0, null);
    			append_dev(div0, t5);
    			mount_component(footer, div0, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(cssVariables_action = cssVariables.call(null, div1, { transleteY: /*transleteY*/ ctx[1] })),
    					listen_dev(div1, "mousedown", stop_propagation(/*handleMovementDown*/ ctx[6]), false, false, true),
    					listen_dev(div1, "touchstart", stop_propagation(/*handleMovementDown*/ ctx[6]), { passive: true }, false, true),
    					listen_dev(div1, "wheel", stop_propagation(/*handleScroll*/ ctx[7]), { passive: true }, false, true)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$ContentDataStore, windowHeight, maxQuestion*/ 37) {
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
    						each_blocks[i].m(div1, t0);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty[0] & /*$RightAnswerCalc*/ 8) set_data_dev(t2, /*$RightAnswerCalc*/ ctx[3]);

    			if (!current || dirty[0] & /*$ContentDataStore*/ 4 && div0_id_value !== (div0_id_value = "qa-no-" + (/*$ContentDataStore*/ ctx[2].question_sets.length + 1))) {
    				attr_dev(div0, "id", div0_id_value);
    			}

    			if (cssVariables_action && is_function(cssVariables_action.update) && dirty[0] & /*transleteY*/ 2) cssVariables_action.update.call(null, { transleteY: /*transleteY*/ ctx[1] });
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(basicparagraphs.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(basicparagraphs.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			destroy_component(basicparagraphs);
    			destroy_component(footer);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(301:0) {#if $ContentDataStore}",
    		ctx
    	});

    	return block;
    }

    // (310:4) {#each $ContentDataStore.question_sets as { question_number }
    function create_each_block$4(ctx) {
    	let div1;
    	let div0;
    	let qatemplate;
    	let div1_id_value;
    	let current;

    	qatemplate = new QATemplate({
    			props: {
    				maxQuestion: /*maxQuestion*/ ctx[0],
    				questNumber: /*i*/ ctx[37] + 1
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(qatemplate.$$.fragment);
    			attr_dev(div0, "class", "pt-6");
    			add_location(div0, file$8, 315, 8, 11227);
    			attr_dev(div1, "class", "qa-section bg-white svelte-1x5sqzv");
    			attr_dev(div1, "id", div1_id_value = `qa-no-` + /*question_number*/ ctx[35]);
    			set_style(div1, "display", /*i*/ ctx[37] === 0 ? "block" : "none");
    			set_style(div1, "height", /*windowHeight*/ ctx[5] + "px");
    			add_location(div1, file$8, 310, 6, 11049);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(qatemplate, div0, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const qatemplate_changes = {};
    			if (dirty[0] & /*maxQuestion*/ 1) qatemplate_changes.maxQuestion = /*maxQuestion*/ ctx[0];
    			qatemplate.$set(qatemplate_changes);

    			if (!current || dirty[0] & /*$ContentDataStore*/ 4 && div1_id_value !== (div1_id_value = `qa-no-` + /*question_number*/ ctx[35])) {
    				attr_dev(div1, "id", div1_id_value);
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
    			if (detaching) detach_dev(div1);
    			destroy_component(qatemplate);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(310:4) {#each $ContentDataStore.question_sets as { question_number }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$ContentDataStore*/ ctx[2] && create_if_block$6(ctx);

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
    					if_block = create_if_block$6(ctx);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const pageChangeThreshold = 0.1;

    function instance$9($$self, $$props, $$invalidate) {
    	let $progress;
    	let $ContentDataStore;
    	let $isMobile;
    	let $QAFinalPage;
    	let $QASectionsHeight;
    	let $QAProgress;
    	let $RightAnswerCalc;
    	validate_store(ContentDataStore, "ContentDataStore");
    	component_subscribe($$self, ContentDataStore, $$value => $$invalidate(2, $ContentDataStore = $$value));
    	validate_store(isMobile, "isMobile");
    	component_subscribe($$self, isMobile, $$value => $$invalidate(21, $isMobile = $$value));
    	validate_store(QAFinalPage, "QAFinalPage");
    	component_subscribe($$self, QAFinalPage, $$value => $$invalidate(22, $QAFinalPage = $$value));
    	validate_store(QASectionsHeight, "QASectionsHeight");
    	component_subscribe($$self, QASectionsHeight, $$value => $$invalidate(23, $QASectionsHeight = $$value));
    	validate_store(QAProgress, "QAProgress");
    	component_subscribe($$self, QAProgress, $$value => $$invalidate(24, $QAProgress = $$value));
    	validate_store(RightAnswerCalc, "RightAnswerCalc");
    	component_subscribe($$self, RightAnswerCalc, $$value => $$invalidate(3, $RightAnswerCalc = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("QASections", slots, []);
    	const progress = tweened(0, { duration: 800, easing: quintOut });
    	validate_store(progress, "progress");
    	component_subscribe($$self, progress, value => $$invalidate(20, $progress = value));

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
    		clickUpMovementY = newMovementY; // the y-coordinate when user click down
    	// the y-coordinate when user move
    	// the distance that user move (movementDownY - moveY)
    	// the y-coordinate after user click up

    	// update QAsectionHeight initially
    	QASectionsHeight.update(() => windowHeight);

    	// scroll-like movement initial setting variables
    	let validToScroll = true; // is wheel event fire now?

    	onMount(() => {
    		// get all QA sections' height
    		QASectionsHeight.update(() => getAllSectionsHeight());

    		setTimeout(
    			() => {
    				$$invalidate(0, maxQuestion = document.querySelectorAll("[id^=\"qa-no-\"]").length - 1);

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
    			1000
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
    		console.log("click down");

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
    			$$invalidate(13, moveDiff = (moveY - movementDownY) * 0.5); // moveDiff * 0.6 can prevent decrease distance that user move

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
    			$$invalidate(13, moveDiff = 0);
    		} else {
    			// if not, use normal scroll mode
    			if (Math.abs(moveDiff) > windowHeight * pageChangeThreshold && !isOnQAsectionsTopOrEnd()) {
    				moveToNextPage();
    				$$invalidate(13, moveDiff = 0);
    			} else {
    				// improve user experience when scroll over the valid zone
    				progress.set(newMovementY, { duration: 0 });

    				progress.set(-totalSectionsHeight(0, currentPage - 1));
    				newMovementY = -totalSectionsHeight(0, currentPage - 1);
    				clickUpMovementY = newMovementY;
    				$$invalidate(13, moveDiff = 0);
    			}
    		}

    		// remove event listener after mouse up
    		QAcontainer.removeEventListener("mouseup", handleMovementUp);

    		QAcontainer.removeEventListener("mousemove", handleMove);
    		QAcontainer.removeEventListener("touchend", handleMovementUp);
    		QAcontainer.removeEventListener("touchmove", handleMove);
    		console.log(currentPage);
    		console.log("click up");
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

    	// scroll/wheel event handler setting
    	function handleScroll(e) {
    		updateOverflowInfo();

    		if (e.deltaY > 0) {
    			moveDirection = "down";
    		} else {
    			moveDirection = "up";
    		}

    		console.log("scroll", moveOverflowDiff, overflowHeight);
    		console.log(checkScrollOverflowSection());

    		if (checkScrollOverflowSection() === true && validToScroll) {
    			clickUpMovementY = newMovementY + (moveDirection == "down" ? -30 : 30);
    			newMovementY = newMovementY + (moveDirection == "down" ? -30 : 30);
    			progress.set(newMovementY, { duration: 100 });
    		} else if (checkScrollOverflowSection() === false && validToScroll) {
    			validToScroll = false;
    			scrollToNextPage();
    		} else if (checkScrollOverflowSection() === "static") ; // do nothing
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
    			return !isOnQAsectionsTopOrEnd();
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
    		if (currentPage === 1 && moveDirection === "up") {
    			if (newMovementY >= 0) {
    				return "static";
    			} else if (moveOverflowDiff < overflowHeight) {
    				return true;
    			} else if (moveOverflowDiff > overflowHeight) {
    				return false;
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<QASections> was created with unknown prop '${key}'`);
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
    		TeamCreatorList,
    		ContentDataStore,
    		QATemplate,
    		progress,
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
    		clickUpMovementY,
    		pageChangeThreshold,
    		validToScroll,
    		handleMovementDown,
    		handleMove,
    		handleMovementUp,
    		moveToNextPage,
    		handleScroll,
    		scrollToNextPage,
    		isOnQAsectionsTopOrEnd,
    		checkOverflowSection,
    		checkScrollOverflowSection,
    		totalSectionsHeight,
    		updateOverflowInfo,
    		moveDirection,
    		transleteY,
    		$progress,
    		$ContentDataStore,
    		$isMobile,
    		$QAFinalPage,
    		$QASectionsHeight,
    		$QAProgress,
    		$RightAnswerCalc
    	});

    	$$self.$inject_state = $$props => {
    		if ("maxQuestion" in $$props) $$invalidate(0, maxQuestion = $$props.maxQuestion);
    		if ("currentPage" in $$props) currentPage = $$props.currentPage;
    		if ("mouseDown" in $$props) mouseDown = $$props.mouseDown;
    		if ("isMoving" in $$props) isMoving = $$props.isMoving;
    		if ("windowHeight" in $$props) $$invalidate(5, windowHeight = $$props.windowHeight);
    		if ("movementDownY" in $$props) movementDownY = $$props.movementDownY;
    		if ("moveY" in $$props) moveY = $$props.moveY;
    		if ("moveDiff" in $$props) $$invalidate(13, moveDiff = $$props.moveDiff);
    		if ("newMovementY" in $$props) newMovementY = $$props.newMovementY;
    		if ("overflowHeight" in $$props) overflowHeight = $$props.overflowHeight;
    		if ("moveOverflowDiff" in $$props) moveOverflowDiff = $$props.moveOverflowDiff;
    		if ("scrollOverflowTick" in $$props) scrollOverflowTick = $$props.scrollOverflowTick;
    		if ("clickUpMovementY" in $$props) clickUpMovementY = $$props.clickUpMovementY;
    		if ("validToScroll" in $$props) validToScroll = $$props.validToScroll;
    		if ("moveDirection" in $$props) moveDirection = $$props.moveDirection;
    		if ("transleteY" in $$props) $$invalidate(1, transleteY = $$props.transleteY);
    	};

    	let moveDirection;
    	let transleteY;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*moveDiff*/ 8192) {
    			// detect click&toych direction
    			 moveDirection = moveDiff <= 0 ? "down" : "up";
    		}

    		if ($$self.$$.dirty[0] & /*$progress*/ 1048576) {
    			// y-coordinate that qa-container need to translate (just like normal scroll effect)
    			 $$invalidate(1, transleteY = $progress);
    		}
    	};

    	return [
    		maxQuestion,
    		transleteY,
    		$ContentDataStore,
    		$RightAnswerCalc,
    		progress,
    		windowHeight,
    		handleMovementDown,
    		handleScroll
    	];
    }

    class QASections extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QASections",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/shared/Spinner.svelte generated by Svelte v3.29.4 */

    const file$9 = "src/shared/Spinner.svelte";

    function create_fragment$a(ctx) {
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
    			add_location(circle, file$9, 63, 41, 1279);
    			attr_dev(svg, "class", "spinner svelte-1b7swrt");
    			attr_dev(svg, "viewBox", "0 0 50 50");
    			add_location(svg, file$9, 63, 0, 1238);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props) {
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Spinner",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/shared/ArticleList.svelte generated by Svelte v3.29.4 */
    const file$a = "src/shared/ArticleList.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i].articletitle;
    	child_ctx[7] = list[i].articledate;
    	child_ctx[8] = list[i].articleimage;
    	child_ctx[9] = list[i].articleid;
    	return child_ctx;
    }

    // (55:2) {:catch error}
    function create_catch_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "An error occurred!";
    			attr_dev(p, "class", "text-center");
    			add_location(p, file$a, 55, 4, 1624);
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
    		source: "(55:2) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (33:2) {:then articleData}
    function create_then_block(ctx) {
    	let each_1_anchor;
    	let each_value = /*articleData*/ ctx[1].slice(0, 6);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
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
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
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
    		source: "(33:2) {:then articleData}",
    		ctx
    	});

    	return block;
    }

    // (34:4) {#each articleData.slice(0, 6) as { articletitle, articledate, articleimage, articleid }}
    function create_each_block$5(ctx) {
    	let div1;
    	let div0;
    	let a0;
    	let img;
    	let img_src_value;
    	let a0_href_value;
    	let t0;
    	let span;
    	let t1_value = /*articledate*/ ctx[7] + "";
    	let t1;
    	let t2;
    	let a1;
    	let h3;
    	let t3_value = /*articletitle*/ ctx[6] + "";
    	let t3;
    	let a1_href_value;
    	let t4;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			img = element("img");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			a1 = element("a");
    			h3 = element("h3");
    			t3 = text(t3_value);
    			t4 = space();
    			attr_dev(img, "class", "article-lists-img hover:scale-110");
    			if (img.src !== (img_src_value = /*articleimage*/ ctx[8])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$a, 41, 12, 1096);
    			attr_dev(a0, "href", a0_href_value = `https://www.thenewslens.com/${/*articleid*/ ctx[9]}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${/*projectName*/ ctx[0]}`);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noopener noreferrer");
    			add_location(a0, file$a, 36, 10, 862);
    			attr_dev(div0, "class", "overflow-hidden");
    			add_location(div0, file$a, 35, 8, 822);
    			attr_dev(span, "class", "article-lists-date");
    			add_location(span, file$a, 44, 8, 1210);
    			attr_dev(h3, "class", "article-lists-h3 hover:text-blue-800");
    			add_location(h3, file$a, 50, 10, 1496);
    			attr_dev(a1, "href", a1_href_value = `https://www.thenewslens.com/${/*articleid*/ ctx[9]}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${/*projectName*/ ctx[0]}`);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "rel", "noopener noreferrer");
    			add_location(a1, file$a, 45, 8, 1272);
    			attr_dev(div1, "class", "my-4 shadow");
    			add_location(div1, file$a, 34, 6, 788);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(a0, img);
    			append_dev(div1, t0);
    			append_dev(div1, span);
    			append_dev(span, t1);
    			append_dev(div1, t2);
    			append_dev(div1, a1);
    			append_dev(a1, h3);
    			append_dev(h3, t3);
    			append_dev(div1, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*projectName*/ 1 && a0_href_value !== (a0_href_value = `https://www.thenewslens.com/${/*articleid*/ ctx[9]}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${/*projectName*/ ctx[0]}`)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*projectName*/ 1 && a1_href_value !== (a1_href_value = `https://www.thenewslens.com/${/*articleid*/ ctx[9]}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${/*projectName*/ ctx[0]}`)) {
    				attr_dev(a1, "href", a1_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(34:4) {#each articleData.slice(0, 6) as { articletitle, articledate, articleimage, articleid }}",
    		ctx
    	});

    	return block;
    }

    // (29:22)      <div class="w-64 h-64">       <Spinner />     </div>   {:then articleData}
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
    			add_location(div, file$a, 29, 4, 613);
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
    		source: "(29:22)      <div class=\\\"w-64 h-64\\\">       <Spinner />     </div>   {:then articleData}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let t;
    	let div;
    	let promise;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 1,
    		error: 12,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*articleData*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    			t = space();
    			div = element("div");
    			info.block.c();
    			attr_dev(div, "class", "article-list-grid-template pb-20");
    			add_location(div, file$a, 27, 0, 539);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[1] = child_ctx[12] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);

    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			info.block.d();
    			info.token = null;
    			info = null;
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ArticleList", slots, ['default']);
    	let { projectName = "" } = $$props;
    	let { tnlLanguage = "tw" } = $$props;
    	const articleListsUrl = "https://datastore.thenewslens.com/infographic/article-lists/" + projectName + ".json?" + `${Date.now()}`;

    	const articleData = (async () => {
    		const response = await fetch(articleListsUrl);
    		return await response.json();
    	})();

    	const writable_props = ["projectName", "tnlLanguage"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ArticleList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("projectName" in $$props) $$invalidate(0, projectName = $$props.projectName);
    		if ("tnlLanguage" in $$props) $$invalidate(2, tnlLanguage = $$props.tnlLanguage);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Spinner,
    		projectName,
    		tnlLanguage,
    		articleListsUrl,
    		articleData
    	});

    	$$self.$inject_state = $$props => {
    		if ("projectName" in $$props) $$invalidate(0, projectName = $$props.projectName);
    		if ("tnlLanguage" in $$props) $$invalidate(2, tnlLanguage = $$props.tnlLanguage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [projectName, articleData, tnlLanguage, $$scope, slots];
    }

    class ArticleList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { projectName: 0, tnlLanguage: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ArticleList",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get projectName() {
    		throw new Error("<ArticleList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set projectName(value) {
    		throw new Error("<ArticleList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tnlLanguage() {
    		throw new Error("<ArticleList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tnlLanguage(value) {
    		throw new Error("<ArticleList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.4 */
    const file$b = "src/App.svelte";

    function create_fragment$c(ctx) {
    	let mobiledetector;
    	let t0;
    	let header;
    	let t1;
    	let main;
    	let article;
    	let section0;
    	let basicparagraphs;
    	let t2;
    	let section1;
    	let button;
    	let t4;
    	let section2;
    	let qasections;
    	let t5;
    	let current;
    	let mounted;
    	let dispose;
    	mobiledetector = new MobileDetector({ $$inline: true });
    	header = new Header({ $$inline: true });

    	basicparagraphs = new BasicParagraphs({
    			props: { sectionName: "intro" },
    			$$inline: true
    		});

    	qasections = new QASections({ $$inline: true });
    	let if_block = false ;

    	const block = {
    		c: function create() {
    			create_component(mobiledetector.$$.fragment);
    			t0 = space();
    			create_component(header.$$.fragment);
    			t1 = space();
    			main = element("main");
    			article = element("article");
    			section0 = element("section");
    			create_component(basicparagraphs.$$.fragment);
    			t2 = space();
    			section1 = element("section");
    			button = element("button");
    			button.textContent = "開始作答";
    			t4 = space();
    			section2 = element("section");
    			create_component(qasections.$$.fragment);
    			t5 = space();
    			attr_dev(section0, "class", "container-width mx-auto grid-full-cols svelte-gu3le");
    			add_location(section0, file$b, 30, 4, 789);
    			attr_dev(button, "class", "block border border-black mx-auto mb-6");
    			add_location(button, file$b, 34, 6, 974);
    			attr_dev(section1, "class", "container-width mx-auto grid-full-cols svelte-gu3le");
    			add_location(section1, file$b, 33, 4, 911);
    			attr_dev(section2, "class", "container-width mx-auto grid-full-cols overflow-hidden svelte-gu3le");
    			attr_dev(section2, "id", "qa-sections");
    			set_style(section2, "display", "none");
    			add_location(section2, file$b, 36, 4, 1085);
    			attr_dev(article, "class", "main-grid-template");
    			add_location(article, file$b, 29, 2, 748);
    			add_location(main, file$b, 28, 0, 739);
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
    			mount_component(basicparagraphs, section0, null);
    			append_dev(article, t2);
    			append_dev(article, section1);
    			append_dev(section1, button);
    			append_dev(article, t4);
    			append_dev(article, section2);
    			mount_component(qasections, section2, null);
    			append_dev(article, t5);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", handleClick, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mobiledetector.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(basicparagraphs.$$.fragment, local);
    			transition_in(qasections.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mobiledetector.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(basicparagraphs.$$.fragment, local);
    			transition_out(qasections.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(mobiledetector, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(main);
    			destroy_component(basicparagraphs);
    			destroy_component(qasections);
    			mounted = false;
    			dispose();
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

    function handleClick() {
    	document.querySelector("#qa-sections").style.display = "block";
    	document.querySelector("#qa-no-1").scrollIntoView({ behavior: "smooth" });
    	document.querySelector("body").style.overflow = "hidden";
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
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
    		QAStatus,
    		handleClick
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
