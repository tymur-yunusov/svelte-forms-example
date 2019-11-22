
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    const has_prop = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
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
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment && $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
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

    function bind(component, name, callback) {
        if (has_prop(component.$$.props, name)) {
            name = component.$$.props[name] || name;
            component.$$.bound[name] = callback;
            callback(component.$$.ctx[name]);
        }
    }
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
            $$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, props) {
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
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : prop_values;
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
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
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
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

    function min(val, args) {
      const minValue = parseFloat(args[0]);
      const value = isNaN(val) ? val.length : parseFloat(val);

      return value >= minValue;
    }

    function max(val, args) {
      const maxValue = parseFloat(args[0]);
      const value = isNaN(val) ? val.length : parseFloat(val);

      return isNaN(value) ? true : value <= maxValue;
    }

    function between(val, args) {
      return min(val, [args[0]]) && max(val, [args[1]]);
    }

    function email(val, args) {
      const regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

      return val && regex.test(val);
    }

    function required(val, args) {
      if (val === undefined || val === null) return false;

      if (typeof val === 'string') {
        const tmp = val.replace(/\s/g, "");

        return tmp.length > 0;
      }

      return true;
    }

    function url(val, args) {
      const regex = (/(https?|ftp|git|svn):\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,63}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i);
      return regex.test(url);
    }

    function equal(val, args) {
      return val === args[0];
    }



    var rules = /*#__PURE__*/Object.freeze({
        __proto__: null,
        between: between,
        email: email,
        max: max,
        min: min,
        required: required,
        url: url,
        equal: equal
    });

    function getValue(field) {
      return field.value;
    }

    function isPromise(obj) {
      // Standard promise API always has a `then` method
      return !!obj.then;
    }

    function validate(value, { field, validator, observable }) {
      let valid = true;
      let pending = false;
      let rule;
      
      if (typeof validator === 'function') {
        const resp = validator.call(null, value);

        if (isPromise(resp)) {
          pending = true;
          resp.then(({ name, valid }) => {
            observable.update(n => {
              n[field] = n[field] || { errors: [] };

              n[field].pending = false;
              n[field].valid = valid;

              if (!valid) {
                n[field].errors.push(rule);
              }

              return n;
            });
          });
        } else {
          valid = resp.valid;
          rule = resp.name;
        }
      } else {
        const params = validator.split(/:/g);
        rule = params.shift();
        valid = rules[rule].call(null, value, params);
      }

      return [valid, rule, pending];
    }

    function field(name, config, observable, { stopAtFirstError }) {
        const { value, validators = [] } = config;
        let valid = true;
        let pending = false;
        let errors = [];

        for (let i = 0; i < validators.length; i++) {
          const [isValid, rule, isPending] = validate(value, { field: name, validator: validators[i], observable });

          if (!pending && isPending) {
            pending = true;
          }
          
          if (!isValid) {
            valid = false;
            errors = [...errors, rule];

            if (stopAtFirstError) break;
          }
        }

        return { valid, errors, pending };
    }

    function bindClass(node, { form, name, valid = 'valid', invalid = 'invalid' }) {
      const key = name || node.getAttribute('name');

      const unsubscribe = form.subscribe((context) => {
        if (context.dirty && context[key] && context[key].valid) {
          node.classList.add(valid);
        } else {
          node.classList.remove(valid);
        }
      
        if (context.dirty && context[key] && !context[key].valid) {
          node.classList.add(invalid);
        } else {
          node.classList.remove(invalid);
        }
      });

      return {
        destroy: unsubscribe
      }
    }

    function form(fn, config = { initCheck: false, stopAtFirstError: true }) {
      const storeValue = writable({ oldValues: {}, dirty: false  });
      
      afterUpdate(() => walkThroughFields(fn, storeValue, config));

      walkThroughFields(fn, storeValue, config);

      return storeValue;
    }

    function walkThroughFields(fn, observable, config) {
      const fields = fn.call();
      const returnedObject = { oldValues: {}, dirty: false };
      const context = get_store_value(observable);

      returnedObject.dirty = context.dirty;

      Object.keys(fields).forEach(key => {
        const value = getValue(fields[key]);

        if (value !== context.oldValues[key]) {
          returnedObject[key] = field(key, fields[key], observable, config);
        }
        else {
          returnedObject[key] = context[key];
        }

        returnedObject.oldValues[key] = value;
        
        if (!context.dirty && context.oldValues[key] !== undefined && value !== context.oldValues[key]) {
          returnedObject.dirty = true;
        }
      });

      returnedObject.valid = !Object.keys(returnedObject).find(f => {
        if (['oldValues', 'dirty'].includes(f)) return false;
        return !returnedObject[f].valid;
      });

      observable.set(returnedObject);
    }

    /* src/ShippingStep.svelte generated by Svelte v3.15.0 */
    const file = "src/ShippingStep.svelte";

    // (11:4) {#if $myForm.shipping_firstname.errors.includes('required') }
    function create_if_block_4(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "This is required field";
    			attr_dev(p, "class", "validation-error svelte-f563fh");
    			add_location(p, file, 11, 6, 448);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(11:4) {#if $myForm.shipping_firstname.errors.includes('required') }",
    		ctx
    	});

    	return block;
    }

    // (16:0) {#if emailVisible}
    function create_if_block_2(ctx) {
    	let div;
    	let label;
    	let t1;
    	let input;
    	let bindClass_action;
    	let t2;
    	let show_if = ctx.$myForm.shipping_lastname.errors.includes("required");
    	let dispose;
    	let if_block = show_if && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			label.textContent = "Last name";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(label, "for", "");
    			add_location(label, file, 17, 8, 576);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-f563fh");
    			add_location(input, file, 18, 8, 616);
    			attr_dev(div, "class", "input-box svelte-f563fh");
    			add_location(div, file, 16, 4, 544);
    			dispose = listen_dev(input, "input", ctx.input_input_handler);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(div, t1);
    			append_dev(div, input);
    			set_input_value(input, ctx.data["shipping_lastname"]);

    			bindClass_action = bindClass.call(null, input, {
    				form: ctx.myForm,
    				valid: "validation-passed",
    				invalid: "validation-passed"
    			}) || ({});

    			append_dev(div, t2);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(changed, ctx) {
    			if (changed.data && input.value !== ctx.data["shipping_lastname"]) {
    				set_input_value(input, ctx.data["shipping_lastname"]);
    			}

    			if (is_function(bindClass_action.update) && changed.myForm) bindClass_action.update.call(null, {
    				form: ctx.myForm,
    				valid: "validation-passed",
    				invalid: "validation-passed"
    			});

    			if (changed.$myForm) show_if = ctx.$myForm.shipping_lastname.errors.includes("required");

    			if (show_if) {
    				if (!if_block) {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (bindClass_action && is_function(bindClass_action.destroy)) bindClass_action.destroy();
    			if (if_block) if_block.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(16:0) {#if emailVisible}",
    		ctx
    	});

    	return block;
    }

    // (20:8) {#if $myForm.shipping_lastname.errors.includes('required') }
    function create_if_block_3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "This is required field";
    			attr_dev(p, "class", "validation-error svelte-f563fh");
    			add_location(p, file, 20, 8, 844);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(20:8) {#if $myForm.shipping_lastname.errors.includes('required') }",
    		ctx
    	});

    	return block;
    }

    // (29:4) {#if $myForm.shipping_email.errors.includes('required') }
    function create_if_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "This is required field";
    			attr_dev(p, "class", "validation-error svelte-f563fh");
    			add_location(p, file, 29, 6, 1207);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(29:4) {#if $myForm.shipping_email.errors.includes('required') }",
    		ctx
    	});

    	return block;
    }

    // (32:4) {#if $myForm.shipping_email.errors.includes('email') }
    function create_if_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Please enter correct email";
    			attr_dev(p, "class", "validation-error svelte-f563fh");
    			add_location(p, file, 32, 6, 1337);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(32:4) {#if $myForm.shipping_email.errors.includes('email') }",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let h1;
    	let t1;
    	let div0;
    	let label0;
    	let t3;
    	let input0;
    	let bindClass_action;
    	let t4;
    	let show_if_2 = ctx.$myForm.shipping_firstname.errors.includes("required");
    	let t5;
    	let t6;
    	let div1;
    	let label1;
    	let t8;
    	let input1;
    	let bindClass_action_1;
    	let t9;
    	let show_if_1 = ctx.$myForm.shipping_email.errors.includes("required");
    	let t10;
    	let show_if = ctx.$myForm.shipping_email.errors.includes("email");
    	let dispose;
    	let if_block0 = show_if_2 && create_if_block_4(ctx);
    	let if_block1 = ctx.emailVisible && create_if_block_2(ctx);
    	let if_block2 = show_if_1 && create_if_block_1(ctx);
    	let if_block3 = show_if && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Shipping step";
    			t1 = space();
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "First name";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			if (if_block0) if_block0.c();
    			t5 = space();
    			if (if_block1) if_block1.c();
    			t6 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Email";
    			t8 = space();
    			input1 = element("input");
    			t9 = space();
    			if (if_block2) if_block2.c();
    			t10 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(h1, "class", "svelte-f563fh");
    			add_location(h1, file, 6, 0, 136);
    			attr_dev(label0, "for", "");
    			add_location(label0, file, 8, 4, 187);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "svelte-f563fh");
    			add_location(input0, file, 9, 4, 224);
    			attr_dev(div0, "class", "input-box svelte-f563fh");
    			add_location(div0, file, 7, 0, 159);
    			attr_dev(label1, "for", "");
    			add_location(label1, file, 26, 4, 959);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "svelte-f563fh");
    			add_location(input1, file, 27, 4, 991);
    			attr_dev(div1, "class", "input-box svelte-f563fh");
    			add_location(div1, file, 25, 0, 931);

    			dispose = [
    				listen_dev(input0, "input", ctx.input0_input_handler),
    				listen_dev(input1, "input", ctx.input1_input_handler)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, label0);
    			append_dev(div0, t3);
    			append_dev(div0, input0);
    			set_input_value(input0, ctx.data["shipping_firstname"]);

    			bindClass_action = bindClass.call(null, input0, {
    				form: ctx.myForm,
    				valid: "validation-passed",
    				invalid: "validation-passed"
    			}) || ({});

    			append_dev(div0, t4);
    			if (if_block0) if_block0.m(div0, null);
    			insert_dev(target, t5, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, label1);
    			append_dev(div1, t8);
    			append_dev(div1, input1);
    			set_input_value(input1, ctx.data["shipping_email"]);

    			bindClass_action_1 = bindClass.call(null, input1, {
    				form: ctx.myForm,
    				valid: "validation-passed",
    				invalid: "validation-passed"
    			}) || ({});

    			append_dev(div1, t9);
    			if (if_block2) if_block2.m(div1, null);
    			append_dev(div1, t10);
    			if (if_block3) if_block3.m(div1, null);
    		},
    		p: function update(changed, ctx) {
    			if (changed.data && input0.value !== ctx.data["shipping_firstname"]) {
    				set_input_value(input0, ctx.data["shipping_firstname"]);
    			}

    			if (is_function(bindClass_action.update) && changed.myForm) bindClass_action.update.call(null, {
    				form: ctx.myForm,
    				valid: "validation-passed",
    				invalid: "validation-passed"
    			});

    			if (changed.$myForm) show_if_2 = ctx.$myForm.shipping_firstname.errors.includes("required");

    			if (show_if_2) {
    				if (!if_block0) {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (ctx.emailVisible) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(t6.parentNode, t6);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (changed.data && input1.value !== ctx.data["shipping_email"]) {
    				set_input_value(input1, ctx.data["shipping_email"]);
    			}

    			if (is_function(bindClass_action_1.update) && changed.myForm) bindClass_action_1.update.call(null, {
    				form: ctx.myForm,
    				valid: "validation-passed",
    				invalid: "validation-passed"
    			});

    			if (changed.$myForm) show_if_1 = ctx.$myForm.shipping_email.errors.includes("required");

    			if (show_if_1) {
    				if (!if_block2) {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					if_block2.m(div1, t10);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (changed.$myForm) show_if = ctx.$myForm.shipping_email.errors.includes("email");

    			if (show_if) {
    				if (!if_block3) {
    					if_block3 = create_if_block(ctx);
    					if_block3.c();
    					if_block3.m(div1, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);
    			if (bindClass_action && is_function(bindClass_action.destroy)) bindClass_action.destroy();
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t5);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div1);
    			if (bindClass_action_1 && is_function(bindClass_action_1.destroy)) bindClass_action_1.destroy();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			run_all(dispose);
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

    function instance($$self, $$props, $$invalidate) {
    	let $myForm,
    		$$unsubscribe_myForm = noop,
    		$$subscribe_myForm = () => ($$unsubscribe_myForm(), $$unsubscribe_myForm = subscribe(myForm, $$value => $$invalidate("$myForm", $myForm = $$value)), myForm);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_myForm());
    	let { myForm } = $$props;
    	validate_store(myForm, "myForm");
    	$$subscribe_myForm();
    	let { data } = $$props;
    	let { emailVisible } = $$props;
    	const writable_props = ["myForm", "data", "emailVisible"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ShippingStep> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		data["shipping_firstname"] = this.value;
    		$$invalidate("data", data);
    	}

    	function input_input_handler() {
    		data["shipping_lastname"] = this.value;
    		$$invalidate("data", data);
    	}

    	function input1_input_handler() {
    		data["shipping_email"] = this.value;
    		$$invalidate("data", data);
    	}

    	$$self.$set = $$props => {
    		if ("myForm" in $$props) $$subscribe_myForm($$invalidate("myForm", myForm = $$props.myForm));
    		if ("data" in $$props) $$invalidate("data", data = $$props.data);
    		if ("emailVisible" in $$props) $$invalidate("emailVisible", emailVisible = $$props.emailVisible);
    	};

    	$$self.$capture_state = () => {
    		return { myForm, data, emailVisible, $myForm };
    	};

    	$$self.$inject_state = $$props => {
    		if ("myForm" in $$props) $$subscribe_myForm($$invalidate("myForm", myForm = $$props.myForm));
    		if ("data" in $$props) $$invalidate("data", data = $$props.data);
    		if ("emailVisible" in $$props) $$invalidate("emailVisible", emailVisible = $$props.emailVisible);
    		if ("$myForm" in $$props) myForm.set($myForm = $$props.$myForm);
    	};

    	return {
    		myForm,
    		data,
    		emailVisible,
    		$myForm,
    		input0_input_handler,
    		input_input_handler,
    		input1_input_handler
    	};
    }

    class ShippingStep extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { myForm: 0, data: 0, emailVisible: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ShippingStep",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (ctx.myForm === undefined && !("myForm" in props)) {
    			console.warn("<ShippingStep> was created without expected prop 'myForm'");
    		}

    		if (ctx.data === undefined && !("data" in props)) {
    			console.warn("<ShippingStep> was created without expected prop 'data'");
    		}

    		if (ctx.emailVisible === undefined && !("emailVisible" in props)) {
    			console.warn("<ShippingStep> was created without expected prop 'emailVisible'");
    		}
    	}

    	get myForm() {
    		throw new Error("<ShippingStep>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set myForm(value) {
    		throw new Error("<ShippingStep>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<ShippingStep>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<ShippingStep>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get emailVisible() {
    		throw new Error("<ShippingStep>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set emailVisible(value) {
    		throw new Error("<ShippingStep>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/BillingStep.svelte generated by Svelte v3.15.0 */
    const file$1 = "src/BillingStep.svelte";

    // (11:4) {#if $myForm.billing_firstname.errors.includes('required') }
    function create_if_block_2$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "This is required field";
    			attr_dev(p, "class", "validation-error svelte-f563fh");
    			add_location(p, file$1, 11, 6, 419);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(11:4) {#if $myForm.billing_firstname.errors.includes('required') }",
    		ctx
    	});

    	return block;
    }

    // (19:4) {#if $myForm.billing_lastname.errors.includes('required') }
    function create_if_block_1$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "This is required field";
    			attr_dev(p, "class", "validation-error svelte-f563fh");
    			add_location(p, file$1, 19, 6, 776);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(19:4) {#if $myForm.billing_lastname.errors.includes('required') }",
    		ctx
    	});

    	return block;
    }

    // (27:4) {#if $myForm.billing_email.errors.includes('required') }
    function create_if_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "This is required field";
    			attr_dev(p, "class", "validation-error svelte-f563fh");
    			add_location(p, file$1, 27, 6, 1128);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(27:4) {#if $myForm.billing_email.errors.includes('required') }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let h1;
    	let t1;
    	let div0;
    	let label0;
    	let t3;
    	let input0;
    	let bindClass_action;
    	let t4;
    	let show_if_2 = ctx.$myForm.billing_firstname.errors.includes("required");
    	let t5;
    	let div1;
    	let label1;
    	let t7;
    	let input1;
    	let bindClass_action_1;
    	let t8;
    	let show_if_1 = ctx.$myForm.billing_lastname.errors.includes("required");
    	let t9;
    	let div2;
    	let label2;
    	let t11;
    	let input2;
    	let bindClass_action_2;
    	let t12;
    	let show_if = ctx.$myForm.billing_email.errors.includes("required");
    	let dispose;
    	let if_block0 = show_if_2 && create_if_block_2$1(ctx);
    	let if_block1 = show_if_1 && create_if_block_1$1(ctx);
    	let if_block2 = show_if && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Billing step";
    			t1 = space();
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "First name";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			if (if_block0) if_block0.c();
    			t5 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Last name";
    			t7 = space();
    			input1 = element("input");
    			t8 = space();
    			if (if_block1) if_block1.c();
    			t9 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "First name";
    			t11 = space();
    			input2 = element("input");
    			t12 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(h1, "class", "svelte-f563fh");
    			add_location(h1, file$1, 6, 0, 110);
    			attr_dev(label0, "for", "");
    			add_location(label0, file$1, 8, 4, 160);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "svelte-f563fh");
    			add_location(input0, file$1, 9, 4, 197);
    			attr_dev(div0, "class", "input-box svelte-f563fh");
    			add_location(div0, file$1, 7, 0, 132);
    			attr_dev(label1, "for", "");
    			add_location(label1, file$1, 16, 4, 520);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "svelte-f563fh");
    			add_location(input1, file$1, 17, 4, 556);
    			attr_dev(div1, "class", "input-box svelte-f563fh");
    			add_location(div1, file$1, 15, 0, 492);
    			attr_dev(label2, "for", "");
    			add_location(label2, file$1, 24, 4, 877);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "svelte-f563fh");
    			add_location(input2, file$1, 25, 4, 914);
    			attr_dev(div2, "class", "input-box svelte-f563fh");
    			add_location(div2, file$1, 23, 0, 849);

    			dispose = [
    				listen_dev(input0, "input", ctx.input0_input_handler),
    				listen_dev(input1, "input", ctx.input1_input_handler),
    				listen_dev(input2, "input", ctx.input2_input_handler)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, label0);
    			append_dev(div0, t3);
    			append_dev(div0, input0);
    			set_input_value(input0, ctx.data["billing_firstname"]);

    			bindClass_action = bindClass.call(null, input0, {
    				form: ctx.myForm,
    				valid: "validation-passed",
    				invalid: "validation-passed"
    			}) || ({});

    			append_dev(div0, t4);
    			if (if_block0) if_block0.m(div0, null);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, label1);
    			append_dev(div1, t7);
    			append_dev(div1, input1);
    			set_input_value(input1, ctx.data["billing_lastname"]);

    			bindClass_action_1 = bindClass.call(null, input1, {
    				form: ctx.myForm,
    				valid: "validation-passed",
    				invalid: "validation-passed"
    			}) || ({});

    			append_dev(div1, t8);
    			if (if_block1) if_block1.m(div1, null);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, label2);
    			append_dev(div2, t11);
    			append_dev(div2, input2);
    			set_input_value(input2, ctx.data["billing_email"]);

    			bindClass_action_2 = bindClass.call(null, input2, {
    				form: ctx.myForm,
    				valid: "validation-passed",
    				invalid: "validation-passed"
    			}) || ({});

    			append_dev(div2, t12);
    			if (if_block2) if_block2.m(div2, null);
    		},
    		p: function update(changed, ctx) {
    			if (changed.data && input0.value !== ctx.data["billing_firstname"]) {
    				set_input_value(input0, ctx.data["billing_firstname"]);
    			}

    			if (is_function(bindClass_action.update) && changed.myForm) bindClass_action.update.call(null, {
    				form: ctx.myForm,
    				valid: "validation-passed",
    				invalid: "validation-passed"
    			});

    			if (changed.$myForm) show_if_2 = ctx.$myForm.billing_firstname.errors.includes("required");

    			if (show_if_2) {
    				if (!if_block0) {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (changed.data && input1.value !== ctx.data["billing_lastname"]) {
    				set_input_value(input1, ctx.data["billing_lastname"]);
    			}

    			if (is_function(bindClass_action_1.update) && changed.myForm) bindClass_action_1.update.call(null, {
    				form: ctx.myForm,
    				valid: "validation-passed",
    				invalid: "validation-passed"
    			});

    			if (changed.$myForm) show_if_1 = ctx.$myForm.billing_lastname.errors.includes("required");

    			if (show_if_1) {
    				if (!if_block1) {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (changed.data && input2.value !== ctx.data["billing_email"]) {
    				set_input_value(input2, ctx.data["billing_email"]);
    			}

    			if (is_function(bindClass_action_2.update) && changed.myForm) bindClass_action_2.update.call(null, {
    				form: ctx.myForm,
    				valid: "validation-passed",
    				invalid: "validation-passed"
    			});

    			if (changed.$myForm) show_if = ctx.$myForm.billing_email.errors.includes("required");

    			if (show_if) {
    				if (!if_block2) {
    					if_block2 = create_if_block$1(ctx);
    					if_block2.c();
    					if_block2.m(div2, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);
    			if (bindClass_action && is_function(bindClass_action.destroy)) bindClass_action.destroy();
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div1);
    			if (bindClass_action_1 && is_function(bindClass_action_1.destroy)) bindClass_action_1.destroy();
    			if (if_block1) if_block1.d();
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div2);
    			if (bindClass_action_2 && is_function(bindClass_action_2.destroy)) bindClass_action_2.destroy();
    			if (if_block2) if_block2.d();
    			run_all(dispose);
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
    	let $myForm,
    		$$unsubscribe_myForm = noop,
    		$$subscribe_myForm = () => ($$unsubscribe_myForm(), $$unsubscribe_myForm = subscribe(myForm, $$value => $$invalidate("$myForm", $myForm = $$value)), myForm);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_myForm());
    	let { myForm } = $$props;
    	validate_store(myForm, "myForm");
    	$$subscribe_myForm();
    	let { data } = $$props;
    	const writable_props = ["myForm", "data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BillingStep> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		data["billing_firstname"] = this.value;
    		$$invalidate("data", data);
    	}

    	function input1_input_handler() {
    		data["billing_lastname"] = this.value;
    		$$invalidate("data", data);
    	}

    	function input2_input_handler() {
    		data["billing_email"] = this.value;
    		$$invalidate("data", data);
    	}

    	$$self.$set = $$props => {
    		if ("myForm" in $$props) $$subscribe_myForm($$invalidate("myForm", myForm = $$props.myForm));
    		if ("data" in $$props) $$invalidate("data", data = $$props.data);
    	};

    	$$self.$capture_state = () => {
    		return { myForm, data, $myForm };
    	};

    	$$self.$inject_state = $$props => {
    		if ("myForm" in $$props) $$subscribe_myForm($$invalidate("myForm", myForm = $$props.myForm));
    		if ("data" in $$props) $$invalidate("data", data = $$props.data);
    		if ("$myForm" in $$props) myForm.set($myForm = $$props.$myForm);
    	};

    	return {
    		myForm,
    		data,
    		$myForm,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler
    	};
    }

    class BillingStep extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { myForm: 0, data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BillingStep",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (ctx.myForm === undefined && !("myForm" in props)) {
    			console.warn("<BillingStep> was created without expected prop 'myForm'");
    		}

    		if (ctx.data === undefined && !("data" in props)) {
    			console.warn("<BillingStep> was created without expected prop 'data'");
    		}
    	}

    	get myForm() {
    		throw new Error("<BillingStep>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set myForm(value) {
    		throw new Error("<BillingStep>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<BillingStep>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<BillingStep>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.15.0 */
    const file$2 = "src/App.svelte";

    // (31:8) {:else}
    function create_else_block_1(ctx) {
    	let updating_data;
    	let current;

    	function billingstep_data_binding(value) {
    		ctx.billingstep_data_binding.call(null, value);
    	}

    	let billingstep_props = { myForm: ctx.myForm };

    	if (ctx.data !== void 0) {
    		billingstep_props.data = ctx.data;
    	}

    	const billingstep = new BillingStep({ props: billingstep_props, $$inline: true });
    	binding_callbacks.push(() => bind(billingstep, "data", billingstep_data_binding));

    	const block = {
    		c: function create() {
    			create_component(billingstep.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(billingstep, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const billingstep_changes = {};

    			if (!updating_data && changed.data) {
    				updating_data = true;
    				billingstep_changes.data = ctx.data;
    				add_flush_callback(() => updating_data = false);
    			}

    			billingstep.$set(billingstep_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(billingstep.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(billingstep.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(billingstep, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(31:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (29:8) {#if stepNumber == 1}
    function create_if_block_1$2(ctx) {
    	let updating_data;
    	let current;

    	function shippingstep_data_binding(value) {
    		ctx.shippingstep_data_binding.call(null, value);
    	}

    	let shippingstep_props = {
    		myForm: ctx.myForm,
    		emailVisible: ctx.emailVisible
    	};

    	if (ctx.data !== void 0) {
    		shippingstep_props.data = ctx.data;
    	}

    	const shippingstep = new ShippingStep({
    			props: shippingstep_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(shippingstep, "data", shippingstep_data_binding));

    	const block = {
    		c: function create() {
    			create_component(shippingstep.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(shippingstep, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			const shippingstep_changes = {};
    			if (changed.emailVisible) shippingstep_changes.emailVisible = ctx.emailVisible;

    			if (!updating_data && changed.data) {
    				updating_data = true;
    				shippingstep_changes.data = ctx.data;
    				add_flush_callback(() => updating_data = false);
    			}

    			shippingstep.$set(shippingstep_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shippingstep.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shippingstep.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shippingstep, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(29:8) {#if stepNumber == 1}",
    		ctx
    	});

    	return block;
    }

    // (38:8) {:else}
    function create_else_block(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Previous step";
    			attr_dev(button, "class", "svelte-bu2a3c");
    			add_location(button, file$2, 38, 12, 1403);
    			dispose = listen_dev(button, "click", prevent_default(ctx.click_handler_1), false, false, true);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(38:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (36:8) {#if stepNumber == 1}
    function create_if_block$2(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Next step";
    			attr_dev(button, "class", "svelte-bu2a3c");
    			add_location(button, file$2, 36, 12, 1301);
    			dispose = listen_dev(button, "click", prevent_default(ctx.click_handler), false, false, true);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(36:8) {#if stepNumber == 1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let form_1;
    	let current_block_type_index;
    	let if_block0;
    	let t0;
    	let t1;
    	let button;
    	let t2_value = (ctx.emailVisible ? "Hide" : "Show") + "";
    	let t2;
    	let t3;
    	let t4;
    	let p;
    	let t5;
    	let t6_value = ctx.$myForm.valid + "";
    	let t6;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block_1$2, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.stepNumber == 1) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	function select_block_type_1(changed, ctx) {
    		if (ctx.stepNumber == 1) return create_if_block$2;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(null, ctx);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			form_1 = element("form");
    			if_block0.c();
    			t0 = space();
    			if_block1.c();
    			t1 = space();
    			button = element("button");
    			t2 = text(t2_value);
    			t3 = text(" lastname");
    			t4 = space();
    			p = element("p");
    			t5 = text("Form valid: ");
    			t6 = text(t6_value);
    			attr_dev(button, "class", "svelte-bu2a3c");
    			add_location(button, file$2, 41, 8, 1504);
    			add_location(p, file$2, 42, 8, 1633);
    			attr_dev(form_1, "class", "myForm svelte-bu2a3c");
    			add_location(form_1, file$2, 27, 1, 1067);
    			add_location(main, file$2, 26, 0, 1059);
    			dispose = listen_dev(button, "click", prevent_default(ctx.click_handler_2), false, false, true);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, form_1);
    			if_blocks[current_block_type_index].m(form_1, null);
    			append_dev(form_1, t0);
    			if_block1.m(form_1, null);
    			append_dev(form_1, t1);
    			append_dev(form_1, button);
    			append_dev(button, t2);
    			append_dev(button, t3);
    			append_dev(form_1, t4);
    			append_dev(form_1, p);
    			append_dev(p, t5);
    			append_dev(p, t6);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
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
    				if_block0.m(form_1, t0);
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(changed, ctx)) && if_block1) {
    				if_block1.p(changed, ctx);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(form_1, t1);
    				}
    			}

    			if ((!current || changed.emailVisible) && t2_value !== (t2_value = (ctx.emailVisible ? "Hide" : "Show") + "")) set_data_dev(t2, t2_value);
    			if ((!current || changed.$myForm) && t6_value !== (t6_value = ctx.$myForm.valid + "")) set_data_dev(t6, t6_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    			if_block1.d();
    			dispose();
    		}
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
    	let $myForm;
    	let stepNumber = 1;
    	let { emailVisible = true } = $$props;

    	let { data = {
    		"shipping_firstname": "",
    		"shipping_lastname": "",
    		"shipping_email": "",
    		"billing_firstname": "",
    		"billing_lastname": "",
    		"billing_email": ""
    	} } = $$props;

    	const myForm = form(() => ({
    		shipping_firstname: {
    			value: data["shipping_firstname"],
    			validators: ["required"]
    		},
    		shipping_lastname: {
    			value: data["shipping_lastname"],
    			validators: ["required"]
    		},
    		shipping_email: {
    			value: data["shipping_email"],
    			validators: ["required", "email"]
    		},
    		billing_firstname: {
    			value: data["billing_firstname"],
    			validators: ["required"]
    		},
    		billing_lastname: {
    			value: data["billing_lastname"],
    			validators: ["required"]
    		},
    		billing_email: {
    			value: data["billing_email"],
    			validators: ["required"]
    		}
    	}));

    	validate_store(myForm, "myForm");
    	component_subscribe($$self, myForm, value => $$invalidate("$myForm", $myForm = value));
    	const writable_props = ["emailVisible", "data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function shippingstep_data_binding(value) {
    		data = value;
    		$$invalidate("data", data);
    	}

    	function billingstep_data_binding(value) {
    		data = value;
    		$$invalidate("data", data);
    	}

    	const click_handler = () => $$invalidate("stepNumber", stepNumber = 2);
    	const click_handler_1 = () => $$invalidate("stepNumber", stepNumber = 1);
    	const click_handler_2 = () => $$invalidate("emailVisible", emailVisible = !emailVisible);

    	$$self.$set = $$props => {
    		if ("emailVisible" in $$props) $$invalidate("emailVisible", emailVisible = $$props.emailVisible);
    		if ("data" in $$props) $$invalidate("data", data = $$props.data);
    	};

    	$$self.$capture_state = () => {
    		return { stepNumber, emailVisible, data, $myForm };
    	};

    	$$self.$inject_state = $$props => {
    		if ("stepNumber" in $$props) $$invalidate("stepNumber", stepNumber = $$props.stepNumber);
    		if ("emailVisible" in $$props) $$invalidate("emailVisible", emailVisible = $$props.emailVisible);
    		if ("data" in $$props) $$invalidate("data", data = $$props.data);
    		if ("$myForm" in $$props) myForm.set($myForm = $$props.$myForm);
    	};

    	return {
    		stepNumber,
    		emailVisible,
    		data,
    		myForm,
    		$myForm,
    		shippingstep_data_binding,
    		billingstep_data_binding,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { emailVisible: 0, data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get emailVisible() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set emailVisible(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
