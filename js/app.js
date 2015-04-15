/*!
 * Modernizr v2.8.3
 * www.modernizr.com
 *
 * Copyright (c) Faruk Ates, Paul Irish, Alex Sexton
 * Available under the BSD and MIT licenses: www.modernizr.com/license/
 */

/*
 * Modernizr tests which native CSS3 and HTML5 features are available in
 * the current UA and makes the results available to you in two ways:
 * as properties on a global Modernizr object, and as classes on the
 * <html> element. This information allows you to progressively enhance
 * your pages with a granular level of control over the experience.
 *
 * Modernizr has an optional (not included) conditional resource loader
 * called Modernizr.load(), based on Yepnope.js (yepnopejs.com).
 * To get a build that includes Modernizr.load(), as well as choosing
 * which tests to include, go to www.modernizr.com/download/
 *
 * Authors        Faruk Ates, Paul Irish, Alex Sexton
 * Contributors   Ryan Seddon, Ben Alman
 */

window.Modernizr = (function (window, document, undefined) {

    var version = '2.8.3',

        Modernizr = {},

    /*>>cssclasses*/
    // option for enabling the HTML classes to be added
        enableClasses = true,
    /*>>cssclasses*/

        docElement = document.documentElement,

        /**
         * Create our "modernizr" element that we do most feature tests on.
         */
        mod = 'modernizr',
        modElem = document.createElement(mod),
        mStyle = modElem.style,

        /**
         * Create the input element for various Web Forms feature tests.
         */
        inputElem /*>>inputelem*/ = document.createElement('input') /*>>inputelem*/,

    /*>>smile*/
        smile = ':)',
    /*>>smile*/

        toString = {}.toString,

    // TODO :: make the prefixes more granular
    /*>>prefixes*/
    // List of property values to set for css tests. See ticket #21
        prefixes = ' -webkit- -moz- -o- -ms- '.split(' '),
    /*>>prefixes*/

    /*>>domprefixes*/
    // Following spec is to expose vendor-specific style properties as:
    //   elem.style.WebkitBorderRadius
    // and the following would be incorrect:
    //   elem.style.webkitBorderRadius

    // Webkit ghosts their properties in lowercase but Opera & Moz do not.
    // Microsoft uses a lowercase `ms` instead of the correct `Ms` in IE8+
    //   erik.eae.net/archives/2008/03/10/21.48.10/

    // More here: github.com/Modernizr/Modernizr/issues/issue/21
        omPrefixes = 'Webkit Moz O ms',

        cssomPrefixes = omPrefixes.split(' '),

        domPrefixes = omPrefixes.toLowerCase().split(' '),
    /*>>domprefixes*/

    /*>>ns*/
        ns = {'svg': 'http://www.w3.org/2000/svg'},
    /*>>ns*/

        tests = {},
        inputs = {},
        attrs = {},

        classes = [],

        slice = classes.slice,

        featureName, // used in testing loop


    /*>>teststyles*/
    // Inject element with style element and some CSS rules
        injectElementWithStyles = function (rule, callback, nodes, testnames) {

            var style, ret, node, docOverflow,
                div = document.createElement('div'),
            // After page load injecting a fake body doesn't work so check if body exists
                body = document.body,
            // IE6 and 7 won't return offsetWidth or offsetHeight unless it's in the body element, so we fake it.
                fakeBody = body || document.createElement('body');

            if (parseInt(nodes, 10)) {
                // In order not to give false positives we create a node for each test
                // This also allows the method to scale for unspecified uses
                while (nodes--) {
                    node = document.createElement('div');
                    node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
                    div.appendChild(node);
                }
            }

            // <style> elements in IE6-9 are considered 'NoScope' elements and therefore will be removed
            // when injected with innerHTML. To get around this you need to prepend the 'NoScope' element
            // with a 'scoped' element, in our case the soft-hyphen entity as it won't mess with our measurements.
            // msdn.microsoft.com/en-us/library/ms533897%28VS.85%29.aspx
            // Documents served as xml will throw if using &shy; so use xml friendly encoded version. See issue #277
            style = ['&#173;', '<style id="s', mod, '">', rule, '</style>'].join('');
            div.id = mod;
            // IE6 will false positive on some tests due to the style element inside the test div somehow interfering offsetHeight, so insert it into body or fakebody.
            // Opera will act all quirky when injecting elements in documentElement when page is served as xml, needs fakebody too. #270
            (body ? div : fakeBody).innerHTML += style;
            fakeBody.appendChild(div);
            if (!body) {
                //avoid crashing IE8, if background image is used
                fakeBody.style.background = '';
                //Safari 5.13/5.1.4 OSX stops loading if ::-webkit-scrollbar is used and scrollbars are visible
                fakeBody.style.overflow = 'hidden';
                docOverflow = docElement.style.overflow;
                docElement.style.overflow = 'hidden';
                docElement.appendChild(fakeBody);
            }

            ret = callback(div, rule);
            // If this is done after page load we don't want to remove the body so check if body exists
            if (!body) {
                fakeBody.parentNode.removeChild(fakeBody);
                docElement.style.overflow = docOverflow;
            } else {
                div.parentNode.removeChild(div);
            }

            return !!ret;

        },
    /*>>teststyles*/

    /*>>mq*/
    // adapted from matchMedia polyfill
    // by Scott Jehl and Paul Irish
    // gist.github.com/786768
        testMediaQuery = function (mq) {

            var matchMedia = window.matchMedia || window.msMatchMedia;
            if (matchMedia) {
                return matchMedia(mq) && matchMedia(mq).matches || false;
            }

            var bool;

            injectElementWithStyles('@media ' + mq + ' { #' + mod + ' { position: absolute; } }', function (node) {
                bool = (window.getComputedStyle ?
                    getComputedStyle(node, null) :
                    node.currentStyle)['position'] == 'absolute';
            });

            return bool;

        },
    /*>>mq*/


    /*>>hasevent*/
    //
    // isEventSupported determines if a given element supports the given event
    // kangax.github.com/iseventsupported/
    //
    // The following results are known incorrects:
    //   Modernizr.hasEvent("webkitTransitionEnd", elem) // false negative
    //   Modernizr.hasEvent("textInput") // in Webkit. github.com/Modernizr/Modernizr/issues/333
    //   ...
        isEventSupported = (function () {

            var TAGNAMES = {
                'select': 'input', 'change': 'input',
                'submit': 'form', 'reset': 'form',
                'error': 'img', 'load': 'img', 'abort': 'img'
            };

            function isEventSupported(eventName, element) {

                element = element || document.createElement(TAGNAMES[eventName] || 'div');
                eventName = 'on' + eventName;

                // When using `setAttribute`, IE skips "unload", WebKit skips "unload" and "resize", whereas `in` "catches" those
                var isSupported = eventName in element;

                if (!isSupported) {
                    // If it has no `setAttribute` (i.e. doesn't implement Node interface), try generic element
                    if (!element.setAttribute) {
                        element = document.createElement('div');
                    }
                    if (element.setAttribute && element.removeAttribute) {
                        element.setAttribute(eventName, '');
                        isSupported = is(element[eventName], 'function');

                        // If property was created, "remove it" (by setting value to `undefined`)
                        if (!is(element[eventName], 'undefined')) {
                            element[eventName] = undefined;
                        }
                        element.removeAttribute(eventName);
                    }
                }

                element = null;
                return isSupported;
            }

            return isEventSupported;
        })(),
    /*>>hasevent*/

    // TODO :: Add flag for hasownprop ? didn't last time

    // hasOwnProperty shim by kangax needed for Safari 2.0 support
        _hasOwnProperty = ({}).hasOwnProperty, hasOwnProp;

    if (!is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined')) {
        hasOwnProp = function (object, property) {
            return _hasOwnProperty.call(object, property);
        };
    }
    else {
        hasOwnProp = function (object, property) { /* yes, this can give false positives/negatives, but most of the time we don't care about those */
            return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
        };
    }

    // Adapted from ES5-shim https://github.com/kriskowal/es5-shim/blob/master/es5-shim.js
    // es5.github.com/#x15.3.4.5

    if (!Function.prototype.bind) {
        Function.prototype.bind = function bind(that) {

            var target = this;

            if (typeof target != "function") {
                throw new TypeError();
            }

            var args = slice.call(arguments, 1),
                bound = function () {

                    if (this instanceof bound) {

                        var F = function () {
                        };
                        F.prototype = target.prototype;
                        var self = new F();

                        var result = target.apply(
                            self,
                            args.concat(slice.call(arguments))
                        );
                        if (Object(result) === result) {
                            return result;
                        }
                        return self;

                    } else {

                        return target.apply(
                            that,
                            args.concat(slice.call(arguments))
                        );

                    }

                };

            return bound;
        };
    }

    /**
     * setCss applies given styles to the Modernizr DOM node.
     */
    function setCss(str) {
        mStyle.cssText = str;
    }

    /**
     * setCssAll extrapolates all vendor-specific css strings.
     */
    function setCssAll(str1, str2) {
        return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
    }

    /**
     * is returns a boolean for if typeof obj is exactly type.
     */
    function is(obj, type) {
        return typeof obj === type;
    }

    /**
     * contains returns a boolean for if substr is found within str.
     */
    function contains(str, substr) {
        return !!~('' + str).indexOf(substr);
    }

    /*>>testprop*/

    // testProps is a generic CSS / DOM property test.

    // In testing support for a given CSS property, it's legit to test:
    //    `elem.style[styleName] !== undefined`
    // If the property is supported it will return an empty string,
    // if unsupported it will return undefined.

    // We'll take advantage of this quick test and skip setting a style
    // on our modernizr element, but instead just testing undefined vs
    // empty string.

    // Because the testing of the CSS property names (with "-", as
    // opposed to the camelCase DOM properties) is non-portable and
    // non-standard but works in WebKit and IE (but not Gecko or Opera),
    // we explicitly reject properties with dashes so that authors
    // developing in WebKit or IE first don't end up with
    // browser-specific content by accident.

    function testProps(props, prefixed) {
        for (var i in props) {
            var prop = props[i];
            if (!contains(prop, "-") && mStyle[prop] !== undefined) {
                return prefixed == 'pfx' ? prop : true;
            }
        }
        return false;
    }

    /*>>testprop*/

    // TODO :: add testDOMProps
    /**
     * testDOMProps is a generic DOM property test; if a browser supports
     *   a certain property, it won't return undefined for it.
     */
    function testDOMProps(props, obj, elem) {
        for (var i in props) {
            var item = obj[props[i]];
            if (item !== undefined) {

                // return the property name as a string
                if (elem === false) return props[i];

                // let's bind a function
                if (is(item, 'function')) {
                    // default to autobind unless override
                    return item.bind(elem || obj);
                }

                // return the unbound function or obj or value
                return item;
            }
        }
        return false;
    }

    /*>>testallprops*/
    /**
     * testPropsAll tests a list of DOM properties we want to check against.
     *   We specify literally ALL possible (known and/or likely) properties on
     *   the element including the non-vendor prefixed one, for forward-
     *   compatibility.
     */
    function testPropsAll(prop, prefixed, elem) {

        var ucProp = prop.charAt(0).toUpperCase() + prop.slice(1),
            props = (prop + ' ' + cssomPrefixes.join(ucProp + ' ') + ucProp).split(' ');

        // did they call .prefixed('boxSizing') or are we just testing a prop?
        if (is(prefixed, "string") || is(prefixed, "undefined")) {
            return testProps(props, prefixed);

            // otherwise, they called .prefixed('requestAnimationFrame', window[, elem])
        } else {
            props = (prop + ' ' + (domPrefixes).join(ucProp + ' ') + ucProp).split(' ');
            return testDOMProps(props, prefixed, elem);
        }
    }

    /*>>testallprops*/


    /**
     * Tests
     * -----
     */

        // The *new* flexbox
        // dev.w3.org/csswg/css3-flexbox

    tests['flexbox'] = function () {
        return testPropsAll('flexWrap');
    };

    // The *old* flexbox
    // www.w3.org/TR/2009/WD-css3-flexbox-20090723/

    tests['flexboxlegacy'] = function () {
        return testPropsAll('boxDirection');
    };

    // On the S60 and BB Storm, getContext exists, but always returns undefined
    // so we actually have to call getContext() to verify
    // github.com/Modernizr/Modernizr/issues/issue/97/

    tests['canvas'] = function () {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    };

    tests['canvastext'] = function () {
        return !!(Modernizr['canvas'] && is(document.createElement('canvas').getContext('2d').fillText, 'function'));
    };

    // webk.it/70117 is tracking a legit WebGL feature detect proposal

    // We do a soft detect which may false positive in order to avoid
    // an expensive context creation: bugzil.la/732441

    tests['webgl'] = function () {
        return !!window.WebGLRenderingContext;
    };

    /*
     * The Modernizr.touch test only indicates if the browser supports
     *    touch events, which does not necessarily reflect a touchscreen
     *    device, as evidenced by tablets running Windows 7 or, alas,
     *    the Palm Pre / WebOS (touch) phones.
     *
     * Additionally, Chrome (desktop) used to lie about its support on this,
     *    but that has since been rectified: crbug.com/36415
     *
     * We also test for Firefox 4 Multitouch Support.
     *
     * For more info, see: modernizr.github.com/Modernizr/touch.html
     */

    tests['touch'] = function () {
        var bool;

        if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
            bool = true;
        } else {
            injectElementWithStyles(['@media (', prefixes.join('touch-enabled),('), mod, ')', '{#modernizr{top:9px;position:absolute}}'].join(''), function (node) {
                bool = node.offsetTop === 9;
            });
        }

        return bool;
    };


    // geolocation is often considered a trivial feature detect...
    // Turns out, it's quite tricky to get right:
    //
    // Using !!navigator.geolocation does two things we don't want. It:
    //   1. Leaks memory in IE9: github.com/Modernizr/Modernizr/issues/513
    //   2. Disables page caching in WebKit: webk.it/43956
    //
    // Meanwhile, in Firefox < 8, an about:config setting could expose
    // a false positive that would throw an exception: bugzil.la/688158

    tests['geolocation'] = function () {
        return 'geolocation' in navigator;
    };


    tests['postmessage'] = function () {
        return !!window.postMessage;
    };


    // Chrome incognito mode used to throw an exception when using openDatabase
    // It doesn't anymore.
    tests['websqldatabase'] = function () {
        return !!window.openDatabase;
    };

    // Vendors had inconsistent prefixing with the experimental Indexed DB:
    // - Webkit's implementation is accessible through webkitIndexedDB
    // - Firefox shipped moz_indexedDB before FF4b9, but since then has been mozIndexedDB
    // For speed, we don't test the legacy (and beta-only) indexedDB
    tests['indexedDB'] = function () {
        return !!testPropsAll("indexedDB", window);
    };

    // documentMode logic from YUI to filter out IE8 Compat Mode
    //   which false positives.
    tests['hashchange'] = function () {
        return isEventSupported('hashchange', window) && (document.documentMode === undefined || document.documentMode > 7);
    };

    // Per 1.6:
    // This used to be Modernizr.historymanagement but the longer
    // name has been deprecated in favor of a shorter and property-matching one.
    // The old API is still available in 1.6, but as of 2.0 will throw a warning,
    // and in the first release thereafter disappear entirely.
    tests['history'] = function () {
        return !!(window.history && history.pushState);
    };

    tests['draganddrop'] = function () {
        var div = document.createElement('div');
        return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
    };

    // FF3.6 was EOL'ed on 4/24/12, but the ESR version of FF10
    // will be supported until FF19 (2/12/13), at which time, ESR becomes FF17.
    // FF10 still uses prefixes, so check for it until then.
    // for more ESR info, see: mozilla.org/en-US/firefox/organizations/faq/
    tests['websockets'] = function () {
        return 'WebSocket' in window || 'MozWebSocket' in window;
    };


    // css-tricks.com/rgba-browser-support/
    tests['rgba'] = function () {
        // Set an rgba() color and check the returned value

        setCss('background-color:rgba(150,255,150,.5)');

        return contains(mStyle.backgroundColor, 'rgba');
    };

    tests['hsla'] = function () {
        // Same as rgba(), in fact, browsers re-map hsla() to rgba() internally,
        //   except IE9 who retains it as hsla

        setCss('background-color:hsla(120,40%,100%,.5)');

        return contains(mStyle.backgroundColor, 'rgba') || contains(mStyle.backgroundColor, 'hsla');
    };

    tests['multiplebgs'] = function () {
        // Setting multiple images AND a color on the background shorthand property
        //  and then querying the style.background property value for the number of
        //  occurrences of "url(" is a reliable method for detecting ACTUAL support for this!

        setCss('background:url(https://),url(https://),red url(https://)');

        // If the UA supports multiple backgrounds, there should be three occurrences
        //   of the string "url(" in the return value for elemStyle.background

        return (/(url\s*\(.*?){3}/).test(mStyle.background);
    };


    // this will false positive in Opera Mini
    //   github.com/Modernizr/Modernizr/issues/396

    tests['backgroundsize'] = function () {
        return testPropsAll('backgroundSize');
    };

    tests['borderimage'] = function () {
        return testPropsAll('borderImage');
    };


    // Super comprehensive table about all the unique implementations of
    // border-radius: muddledramblings.com/table-of-css3-border-radius-compliance

    tests['borderradius'] = function () {
        return testPropsAll('borderRadius');
    };

    // WebOS unfortunately false positives on this test.
    tests['boxshadow'] = function () {
        return testPropsAll('boxShadow');
    };

    // FF3.0 will false positive on this test
    tests['textshadow'] = function () {
        return document.createElement('div').style.textShadow === '';
    };


    tests['opacity'] = function () {
        // Browsers that actually have CSS Opacity implemented have done so
        //  according to spec, which means their return values are within the
        //  range of [0.0,1.0] - including the leading zero.

        setCssAll('opacity:.55');

        // The non-literal . in this regex is intentional:
        //   German Chrome returns this value as 0,55
        // github.com/Modernizr/Modernizr/issues/#issue/59/comment/516632
        return (/^0.55$/).test(mStyle.opacity);
    };


    // Note, Android < 4 will pass this test, but can only animate
    //   a single property at a time
    //   goo.gl/v3V4Gp
    tests['cssanimations'] = function () {
        return testPropsAll('animationName');
    };


    tests['csscolumns'] = function () {
        return testPropsAll('columnCount');
    };


    tests['cssgradients'] = function () {
        /**
         * For CSS Gradients syntax, please see:
         * webkit.org/blog/175/introducing-css-gradients/
         * developer.mozilla.org/en/CSS/-moz-linear-gradient
         * developer.mozilla.org/en/CSS/-moz-radial-gradient
         * dev.w3.org/csswg/css3-images/#gradients-
         */

        var str1 = 'background-image:',
            str2 = 'gradient(linear,left top,right bottom,from(#9f9),to(white));',
            str3 = 'linear-gradient(left top,#9f9, white);';

        setCss(
            // legacy webkit syntax (FIXME: remove when syntax not in use anymore)
            (str1 + '-webkit- '.split(' ').join(str2 + str1) +
                // standard syntax             // trailing 'background-image:'
            prefixes.join(str3 + str1)).slice(0, -str1.length)
        );

        return contains(mStyle.backgroundImage, 'gradient');
    };


    tests['cssreflections'] = function () {
        return testPropsAll('boxReflect');
    };


    tests['csstransforms'] = function () {
        return !!testPropsAll('transform');
    };


    tests['csstransforms3d'] = function () {

        var ret = !!testPropsAll('perspective');

        // Webkit's 3D transforms are passed off to the browser's own graphics renderer.
        //   It works fine in Safari on Leopard and Snow Leopard, but not in Chrome in
        //   some conditions. As a result, Webkit typically recognizes the syntax but
        //   will sometimes throw a false positive, thus we must do a more thorough check:
        if (ret && 'webkitPerspective' in docElement.style) {

            // Webkit allows this media query to succeed only if the feature is enabled.
            // `@media (transform-3d),(-webkit-transform-3d){ ... }`
            injectElementWithStyles('@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}', function (node, rule) {
                ret = node.offsetLeft === 9 && node.offsetHeight === 3;
            });
        }
        return ret;
    };


    tests['csstransitions'] = function () {
        return testPropsAll('transition');
    };


    /*>>fontface*/
    // @font-face detection routine by Diego Perini
    // javascript.nwbox.com/CSSSupport/

    // false positives:
    //   WebOS github.com/Modernizr/Modernizr/issues/342
    //   WP7   github.com/Modernizr/Modernizr/issues/538
    tests['fontface'] = function () {
        var bool;

        injectElementWithStyles('@font-face {font-family:"font";src:url("https://")}', function (node, rule) {
            var style = document.getElementById('smodernizr'),
                sheet = style.sheet || style.styleSheet,
                cssText = sheet ? (sheet.cssRules && sheet.cssRules[0] ? sheet.cssRules[0].cssText : sheet.cssText || '') : '';

            bool = /src/i.test(cssText) && cssText.indexOf(rule.split(' ')[0]) === 0;
        });

        return bool;
    };
    /*>>fontface*/

    // CSS generated content detection
    tests['generatedcontent'] = function () {
        var bool;

        injectElementWithStyles(['#', mod, '{font:0/0 a}#', mod, ':after{content:"', smile, '";visibility:hidden;font:3px/1 a}'].join(''), function (node) {
            bool = node.offsetHeight >= 3;
        });

        return bool;
    };


    // These tests evaluate support of the video/audio elements, as well as
    // testing what types of content they support.
    //
    // We're using the Boolean constructor here, so that we can extend the value
    // e.g.  Modernizr.video     // true
    //       Modernizr.video.ogg // 'probably'
    //
    // Codec values from : github.com/NielsLeenheer/html5test/blob/9106a8/index.html#L845
    //                     thx to NielsLeenheer and zcorpan

    // Note: in some older browsers, "no" was a return value instead of empty string.
    //   It was live in FF3.5.0 and 3.5.1, but fixed in 3.5.2
    //   It was also live in Safari 4.0.0 - 4.0.4, but fixed in 4.0.5

    tests['video'] = function () {
        var elem = document.createElement('video'),
            bool = false;

        // IE9 Running on Windows Server SKU can cause an exception to be thrown, bug #224
        try {
            if (bool = !!elem.canPlayType) {
                bool = new Boolean(bool);
                bool.ogg = elem.canPlayType('video/ogg; codecs="theora"').replace(/^no$/, '');

                // Without QuickTime, this value will be `undefined`. github.com/Modernizr/Modernizr/issues/546
                bool.h264 = elem.canPlayType('video/mp4; codecs="avc1.42E01E"').replace(/^no$/, '');

                bool.webm = elem.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/, '');
            }

        } catch (e) {
        }

        return bool;
    };

    tests['audio'] = function () {
        var elem = document.createElement('audio'),
            bool = false;

        try {
            if (bool = !!elem.canPlayType) {
                bool = new Boolean(bool);
                bool.ogg = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, '');
                bool.mp3 = elem.canPlayType('audio/mpeg;').replace(/^no$/, '');

                // Mimetypes accepted:
                //   developer.mozilla.org/En/Media_formats_supported_by_the_audio_and_video_elements
                //   bit.ly/iphoneoscodecs
                bool.wav = elem.canPlayType('audio/wav; codecs="1"').replace(/^no$/, '');
                bool.m4a = ( elem.canPlayType('audio/x-m4a;') ||
                elem.canPlayType('audio/aac;')).replace(/^no$/, '');
            }
        } catch (e) {
        }

        return bool;
    };


    // In FF4, if disabled, window.localStorage should === null.

    // Normally, we could not test that directly and need to do a
    //   `('localStorage' in window) && ` test first because otherwise Firefox will
    //   throw bugzil.la/365772 if cookies are disabled

    // Also in iOS5 Private Browsing mode, attempting to use localStorage.setItem
    // will throw the exception:
    //   QUOTA_EXCEEDED_ERRROR DOM Exception 22.
    // Peculiarly, getItem and removeItem calls do not throw.

    // Because we are forced to try/catch this, we'll go aggressive.

    // Just FWIW: IE8 Compat mode supports these features completely:
    //   www.quirksmode.org/dom/html5.html
    // But IE8 doesn't support either with local files

    tests['localstorage'] = function () {
        try {
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch (e) {
            return false;
        }
    };

    tests['sessionstorage'] = function () {
        try {
            sessionStorage.setItem(mod, mod);
            sessionStorage.removeItem(mod);
            return true;
        } catch (e) {
            return false;
        }
    };


    tests['webworkers'] = function () {
        return !!window.Worker;
    };


    tests['applicationcache'] = function () {
        return !!window.applicationCache;
    };


    // Thanks to Erik Dahlstrom
    tests['svg'] = function () {
        return !!document.createElementNS && !!document.createElementNS(ns.svg, 'svg').createSVGRect;
    };

    // specifically for SVG inline in HTML, not within XHTML
    // test page: paulirish.com/demo/inline-svg
    tests['inlinesvg'] = function () {
        var div = document.createElement('div');
        div.innerHTML = '<svg/>';
        return (div.firstChild && div.firstChild.namespaceURI) == ns.svg;
    };

    // SVG SMIL animation
    tests['smil'] = function () {
        return !!document.createElementNS && /SVGAnimate/.test(toString.call(document.createElementNS(ns.svg, 'animate')));
    };

    // This test is only for clip paths in SVG proper, not clip paths on HTML content
    // demo: srufaculty.sru.edu/david.dailey/svg/newstuff/clipPath4.svg

    // However read the comments to dig into applying SVG clippaths to HTML content here:
    //   github.com/Modernizr/Modernizr/issues/213#issuecomment-1149491
    tests['svgclippaths'] = function () {
        return !!document.createElementNS && /SVGClipPath/.test(toString.call(document.createElementNS(ns.svg, 'clipPath')));
    };

    /*>>webforms*/
    // input features and input types go directly onto the ret object, bypassing the tests loop.
    // Hold this guy to execute in a moment.
    function webforms() {
        /*>>input*/
        // Run through HTML5's new input attributes to see if the UA understands any.
        // We're using f which is the <input> element created early on
        // Mike Taylr has created a comprehensive resource for testing these attributes
        //   when applied to all input types:
        //   miketaylr.com/code/input-type-attr.html
        // spec: www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary

        // Only input placeholder is tested while textarea's placeholder is not.
        // Currently Safari 4 and Opera 11 have support only for the input placeholder
        // Both tests are available in feature-detects/forms-placeholder.js
        Modernizr['input'] = (function (props) {
            for (var i = 0, len = props.length; i < len; i++) {
                attrs[props[i]] = !!(props[i] in inputElem);
            }
            if (attrs.list) {
                // safari false positive's on datalist: webk.it/74252
                // see also github.com/Modernizr/Modernizr/issues/146
                attrs.list = !!(document.createElement('datalist') && window.HTMLDataListElement);
            }
            return attrs;
        })('autocomplete autofocus list placeholder max min multiple pattern required step'.split(' '));
        /*>>input*/

        /*>>inputtypes*/
        // Run through HTML5's new input types to see if the UA understands any.
        //   This is put behind the tests runloop because it doesn't return a
        //   true/false like all the other tests; instead, it returns an object
        //   containing each input type with its corresponding true/false value

        // Big thanks to @miketaylr for the html5 forms expertise. miketaylr.com/
        Modernizr['inputtypes'] = (function (props) {

            for (var i = 0, bool, inputElemType, defaultView, len = props.length; i < len; i++) {

                inputElem.setAttribute('type', inputElemType = props[i]);
                bool = inputElem.type !== 'text';

                // We first check to see if the type we give it sticks..
                // If the type does, we feed it a textual value, which shouldn't be valid.
                // If the value doesn't stick, we know there's input sanitization which infers a custom UI
                if (bool) {

                    inputElem.value = smile;
                    inputElem.style.cssText = 'position:absolute;visibility:hidden;';

                    if (/^range$/.test(inputElemType) && inputElem.style.WebkitAppearance !== undefined) {

                        docElement.appendChild(inputElem);
                        defaultView = document.defaultView;

                        // Safari 2-4 allows the smiley as a value, despite making a slider
                        bool = defaultView.getComputedStyle &&
                        defaultView.getComputedStyle(inputElem, null).WebkitAppearance !== 'textfield' &&
                            // Mobile android web browser has false positive, so must
                            // check the height to see if the widget is actually there.
                        (inputElem.offsetHeight !== 0);

                        docElement.removeChild(inputElem);

                    } else if (/^(search|tel)$/.test(inputElemType)) {
                        // Spec doesn't define any special parsing or detectable UI
                        //   behaviors so we pass these through as true

                        // Interestingly, opera fails the earlier test, so it doesn't
                        //  even make it here.

                    } else if (/^(url|email)$/.test(inputElemType)) {
                        // Real url and email support comes with prebaked validation.
                        bool = inputElem.checkValidity && inputElem.checkValidity() === false;

                    } else {
                        // If the upgraded input compontent rejects the :) text, we got a winner
                        bool = inputElem.value != smile;
                    }
                }

                inputs[props[i]] = !!bool;
            }
            return inputs;
        })('search tel url email datetime date month week time datetime-local number range color'.split(' '));
        /*>>inputtypes*/
    }

    /*>>webforms*/


    // End of test definitions
    // -----------------------


    // Run through all tests and detect their support in the current UA.
    // todo: hypothetically we could be doing an array of tests and use a basic loop here.
    for (var feature in tests) {
        if (hasOwnProp(tests, feature)) {
            // run the test, throw the return value into the Modernizr,
            //   then based on that boolean, define an appropriate className
            //   and push it into an array of classes we'll join later.
            featureName = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();

            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }

    /*>>webforms*/
    // input tests need to run.
    Modernizr.input || webforms();
    /*>>webforms*/


    /**
     * addTest allows the user to define their own feature tests
     * the result will be added onto the Modernizr object,
     * as well as an appropriate className set on the html element
     *
     * @param feature - String naming the feature
     * @param test - Function returning true if feature is supported, false if not
     */
    Modernizr.addTest = function (feature, test) {
        if (typeof feature == 'object') {
            for (var key in feature) {
                if (hasOwnProp(feature, key)) {
                    Modernizr.addTest(key, feature[key]);
                }
            }
        } else {

            feature = feature.toLowerCase();

            if (Modernizr[feature] !== undefined) {
                // we're going to quit if you're trying to overwrite an existing test
                // if we were to allow it, we'd do this:
                //   var re = new RegExp("\\b(no-)?" + feature + "\\b");
                //   docElement.className = docElement.className.replace( re, '' );
                // but, no rly, stuff 'em.
                return Modernizr;
            }

            test = typeof test == 'function' ? test() : test;

            if (typeof enableClasses !== "undefined" && enableClasses) {
                docElement.className += ' ' + (test ? '' : 'no-') + feature;
            }
            Modernizr[feature] = test;

        }

        return Modernizr; // allow chaining.
    };


    // Reset modElem.cssText to nothing to reduce memory footprint.
    setCss('');
    modElem = inputElem = null;

    /*>>shiv*/
    /**
     * @preserve HTML5 Shiv prev3.7.1 | @afarkas @jdalton @jon_neal @rem | MIT/GPL2 Licensed
     */
    ;
    (function (window, document) {
        /*jshint evil:true */
        /** version */
        var version = '3.7.0';

        /** Preset options */
        var options = window.html5 || {};

        /** Used to skip problem elements */
        var reSkip = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i;

        /** Not all elements can be cloned in IE **/
        var saveClones = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i;

        /** Detect whether the browser supports default html5 styles */
        var supportsHtml5Styles;

        /** Name of the expando, to work with multiple documents or to re-shiv one document */
        var expando = '_html5shiv';

        /** The id for the the documents expando */
        var expanID = 0;

        /** Cached data for each document */
        var expandoData = {};

        /** Detect whether the browser supports unknown elements */
        var supportsUnknownElements;

        (function () {
            try {
                var a = document.createElement('a');
                a.innerHTML = '<xyz></xyz>';
                //if the hidden property is implemented we can assume, that the browser supports basic HTML5 Styles
                supportsHtml5Styles = ('hidden' in a);

                supportsUnknownElements = a.childNodes.length == 1 || (function () {
                    // assign a false positive if unable to shiv
                    (document.createElement)('a');
                    var frag = document.createDocumentFragment();
                    return (
                    typeof frag.cloneNode == 'undefined' ||
                    typeof frag.createDocumentFragment == 'undefined' ||
                    typeof frag.createElement == 'undefined'
                    );
                }());
            } catch (e) {
                // assign a false positive if detection fails => unable to shiv
                supportsHtml5Styles = true;
                supportsUnknownElements = true;
            }

        }());

        /*--------------------------------------------------------------------------*/

        /**
         * Creates a style sheet with the given CSS text and adds it to the document.
         * @private
         * @param {Document} ownerDocument The document.
         * @param {String} cssText The CSS text.
         * @returns {StyleSheet} The style element.
         */
        function addStyleSheet(ownerDocument, cssText) {
            var p = ownerDocument.createElement('p'),
                parent = ownerDocument.getElementsByTagName('head')[0] || ownerDocument.documentElement;

            p.innerHTML = 'x<style>' + cssText + '</style>';
            return parent.insertBefore(p.lastChild, parent.firstChild);
        }

        /**
         * Returns the value of `html5.elements` as an array.
         * @private
         * @returns {Array} An array of shived element node names.
         */
        function getElements() {
            var elements = html5.elements;
            return typeof elements == 'string' ? elements.split(' ') : elements;
        }

        /**
         * Returns the data associated to the given document
         * @private
         * @param {Document} ownerDocument The document.
         * @returns {Object} An object of data.
         */
        function getExpandoData(ownerDocument) {
            var data = expandoData[ownerDocument[expando]];
            if (!data) {
                data = {};
                expanID++;
                ownerDocument[expando] = expanID;
                expandoData[expanID] = data;
            }
            return data;
        }

        /**
         * returns a shived element for the given nodeName and document
         * @memberOf html5
         * @param {String} nodeName name of the element
         * @param {Document} ownerDocument The context document.
         * @returns {Object} The shived element.
         */
        function createElement(nodeName, ownerDocument, data) {
            if (!ownerDocument) {
                ownerDocument = document;
            }
            if (supportsUnknownElements) {
                return ownerDocument.createElement(nodeName);
            }
            if (!data) {
                data = getExpandoData(ownerDocument);
            }
            var node;

            if (data.cache[nodeName]) {
                node = data.cache[nodeName].cloneNode();
            } else if (saveClones.test(nodeName)) {
                node = (data.cache[nodeName] = data.createElem(nodeName)).cloneNode();
            } else {
                node = data.createElem(nodeName);
            }

            // Avoid adding some elements to fragments in IE < 9 because
            // * Attributes like `name` or `type` cannot be set/changed once an element
            //   is inserted into a document/fragment
            // * Link elements with `src` attributes that are inaccessible, as with
            //   a 403 response, will cause the tab/window to crash
            // * Script elements appended to fragments will execute when their `src`
            //   or `text` property is set
            return node.canHaveChildren && !reSkip.test(nodeName) && !node.tagUrn ? data.frag.appendChild(node) : node;
        }

        /**
         * returns a shived DocumentFragment for the given document
         * @memberOf html5
         * @param {Document} ownerDocument The context document.
         * @returns {Object} The shived DocumentFragment.
         */
        function createDocumentFragment(ownerDocument, data) {
            if (!ownerDocument) {
                ownerDocument = document;
            }
            if (supportsUnknownElements) {
                return ownerDocument.createDocumentFragment();
            }
            data = data || getExpandoData(ownerDocument);
            var clone = data.frag.cloneNode(),
                i = 0,
                elems = getElements(),
                l = elems.length;
            for (; i < l; i++) {
                clone.createElement(elems[i]);
            }
            return clone;
        }

        /**
         * Shivs the `createElement` and `createDocumentFragment` methods of the document.
         * @private
         * @param {Document|DocumentFragment} ownerDocument The document.
         * @param {Object} data of the document.
         */
        function shivMethods(ownerDocument, data) {
            if (!data.cache) {
                data.cache = {};
                data.createElem = ownerDocument.createElement;
                data.createFrag = ownerDocument.createDocumentFragment;
                data.frag = data.createFrag();
            }


            ownerDocument.createElement = function (nodeName) {
                //abort shiv
                if (!html5.shivMethods) {
                    return data.createElem(nodeName);
                }
                return createElement(nodeName, ownerDocument, data);
            };

            ownerDocument.createDocumentFragment = Function('h,f', 'return function(){' +
                'var n=f.cloneNode(),c=n.createElement;' +
                'h.shivMethods&&(' +
                    // unroll the `createElement` calls
                getElements().join().replace(/[\w\-]+/g, function (nodeName) {
                    data.createElem(nodeName);
                    data.frag.createElement(nodeName);
                    return 'c("' + nodeName + '")';
                }) +
                ');return n}'
            )(html5, data.frag);
        }

        /*--------------------------------------------------------------------------*/

        /**
         * Shivs the given document.
         * @memberOf html5
         * @param {Document} ownerDocument The document to shiv.
         * @returns {Document} The shived document.
         */
        function shivDocument(ownerDocument) {
            if (!ownerDocument) {
                ownerDocument = document;
            }
            var data = getExpandoData(ownerDocument);

            if (html5.shivCSS && !supportsHtml5Styles && !data.hasCSS) {
                data.hasCSS = !!addStyleSheet(ownerDocument,
                    // corrects block display not defined in IE6/7/8/9
                    'article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}' +
                        // adds styling not present in IE6/7/8/9
                    'mark{background:#FF0;color:#000}' +
                        // hides non-rendered elements
                    'template{display:none}'
                );
            }
            if (!supportsUnknownElements) {
                shivMethods(ownerDocument, data);
            }
            return ownerDocument;
        }

        /*--------------------------------------------------------------------------*/

        /**
         * The `html5` object is exposed so that more elements can be shived and
         * existing shiving can be detected on iframes.
         * @type Object
         * @example
         *
         * // options can be changed before the script is included
         * html5 = { 'elements': 'mark section', 'shivCSS': false, 'shivMethods': false };
         */
        var html5 = {

            /**
             * An array or space separated string of node names of the elements to shiv.
             * @memberOf html5
             * @type Array|String
             */
            'elements': options.elements || 'abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output progress section summary template time video',

            /**
             * current version of html5shiv
             */
            'version': version,

            /**
             * A flag to indicate that the HTML5 style sheet should be inserted.
             * @memberOf html5
             * @type Boolean
             */
            'shivCSS': (options.shivCSS !== false),

            /**
             * Is equal to true if a browser supports creating unknown/HTML5 elements
             * @memberOf html5
             * @type boolean
             */
            'supportsUnknownElements': supportsUnknownElements,

            /**
             * A flag to indicate that the document's `createElement` and `createDocumentFragment`
             * methods should be overwritten.
             * @memberOf html5
             * @type Boolean
             */
            'shivMethods': (options.shivMethods !== false),

            /**
             * A string to describe the type of `html5` object ("default" or "default print").
             * @memberOf html5
             * @type String
             */
            'type': 'default',

            // shivs the document according to the specified `html5` object options
            'shivDocument': shivDocument,

            //creates a shived element
            createElement: createElement,

            //creates a shived documentFragment
            createDocumentFragment: createDocumentFragment
        };

        /*--------------------------------------------------------------------------*/

        // expose html5
        window.html5 = html5;

        // shiv the document
        shivDocument(document);

    }(this, document));
    /*>>shiv*/

    // Assign private properties to the return object with prefix
    Modernizr._version = version;

    // expose these for the plugin API. Look in the source for how to join() them against your input
    /*>>prefixes*/
    Modernizr._prefixes = prefixes;
    /*>>prefixes*/
    /*>>domprefixes*/
    Modernizr._domPrefixes = domPrefixes;
    Modernizr._cssomPrefixes = cssomPrefixes;
    /*>>domprefixes*/

    /*>>mq*/
    // Modernizr.mq tests a given media query, live against the current state of the window
    // A few important notes:
    //   * If a browser does not support media queries at all (eg. oldIE) the mq() will always return false
    //   * A max-width or orientation query will be evaluated against the current state, which may change later.
    //   * You must specify values. Eg. If you are testing support for the min-width media query use:
    //       Modernizr.mq('(min-width:0)')
    // usage:
    // Modernizr.mq('only screen and (max-width:768)')
    Modernizr.mq = testMediaQuery;
    /*>>mq*/

    /*>>hasevent*/
    // Modernizr.hasEvent() detects support for a given event, with an optional element to test on
    // Modernizr.hasEvent('gesturestart', elem)
    Modernizr.hasEvent = isEventSupported;
    /*>>hasevent*/

    /*>>testprop*/
    // Modernizr.testProp() investigates whether a given style property is recognized
    // Note that the property names must be provided in the camelCase variant.
    // Modernizr.testProp('pointerEvents')
    Modernizr.testProp = function (prop) {
        return testProps([prop]);
    };
    /*>>testprop*/

    /*>>testallprops*/
    // Modernizr.testAllProps() investigates whether a given style property,
    //   or any of its vendor-prefixed variants, is recognized
    // Note that the property names must be provided in the camelCase variant.
    // Modernizr.testAllProps('boxSizing')
    Modernizr.testAllProps = testPropsAll;
    /*>>testallprops*/


    /*>>teststyles*/
    // Modernizr.testStyles() allows you to add custom styles to the document and test an element afterwards
    // Modernizr.testStyles('#modernizr { position:absolute }', function(elem, rule){ ... })
    Modernizr.testStyles = injectElementWithStyles;
    /*>>teststyles*/


    /*>>prefixed*/
    // Modernizr.prefixed() returns the prefixed or nonprefixed property name variant of your input
    // Modernizr.prefixed('boxSizing') // 'MozBoxSizing'

    // Properties must be passed as dom-style camelcase, rather than `box-sizing` hypentated style.
    // Return values will also be the camelCase variant, if you need to translate that to hypenated style use:
    //
    //     str.replace(/([A-Z])/g, function(str,m1){ return '-' + m1.toLowerCase(); }).replace(/^ms-/,'-ms-');

    // If you're trying to ascertain which transition end event to bind to, you might do something like...
    //
    //     var transEndEventNames = {
    //       'WebkitTransition' : 'webkitTransitionEnd',
    //       'MozTransition'    : 'transitionend',
    //       'OTransition'      : 'oTransitionEnd',
    //       'msTransition'     : 'MSTransitionEnd',
    //       'transition'       : 'transitionend'
    //     },
    //     transEndEventName = transEndEventNames[ Modernizr.prefixed('transition') ];

    Modernizr.prefixed = function (prop, obj, elem) {
        if (!obj) {
            return testPropsAll(prop, 'pfx');
        } else {
            // Testing DOM property e.g. Modernizr.prefixed('requestAnimationFrame', window) // 'mozRequestAnimationFrame'
            return testPropsAll(prop, obj, elem);
        }
    };
    /*>>prefixed*/


    /*>>cssclasses*/
    // Remove "no-js" class from <html> element, if it exists:
    docElement.className = docElement.className.replace(/(^|\s)no-js(\s|$)/, '$1$2') +

        // Add the new classes to the <html> element.
    (enableClasses ? ' js ' + classes.join(' ') : '');
    /*>>cssclasses*/

    return Modernizr;

})(this, this.document);

/*
 * Foundation Responsive Library
 * http://foundation.zurb.com
 * Copyright 2014, ZURB
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 */

(function ($, window, document, undefined) {
    'use strict';

    var header_helpers = function (class_array) {
        var i = class_array.length;
        var head = $('head');

        while (i--) {
            if (head.has('.' + class_array[i]).length === 0) {
                head.append('<meta class="' + class_array[i] + '" />');
            }
        }
    };

    header_helpers([
        'foundation-mq-small',
        'foundation-mq-small-only',
        'foundation-mq-medium',
        'foundation-mq-medium-only',
        'foundation-mq-large',
        'foundation-mq-large-only',
        'foundation-mq-xlarge',
        'foundation-mq-xlarge-only',
        'foundation-mq-xxlarge',
        'foundation-data-attribute-namespace']);

    // Enable FastClick if present

    $(function () {
        if (typeof FastClick !== 'undefined') {
            // Don't attach to body if undefined
            if (typeof document.body !== 'undefined') {
                FastClick.attach(document.body);
            }
        }
    });

    // private Fast Selector wrapper,
    // returns jQuery object. Only use where
    // getElementById is not available.
    var S = function (selector, context) {
        if (typeof selector === 'string') {
            if (context) {
                var cont;
                if (context.jquery) {
                    cont = context[0];
                    if (!cont) {
                        return context;
                    }
                } else {
                    cont = context;
                }
                return $(cont.querySelectorAll(selector));
            }

            return $(document.querySelectorAll(selector));
        }

        return $(selector, context);
    };

    // Namespace functions.

    var attr_name = function (init) {
        var arr = [];
        if (!init) {
            arr.push('data');
        }
        if (this.namespace.length > 0) {
            arr.push(this.namespace);
        }
        arr.push(this.name);

        return arr.join('-');
    };

    var add_namespace = function (str) {
        var parts = str.split('-'),
            i = parts.length,
            arr = [];

        while (i--) {
            if (i !== 0) {
                arr.push(parts[i]);
            } else {
                if (this.namespace.length > 0) {
                    arr.push(this.namespace, parts[i]);
                } else {
                    arr.push(parts[i]);
                }
            }
        }

        return arr.reverse().join('-');
    };

    // Event binding and data-options updating.

    var bindings = function (method, options) {
        var self = this,
            bind = function () {
                var $this = S(this),
                    should_bind_events = !$this.data(self.attr_name(true) + '-init');
                $this.data(self.attr_name(true) + '-init', $.extend({}, self.settings, (options || method), self.data_options($this)));

                if (should_bind_events) {
                    self.events(this);
                }
            };

        if (S(this.scope).is('[' + this.attr_name() + ']')) {
            bind.call(this.scope);
        } else {
            S('[' + this.attr_name() + ']', this.scope).each(bind);
        }
        // # Patch to fix #5043 to move this *after* the if/else clause in order for Backbone and similar frameworks to have improved control over event binding and data-options updating.
        if (typeof method === 'string') {
            return this[method].call(this, options);
        }

    };

    var single_image_loaded = function (image, callback) {
        function loaded() {
            callback(image[0]);
        }

        function bindLoad() {
            this.one('load', loaded);

            if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) {
                var src = this.attr('src'),
                    param = src.match(/\?/) ? '&' : '?';

                param += 'random=' + (new Date()).getTime();
                this.attr('src', src + param);
            }
        }

        if (!image.attr('src')) {
            loaded();
            return;
        }

        if (image[0].complete || image[0].readyState === 4) {
            loaded();
        } else {
            bindLoad.call(image);
        }
    };

    /*
     https://github.com/paulirish/matchMedia.js
     */

    window.matchMedia = window.matchMedia || (function (doc) {

        'use strict';

        var bool,
            docElem = doc.documentElement,
            refNode = docElem.firstElementChild || docElem.firstChild,
        // fakeBody required for <FF4 when executed in <head>
            fakeBody = doc.createElement('body'),
            div = doc.createElement('div');

        div.id = 'mq-test-1';
        div.style.cssText = 'position:absolute;top:-100em';
        fakeBody.style.background = 'none';
        fakeBody.appendChild(div);

        return function (q) {

            div.innerHTML = '&shy;<style media="' + q + '"> #mq-test-1 { width: 42px; }</style>';

            docElem.insertBefore(fakeBody, refNode);
            bool = div.offsetWidth === 42;
            docElem.removeChild(fakeBody);

            return {
                matches: bool,
                media: q
            };

        };

    }(document));

    /*
     * jquery.requestAnimationFrame
     * https://github.com/gnarf37/jquery-requestAnimationFrame
     * Requires jQuery 1.8+
     *
     * Copyright (c) 2012 Corey Frang
     * Licensed under the MIT license.
     */

    (function (jQuery) {


        // requestAnimationFrame polyfill adapted from Erik Möller
        // fixes from Paul Irish and Tino Zijdel
        // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
        // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

        var animating,
            lastTime = 0,
            vendors = ['webkit', 'moz'],
            requestAnimationFrame = window.requestAnimationFrame,
            cancelAnimationFrame = window.cancelAnimationFrame,
            jqueryFxAvailable = 'undefined' !== typeof jQuery.fx;

        for (; lastTime < vendors.length && !requestAnimationFrame; lastTime++) {
            requestAnimationFrame = window[vendors[lastTime] + 'RequestAnimationFrame'];
            cancelAnimationFrame = cancelAnimationFrame ||
            window[vendors[lastTime] + 'CancelAnimationFrame'] ||
            window[vendors[lastTime] + 'CancelRequestAnimationFrame'];
        }

        function raf() {
            if (animating) {
                requestAnimationFrame(raf);

                if (jqueryFxAvailable) {
                    jQuery.fx.tick();
                }
            }
        }

        if (requestAnimationFrame) {
            // use rAF
            window.requestAnimationFrame = requestAnimationFrame;
            window.cancelAnimationFrame = cancelAnimationFrame;

            if (jqueryFxAvailable) {
                jQuery.fx.timer = function (timer) {
                    if (timer() && jQuery.timers.push(timer) && !animating) {
                        animating = true;
                        raf();
                    }
                };

                jQuery.fx.stop = function () {
                    animating = false;
                };
            }
        } else {
            // polyfill
            window.requestAnimationFrame = function (callback) {
                var currTime = new Date().getTime(),
                    timeToCall = Math.max(0, 16 - (currTime - lastTime)),
                    id = window.setTimeout(function () {
                        callback(currTime + timeToCall);
                    }, timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };

            window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };

        }

    }($));

    function removeQuotes(string) {
        if (typeof string === 'string' || string instanceof String) {
            string = string.replace(/^['\\/"]+|(;\s?})+|['\\/"]+$/g, '');
        }

        return string;
    }

    window.Foundation = {
        name: 'Foundation',

        version: '5.5.1',

        media_queries: {
            'small': S('.foundation-mq-small').css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, ''),
            'small-only': S('.foundation-mq-small-only').css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, ''),
            'medium': S('.foundation-mq-medium').css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, ''),
            'medium-only': S('.foundation-mq-medium-only').css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, ''),
            'large': S('.foundation-mq-large').css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, ''),
            'large-only': S('.foundation-mq-large-only').css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, ''),
            'xlarge': S('.foundation-mq-xlarge').css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, ''),
            'xlarge-only': S('.foundation-mq-xlarge-only').css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, ''),
            'xxlarge': S('.foundation-mq-xxlarge').css('font-family').replace(/^[\/\\'"]+|(;\s?})+|[\/\\'"]+$/g, '')
        },

        stylesheet: $('<style></style>').appendTo('head')[0].sheet,

        global: {
            namespace: undefined
        },

        init: function (scope, libraries, method, options, response) {
            var args = [scope, method, options, response],
                responses = [];

            // check RTL
            this.rtl = /rtl/i.test(S('html').attr('dir'));

            // set foundation global scope
            this.scope = scope || this.scope;

            this.set_namespace();

            if (libraries && typeof libraries === 'string' && !/reflow/i.test(libraries)) {
                if (this.libs.hasOwnProperty(libraries)) {
                    responses.push(this.init_lib(libraries, args));
                }
            } else {
                for (var lib in this.libs) {
                    responses.push(this.init_lib(lib, libraries));
                }
            }

            S(window).load(function () {
                S(window)
                    .trigger('resize.fndtn.clearing')
                    .trigger('resize.fndtn.dropdown')
                    .trigger('resize.fndtn.equalizer')
                    .trigger('resize.fndtn.interchange')
                    .trigger('resize.fndtn.joyride')
                    .trigger('resize.fndtn.magellan')
                    .trigger('resize.fndtn.topbar')
                    .trigger('resize.fndtn.slider');
            });

            return scope;
        },

        init_lib: function (lib, args) {
            if (this.libs.hasOwnProperty(lib)) {
                this.patch(this.libs[lib]);

                if (args && args.hasOwnProperty(lib)) {
                    if (typeof this.libs[lib].settings !== 'undefined') {
                        $.extend(true, this.libs[lib].settings, args[lib]);
                    } else if (typeof this.libs[lib].defaults !== 'undefined') {
                        $.extend(true, this.libs[lib].defaults, args[lib]);
                    }
                    return this.libs[lib].init.apply(this.libs[lib], [this.scope, args[lib]]);
                }

                args = args instanceof Array ? args : new Array(args);
                return this.libs[lib].init.apply(this.libs[lib], args);
            }

            return function () {
            };
        },

        patch: function (lib) {
            lib.scope = this.scope;
            lib.namespace = this.global.namespace;
            lib.rtl = this.rtl;
            lib['data_options'] = this.utils.data_options;
            lib['attr_name'] = attr_name;
            lib['add_namespace'] = add_namespace;
            lib['bindings'] = bindings;
            lib['S'] = this.utils.S;
        },

        inherit: function (scope, methods) {
            var methods_arr = methods.split(' '),
                i = methods_arr.length;

            while (i--) {
                if (this.utils.hasOwnProperty(methods_arr[i])) {
                    scope[methods_arr[i]] = this.utils[methods_arr[i]];
                }
            }
        },

        set_namespace: function () {

            // Description:
            //    Don't bother reading the namespace out of the meta tag
            //    if the namespace has been set globally in javascript
            //
            // Example:
            //    Foundation.global.namespace = 'my-namespace';
            // or make it an empty string:
            //    Foundation.global.namespace = '';
            //
            //

            // If the namespace has not been set (is undefined), try to read it out of the meta element.
            // Otherwise use the globally defined namespace, even if it's empty ('')
            var namespace = ( this.global.namespace === undefined ) ? $('.foundation-data-attribute-namespace').css('font-family') : this.global.namespace;

            // Finally, if the namsepace is either undefined or false, set it to an empty string.
            // Otherwise use the namespace value.
            this.global.namespace = ( namespace === undefined || /false/i.test(namespace) ) ? '' : namespace;
        },

        libs: {},

        // methods that can be inherited in libraries
        utils: {

            // Description:
            //    Fast Selector wrapper returns jQuery object. Only use where getElementById
            //    is not available.
            //
            // Arguments:
            //    Selector (String): CSS selector describing the element(s) to be
            //    returned as a jQuery object.
            //
            //    Scope (String): CSS selector describing the area to be searched. Default
            //    is document.
            //
            // Returns:
            //    Element (jQuery Object): jQuery object containing elements matching the
            //    selector within the scope.
            S: S,

            // Description:
            //    Executes a function a max of once every n milliseconds
            //
            // Arguments:
            //    Func (Function): Function to be throttled.
            //
            //    Delay (Integer): Function execution threshold in milliseconds.
            //
            // Returns:
            //    Lazy_function (Function): Function with throttling applied.
            throttle: function (func, delay) {
                var timer = null;

                return function () {
                    var context = this, args = arguments;

                    if (timer == null) {
                        timer = setTimeout(function () {
                            func.apply(context, args);
                            timer = null;
                        }, delay);
                    }
                };
            },

            // Description:
            //    Executes a function when it stops being invoked for n seconds
            //    Modified version of _.debounce() http://underscorejs.org
            //
            // Arguments:
            //    Func (Function): Function to be debounced.
            //
            //    Delay (Integer): Function execution threshold in milliseconds.
            //
            //    Immediate (Bool): Whether the function should be called at the beginning
            //    of the delay instead of the end. Default is false.
            //
            // Returns:
            //    Lazy_function (Function): Function with debouncing applied.
            debounce: function (func, delay, immediate) {
                var timeout, result;
                return function () {
                    var context = this, args = arguments;
                    var later = function () {
                        timeout = null;
                        if (!immediate) {
                            result = func.apply(context, args);
                        }
                    };
                    var callNow = immediate && !timeout;
                    clearTimeout(timeout);
                    timeout = setTimeout(later, delay);
                    if (callNow) {
                        result = func.apply(context, args);
                    }
                    return result;
                };
            },

            // Description:
            //    Parses data-options attribute
            //
            // Arguments:
            //    El (jQuery Object): Element to be parsed.
            //
            // Returns:
            //    Options (Javascript Object): Contents of the element's data-options
            //    attribute.
            data_options: function (el, data_attr_name) {
                data_attr_name = data_attr_name || 'options';
                var opts = {}, ii, p, opts_arr,
                    data_options = function (el) {
                        var namespace = Foundation.global.namespace;

                        if (namespace.length > 0) {
                            return el.data(namespace + '-' + data_attr_name);
                        }

                        return el.data(data_attr_name);
                    };

                var cached_options = data_options(el);

                if (typeof cached_options === 'object') {
                    return cached_options;
                }

                opts_arr = (cached_options || ':').split(';');
                ii = opts_arr.length;

                function isNumber(o) {
                    return !isNaN(o - 0) && o !== null && o !== '' && o !== false && o !== true;
                }

                function trim(str) {
                    if (typeof str === 'string') {
                        return $.trim(str);
                    }
                    return str;
                }

                while (ii--) {
                    p = opts_arr[ii].split(':');
                    p = [p[0], p.slice(1).join(':')];

                    if (/true/i.test(p[1])) {
                        p[1] = true;
                    }
                    if (/false/i.test(p[1])) {
                        p[1] = false;
                    }
                    if (isNumber(p[1])) {
                        if (p[1].indexOf('.') === -1) {
                            p[1] = parseInt(p[1], 10);
                        } else {
                            p[1] = parseFloat(p[1]);
                        }
                    }

                    if (p.length === 2 && p[0].length > 0) {
                        opts[trim(p[0])] = trim(p[1]);
                    }
                }

                return opts;
            },

            // Description:
            //    Adds JS-recognizable media queries
            //
            // Arguments:
            //    Media (String): Key string for the media query to be stored as in
            //    Foundation.media_queries
            //
            //    Class (String): Class name for the generated <meta> tag
            register_media: function (media, media_class) {
                if (Foundation.media_queries[media] === undefined) {
                    $('head').append('<meta class="' + media_class + '"/>');
                    Foundation.media_queries[media] = removeQuotes($('.' + media_class).css('font-family'));
                }
            },

            // Description:
            //    Add custom CSS within a JS-defined media query
            //
            // Arguments:
            //    Rule (String): CSS rule to be appended to the document.
            //
            //    Media (String): Optional media query string for the CSS rule to be
            //    nested under.
            add_custom_rule: function (rule, media) {
                if (media === undefined && Foundation.stylesheet) {
                    Foundation.stylesheet.insertRule(rule, Foundation.stylesheet.cssRules.length);
                } else {
                    var query = Foundation.media_queries[media];

                    if (query !== undefined) {
                        Foundation.stylesheet.insertRule('@media ' +
                        Foundation.media_queries[media] + '{ ' + rule + ' }');
                    }
                }
            },

            // Description:
            //    Performs a callback function when an image is fully loaded
            //
            // Arguments:
            //    Image (jQuery Object): Image(s) to check if loaded.
            //
            //    Callback (Function): Function to execute when image is fully loaded.
            image_loaded: function (images, callback) {
                var self = this,
                    unloaded = images.length;

                if (unloaded === 0) {
                    callback(images);
                }

                images.each(function () {
                    single_image_loaded(self.S(this), function () {
                        unloaded -= 1;
                        if (unloaded === 0) {
                            callback(images);
                        }
                    });
                });
            },

            // Description:
            //    Returns a random, alphanumeric string
            //
            // Arguments:
            //    Length (Integer): Length of string to be generated. Defaults to random
            //    integer.
            //
            // Returns:
            //    Rand (String): Pseudo-random, alphanumeric string.
            random_str: function () {
                if (!this.fidx) {
                    this.fidx = 0;
                }
                this.prefix = this.prefix || [(this.name || 'F'), (+new Date).toString(36)].join('-');

                return this.prefix + (this.fidx++).toString(36);
            },

            // Description:
            //    Helper for window.matchMedia
            //
            // Arguments:
            //    mq (String): Media query
            //
            // Returns:
            //    (Boolean): Whether the media query passes or not
            match: function (mq) {
                return window.matchMedia(mq).matches;
            },

            // Description:
            //    Helpers for checking Foundation default media queries with JS
            //
            // Returns:
            //    (Boolean): Whether the media query passes or not

            is_small_up: function () {
                return this.match(Foundation.media_queries.small);
            },

            is_medium_up: function () {
                return this.match(Foundation.media_queries.medium);
            },

            is_large_up: function () {
                return this.match(Foundation.media_queries.large);
            },

            is_xlarge_up: function () {
                return this.match(Foundation.media_queries.xlarge);
            },

            is_xxlarge_up: function () {
                return this.match(Foundation.media_queries.xxlarge);
            },

            is_small_only: function () {
                return !this.is_medium_up() && !this.is_large_up() && !this.is_xlarge_up() && !this.is_xxlarge_up();
            },

            is_medium_only: function () {
                return this.is_medium_up() && !this.is_large_up() && !this.is_xlarge_up() && !this.is_xxlarge_up();
            },

            is_large_only: function () {
                return this.is_medium_up() && this.is_large_up() && !this.is_xlarge_up() && !this.is_xxlarge_up();
            },

            is_xlarge_only: function () {
                return this.is_medium_up() && this.is_large_up() && this.is_xlarge_up() && !this.is_xxlarge_up();
            },

            is_xxlarge_only: function () {
                return this.is_medium_up() && this.is_large_up() && this.is_xlarge_up() && this.is_xxlarge_up();
            }
        }
    };

    $.fn.foundation = function () {
        var args = Array.prototype.slice.call(arguments, 0);

        return this.each(function () {
            Foundation.init.apply(Foundation, [this].concat(args));
            return this;
        });
    };

}(jQuery, window, window.document));

;
(function ($, window, document, undefined) {
    'use strict';

    Foundation.libs.abide = {
        name: 'abide',

        version: '5.5.1',

        settings: {
            live_validate: true,
            validate_on_blur: true,
            focus_on_invalid: true,
            error_labels: true, // labels with a for="inputId" will recieve an `error` class
            error_class: 'error',
            timeout: 1000,
            patterns: {
                alpha: /^[a-zA-Z]+$/,
                alpha_numeric: /^[a-zA-Z0-9]+$/,
                integer: /^[-+]?\d+$/,
                number: /^[-+]?\d*(?:[\.\,]\d+)?$/,

                // amex, visa, diners
                card: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
                cvv: /^([0-9]){3,4}$/,

                // http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#valid-e-mail-address
                email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,

                url: /^(https?|ftp|file|ssh):\/\/(((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/,
                // abc.de
                domain: /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8}$/,

                datetime: /^([0-2][0-9]{3})\-([0-1][0-9])\-([0-3][0-9])T([0-5][0-9])\:([0-5][0-9])\:([0-5][0-9])(Z|([\-\+]([0-1][0-9])\:00))$/,
                // YYYY-MM-DD
                date: /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))$/,
                // HH:MM:SS
                time: /^(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/,
                dateISO: /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,
                // MM/DD/YYYY
                month_day_year: /^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.]\d{4}$/,
                // DD/MM/YYYY
                day_month_year: /^(0[1-9]|[12][0-9]|3[01])[- \/.](0[1-9]|1[012])[- \/.]\d{4}$/,

                // #FFF or #FFFFFF
                color: /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/
            },
            validators: {
                equalTo: function (el, required, parent) {
                    var from = document.getElementById(el.getAttribute(this.add_namespace('data-equalto'))).value,
                        to = el.value,
                        valid = (from === to);

                    return valid;
                }
            }
        },

        timer: null,

        init: function (scope, method, options) {
            this.bindings(method, options);
        },

        events: function (scope) {
            var self = this,
                form = self.S(scope).attr('novalidate', 'novalidate'),
                settings = form.data(this.attr_name(true) + '-init') || {};

            this.invalid_attr = this.add_namespace('data-invalid');

            form
                .off('.abide')
                .on('submit.fndtn.abide validate.fndtn.abide', function (e) {
                    var is_ajax = /ajax/i.test(self.S(this).attr(self.attr_name()));
                    return self.validate(self.S(this).find('input, textarea, select').get(), e, is_ajax);
                })
                .on('reset', function () {
                    return self.reset($(this));
                })
                .find('input, textarea, select')
                .off('.abide')
                .on('blur.fndtn.abide change.fndtn.abide', function (e) {
                    if (settings.validate_on_blur === true) {
                        self.validate([this], e);
                    }
                })
                .on('keydown.fndtn.abide', function (e) {
                    if (settings.live_validate === true && e.which != 9) {
                        clearTimeout(self.timer);
                        self.timer = setTimeout(function () {
                            self.validate([this], e);
                        }.bind(this), settings.timeout);
                    }
                });
        },

        reset: function (form) {
            form.removeAttr(this.invalid_attr);
            $(this.invalid_attr, form).removeAttr(this.invalid_attr);
            $('.' + this.settings.error_class, form).not('small').removeClass(this.settings.error_class);
        },

        validate: function (els, e, is_ajax) {
            var validations = this.parse_patterns(els),
                validation_count = validations.length,
                form = this.S(els[0]).closest('form'),
                submit_event = /submit/.test(e.type);

            // Has to count up to make sure the focus gets applied to the top error
            for (var i = 0; i < validation_count; i++) {
                if (!validations[i] && (submit_event || is_ajax)) {
                    if (this.settings.focus_on_invalid) {
                        els[i].focus();
                    }
                    form.trigger('invalid').trigger('invalid.fndtn.abide');
                    this.S(els[i]).closest('form').attr(this.invalid_attr, '');
                    return false;
                }
            }

            if (submit_event || is_ajax) {
                form.trigger('valid').trigger('valid.fndtn.abide');
            }

            form.removeAttr(this.invalid_attr);

            if (is_ajax) {
                return false;
            }

            return true;
        },

        parse_patterns: function (els) {
            var i = els.length,
                el_patterns = [];

            while (i--) {
                el_patterns.push(this.pattern(els[i]));
            }

            return this.check_validation_and_apply_styles(el_patterns);
        },

        pattern: function (el) {
            var type = el.getAttribute('type'),
                required = typeof el.getAttribute('required') === 'string';

            var pattern = el.getAttribute('pattern') || '';

            if (this.settings.patterns.hasOwnProperty(pattern) && pattern.length > 0) {
                return [el, this.settings.patterns[pattern], required];
            } else if (pattern.length > 0) {
                return [el, new RegExp(pattern), required];
            }

            if (this.settings.patterns.hasOwnProperty(type)) {
                return [el, this.settings.patterns[type], required];
            }

            pattern = /.*/;

            return [el, pattern, required];
        },

        // TODO: Break this up into smaller methods, getting hard to read.
        check_validation_and_apply_styles: function (el_patterns) {
            var i = el_patterns.length,
                validations = [],
                form = this.S(el_patterns[0][0]).closest('[data-' + this.attr_name(true) + ']'),
                settings = form.data(this.attr_name(true) + '-init') || {};
            while (i--) {
                var el = el_patterns[i][0],
                    required = el_patterns[i][2],
                    value = el.value.trim(),
                    direct_parent = this.S(el).parent(),
                    validator = el.getAttribute(this.add_namespace('data-abide-validator')),
                    is_radio = el.type === 'radio',
                    is_checkbox = el.type === 'checkbox',
                    label = this.S('label[for="' + el.getAttribute('id') + '"]'),
                    valid_length = (required) ? (el.value.length > 0) : true,
                    el_validations = [];

                var parent, valid;

                // support old way to do equalTo validations
                if (el.getAttribute(this.add_namespace('data-equalto'))) {
                    validator = 'equalTo'
                }

                if (!direct_parent.is('label')) {
                    parent = direct_parent;
                } else {
                    parent = direct_parent.parent();
                }

                if (validator) {
                    valid = this.settings.validators[validator].apply(this, [el, required, parent]);
                    el_validations.push(valid);
                }

                if (is_radio && required) {
                    el_validations.push(this.valid_radio(el, required));
                } else if (is_checkbox && required) {
                    el_validations.push(this.valid_checkbox(el, required));
                } else {

                    if (el_patterns[i][1].test(value) && valid_length ||
                        !required && el.value.length < 1 || $(el).attr('disabled')) {
                        el_validations.push(true);
                    } else {
                        el_validations.push(false);
                    }

                    el_validations = [el_validations.every(function (valid) {
                        return valid;
                    })];

                    if (el_validations[0]) {
                        this.S(el).removeAttr(this.invalid_attr);
                        el.setAttribute('aria-invalid', 'false');
                        el.removeAttribute('aria-describedby');
                        parent.removeClass(this.settings.error_class);
                        if (label.length > 0 && this.settings.error_labels) {
                            label.removeClass(this.settings.error_class).removeAttr('role');
                        }
                        $(el).triggerHandler('valid');
                    } else {
                        this.S(el).attr(this.invalid_attr, '');
                        el.setAttribute('aria-invalid', 'true');

                        // Try to find the error associated with the input
                        var errorElem = parent.find('small.' + this.settings.error_class, 'span.' + this.settings.error_class);
                        var errorID = errorElem.length > 0 ? errorElem[0].id : '';
                        if (errorID.length > 0) {
                            el.setAttribute('aria-describedby', errorID);
                        }

                        // el.setAttribute('aria-describedby', $(el).find('.error')[0].id);
                        parent.addClass(this.settings.error_class);
                        if (label.length > 0 && this.settings.error_labels) {
                            label.addClass(this.settings.error_class).attr('role', 'alert');
                        }
                        $(el).triggerHandler('invalid');
                    }
                }
                validations.push(el_validations[0]);
            }
            validations = [validations.every(function (valid) {
                return valid;
            })];
            return validations;
        },

        valid_checkbox: function (el, required) {
            var el = this.S(el),
                valid = (el.is(':checked') || !required || el.get(0).getAttribute('disabled'));

            if (valid) {
                el.removeAttr(this.invalid_attr).parent().removeClass(this.settings.error_class);
            } else {
                el.attr(this.invalid_attr, '').parent().addClass(this.settings.error_class);
            }

            return valid;
        },

        valid_radio: function (el, required) {
            var name = el.getAttribute('name'),
                group = this.S(el).closest('[data-' + this.attr_name(true) + ']').find("[name='" + name + "']"),
                count = group.length,
                valid = false,
                disabled = false;

            // Has to count up to make sure the focus gets applied to the top error
            for (var i = 0; i < count; i++) {
                if (group[i].getAttribute('disabled')) {
                    disabled = true;
                    valid = true;
                } else {
                    if (group[i].checked) {
                        valid = true;
                    } else {
                        if (disabled) {
                            valid = false;
                        }
                    }
                }
            }

            // Has to count up to make sure the focus gets applied to the top error
            for (var i = 0; i < count; i++) {
                if (valid) {
                    this.S(group[i]).removeAttr(this.invalid_attr).parent().removeClass(this.settings.error_class);
                } else {
                    this.S(group[i]).attr(this.invalid_attr, '').parent().addClass(this.settings.error_class);
                }
            }

            return valid;
        },

        valid_equal: function (el, required, parent) {
            var from = document.getElementById(el.getAttribute(this.add_namespace('data-equalto'))).value,
                to = el.value,
                valid = (from === to);

            if (valid) {
                this.S(el).removeAttr(this.invalid_attr);
                parent.removeClass(this.settings.error_class);
                if (label.length > 0 && settings.error_labels) {
                    label.removeClass(this.settings.error_class);
                }
            } else {
                this.S(el).attr(this.invalid_attr, '');
                parent.addClass(this.settings.error_class);
                if (label.length > 0 && settings.error_labels) {
                    label.addClass(this.settings.error_class);
                }
            }

            return valid;
        },

        valid_oneof: function (el, required, parent, doNotValidateOthers) {
            var el = this.S(el),
                others = this.S('[' + this.add_namespace('data-oneof') + ']'),
                valid = others.filter(':checked').length > 0;

            if (valid) {
                el.removeAttr(this.invalid_attr).parent().removeClass(this.settings.error_class);
            } else {
                el.attr(this.invalid_attr, '').parent().addClass(this.settings.error_class);
            }

            if (!doNotValidateOthers) {
                var _this = this;
                others.each(function () {
                    _this.valid_oneof.call(_this, this, null, null, true);
                });
            }

            return valid;
        }
    };
}(jQuery, window, window.document));

;
(function ($, window, document, undefined) {
    'use strict';

    Foundation.libs.accordion = {
        name: 'accordion',

        version: '5.5.1',

        settings: {
            content_class: 'content',
            active_class: 'active',
            multi_expand: false,
            toggleable: true,
            callback: function () {
            }
        },

        init: function (scope, method, options) {
            this.bindings(method, options);
        },

        events: function () {
            var self = this;
            var S = this.S;
            S(this.scope)
                .off('.fndtn.accordion')
                .on('click.fndtn.accordion', '[' + this.attr_name() + '] > .accordion-navigation > a', function (e) {
                    var accordion = S(this).closest('[' + self.attr_name() + ']'),
                        groupSelector = self.attr_name() + '=' + accordion.attr(self.attr_name()),
                        settings = accordion.data(self.attr_name(true) + '-init') || self.settings,
                        target = S('#' + this.href.split('#')[1]),
                        aunts = $('> .accordion-navigation', accordion),
                        siblings = aunts.children('.' + settings.content_class),
                        active_content = siblings.filter('.' + settings.active_class);

                    e.preventDefault();

                    if (accordion.attr(self.attr_name())) {
                        siblings = siblings.add('[' + groupSelector + '] dd > ' + '.' + settings.content_class);
                        aunts = aunts.add('[' + groupSelector + '] .accordion-navigation');
                    }

                    if (settings.toggleable && target.is(active_content)) {
                        target.parent('.accordion-navigation').toggleClass(settings.active_class, false);
                        target.toggleClass(settings.active_class, false);
                        settings.callback(target);
                        target.triggerHandler('toggled', [accordion]);
                        accordion.triggerHandler('toggled', [target]);
                        return;
                    }

                    if (!settings.multi_expand) {
                        siblings.removeClass(settings.active_class);
                        aunts.removeClass(settings.active_class);
                    }

                    target.addClass(settings.active_class).parent().addClass(settings.active_class);
                    settings.callback(target);
                    target.triggerHandler('toggled', [accordion]);
                    accordion.triggerHandler('toggled', [target]);
                });
        },

        off: function () {
        },

        reflow: function () {
        }
    };
}(jQuery, window, window.document));

;
(function ($, window, document, undefined) {
    'use strict';

    Foundation.libs.alert = {
        name: 'alert',

        version: '5.5.1',

        settings: {
            callback: function () {
            }
        },

        init: function (scope, method, options) {
            this.bindings(method, options);
        },

        events: function () {
            var self = this,
                S = this.S;

            $(this.scope).off('.alert').on('click.fndtn.alert', '[' + this.attr_name() + '] .close', function (e) {
                var alertBox = S(this).closest('[' + self.attr_name() + ']'),
                    settings = alertBox.data(self.attr_name(true) + '-init') || self.settings;

                e.preventDefault();
                if (Modernizr.csstransitions) {
                    alertBox.addClass('alert-close');
                    alertBox.on('transitionend webkitTransitionEnd oTransitionEnd', function (e) {
                        S(this).trigger('close').trigger('close.fndtn.alert').remove();
                        settings.callback();
                    });
                } else {
                    alertBox.fadeOut(300, function () {
                        S(this).trigger('close').trigger('close.fndtn.alert').remove();
                        settings.callback();
                    });
                }
            });
        },

        reflow: function () {
        }
    };
}(jQuery, window, window.document));

;
(function ($, window, document, undefined) {
    'use strict';

    Foundation.libs.clearing = {
        name: 'clearing',

        version: '5.5.1',

        settings: {
            templates: {
                viewing: '<a href="#" class="clearing-close">&times;</a>' +
                '<div class="visible-img" style="display: none"><div class="clearing-touch-label"></div><img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D" alt="" />' +
                '<p class="clearing-caption"></p><a href="#" class="clearing-main-prev"><span></span></a>' +
                '<a href="#" class="clearing-main-next"><span></span></a></div>'
            },

            // comma delimited list of selectors that, on click, will close clearing,
            // add 'div.clearing-blackout, div.visible-img' to close on background click
            close_selectors: '.clearing-close, div.clearing-blackout',

            // Default to the entire li element.
            open_selectors: '',

            // Image will be skipped in carousel.
            skip_selector: '',

            touch_label: '',

            // event initializers and locks
            init: false,
            locked: false
        },

        init: function (scope, method, options) {
            var self = this;
            Foundation.inherit(this, 'throttle image_loaded');

            this.bindings(method, options);

            if (self.S(this.scope).is('[' + this.attr_name() + ']')) {
                this.assemble(self.S('li', this.scope));
            } else {
                self.S('[' + this.attr_name() + ']', this.scope).each(function () {
                    self.assemble(self.S('li', this));
                });
            }
        },

        events: function (scope) {
            var self = this,
                S = self.S,
                $scroll_container = $('.scroll-container');

            if ($scroll_container.length > 0) {
                this.scope = $scroll_container;
            }

            S(this.scope)
                .off('.clearing')
                .on('click.fndtn.clearing', 'ul[' + this.attr_name() + '] li ' + this.settings.open_selectors,
                function (e, current, target) {
                    var current = current || S(this),
                        target = target || current,
                        next = current.next('li'),
                        settings = current.closest('[' + self.attr_name() + ']').data(self.attr_name(true) + '-init'),
                        image = S(e.target);

                    e.preventDefault();

                    if (!settings) {
                        self.init();
                        settings = current.closest('[' + self.attr_name() + ']').data(self.attr_name(true) + '-init');
                    }

                    // if clearing is open and the current image is
                    // clicked, go to the next image in sequence
                    if (target.hasClass('visible') &&
                        current[0] === target[0] &&
                        next.length > 0 && self.is_open(current)) {
                        target = next;
                        image = S('img', target);
                    }

                    // set current and target to the clicked li if not otherwise defined.
                    self.open(image, current, target);
                    self.update_paddles(target);
                })

                .on('click.fndtn.clearing', '.clearing-main-next',
                function (e) {
                    self.nav(e, 'next')
                })
                .on('click.fndtn.clearing', '.clearing-main-prev',
                function (e) {
                    self.nav(e, 'prev')
                })
                .on('click.fndtn.clearing', this.settings.close_selectors,
                function (e) {
                    Foundation.libs.clearing.close(e, this)
                });

            $(document).on('keydown.fndtn.clearing',
                function (e) {
                    self.keydown(e)
                });

            S(window).off('.clearing').on('resize.fndtn.clearing',
                function () {
                    self.resize()
                });

            this.swipe_events(scope);
        },

        swipe_events: function (scope) {
            var self = this,
                S = self.S;

            S(this.scope)
                .on('touchstart.fndtn.clearing', '.visible-img', function (e) {
                    if (!e.touches) {
                        e = e.originalEvent;
                    }
                    var data = {
                        start_page_x: e.touches[0].pageX,
                        start_page_y: e.touches[0].pageY,
                        start_time: (new Date()).getTime(),
                        delta_x: 0,
                        is_scrolling: undefined
                    };

                    S(this).data('swipe-transition', data);
                    e.stopPropagation();
                })
                .on('touchmove.fndtn.clearing', '.visible-img', function (e) {
                    if (!e.touches) {
                        e = e.originalEvent;
                    }
                    // Ignore pinch/zoom events
                    if (e.touches.length > 1 || e.scale && e.scale !== 1) {
                        return;
                    }

                    var data = S(this).data('swipe-transition');

                    if (typeof data === 'undefined') {
                        data = {};
                    }

                    data.delta_x = e.touches[0].pageX - data.start_page_x;

                    if (Foundation.rtl) {
                        data.delta_x = -data.delta_x;
                    }

                    if (typeof data.is_scrolling === 'undefined') {
                        data.is_scrolling = !!( data.is_scrolling || Math.abs(data.delta_x) < Math.abs(e.touches[0].pageY - data.start_page_y) );
                    }

                    if (!data.is_scrolling && !data.active) {
                        e.preventDefault();
                        var direction = (data.delta_x < 0) ? 'next' : 'prev';
                        data.active = true;
                        self.nav(e, direction);
                    }
                })
                .on('touchend.fndtn.clearing', '.visible-img', function (e) {
                    S(this).data('swipe-transition', {});
                    e.stopPropagation();
                });
        },

        assemble: function ($li) {
            var $el = $li.parent();

            if ($el.parent().hasClass('carousel')) {
                return;
            }

            $el.after('<div id="foundationClearingHolder"></div>');

            var grid = $el.detach(),
                grid_outerHTML = '';

            if (grid[0] == null) {
                return;
            } else {
                grid_outerHTML = grid[0].outerHTML;
            }

            var holder = this.S('#foundationClearingHolder'),
                settings = $el.data(this.attr_name(true) + '-init'),
                data = {
                    grid: '<div class="carousel">' + grid_outerHTML + '</div>',
                    viewing: settings.templates.viewing
                },
                wrapper = '<div class="clearing-assembled"><div>' + data.viewing +
                    data.grid + '</div></div>',
                touch_label = this.settings.touch_label;

            if (Modernizr.touch) {
                wrapper = $(wrapper).find('.clearing-touch-label').html(touch_label).end();
            }

            holder.after(wrapper).remove();
        },

        open: function ($image, current, target) {
            var self = this,
                body = $(document.body),
                root = target.closest('.clearing-assembled'),
                container = self.S('div', root).first(),
                visible_image = self.S('.visible-img', container),
                image = self.S('img', visible_image).not($image),
                label = self.S('.clearing-touch-label', container),
                error = false;

            // Event to disable scrolling on touch devices when Clearing is activated
            $('body').on('touchmove', function (e) {
                e.preventDefault();
            });

            image.error(function () {
                error = true;
            });

            function startLoad() {
                setTimeout(function () {
                    this.image_loaded(image, function () {
                        if (image.outerWidth() === 1 && !error) {
                            startLoad.call(this);
                        } else {
                            cb.call(this, image);
                        }
                    }.bind(this));
                }.bind(this), 100);
            }

            function cb(image) {
                var $image = $(image);
                $image.css('visibility', 'visible');
                // toggle the gallery
                body.css('overflow', 'hidden');
                root.addClass('clearing-blackout');
                container.addClass('clearing-container');
                visible_image.show();
                this.fix_height(target)
                    .caption(self.S('.clearing-caption', visible_image), self.S('img', target))
                    .center_and_label(image, label)
                    .shift(current, target, function () {
                        target.closest('li').siblings().removeClass('visible');
                        target.closest('li').addClass('visible');
                    });
                visible_image.trigger('opened.fndtn.clearing')
            }

            if (!this.locked()) {
                visible_image.trigger('open.fndtn.clearing');
                // set the image to the selected thumbnail
                image
                    .attr('src', this.load($image))
                    .css('visibility', 'hidden');

                startLoad.call(this);
            }
        },

        close: function (e, el) {
            e.preventDefault();

            var root = (function (target) {
                    if (/blackout/.test(target.selector)) {
                        return target;
                    } else {
                        return target.closest('.clearing-blackout');
                    }
                }($(el))),
                body = $(document.body), container, visible_image;

            if (el === e.target && root) {
                body.css('overflow', '');
                container = $('div', root).first();
                visible_image = $('.visible-img', container);
                visible_image.trigger('close.fndtn.clearing');
                this.settings.prev_index = 0;
                $('ul[' + this.attr_name() + ']', root)
                    .attr('style', '').closest('.clearing-blackout')
                    .removeClass('clearing-blackout');
                container.removeClass('clearing-container');
                visible_image.hide();
                visible_image.trigger('closed.fndtn.clearing');
            }

            // Event to re-enable scrolling on touch devices
            $('body').off('touchmove');

            return false;
        },

        is_open: function (current) {
            return current.parent().prop('style').length > 0;
        },

        keydown: function (e) {
            var clearing = $('.clearing-blackout ul[' + this.attr_name() + ']'),
                NEXT_KEY = this.rtl ? 37 : 39,
                PREV_KEY = this.rtl ? 39 : 37,
                ESC_KEY = 27;

            if (e.which === NEXT_KEY) {
                this.go(clearing, 'next');
            }
            if (e.which === PREV_KEY) {
                this.go(clearing, 'prev');
            }
            if (e.which === ESC_KEY) {
                this.S('a.clearing-close').trigger('click').trigger('click.fndtn.clearing');
            }
        },

        nav: function (e, direction) {
            var clearing = $('ul[' + this.attr_name() + ']', '.clearing-blackout');

            e.preventDefault();
            this.go(clearing, direction);
        },

        resize: function () {
            var image = $('img', '.clearing-blackout .visible-img'),
                label = $('.clearing-touch-label', '.clearing-blackout');

            if (image.length) {
                this.center_and_label(image, label);
                image.trigger('resized.fndtn.clearing')
            }
        },

        // visual adjustments
        fix_height: function (target) {
            var lis = target.parent().children(),
                self = this;

            lis.each(function () {
                var li = self.S(this),
                    image = li.find('img');

                if (li.height() > image.outerHeight()) {
                    li.addClass('fix-height');
                }
            })
                .closest('ul')
                .width(lis.length * 100 + '%');

            return this;
        },

        update_paddles: function (target) {
            target = target.closest('li');
            var visible_image = target
                .closest('.carousel')
                .siblings('.visible-img');

            if (target.next().length > 0) {
                this.S('.clearing-main-next', visible_image).removeClass('disabled');
            } else {
                this.S('.clearing-main-next', visible_image).addClass('disabled');
            }

            if (target.prev().length > 0) {
                this.S('.clearing-main-prev', visible_image).removeClass('disabled');
            } else {
                this.S('.clearing-main-prev', visible_image).addClass('disabled');
            }
        },

        center_and_label: function (target, label) {
            if (!this.rtl && label.length > 0) {
                label.css({
                    marginLeft: -(label.outerWidth() / 2),
                    marginTop: -(target.outerHeight() / 2) - label.outerHeight() - 10
                });
            } else {
                label.css({
                    marginRight: -(label.outerWidth() / 2),
                    marginTop: -(target.outerHeight() / 2) - label.outerHeight() - 10,
                    left: 'auto',
                    right: '50%'
                });
            }
            return this;
        },

        // image loading and preloading

        load: function ($image) {
            var href;

            if ($image[0].nodeName === 'A') {
                href = $image.attr('href');
            } else {
                href = $image.closest('a').attr('href');
            }

            this.preload($image);

            if (href) {
                return href;
            }
            return $image.attr('src');
        },

        preload: function ($image) {
            this
                .img($image.closest('li').next())
                .img($image.closest('li').prev());
        },

        img: function (img) {
            if (img.length) {
                var new_img = new Image(),
                    new_a = this.S('a', img);

                if (new_a.length) {
                    new_img.src = new_a.attr('href');
                } else {
                    new_img.src = this.S('img', img).attr('src');
                }
            }
            return this;
        },

        // image caption

        caption: function (container, $image) {
            var caption = $image.attr('data-caption');

            if (caption) {
                container
                    .html(caption)
                    .show();
            } else {
                container
                    .text('')
                    .hide();
            }
            return this;
        },

        // directional methods

        go: function ($ul, direction) {
            var current = this.S('.visible', $ul),
                target = current[direction]();

            // Check for skip selector.
            if (this.settings.skip_selector && target.find(this.settings.skip_selector).length != 0) {
                target = target[direction]();
            }

            if (target.length) {
                this.S('img', target)
                    .trigger('click', [current, target]).trigger('click.fndtn.clearing', [current, target])
                    .trigger('change.fndtn.clearing');
            }
        },

        shift: function (current, target, callback) {
            var clearing = target.parent(),
                old_index = this.settings.prev_index || target.index(),
                direction = this.direction(clearing, current, target),
                dir = this.rtl ? 'right' : 'left',
                left = parseInt(clearing.css('left'), 10),
                width = target.outerWidth(),
                skip_shift;

            var dir_obj = {};

            // we use jQuery animate instead of CSS transitions because we
            // need a callback to unlock the next animation
            // needs support for RTL **
            if (target.index() !== old_index && !/skip/.test(direction)) {
                if (/left/.test(direction)) {
                    this.lock();
                    dir_obj[dir] = left + width;
                    clearing.animate(dir_obj, 300, this.unlock());
                } else if (/right/.test(direction)) {
                    this.lock();
                    dir_obj[dir] = left - width;
                    clearing.animate(dir_obj, 300, this.unlock());
                }
            } else if (/skip/.test(direction)) {
                // the target image is not adjacent to the current image, so
                // do we scroll right or not
                skip_shift = target.index() - this.settings.up_count;
                this.lock();

                if (skip_shift > 0) {
                    dir_obj[dir] = -(skip_shift * width);
                    clearing.animate(dir_obj, 300, this.unlock());
                } else {
                    dir_obj[dir] = 0;
                    clearing.animate(dir_obj, 300, this.unlock());
                }
            }

            callback();
        },

        direction: function ($el, current, target) {
            var lis = this.S('li', $el),
                li_width = lis.outerWidth() + (lis.outerWidth() / 4),
                up_count = Math.floor(this.S('.clearing-container').outerWidth() / li_width) - 1,
                target_index = lis.index(target),
                response;

            this.settings.up_count = up_count;

            if (this.adjacent(this.settings.prev_index, target_index)) {
                if ((target_index > up_count) && target_index > this.settings.prev_index) {
                    response = 'right';
                } else if ((target_index > up_count - 1) && target_index <= this.settings.prev_index) {
                    response = 'left';
                } else {
                    response = false;
                }
            } else {
                response = 'skip';
            }

            this.settings.prev_index = target_index;

            return response;
        },

        adjacent: function (current_index, target_index) {
            for (var i = target_index + 1; i >= target_index - 1; i--) {
                if (i === current_index) {
                    return true;
                }
            }
            return false;
        },

        // lock management

        lock: function () {
            this.settings.locked = true;
        },

        unlock: function () {
            this.settings.locked = false;
        },

        locked: function () {
            return this.settings.locked;
        },

        off: function () {
            this.S(this.scope).off('.fndtn.clearing');
            this.S(window).off('.fndtn.clearing');
        },

        reflow: function () {
            this.init();
        }
    };

}(jQuery, window, window.document));

;
(function ($, window, document, undefined) {
    'use strict';

    Foundation.libs.dropdown = {
        name: 'dropdown',

        version: '5.5.1',

        settings: {
            active_class: 'open',
            disabled_class: 'disabled',
            mega_class: 'mega',
            align: 'bottom',
            is_hover: false,
            hover_timeout: 150,
            opened: function () {
            },
            closed: function () {
            }
        },

        init: function (scope, method, options) {
            Foundation.inherit(this, 'throttle');

            $.extend(true, this.settings, method, options);
            this.bindings(method, options);
        },

        events: function (scope) {
            var self = this,
                S = self.S;

            S(this.scope)
                .off('.dropdown')
                .on('click.fndtn.dropdown', '[' + this.attr_name() + ']', function (e) {
                    var settings = S(this).data(self.attr_name(true) + '-init') || self.settings;
                    if (!settings.is_hover || Modernizr.touch) {
                        e.preventDefault();
                        if (S(this).parent('[data-reveal-id]')) {
                            e.stopPropagation();
                        }
                        self.toggle($(this));
                    }
                })
                .on('mouseenter.fndtn.dropdown', '[' + this.attr_name() + '], [' + this.attr_name() + '-content]', function (e) {
                    var $this = S(this),
                        dropdown,
                        target;

                    clearTimeout(self.timeout);

                    if ($this.data(self.data_attr())) {
                        dropdown = S('#' + $this.data(self.data_attr()));
                        target = $this;
                    } else {
                        dropdown = $this;
                        target = S('[' + self.attr_name() + '="' + dropdown.attr('id') + '"]');
                    }

                    var settings = target.data(self.attr_name(true) + '-init') || self.settings;

                    if (S(e.currentTarget).data(self.data_attr()) && settings.is_hover) {
                        self.closeall.call(self);
                    }

                    if (settings.is_hover) {
                        self.open.apply(self, [dropdown, target]);
                    }
                })
                .on('mouseleave.fndtn.dropdown', '[' + this.attr_name() + '], [' + this.attr_name() + '-content]', function (e) {
                    var $this = S(this);
                    var settings;

                    if ($this.data(self.data_attr())) {
                        settings = $this.data(self.data_attr(true) + '-init') || self.settings;
                    } else {
                        var target = S('[' + self.attr_name() + '="' + S(this).attr('id') + '"]'),
                            settings = target.data(self.attr_name(true) + '-init') || self.settings;
                    }

                    self.timeout = setTimeout(function () {
                        if ($this.data(self.data_attr())) {
                            if (settings.is_hover) {
                                self.close.call(self, S('#' + $this.data(self.data_attr())));
                            }
                        } else {
                            if (settings.is_hover) {
                                self.close.call(self, $this);
                            }
                        }
                    }.bind(this), settings.hover_timeout);
                })
                .on('click.fndtn.dropdown', function (e) {
                    var parent = S(e.target).closest('[' + self.attr_name() + '-content]');
                    var links = parent.find('a');

                    if (links.length > 0 && parent.attr('aria-autoclose') !== 'false') {
                        self.close.call(self, S('[' + self.attr_name() + '-content]'));
                    }

                    if (e.target !== document && !$.contains(document.documentElement, e.target)) {
                        return;
                    }

                    if (S(e.target).closest('[' + self.attr_name() + ']').length > 0) {
                        return;
                    }

                    if (!(S(e.target).data('revealId')) &&
                        (parent.length > 0 && (S(e.target).is('[' + self.attr_name() + '-content]') ||
                        $.contains(parent.first()[0], e.target)))) {
                        e.stopPropagation();
                        return;
                    }

                    self.close.call(self, S('[' + self.attr_name() + '-content]'));
                })
                .on('opened.fndtn.dropdown', '[' + self.attr_name() + '-content]', function () {
                    self.settings.opened.call(this);
                })
                .on('closed.fndtn.dropdown', '[' + self.attr_name() + '-content]', function () {
                    self.settings.closed.call(this);
                });

            S(window)
                .off('.dropdown')
                .on('resize.fndtn.dropdown', self.throttle(function () {
                    self.resize.call(self);
                }, 50));

            this.resize();
        },

        close: function (dropdown) {
            var self = this;
            dropdown.each(function () {
                var original_target = $('[' + self.attr_name() + '=' + dropdown[0].id + ']') || $('aria-controls=' + dropdown[0].id + ']');
                original_target.attr('aria-expanded', 'false');
                if (self.S(this).hasClass(self.settings.active_class)) {
                    self.S(this)
                        .css(Foundation.rtl ? 'right' : 'left', '-99999px')
                        .attr('aria-hidden', 'true')
                        .removeClass(self.settings.active_class)
                        .prev('[' + self.attr_name() + ']')
                        .removeClass(self.settings.active_class)
                        .removeData('target');

                    self.S(this).trigger('closed').trigger('closed.fndtn.dropdown', [dropdown]);
                }
            });
            dropdown.removeClass('f-open-' + this.attr_name(true));
        },

        closeall: function () {
            var self = this;
            $.each(self.S('.f-open-' + this.attr_name(true)), function () {
                self.close.call(self, self.S(this));
            });
        },

        open: function (dropdown, target) {
            this
                .css(dropdown
                    .addClass(this.settings.active_class), target);
            dropdown.prev('[' + this.attr_name() + ']').addClass(this.settings.active_class);
            dropdown.data('target', target.get(0)).trigger('opened').trigger('opened.fndtn.dropdown', [dropdown, target]);
            dropdown.attr('aria-hidden', 'false');
            target.attr('aria-expanded', 'true');
            dropdown.focus();
            dropdown.addClass('f-open-' + this.attr_name(true));
        },

        data_attr: function () {
            if (this.namespace.length > 0) {
                return this.namespace + '-' + this.name;
            }

            return this.name;
        },

        toggle: function (target) {
            if (target.hasClass(this.settings.disabled_class)) {
                return;
            }
            var dropdown = this.S('#' + target.data(this.data_attr()));
            if (dropdown.length === 0) {
                // No dropdown found, not continuing
                return;
            }

            this.close.call(this, this.S('[' + this.attr_name() + '-content]').not(dropdown));

            if (dropdown.hasClass(this.settings.active_class)) {
                this.close.call(this, dropdown);
                if (dropdown.data('target') !== target.get(0)) {
                    this.open.call(this, dropdown, target);
                }
            } else {
                this.open.call(this, dropdown, target);
            }
        },

        resize: function () {
            var dropdown = this.S('[' + this.attr_name() + '-content].open');
            var target = $(dropdown.data("target"));

            if (dropdown.length && target.length) {
                this.css(dropdown, target);
            }
        },

        css: function (dropdown, target) {
            var left_offset = Math.max((target.width() - dropdown.width()) / 2, 8),
                settings = target.data(this.attr_name(true) + '-init') || this.settings;

            this.clear_idx();

            if (this.small()) {
                var p = this.dirs.bottom.call(dropdown, target, settings);

                dropdown.attr('style', '').removeClass('drop-left drop-right drop-top').css({
                    position: 'absolute',
                    width: '95%',
                    'max-width': 'none',
                    top: p.top
                });

                dropdown.css(Foundation.rtl ? 'right' : 'left', left_offset);
            } else {

                this.style(dropdown, target, settings);
            }

            return dropdown;
        },

        style: function (dropdown, target, settings) {
            var css = $.extend({position: 'absolute'},
                this.dirs[settings.align].call(dropdown, target, settings));

            dropdown.attr('style', '').css(css);
        },

        // return CSS property object
        // `this` is the dropdown
        dirs: {
            // Calculate target offset
            _base: function (t) {
                var o_p = this.offsetParent(),
                    o = o_p.offset(),
                    p = t.offset();

                p.top -= o.top;
                p.left -= o.left;

                //set some flags on the p object to pass along
                p.missRight = false;
                p.missTop = false;
                p.missLeft = false;
                p.leftRightFlag = false;

                //lets see if the panel will be off the screen
                //get the actual width of the page and store it
                var actualBodyWidth;
                if (document.getElementsByClassName('row')[0]) {
                    actualBodyWidth = document.getElementsByClassName('row')[0].clientWidth;
                } else {
                    actualBodyWidth = window.outerWidth;
                }

                var actualMarginWidth = (window.outerWidth - actualBodyWidth) / 2;
                var actualBoundary = actualBodyWidth;

                if (!this.hasClass('mega')) {
                    //miss top
                    if (t.offset().top <= this.outerHeight()) {
                        p.missTop = true;
                        actualBoundary = window.outerWidth - actualMarginWidth;
                        p.leftRightFlag = true;
                    }

                    //miss right
                    if (t.offset().left + this.outerWidth() > t.offset().left + actualMarginWidth && t.offset().left - actualMarginWidth > this.outerWidth()) {
                        p.missRight = true;
                        p.missLeft = false;
                    }

                    //miss left
                    if (t.offset().left - this.outerWidth() <= 0) {
                        p.missLeft = true;
                        p.missRight = false;
                    }
                }

                return p;
            },

            top: function (t, s) {
                var self = Foundation.libs.dropdown,
                    p = self.dirs._base.call(this, t);

                this.addClass('drop-top');

                if (p.missTop == true) {
                    p.top = p.top + t.outerHeight() + this.outerHeight();
                    this.removeClass('drop-top');
                }

                if (p.missRight == true) {
                    p.left = p.left - this.outerWidth() + t.outerWidth();
                }

                if (t.outerWidth() < this.outerWidth() || self.small() || this.hasClass(s.mega_menu)) {
                    self.adjust_pip(this, t, s, p);
                }

                if (Foundation.rtl) {
                    return {
                        left: p.left - this.outerWidth() + t.outerWidth(),
                        top: p.top - this.outerHeight()
                    };
                }

                return {left: p.left, top: p.top - this.outerHeight()};
            },

            bottom: function (t, s) {
                var self = Foundation.libs.dropdown,
                    p = self.dirs._base.call(this, t);

                if (p.missRight == true) {
                    p.left = p.left - this.outerWidth() + t.outerWidth();
                }

                if (t.outerWidth() < this.outerWidth() || self.small() || this.hasClass(s.mega_menu)) {
                    self.adjust_pip(this, t, s, p);
                }

                if (self.rtl) {
                    return {left: p.left - this.outerWidth() + t.outerWidth(), top: p.top + t.outerHeight()};
                }

                return {left: p.left, top: p.top + t.outerHeight()};
            },

            left: function (t, s) {
                var p = Foundation.libs.dropdown.dirs._base.call(this, t);

                this.addClass('drop-left');

                if (p.missLeft == true) {
                    p.left = p.left + this.outerWidth();
                    p.top = p.top + t.outerHeight();
                    this.removeClass('drop-left');
                }

                return {left: p.left - this.outerWidth(), top: p.top};
            },

            right: function (t, s) {
                var p = Foundation.libs.dropdown.dirs._base.call(this, t);

                this.addClass('drop-right');

                if (p.missRight == true) {
                    p.left = p.left - this.outerWidth();
                    p.top = p.top + t.outerHeight();
                    this.removeClass('drop-right');
                } else {
                    p.triggeredRight = true;
                }

                var self = Foundation.libs.dropdown;

                if (t.outerWidth() < this.outerWidth() || self.small() || this.hasClass(s.mega_menu)) {
                    self.adjust_pip(this, t, s, p);
                }

                return {left: p.left + t.outerWidth(), top: p.top};
            }
        },

        // Insert rule to style psuedo elements
        adjust_pip: function (dropdown, target, settings, position) {
            var sheet = Foundation.stylesheet,
                pip_offset_base = 8;

            if (dropdown.hasClass(settings.mega_class)) {
                pip_offset_base = position.left + (target.outerWidth() / 2) - 8;
            } else if (this.small()) {
                pip_offset_base += position.left - 8;
            }

            this.rule_idx = sheet.cssRules.length;

            //default
            var sel_before = '.f-dropdown.open:before',
                sel_after = '.f-dropdown.open:after',
                css_before = 'left: ' + pip_offset_base + 'px;',
                css_after = 'left: ' + (pip_offset_base - 1) + 'px;';

            if (position.missRight == true) {
                pip_offset_base = dropdown.outerWidth() - 23;
                sel_before = '.f-dropdown.open:before',
                    sel_after = '.f-dropdown.open:after',
                    css_before = 'left: ' + pip_offset_base + 'px;',
                    css_after = 'left: ' + (pip_offset_base - 1) + 'px;';
            }

            //just a case where right is fired, but its not missing right
            if (position.triggeredRight == true) {
                sel_before = '.f-dropdown.open:before',
                    sel_after = '.f-dropdown.open:after',
                    css_before = 'left:-12px;',
                    css_after = 'left:-14px;';
            }

            if (sheet.insertRule) {
                sheet.insertRule([sel_before, '{', css_before, '}'].join(' '), this.rule_idx);
                sheet.insertRule([sel_after, '{', css_after, '}'].join(' '), this.rule_idx + 1);
            } else {
                sheet.addRule(sel_before, css_before, this.rule_idx);
                sheet.addRule(sel_after, css_after, this.rule_idx + 1);
            }
        },

        // Remove old dropdown rule index
        clear_idx: function () {
            var sheet = Foundation.stylesheet;

            if (typeof this.rule_idx !== 'undefined') {
                sheet.deleteRule(this.rule_idx);
                sheet.deleteRule(this.rule_idx);
                delete this.rule_idx;
            }
        },

        small: function () {
            return matchMedia(Foundation.media_queries.small).matches && !matchMedia(Foundation.media_queries.medium).matches;
        },

        off: function () {
            this.S(this.scope).off('.fndtn.dropdown');
            this.S('html, body').off('.fndtn.dropdown');
            this.S(window).off('.fndtn.dropdown');
            this.S('[data-dropdown-content]').off('.fndtn.dropdown');
        },

        reflow: function () {
        }
    };
}(jQuery, window, window.document));

;
(function ($, window, document, undefined) {
    'use strict';

    Foundation.libs.equalizer = {
        name: 'equalizer',

        version: '5.5.1',

        settings: {
            use_tallest: true,
            before_height_change: $.noop,
            after_height_change: $.noop,
            equalize_on_stack: false
        },

        init: function (scope, method, options) {
            Foundation.inherit(this, 'image_loaded');
            this.bindings(method, options);
            this.reflow();
        },

        events: function () {
            this.S(window).off('.equalizer').on('resize.fndtn.equalizer', function (e) {
                this.reflow();
            }.bind(this));
        },

        equalize: function (equalizer) {
            var isStacked = false,
                vals = equalizer.find('[' + this.attr_name() + '-watch]:visible'),
                settings = equalizer.data(this.attr_name(true) + '-init');

            if (vals.length === 0) {
                return;
            }
            var firstTopOffset = vals.first().offset().top;
            settings.before_height_change();
            equalizer.trigger('before-height-change').trigger('before-height-change.fndth.equalizer');
            vals.height('inherit');
            vals.each(function () {
                var el = $(this);
                if (el.offset().top !== firstTopOffset) {
                    isStacked = true;
                }
            });

            if (settings.equalize_on_stack === false) {
                if (isStacked) {
                    return;
                }
            }
            ;

            var heights = vals.map(function () {
                return $(this).outerHeight(false)
            }).get();

            if (settings.use_tallest) {
                var max = Math.max.apply(null, heights);
                vals.css('height', max);
            } else {
                var min = Math.min.apply(null, heights);
                vals.css('height', min);
            }
            settings.after_height_change();
            equalizer.trigger('after-height-change').trigger('after-height-change.fndtn.equalizer');
        },

        reflow: function () {
            var self = this;

            this.S('[' + this.attr_name() + ']', this.scope).each(function () {
                var $eq_target = $(this);
                self.image_loaded(self.S('img', this), function () {
                    self.equalize($eq_target)
                });
            });
        }
    };
})(jQuery, window, window.document);

;
(function ($, window, document, undefined) {
    'use strict';

    Foundation.libs.interchange = {
        name: 'interchange',

        version: '5.5.1',

        cache: {},

        images_loaded: false,
        nodes_loaded: false,

        settings: {
            load_attr: 'interchange',

            named_queries: {
                'default': 'only screen',
                'small': Foundation.media_queries['small'],
                'small-only': Foundation.media_queries['small-only'],
                'medium': Foundation.media_queries['medium'],
                'medium-only': Foundation.media_queries['medium-only'],
                'large': Foundation.media_queries['large'],
                'large-only': Foundation.media_queries['large-only'],
                'xlarge': Foundation.media_queries['xlarge'],
                'xlarge-only': Foundation.media_queries['xlarge-only'],
                'xxlarge': Foundation.media_queries['xxlarge'],
                'landscape': 'only screen and (orientation: landscape)',
                'portrait': 'only screen and (orientation: portrait)',
                'retina': 'only screen and (-webkit-min-device-pixel-ratio: 2),' +
                'only screen and (min--moz-device-pixel-ratio: 2),' +
                'only screen and (-o-min-device-pixel-ratio: 2/1),' +
                'only screen and (min-device-pixel-ratio: 2),' +
                'only screen and (min-resolution: 192dpi),' +
                'only screen and (min-resolution: 2dppx)'
            },

            directives: {
                replace: function (el, path, trigger) {
                    // The trigger argument, if called within the directive, fires
                    // an event named after the directive on the element, passing
                    // any parameters along to the event that you pass to trigger.
                    //
                    // ex. trigger(), trigger([a, b, c]), or trigger(a, b, c)
                    //
                    // This allows you to bind a callback like so:
                    // $('#interchangeContainer').on('replace', function (e, a, b, c) {
                    //   console.log($(this).html(), a, b, c);
                    // });

                    if (/IMG/.test(el[0].nodeName)) {
                        var orig_path = el[0].src;

                        if (new RegExp(path, 'i').test(orig_path)) {
                            return;
                        }

                        el[0].src = path;

                        return trigger(el[0].src);
                    }
                    var last_path = el.data(this.data_attr + '-last-path'),
                        self = this;

                    if (last_path == path) {
                        return;
                    }

                    if (/\.(gif|jpg|jpeg|tiff|png)([?#].*)?/i.test(path)) {
                        $(el).css('background-image', 'url(' + path + ')');
                        el.data('interchange-last-path', path);
                        return trigger(path);
                    }

                    return $.get(path, function (response) {
                        el.html(response);
                        el.data(self.data_attr + '-last-path', path);
                        trigger();
                    });

                }
            }
        },

        init: function (scope, method, options) {
            Foundation.inherit(this, 'throttle random_str');

            this.data_attr = this.set_data_attr();
            $.extend(true, this.settings, method, options);
            this.bindings(method, options);
            this.load('images');
            this.load('nodes');
        },

        get_media_hash: function () {
            var mediaHash = '';
            for (var queryName in this.settings.named_queries) {
                mediaHash += matchMedia(this.settings.named_queries[queryName]).matches.toString();
            }
            return mediaHash;
        },

        events: function () {
            var self = this, prevMediaHash;

            $(window)
                .off('.interchange')
                .on('resize.fndtn.interchange', self.throttle(function () {
                    var currMediaHash = self.get_media_hash();
                    if (currMediaHash !== prevMediaHash) {
                        self.resize();
                    }
                    prevMediaHash = currMediaHash;
                }, 50));

            return this;
        },

        resize: function () {
            var cache = this.cache;

            if (!this.images_loaded || !this.nodes_loaded) {
                setTimeout($.proxy(this.resize, this), 50);
                return;
            }

            for (var uuid in cache) {
                if (cache.hasOwnProperty(uuid)) {
                    var passed = this.results(uuid, cache[uuid]);

                    if (passed) {
                        this.settings.directives[passed
                            .scenario[1]].call(this, passed.el, passed.scenario[0], (function (passed) {
                                if (arguments[0] instanceof Array) {
                                    var args = arguments[0];
                                } else {
                                    var args = Array.prototype.slice.call(arguments, 0);
                                }

                                return function () {
                                    passed.el.trigger(passed.scenario[1], args);
                                }
                            }(passed)));
                    }
                }
            }

        },

        results: function (uuid, scenarios) {
            var count = scenarios.length;

            if (count > 0) {
                var el = this.S('[' + this.add_namespace('data-uuid') + '="' + uuid + '"]');

                while (count--) {
                    var mq, rule = scenarios[count][2];
                    if (this.settings.named_queries.hasOwnProperty(rule)) {
                        mq = matchMedia(this.settings.named_queries[rule]);
                    } else {
                        mq = matchMedia(rule);
                    }
                    if (mq.matches) {
                        return {el: el, scenario: scenarios[count]};
                    }
                }
            }

            return false;
        },

        load: function (type, force_update) {
            if (typeof this['cached_' + type] === 'undefined' || force_update) {
                this['update_' + type]();
            }

            return this['cached_' + type];
        },

        update_images: function () {
            var images = this.S('img[' + this.data_attr + ']'),
                count = images.length,
                i = count,
                loaded_count = 0,
                data_attr = this.data_attr;

            this.cache = {};
            this.cached_images = [];
            this.images_loaded = (count === 0);

            while (i--) {
                loaded_count++;
                if (images[i]) {
                    var str = images[i].getAttribute(data_attr) || '';

                    if (str.length > 0) {
                        this.cached_images.push(images[i]);
                    }
                }

                if (loaded_count === count) {
                    this.images_loaded = true;
                    this.enhance('images');
                }
            }

            return this;
        },

        update_nodes: function () {
            var nodes = this.S('[' + this.data_attr + ']').not('img'),
                count = nodes.length,
                i = count,
                loaded_count = 0,
                data_attr = this.data_attr;

            this.cached_nodes = [];
            this.nodes_loaded = (count === 0);

            while (i--) {
                loaded_count++;
                var str = nodes[i].getAttribute(data_attr) || '';

                if (str.length > 0) {
                    this.cached_nodes.push(nodes[i]);
                }

                if (loaded_count === count) {
                    this.nodes_loaded = true;
                    this.enhance('nodes');
                }
            }

            return this;
        },

        enhance: function (type) {
            var i = this['cached_' + type].length;

            while (i--) {
                this.object($(this['cached_' + type][i]));
            }

            return $(window).trigger('resize').trigger('resize.fndtn.interchange');
        },

        convert_directive: function (directive) {

            var trimmed = this.trim(directive);

            if (trimmed.length > 0) {
                return trimmed;
            }

            return 'replace';
        },

        parse_scenario: function (scenario) {
            // This logic had to be made more complex since some users were using commas in the url path
            // So we cannot simply just split on a comma
            var directive_match = scenario[0].match(/(.+),\s*(\w+)\s*$/),
                media_query = scenario[1];

            if (directive_match) {
                var path = directive_match[1],
                    directive = directive_match[2];
            } else {
                var cached_split = scenario[0].split(/,\s*$/),
                    path = cached_split[0],
                    directive = '';
            }

            return [this.trim(path), this.convert_directive(directive), this.trim(media_query)];
        },

        object: function (el) {
            var raw_arr = this.parse_data_attr(el),
                scenarios = [],
                i = raw_arr.length;

            if (i > 0) {
                while (i--) {
                    var split = raw_arr[i].split(/\(([^\)]*?)(\))$/);

                    if (split.length > 1) {
                        var params = this.parse_scenario(split);
                        scenarios.push(params);
                    }
                }
            }

            return this.store(el, scenarios);
        },

        store: function (el, scenarios) {
            var uuid = this.random_str(),
                current_uuid = el.data(this.add_namespace('uuid', true));

            if (this.cache[current_uuid]) {
                return this.cache[current_uuid];
            }

            el.attr(this.add_namespace('data-uuid'), uuid);

            return this.cache[uuid] = scenarios;
        },

        trim: function (str) {

            if (typeof str === 'string') {
                return $.trim(str);
            }

            return str;
        },

        set_data_attr: function (init) {
            if (init) {
                if (this.namespace.length > 0) {
                    return this.namespace + '-' + this.settings.load_attr;
                }

                return this.settings.load_attr;
            }

            if (this.namespace.length > 0) {
                return 'data-' + this.namespace + '-' + this.settings.load_attr;
            }

            return 'data-' + this.settings.load_attr;
        },

        parse_data_attr: function (el) {
            var raw = el.attr(this.attr_name()).split(/\[(.*?)\]/),
                i = raw.length,
                output = [];

            while (i--) {
                if (raw[i].replace(/[\W\d]+/, '').length > 4) {
                    output.push(raw[i]);
                }
            }

            return output;
        },

        reflow: function () {
            this.load('images', true);
            this.load('nodes', true);
        }

    };

}(jQuery, window, window.document));

;
(function ($, window, document, undefined) {
    'use strict';

    var Modernizr = Modernizr || false;

    Foundation.libs.joyride = {
        name: 'joyride',

        version: '5.5.1',

        defaults: {
            expose: false,     // turn on or off the expose feature
            modal: true,      // Whether to cover page with modal during the tour
            keyboard: true,      // enable left, right and esc keystrokes
            tip_location: 'bottom',  // 'top' or 'bottom' in relation to parent
            nub_position: 'auto',    // override on a per tooltip bases
            scroll_speed: 1500,      // Page scrolling speed in milliseconds, 0 = no scroll animation
            scroll_animation: 'linear',  // supports 'swing' and 'linear', extend with jQuery UI.
            timer: 0,         // 0 = no timer , all other numbers = timer in milliseconds
            start_timer_on_click: true,      // true or false - true requires clicking the first button start the timer
            start_offset: 0,         // the index of the tooltip you want to start on (index of the li)
            next_button: true,      // true or false to control whether a next button is used
            prev_button: true,      // true or false to control whether a prev button is used
            tip_animation: 'fade',    // 'pop' or 'fade' in each tip
            pause_after: [],        // array of indexes where to pause the tour after
            exposed: [],        // array of expose elements
            tip_animation_fade_speed: 300,       // when tipAnimation = 'fade' this is speed in milliseconds for the transition
            cookie_monster: false,     // true or false to control whether cookies are used
            cookie_name: 'joyride', // Name the cookie you'll use
            cookie_domain: false,     // Will this cookie be attached to a domain, ie. '.notableapp.com'
            cookie_expires: 365,       // set when you would like the cookie to expire.
            tip_container: 'body',    // Where will the tip be attached
            abort_on_close: true,      // When true, the close event will not fire any callback
            tip_location_patterns: {
                top: ['bottom'],
                bottom: [], // bottom should not need to be repositioned
                left: ['right', 'top', 'bottom'],
                right: ['left', 'top', 'bottom']
            },
            post_ride_callback: function () {
            },    // A method to call once the tour closes (canceled or complete)
            post_step_callback: function () {
            },    // A method to call after each step
            pre_step_callback: function () {
            },    // A method to call before each step
            pre_ride_callback: function () {
            },    // A method to call before the tour starts (passed index, tip, and cloned exposed element)
            post_expose_callback: function () {
            },    // A method to call after an element has been exposed
            template: { // HTML segments for tip layout
                link: '<a href="#close" class="joyride-close-tip">&times;</a>',
                timer: '<div class="joyride-timer-indicator-wrap"><span class="joyride-timer-indicator"></span></div>',
                tip: '<div class="joyride-tip-guide"><span class="joyride-nub"></span></div>',
                wrapper: '<div class="joyride-content-wrapper"></div>',
                button: '<a href="#" class="small button joyride-next-tip"></a>',
                prev_button: '<a href="#" class="small button joyride-prev-tip"></a>',
                modal: '<div class="joyride-modal-bg"></div>',
                expose: '<div class="joyride-expose-wrapper"></div>',
                expose_cover: '<div class="joyride-expose-cover"></div>'
            },
            expose_add_class: '' // One or more space-separated class names to be added to exposed element
        },

        init: function (scope, method, options) {
            Foundation.inherit(this, 'throttle random_str');

            this.settings = this.settings || $.extend({}, this.defaults, (options || method));

            this.bindings(method, options)
        },

        go_next: function () {
            if (this.settings.$li.next().length < 1) {
                this.end();
            } else if (this.settings.timer > 0) {
                clearTimeout(this.settings.automate);
                this.hide();
                this.show();
                this.startTimer();
            } else {
                this.hide();
                this.show();
            }
        },

        go_prev: function () {
            if (this.settings.$li.prev().length < 1) {
                // Do nothing if there are no prev element
            } else if (this.settings.timer > 0) {
                clearTimeout(this.settings.automate);
                this.hide();
                this.show(null, true);
                this.startTimer();
            } else {
                this.hide();
                this.show(null, true);
            }
        },

        events: function () {
            var self = this;

            $(this.scope)
                .off('.joyride')
                .on('click.fndtn.joyride', '.joyride-next-tip, .joyride-modal-bg', function (e) {
                    e.preventDefault();
                    this.go_next()
                }.bind(this))
                .on('click.fndtn.joyride', '.joyride-prev-tip', function (e) {
                    e.preventDefault();
                    this.go_prev();
                }.bind(this))

                .on('click.fndtn.joyride', '.joyride-close-tip', function (e) {
                    e.preventDefault();
                    this.end(this.settings.abort_on_close);
                }.bind(this))

                .on('keyup.fndtn.joyride', function (e) {
                    // Don't do anything if keystrokes are disabled
                    // or if the joyride is not being shown
                    if (!this.settings.keyboard || !this.settings.riding) {
                        return;
                    }

                    switch (e.which) {
                        case 39: // right arrow
                            e.preventDefault();
                            this.go_next();
                            break;
                        case 37: // left arrow
                            e.preventDefault();
                            this.go_prev();
                            break;
                        case 27: // escape
                            e.preventDefault();
                            this.end(this.settings.abort_on_close);
                    }
                }.bind(this));

            $(window)
                .off('.joyride')
                .on('resize.fndtn.joyride', self.throttle(function () {
                    if ($('[' + self.attr_name() + ']').length > 0 && self.settings.$next_tip && self.settings.riding) {
                        if (self.settings.exposed.length > 0) {
                            var $els = $(self.settings.exposed);

                            $els.each(function () {
                                var $this = $(this);
                                self.un_expose($this);
                                self.expose($this);
                            });
                        }

                        if (self.is_phone()) {
                            self.pos_phone();
                        } else {
                            self.pos_default(false);
                        }
                    }
                }, 100));
        },

        start: function () {
            var self = this,
                $this = $('[' + this.attr_name() + ']', this.scope),
                integer_settings = ['timer', 'scrollSpeed', 'startOffset', 'tipAnimationFadeSpeed', 'cookieExpires'],
                int_settings_count = integer_settings.length;

            if (!$this.length > 0) {
                return;
            }

            if (!this.settings.init) {
                this.events();
            }

            this.settings = $this.data(this.attr_name(true) + '-init');

            // non configureable settings
            this.settings.$content_el = $this;
            this.settings.$body = $(this.settings.tip_container);
            this.settings.body_offset = $(this.settings.tip_container).position();
            this.settings.$tip_content = this.settings.$content_el.find('> li');
            this.settings.paused = false;
            this.settings.attempts = 0;
            this.settings.riding = true;

            // can we create cookies?
            if (typeof $.cookie !== 'function') {
                this.settings.cookie_monster = false;
            }

            // generate the tips and insert into dom.
            if (!this.settings.cookie_monster || this.settings.cookie_monster && !$.cookie(this.settings.cookie_name)) {
                this.settings.$tip_content.each(function (index) {
                    var $this = $(this);
                    this.settings = $.extend({}, self.defaults, self.data_options($this));

                    // Make sure that settings parsed from data_options are integers where necessary
                    var i = int_settings_count;
                    while (i--) {
                        self.settings[integer_settings[i]] = parseInt(self.settings[integer_settings[i]], 10);
                    }
                    self.create({$li: $this, index: index});
                });

                // show first tip
                if (!this.settings.start_timer_on_click && this.settings.timer > 0) {
                    this.show('init');
                    this.startTimer();
                } else {
                    this.show('init');
                }

            }
        },

        resume: function () {
            this.set_li();
            this.show();
        },

        tip_template: function (opts) {
            var $blank, content;

            opts.tip_class = opts.tip_class || '';

            $blank = $(this.settings.template.tip).addClass(opts.tip_class);
            content = $.trim($(opts.li).html()) +
            this.prev_button_text(opts.prev_button_text, opts.index) +
            this.button_text(opts.button_text) +
            this.settings.template.link +
            this.timer_instance(opts.index);

            $blank.append($(this.settings.template.wrapper));
            $blank.first().attr(this.add_namespace('data-index'), opts.index);
            $('.joyride-content-wrapper', $blank).append(content);

            return $blank[0];
        },

        timer_instance: function (index) {
            var txt;

            if ((index === 0 && this.settings.start_timer_on_click && this.settings.timer > 0) || this.settings.timer === 0) {
                txt = '';
            } else {
                txt = $(this.settings.template.timer)[0].outerHTML;
            }
            return txt;
        },

        button_text: function (txt) {
            if (this.settings.tip_settings.next_button) {
                txt = $.trim(txt) || 'Next';
                txt = $(this.settings.template.button).append(txt)[0].outerHTML;
            } else {
                txt = '';
            }
            return txt;
        },

        prev_button_text: function (txt, idx) {
            if (this.settings.tip_settings.prev_button) {
                txt = $.trim(txt) || 'Previous';

                // Add the disabled class to the button if it's the first element
                if (idx == 0) {
                    txt = $(this.settings.template.prev_button).append(txt).addClass('disabled')[0].outerHTML;
                } else {
                    txt = $(this.settings.template.prev_button).append(txt)[0].outerHTML;
                }
            } else {
                txt = '';
            }
            return txt;
        },

        create: function (opts) {
            this.settings.tip_settings = $.extend({}, this.settings, this.data_options(opts.$li));
            var buttonText = opts.$li.attr(this.add_namespace('data-button')) || opts.$li.attr(this.add_namespace('data-text')),
                prevButtonText = opts.$li.attr(this.add_namespace('data-button-prev')) || opts.$li.attr(this.add_namespace('data-prev-text')),
                tipClass = opts.$li.attr('class'),
                $tip_content = $(this.tip_template({
                    tip_class: tipClass,
                    index: opts.index,
                    button_text: buttonText,
                    prev_button_text: prevButtonText,
                    li: opts.$li
                }));

            $(this.settings.tip_container).append($tip_content);
        },

        show: function (init, is_prev) {
            var $timer = null;

            // are we paused?
            if (this.settings.$li === undefined || ($.inArray(this.settings.$li.index(), this.settings.pause_after) === -1)) {

                // don't go to the next li if the tour was paused
                if (this.settings.paused) {
                    this.settings.paused = false;
                } else {
                    this.set_li(init, is_prev);
                }

                this.settings.attempts = 0;

                if (this.settings.$li.length && this.settings.$target.length > 0) {
                    if (init) { //run when we first start
                        this.settings.pre_ride_callback(this.settings.$li.index(), this.settings.$next_tip);
                        if (this.settings.modal) {
                            this.show_modal();
                        }
                    }

                    this.settings.pre_step_callback(this.settings.$li.index(), this.settings.$next_tip);

                    if (this.settings.modal && this.settings.expose) {
                        this.expose();
                    }

                    this.settings.tip_settings = $.extend({}, this.settings, this.data_options(this.settings.$li));

                    this.settings.timer = parseInt(this.settings.timer, 10);

                    this.settings.tip_settings.tip_location_pattern = this.settings.tip_location_patterns[this.settings.tip_settings.tip_location];

                    // scroll and hide bg if not modal
                    if (!/body/i.test(this.settings.$target.selector)) {
                        var joyridemodalbg = $('.joyride-modal-bg');
                        if (/pop/i.test(this.settings.tipAnimation)) {
                            joyridemodalbg.hide();
                        } else {
                            joyridemodalbg.fadeOut(this.settings.tipAnimationFadeSpeed);
                        }
                        this.scroll_to();
                    }

                    if (this.is_phone()) {
                        this.pos_phone(true);
                    } else {
                        this.pos_default(true);
                    }

                    $timer = this.settings.$next_tip.find('.joyride-timer-indicator');

                    if (/pop/i.test(this.settings.tip_animation)) {

                        $timer.width(0);

                        if (this.settings.timer > 0) {

                            this.settings.$next_tip.show();

                            setTimeout(function () {
                                $timer.animate({
                                    width: $timer.parent().width()
                                }, this.settings.timer, 'linear');
                            }.bind(this), this.settings.tip_animation_fade_speed);

                        } else {
                            this.settings.$next_tip.show();

                        }

                    } else if (/fade/i.test(this.settings.tip_animation)) {

                        $timer.width(0);

                        if (this.settings.timer > 0) {

                            this.settings.$next_tip
                                .fadeIn(this.settings.tip_animation_fade_speed)
                                .show();

                            setTimeout(function () {
                                $timer.animate({
                                    width: $timer.parent().width()
                                }, this.settings.timer, 'linear');
                            }.bind(this), this.settings.tip_animation_fade_speed);

                        } else {
                            this.settings.$next_tip.fadeIn(this.settings.tip_animation_fade_speed);
                        }
                    }

                    this.settings.$current_tip = this.settings.$next_tip;

                    // skip non-existant targets
                } else if (this.settings.$li && this.settings.$target.length < 1) {

                    this.show(init, is_prev);

                } else {

                    this.end();

                }
            } else {

                this.settings.paused = true;

            }

        },

        is_phone: function () {
            return matchMedia(Foundation.media_queries.small).matches && !matchMedia(Foundation.media_queries.medium).matches;
        },

        hide: function () {
            if (this.settings.modal && this.settings.expose) {
                this.un_expose();
            }

            if (!this.settings.modal) {
                $('.joyride-modal-bg').hide();
            }

            // Prevent scroll bouncing...wait to remove from layout
            this.settings.$current_tip.css('visibility', 'hidden');
            setTimeout($.proxy(function () {
                this.hide();
                this.css('visibility', 'visible');
            }, this.settings.$current_tip), 0);
            this.settings.post_step_callback(this.settings.$li.index(),
                this.settings.$current_tip);
        },

        set_li: function (init, is_prev) {
            if (init) {
                this.settings.$li = this.settings.$tip_content.eq(this.settings.start_offset);
                this.set_next_tip();
                this.settings.$current_tip = this.settings.$next_tip;
            } else {
                if (is_prev) {
                    this.settings.$li = this.settings.$li.prev();
                } else {
                    this.settings.$li = this.settings.$li.next();
                }
                this.set_next_tip();
            }

            this.set_target();
        },

        set_next_tip: function () {
            this.settings.$next_tip = $('.joyride-tip-guide').eq(this.settings.$li.index());
            this.settings.$next_tip.data('closed', '');
        },

        set_target: function () {
            var cl = this.settings.$li.attr(this.add_namespace('data-class')),
                id = this.settings.$li.attr(this.add_namespace('data-id')),
                $sel = function () {
                    if (id) {
                        return $(document.getElementById(id));
                    } else if (cl) {
                        return $('.' + cl).first();
                    } else {
                        return $('body');
                    }
                };

            this.settings.$target = $sel();
        },

        scroll_to: function () {
            var window_half, tipOffset;

            window_half = $(window).height() / 2;
            tipOffset = Math.ceil(this.settings.$target.offset().top - window_half + this.settings.$next_tip.outerHeight());

            if (tipOffset != 0) {
                $('html, body').stop().animate({
                    scrollTop: tipOffset
                }, this.settings.scroll_speed, 'swing');
            }
        },

        paused: function () {
            return ($.inArray((this.settings.$li.index() + 1), this.settings.pause_after) === -1);
        },

        restart: function () {
            this.hide();
            this.settings.$li = undefined;
            this.show('init');
        },

        pos_default: function (init) {
            var $nub = this.settings.$next_tip.find('.joyride-nub'),
                nub_width = Math.ceil($nub.outerWidth() / 2),
                nub_height = Math.ceil($nub.outerHeight() / 2),
                toggle = init || false;

            // tip must not be "display: none" to calculate position
            if (toggle) {
                this.settings.$next_tip.css('visibility', 'hidden');
                this.settings.$next_tip.show();
            }

            if (!/body/i.test(this.settings.$target.selector)) {
                var topAdjustment = this.settings.tip_settings.tipAdjustmentY ? parseInt(this.settings.tip_settings.tipAdjustmentY) : 0,
                    leftAdjustment = this.settings.tip_settings.tipAdjustmentX ? parseInt(this.settings.tip_settings.tipAdjustmentX) : 0;

                if (this.bottom()) {
                    if (this.rtl) {
                        this.settings.$next_tip.css({
                            top: (this.settings.$target.offset().top + nub_height + this.settings.$target.outerHeight() + topAdjustment),
                            left: this.settings.$target.offset().left + this.settings.$target.outerWidth() - this.settings.$next_tip.outerWidth() + leftAdjustment
                        });
                    } else {
                        this.settings.$next_tip.css({
                            top: (this.settings.$target.offset().top + nub_height + this.settings.$target.outerHeight() + topAdjustment),
                            left: this.settings.$target.offset().left + leftAdjustment
                        });
                    }

                    this.nub_position($nub, this.settings.tip_settings.nub_position, 'top');

                } else if (this.top()) {
                    if (this.rtl) {
                        this.settings.$next_tip.css({
                            top: (this.settings.$target.offset().top - this.settings.$next_tip.outerHeight() - nub_height + topAdjustment),
                            left: this.settings.$target.offset().left + this.settings.$target.outerWidth() - this.settings.$next_tip.outerWidth()
                        });
                    } else {
                        this.settings.$next_tip.css({
                            top: (this.settings.$target.offset().top - this.settings.$next_tip.outerHeight() - nub_height + topAdjustment),
                            left: this.settings.$target.offset().left + leftAdjustment
                        });
                    }

                    this.nub_position($nub, this.settings.tip_settings.nub_position, 'bottom');

                } else if (this.right()) {

                    this.settings.$next_tip.css({
                        top: this.settings.$target.offset().top + topAdjustment,
                        left: (this.settings.$target.outerWidth() + this.settings.$target.offset().left + nub_width + leftAdjustment)
                    });

                    this.nub_position($nub, this.settings.tip_settings.nub_position, 'left');

                } else if (this.left()) {

                    this.settings.$next_tip.css({
                        top: this.settings.$target.offset().top + topAdjustment,
                        left: (this.settings.$target.offset().left - this.settings.$next_tip.outerWidth() - nub_width + leftAdjustment)
                    });

                    this.nub_position($nub, this.settings.tip_settings.nub_position, 'right');

                }

                if (!this.visible(this.corners(this.settings.$next_tip)) && this.settings.attempts < this.settings.tip_settings.tip_location_pattern.length) {

                    $nub.removeClass('bottom')
                        .removeClass('top')
                        .removeClass('right')
                        .removeClass('left');

                    this.settings.tip_settings.tip_location = this.settings.tip_settings.tip_location_pattern[this.settings.attempts];

                    this.settings.attempts++;

                    this.pos_default();

                }

            } else if (this.settings.$li.length) {

                this.pos_modal($nub);

            }

            if (toggle) {
                this.settings.$next_tip.hide();
                this.settings.$next_tip.css('visibility', 'visible');
            }

        },

        pos_phone: function (init) {
            var tip_height = this.settings.$next_tip.outerHeight(),
                tip_offset = this.settings.$next_tip.offset(),
                target_height = this.settings.$target.outerHeight(),
                $nub = $('.joyride-nub', this.settings.$next_tip),
                nub_height = Math.ceil($nub.outerHeight() / 2),
                toggle = init || false;

            $nub.removeClass('bottom')
                .removeClass('top')
                .removeClass('right')
                .removeClass('left');

            if (toggle) {
                this.settings.$next_tip.css('visibility', 'hidden');
                this.settings.$next_tip.show();
            }

            if (!/body/i.test(this.settings.$target.selector)) {

                if (this.top()) {

                    this.settings.$next_tip.offset({top: this.settings.$target.offset().top - tip_height - nub_height});
                    $nub.addClass('bottom');

                } else {

                    this.settings.$next_tip.offset({top: this.settings.$target.offset().top + target_height + nub_height});
                    $nub.addClass('top');

                }

            } else if (this.settings.$li.length) {
                this.pos_modal($nub);
            }

            if (toggle) {
                this.settings.$next_tip.hide();
                this.settings.$next_tip.css('visibility', 'visible');
            }
        },

        pos_modal: function ($nub) {
            this.center();
            $nub.hide();

            this.show_modal();
        },

        show_modal: function () {
            if (!this.settings.$next_tip.data('closed')) {
                var joyridemodalbg = $('.joyride-modal-bg');
                if (joyridemodalbg.length < 1) {
                    var joyridemodalbg = $(this.settings.template.modal);
                    joyridemodalbg.appendTo('body');
                }

                if (/pop/i.test(this.settings.tip_animation)) {
                    joyridemodalbg.show();
                } else {
                    joyridemodalbg.fadeIn(this.settings.tip_animation_fade_speed);
                }
            }
        },

        expose: function () {
            var expose,
                exposeCover,
                el,
                origCSS,
                origClasses,
                randId = 'expose-' + this.random_str(6);

            if (arguments.length > 0 && arguments[0] instanceof $) {
                el = arguments[0];
            } else if (this.settings.$target && !/body/i.test(this.settings.$target.selector)) {
                el = this.settings.$target;
            } else {
                return false;
            }

            if (el.length < 1) {
                if (window.console) {
                    console.error('element not valid', el);
                }
                return false;
            }

            expose = $(this.settings.template.expose);
            this.settings.$body.append(expose);
            expose.css({
                top: el.offset().top,
                left: el.offset().left,
                width: el.outerWidth(true),
                height: el.outerHeight(true)
            });

            exposeCover = $(this.settings.template.expose_cover);

            origCSS = {
                zIndex: el.css('z-index'),
                position: el.css('position')
            };

            origClasses = el.attr('class') == null ? '' : el.attr('class');

            el.css('z-index', parseInt(expose.css('z-index')) + 1);

            if (origCSS.position == 'static') {
                el.css('position', 'relative');
            }

            el.data('expose-css', origCSS);
            el.data('orig-class', origClasses);
            el.attr('class', origClasses + ' ' + this.settings.expose_add_class);

            exposeCover.css({
                top: el.offset().top,
                left: el.offset().left,
                width: el.outerWidth(true),
                height: el.outerHeight(true)
            });

            if (this.settings.modal) {
                this.show_modal();
            }

            this.settings.$body.append(exposeCover);
            expose.addClass(randId);
            exposeCover.addClass(randId);
            el.data('expose', randId);
            this.settings.post_expose_callback(this.settings.$li.index(), this.settings.$next_tip, el);
            this.add_exposed(el);
        },

        un_expose: function () {
            var exposeId,
                el,
                expose,
                origCSS,
                origClasses,
                clearAll = false;

            if (arguments.length > 0 && arguments[0] instanceof $) {
                el = arguments[0];
            } else if (this.settings.$target && !/body/i.test(this.settings.$target.selector)) {
                el = this.settings.$target;
            } else {
                return false;
            }

            if (el.length < 1) {
                if (window.console) {
                    console.error('element not valid', el);
                }
                return false;
            }

            exposeId = el.data('expose');
            expose = $('.' + exposeId);

            if (arguments.length > 1) {
                clearAll = arguments[1];
            }

            if (clearAll === true) {
                $('.joyride-expose-wrapper,.joyride-expose-cover').remove();
            } else {
                expose.remove();
            }

            origCSS = el.data('expose-css');

            if (origCSS.zIndex == 'auto') {
                el.css('z-index', '');
            } else {
                el.css('z-index', origCSS.zIndex);
            }

            if (origCSS.position != el.css('position')) {
                if (origCSS.position == 'static') {// this is default, no need to set it.
                    el.css('position', '');
                } else {
                    el.css('position', origCSS.position);
                }
            }

            origClasses = el.data('orig-class');
            el.attr('class', origClasses);
            el.removeData('orig-classes');

            el.removeData('expose');
            el.removeData('expose-z-index');
            this.remove_exposed(el);
        },

        add_exposed: function (el) {
            this.settings.exposed = this.settings.exposed || [];
            if (el instanceof $ || typeof el === 'object') {
                this.settings.exposed.push(el[0]);
            } else if (typeof el == 'string') {
                this.settings.exposed.push(el);
            }
        },

        remove_exposed: function (el) {
            var search, i;
            if (el instanceof $) {
                search = el[0]
            } else if (typeof el == 'string') {
                search = el;
            }

            this.settings.exposed = this.settings.exposed || [];
            i = this.settings.exposed.length;

            while (i--) {
                if (this.settings.exposed[i] == search) {
                    this.settings.exposed.splice(i, 1);
                    return;
                }
            }
        },

        center: function () {
            var $w = $(window);

            this.settings.$next_tip.css({
                top: ((($w.height() - this.settings.$next_tip.outerHeight()) / 2) + $w.scrollTop()),
                left: ((($w.width() - this.settings.$next_tip.outerWidth()) / 2) + $w.scrollLeft())
            });

            return true;
        },

        bottom: function () {
            return /bottom/i.test(this.settings.tip_settings.tip_location);
        },

        top: function () {
            return /top/i.test(this.settings.tip_settings.tip_location);
        },

        right: function () {
            return /right/i.test(this.settings.tip_settings.tip_location);
        },

        left: function () {
            return /left/i.test(this.settings.tip_settings.tip_location);
        },

        corners: function (el) {
            var w = $(window),
                window_half = w.height() / 2,
            //using this to calculate since scroll may not have finished yet.
                tipOffset = Math.ceil(this.settings.$target.offset().top - window_half + this.settings.$next_tip.outerHeight()),
                right = w.width() + w.scrollLeft(),
                offsetBottom = w.height() + tipOffset,
                bottom = w.height() + w.scrollTop(),
                top = w.scrollTop();

            if (tipOffset < top) {
                if (tipOffset < 0) {
                    top = 0;
                } else {
                    top = tipOffset;
                }
            }

            if (offsetBottom > bottom) {
                bottom = offsetBottom;
            }

            return [
                el.offset().top < top,
                right < el.offset().left + el.outerWidth(),
                bottom < el.offset().top + el.outerHeight(),
                w.scrollLeft() > el.offset().left
            ];
        },

        visible: function (hidden_corners) {
            var i = hidden_corners.length;

            while (i--) {
                if (hidden_corners[i]) {
                    return false;
                }
            }

            return true;
        },

        nub_position: function (nub, pos, def) {
            if (pos === 'auto') {
                nub.addClass(def);
            } else {
                nub.addClass(pos);
            }
        },

        startTimer: function () {
            if (this.settings.$li.length) {
                this.settings.automate = setTimeout(function () {
                    this.hide();
                    this.show();
                    this.startTimer();
                }.bind(this), this.settings.timer);
            } else {
                clearTimeout(this.settings.automate);
            }
        },

        end: function (abort) {
            if (this.settings.cookie_monster) {
                $.cookie(this.settings.cookie_name, 'ridden', {
                    expires: this.settings.cookie_expires,
                    domain: this.settings.cookie_domain
                });
            }

            if (this.settings.timer > 0) {
                clearTimeout(this.settings.automate);
            }

            if (this.settings.modal && this.settings.expose) {
                this.un_expose();
            }

            // Unplug keystrokes listener
            $(this.scope).off('keyup.joyride')

            this.settings.$next_tip.data('closed', true);
            this.settings.riding = false;

            $('.joyride-modal-bg').hide();
            this.settings.$current_tip.hide();

            if (typeof abort === 'undefined' || abort === false) {
                this.settings.post_step_callback(this.settings.$li.index(), this.settings.$current_tip);
                this.settings.post_ride_callback(this.settings.$li.index(), this.settings.$current_tip);
            }

            $('.joyride-tip-guide').remove();
        },

        off: function () {
            $(this.scope).off('.joyride');
            $(window).off('.joyride');
            $('.joyride-close-tip, .joyride-next-tip, .joyride-modal-bg').off('.joyride');
            $('.joyride-tip-guide, .joyride-modal-bg').remove();
            clearTimeout(this.settings.automate);
            this.settings = {};
        },

        reflow: function () {
        }
    };
}(jQuery, window, window.document));

;
(function ($, window, document, undefined) {
    'use strict';

    Foundation.libs['magellan-expedition'] = {
        name: 'magellan-expedition',

        version: '5.5.1',

        settings: {
            active_class: 'active',
            threshold: 0, // pixels from the top of the expedition for it to become fixes
            destination_threshold: 20, // pixels from the top of destination for it to be considered active
            throttle_delay: 30, // calculation throttling to increase framerate
            fixed_top: 0, // top distance in pixels assigend to the fixed element on scroll
            offset_by_height: true,  // whether to offset the destination by the expedition height. Usually you want this to be true, unless your expedition is on the side.
            duration: 700, // animation duration time
            easing: 'swing' // animation easing
        },

        init: function (scope, method, options) {
            Foundation.inherit(this, 'throttle');
            this.bindings(method, options);
        },

        events: function () {
            var self = this,
                S = self.S,
                settings = self.settings;

            // initialize expedition offset
            self.set_expedition_position();

            S(self.scope)
                .off('.magellan')
                .on('click.fndtn.magellan', '[' + self.add_namespace('data-magellan-arrival') + '] a[href^="#"]', function (e) {
                    e.preventDefault();
                    var expedition = $(this).closest('[' + self.attr_name() + ']'),
                        settings = expedition.data('magellan-expedition-init'),
                        hash = this.hash.split('#').join(''),
                        target = $('a[name="' + hash + '"]');

                    if (target.length === 0) {
                        target = $('#' + hash);

                    }

                    // Account for expedition height if fixed position
                    var scroll_top = target.offset().top - settings.destination_threshold + 1;
                    if (settings.offset_by_height) {
                        scroll_top = scroll_top - expedition.outerHeight();
                    }

                    $('html, body').stop().animate({
                        'scrollTop': scroll_top
                    }, settings.duration, settings.easing, function () {
                        if (history.pushState) {
                            history.pushState(null, null, '#' + hash);
                        } else {
                            location.hash = '#' + hash;
                        }
                    });
                })
                .on('scroll.fndtn.magellan', self.throttle(this.check_for_arrivals.bind(this), settings.throttle_delay));

            $(window)
                .on('resize.fndtn.magellan', self.throttle(this.set_expedition_position.bind(this), settings.throttle_delay));
        },

        check_for_arrivals: function () {
            var self = this;
            self.update_arrivals();
            self.update_expedition_positions();
        },

        set_expedition_position: function () {
            var self = this;
            $('[' + this.attr_name() + '=fixed]', self.scope).each(function (idx, el) {
                var expedition = $(this),
                    settings = expedition.data('magellan-expedition-init'),
                    styles = expedition.attr('styles'), // save styles
                    top_offset, fixed_top;

                expedition.attr('style', '');
                top_offset = expedition.offset().top + settings.threshold;

                //set fixed-top by attribute
                fixed_top = parseInt(expedition.data('magellan-fixed-top'));
                if (!isNaN(fixed_top)) {
                    self.settings.fixed_top = fixed_top;
                }

                expedition.data(self.data_attr('magellan-top-offset'), top_offset);
                expedition.attr('style', styles);
            });
        },

        update_expedition_positions: function () {
            var self = this,
                window_top_offset = $(window).scrollTop();

            $('[' + this.attr_name() + '=fixed]', self.scope).each(function () {
                var expedition = $(this),
                    settings = expedition.data('magellan-expedition-init'),
                    styles = expedition.attr('style'), // save styles
                    top_offset = expedition.data('magellan-top-offset');

                //scroll to the top distance
                if (window_top_offset + self.settings.fixed_top >= top_offset) {
                    // Placeholder allows height calculations to be consistent even when
                    // appearing to switch between fixed/non-fixed placement
                    var placeholder = expedition.prev('[' + self.add_namespace('data-magellan-expedition-clone') + ']');
                    if (placeholder.length === 0) {
                        placeholder = expedition.clone();
                        placeholder.removeAttr(self.attr_name());
                        placeholder.attr(self.add_namespace('data-magellan-expedition-clone'), '');
                        expedition.before(placeholder);
                    }
                    expedition.css({position: 'fixed', top: settings.fixed_top}).addClass('fixed');
                } else {
                    expedition.prev('[' + self.add_namespace('data-magellan-expedition-clone') + ']').remove();
                    expedition.attr('style', styles).css('position', '').css('top', '').removeClass('fixed');
                }
            });
        },

        update_arrivals: function () {
            var self = this,
                window_top_offset = $(window).scrollTop();

            $('[' + this.attr_name() + ']', self.scope).each(function () {
                var expedition = $(this),
                    settings = expedition.data(self.attr_name(true) + '-init'),
                    offsets = self.offsets(expedition, window_top_offset),
                    arrivals = expedition.find('[' + self.add_namespace('data-magellan-arrival') + ']'),
                    active_item = false;
                offsets.each(function (idx, item) {
                    if (item.viewport_offset >= item.top_offset) {
                        var arrivals = expedition.find('[' + self.add_namespace('data-magellan-arrival') + ']');
                        arrivals.not(item.arrival).removeClass(settings.active_class);
                        item.arrival.addClass(settings.active_class);
                        active_item = true;
                        return true;
                    }
                });

                if (!active_item) {
                    arrivals.removeClass(settings.active_class);
                }
            });
        },

        offsets: function (expedition, window_offset) {
            var self = this,
                settings = expedition.data(self.attr_name(true) + '-init'),
                viewport_offset = window_offset;

            return expedition.find('[' + self.add_namespace('data-magellan-arrival') + ']').map(function (idx, el) {
                var name = $(this).data(self.data_attr('magellan-arrival')),
                    dest = $('[' + self.add_namespace('data-magellan-destination') + '=' + name + ']');
                if (dest.length > 0) {
                    var top_offset = dest.offset().top - settings.destination_threshold;
                    if (settings.offset_by_height) {
                        top_offset = top_offset - expedition.outerHeight();
                    }
                    top_offset = Math.floor(top_offset);
                    return {
                        destination: dest,
                        arrival: $(this),
                        top_offset: top_offset,
                        viewport_offset: viewport_offset
                    }
                }
            }).sort(function (a, b) {
                if (a.top_offset < b.top_offset) {
                    return -1;
                }
                if (a.top_offset > b.top_offset) {
                    return 1;
                }
                return 0;
            });
        },

        data_attr: function (str) {
            if (this.namespace.length > 0) {
                return this.namespace + '-' + str;
            }

            return str;
        },

        off: function () {
            this.S(this.scope).off('.magellan');
            this.S(window).off('.magellan');
        },

        reflow: function () {
            var self = this;
            // remove placeholder expeditions used for height calculation purposes
            $('[' + self.add_namespace('data-magellan-expedition-clone') + ']', self.scope).remove();
        }
    };
}(jQuery, window, window.document));

;
(function ($, window, document, undefined) {
    'use strict';

    Foundation.libs.offcanvas = {
        name: 'offcanvas',

        version: '5.5.1',

        settings: {
            open_method: 'move',
            close_on_click: false
        },

        init: function (scope, method, options) {
            this.bindings(method, options);
        },

        events: function () {
            var self = this,
                S = self.S,
                move_class = '',
                right_postfix = '',
                left_postfix = '';

            if (this.settings.open_method === 'move') {
                move_class = 'move-';
                right_postfix = 'right';
                left_postfix = 'left';
            } else if (this.settings.open_method === 'overlap_single') {
                move_class = 'offcanvas-overlap-';
                right_postfix = 'right';
                left_postfix = 'left';
            } else if (this.settings.open_method === 'overlap') {
                move_class = 'offcanvas-overlap';
            }

            S(this.scope).off('.offcanvas')
                .on('click.fndtn.offcanvas', '.left-off-canvas-toggle', function (e) {
                    self.click_toggle_class(e, move_class + right_postfix);
                    if (self.settings.open_method !== 'overlap') {
                        S('.left-submenu').removeClass(move_class + right_postfix);
                    }
                    $('.left-off-canvas-toggle').attr('aria-expanded', 'true');
                })
                .on('click.fndtn.offcanvas', '.left-off-canvas-menu a', function (e) {
                    var settings = self.get_settings(e);
                    var parent = S(this).parent();

                    if (settings.close_on_click && !parent.hasClass('has-submenu') && !parent.hasClass('back')) {
                        self.hide.call(self, move_class + right_postfix, self.get_wrapper(e));
                        parent.parent().removeClass(move_class + right_postfix);
                    } else if (S(this).parent().hasClass('has-submenu')) {
                        e.preventDefault();
                        S(this).siblings('.left-submenu').toggleClass(move_class + right_postfix);
                    } else if (parent.hasClass('back')) {
                        e.preventDefault();
                        parent.parent().removeClass(move_class + right_postfix);
                    }
                    $('.left-off-canvas-toggle').attr('aria-expanded', 'true');
                })
                .on('click.fndtn.offcanvas', '.right-off-canvas-toggle', function (e) {
                    self.click_toggle_class(e, move_class + left_postfix);
                    if (self.settings.open_method !== 'overlap') {
                        S('.right-submenu').removeClass(move_class + left_postfix);
                    }
                    $('.right-off-canvas-toggle').attr('aria-expanded', 'true');
                })
                .on('click.fndtn.offcanvas', '.right-off-canvas-menu a', function (e) {
                    var settings = self.get_settings(e);
                    var parent = S(this).parent();

                    if (settings.close_on_click && !parent.hasClass('has-submenu') && !parent.hasClass('back')) {
                        self.hide.call(self, move_class + left_postfix, self.get_wrapper(e));
                        parent.parent().removeClass(move_class + left_postfix);
                    } else if (S(this).parent().hasClass('has-submenu')) {
                        e.preventDefault();
                        S(this).siblings('.right-submenu').toggleClass(move_class + left_postfix);
                    } else if (parent.hasClass('back')) {
                        e.preventDefault();
                        parent.parent().removeClass(move_class + left_postfix);
                    }
                    $('.right-off-canvas-toggle').attr('aria-expanded', 'true');
                })
                .on('click.fndtn.offcanvas', '.exit-off-canvas', function (e) {
                    self.click_remove_class(e, move_class + left_postfix);
                    S('.right-submenu').removeClass(move_class + left_postfix);
                    if (right_postfix) {
                        self.click_remove_class(e, move_class + right_postfix);
                        S('.left-submenu').removeClass(move_class + left_postfix);
                    }
                    $('.right-off-canvas-toggle').attr('aria-expanded', 'true');
                })
                .on('click.fndtn.offcanvas', '.exit-off-canvas', function (e) {
                    self.click_remove_class(e, move_class + left_postfix);
                    $('.left-off-canvas-toggle').attr('aria-expanded', 'false');
                    if (right_postfix) {
                        self.click_remove_class(e, move_class + right_postfix);
                        $('.right-off-canvas-toggle').attr('aria-expanded', 'false');
                    }
                });
        },

        toggle: function (class_name, $off_canvas) {
            $off_canvas = $off_canvas || this.get_wrapper();
            if ($off_canvas.is('.' + class_name)) {
                this.hide(class_name, $off_canvas);
            } else {
                this.show(class_name, $off_canvas);
            }
        },

        show: function (class_name, $off_canvas) {
            $off_canvas = $off_canvas || this.get_wrapper();
            $off_canvas.trigger('open').trigger('open.fndtn.offcanvas');
            $off_canvas.addClass(class_name);
        },

        hide: function (class_name, $off_canvas) {
            $off_canvas = $off_canvas || this.get_wrapper();
            $off_canvas.trigger('close').trigger('close.fndtn.offcanvas');
            $off_canvas.removeClass(class_name);
        },

        click_toggle_class: function (e, class_name) {
            e.preventDefault();
            var $off_canvas = this.get_wrapper(e);
            this.toggle(class_name, $off_canvas);
        },

        click_remove_class: function (e, class_name) {
            e.preventDefault();
            var $off_canvas = this.get_wrapper(e);
            this.hide(class_name, $off_canvas);
        },

        get_settings: function (e) {
            var offcanvas = this.S(e.target).closest('[' + this.attr_name() + ']');
            return offcanvas.data(this.attr_name(true) + '-init') || this.settings;
        },

        get_wrapper: function (e) {
            var $off_canvas = this.S(e ? e.target : this.scope).closest('.off-canvas-wrap');

            if ($off_canvas.length === 0) {
                $off_canvas = this.S('.off-canvas-wrap');
            }
            return $off_canvas;
        },

        reflow: function () {
        }
    };
}(jQuery, window, window.document));

;
(function ($, window, document, undefined) {
    'use strict';

    var noop = function () {
    };

    var Orbit = function (el, settings) {
        // Don't reinitialize plugin
        if (el.hasClass(settings.slides_container_class)) {
            return this;
        }

        var self = this,
            container,
            slides_container = el,
            number_container,
            bullets_container,
            timer_container,
            idx = 0,
            animate,
            timer,
            locked = false,
            adjust_height_after = false;

        self.slides = function () {
            return slides_container.children(settings.slide_selector);
        };

        self.slides().first().addClass(settings.active_slide_class);

        self.update_slide_number = function (index) {
            if (settings.slide_number) {
                number_container.find('span:first').text(parseInt(index) + 1);
                number_container.find('span:last').text(self.slides().length);
            }
            if (settings.bullets) {
                bullets_container.children().removeClass(settings.bullets_active_class);
                $(bullets_container.children().get(index)).addClass(settings.bullets_active_class);
            }
        };

        self.update_active_link = function (index) {
            var link = $('[data-orbit-link="' + self.slides().eq(index).attr('data-orbit-slide') + '"]');
            link.siblings().removeClass(settings.bullets_active_class);
            link.addClass(settings.bullets_active_class);
        };

        self.build_markup = function () {
            slides_container.wrap('<div class="' + settings.container_class + '"></div>');
            container = slides_container.parent();
            slides_container.addClass(settings.slides_container_class);

            if (settings.stack_on_small) {
                container.addClass(settings.stack_on_small_class);
            }

            if (settings.navigation_arrows) {
                container.append($('<a href="#"><span></span></a>').addClass(settings.prev_class));
                container.append($('<a href="#"><span></span></a>').addClass(settings.next_class));
            }

            if (settings.timer) {
                timer_container = $('<div>').addClass(settings.timer_container_class);
                timer_container.append('<span>');
                timer_container.append($('<div>').addClass(settings.timer_progress_class));
                timer_container.addClass(settings.timer_paused_class);
                container.append(timer_container);
            }

            if (settings.slide_number) {
                number_container = $('<div>').addClass(settings.slide_number_class);
                number_container.append('<span></span> ' + settings.slide_number_text + ' <span></span>');
                container.append(number_container);
            }

            if (settings.bullets) {
                bullets_container = $('<ol>').addClass(settings.bullets_container_class);
                container.append(bullets_container);
                bullets_container.wrap('<div class="orbit-bullets-container"></div>');
                self.slides().each(function (idx, el) {
                    var bullet = $('<li>').attr('data-orbit-slide', idx).on('click', self.link_bullet);
                    ;
                    bullets_container.append(bullet);
                });
            }

        };

        self._goto = function (next_idx, start_timer) {
            // if (locked) {return false;}
            if (next_idx === idx) {
                return false;
            }
            if (typeof timer === 'object') {
                timer.restart();
            }
            var slides = self.slides();

            var dir = 'next';
            locked = true;
            if (next_idx < idx) {
                dir = 'prev';
            }
            if (next_idx >= slides.length) {
                if (!settings.circular) {
                    return false;
                }
                next_idx = 0;
            } else if (next_idx < 0) {
                if (!settings.circular) {
                    return false;
                }
                next_idx = slides.length - 1;
            }

            var current = $(slides.get(idx));
            var next = $(slides.get(next_idx));

            current.css('zIndex', 2);
            current.removeClass(settings.active_slide_class);
            next.css('zIndex', 4).addClass(settings.active_slide_class);

            slides_container.trigger('before-slide-change.fndtn.orbit');
            settings.before_slide_change();
            self.update_active_link(next_idx);

            var callback = function () {
                var unlock = function () {
                    idx = next_idx;
                    locked = false;
                    if (start_timer === true) {
                        timer = self.create_timer();
                        timer.start();
                    }
                    self.update_slide_number(idx);
                    slides_container.trigger('after-slide-change.fndtn.orbit', [{
                        slide_number: idx,
                        total_slides: slides.length
                    }]);
                    settings.after_slide_change(idx, slides.length);
                };
                if (slides_container.outerHeight() != next.outerHeight() && settings.variable_height) {
                    slides_container.animate({'height': next.outerHeight()}, 250, 'linear', unlock);
                } else {
                    unlock();
                }
            };

            if (slides.length === 1) {
                callback();
                return false;
            }

            var start_animation = function () {
                if (dir === 'next') {
                    animate.next(current, next, callback);
                }
                if (dir === 'prev') {
                    animate.prev(current, next, callback);
                }
            };

            if (next.outerHeight() > slides_container.outerHeight() && settings.variable_height) {
                slides_container.animate({'height': next.outerHeight()}, 250, 'linear', start_animation);
            } else {
                start_animation();
            }
        };

        self.next = function (e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            self._goto(idx + 1);
        };

        self.prev = function (e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            self._goto(idx - 1);
        };

        self.link_custom = function (e) {
            e.preventDefault();
            var link = $(this).attr('data-orbit-link');
            if ((typeof link === 'string') && (link = $.trim(link)) != '') {
                var slide = container.find('[data-orbit-slide=' + link + ']');
                if (slide.index() != -1) {
                    self._goto(slide.index());
                }
            }
        };

        self.link_bullet = function (e) {
            var index = $(this).attr('data-orbit-slide');
            if ((typeof index === 'string') && (index = $.trim(index)) != '') {
                if (isNaN(parseInt(index))) {
                    var slide = container.find('[data-orbit-slide=' + index + ']');
                    if (slide.index() != -1) {
                        self._goto(slide.index() + 1);
                    }
                } else {
                    self._goto(parseInt(index));
                }
            }

        }

        self.timer_callback = function () {
            self._goto(idx + 1, true);
        }

        self.compute_dimensions = function () {
            var current = $(self.slides().get(idx));
            var h = current.outerHeight();
            if (!settings.variable_height) {
                self.slides().each(function () {
                    if ($(this).outerHeight() > h) {
                        h = $(this).outerHeight();
                    }
                });
            }
            slides_container.height(h);
        };

        self.create_timer = function () {
            var t = new Timer(
                container.find('.' + settings.timer_container_class),
                settings,
                self.timer_callback
            );
            return t;
        };

        self.stop_timer = function () {
            if (typeof timer === 'object') {
                timer.stop();
            }
        };

        self.toggle_timer = function () {
            var t = container.find('.' + settings.timer_container_class);
            if (t.hasClass(settings.timer_paused_class)) {
                if (typeof timer === 'undefined') {
                    timer = self.create_timer();
                }
                timer.start();
            } else {
                if (typeof timer === 'object') {
                    timer.stop();
                }
            }
        };

        self.init = function () {
            self.build_markup();
            if (settings.timer) {
                timer = self.create_timer();
                Foundation.utils.image_loaded(this.slides().children('img'), timer.start);
            }
            animate = new FadeAnimation(settings, slides_container);
            if (settings.animation === 'slide') {
                animate = new SlideAnimation(settings, slides_container);
            }

            container.on('click', '.' + settings.next_class, self.next);
            container.on('click', '.' + settings.prev_class, self.prev);

            if (settings.next_on_click) {
                container.on('click', '.' + settings.slides_container_class + ' [data-orbit-slide]', self.link_bullet);
            }

            container.on('click', self.toggle_timer);
            if (settings.swipe) {
                container.on('touchstart.fndtn.orbit', function (e) {
                    if (!e.touches) {
                        e = e.originalEvent;
                    }
                    var data = {
                        start_page_x: e.touches[0].pageX,
                        start_page_y: e.touches[0].pageY,
                        start_time: (new Date()).getTime(),
                        delta_x: 0,
                        is_scrolling: undefined
                    };
                    container.data('swipe-transition', data);
                    e.stopPropagation();
                })
                    .on('touchmove.fndtn.orbit', function (e) {
                        if (!e.touches) {
                            e = e.originalEvent;
                        }
                        // Ignore pinch/zoom events
                        if (e.touches.length > 1 || e.scale && e.scale !== 1) {
                            return;
                        }

                        var data = container.data('swipe-transition');
                        if (typeof data === 'undefined') {
                            data = {};
                        }

                        data.delta_x = e.touches[0].pageX - data.start_page_x;

                        if (typeof data.is_scrolling === 'undefined') {
                            data.is_scrolling = !!( data.is_scrolling || Math.abs(data.delta_x) < Math.abs(e.touches[0].pageY - data.start_page_y) );
                        }

                        if (!data.is_scrolling && !data.active) {
                            e.preventDefault();
                            var direction = (data.delta_x < 0) ? (idx + 1) : (idx - 1);
                            data.active = true;
                            self._goto(direction);
                        }
                    })
                    .on('touchend.fndtn.orbit', function (e) {
                        container.data('swipe-transition', {});
                        e.stopPropagation();
                    })
            }
            container.on('mouseenter.fndtn.orbit', function (e) {
                if (settings.timer && settings.pause_on_hover) {
                    self.stop_timer();
                }
            })
                .on('mouseleave.fndtn.orbit', function (e) {
                    if (settings.timer && settings.resume_on_mouseout) {
                        timer.start();
                    }
                });

            $(document).on('click', '[data-orbit-link]', self.link_custom);
            $(window).on('load resize', self.compute_dimensions);
            Foundation.utils.image_loaded(this.slides().children('img'), self.compute_dimensions);
            Foundation.utils.image_loaded(this.slides().children('img'), function () {
                container.prev('.' + settings.preloader_class).css('display', 'none');
                self.update_slide_number(0);
                self.update_active_link(0);
                slides_container.trigger('ready.fndtn.orbit');
            });
        };

        self.init();
    };

    var Timer = function (el, settings, callback) {
        var self = this,
            duration = settings.timer_speed,
            progress = el.find('.' + settings.timer_progress_class),
            start,
            timeout,
            left = -1;

        this.update_progress = function (w) {
            var new_progress = progress.clone();
            new_progress.attr('style', '');
            new_progress.css('width', w + '%');
            progress.replaceWith(new_progress);
            progress = new_progress;
        };

        this.restart = function () {
            clearTimeout(timeout);
            el.addClass(settings.timer_paused_class);
            left = -1;
            self.update_progress(0);
        };

        this.start = function () {
            if (!el.hasClass(settings.timer_paused_class)) {
                return true;
            }
            left = (left === -1) ? duration : left;
            el.removeClass(settings.timer_paused_class);
            start = new Date().getTime();
            progress.animate({'width': '100%'}, left, 'linear');
            timeout = setTimeout(function () {
                self.restart();
                callback();
            }, left);
            el.trigger('timer-started.fndtn.orbit')
        };

        this.stop = function () {
            if (el.hasClass(settings.timer_paused_class)) {
                return true;
            }
            clearTimeout(timeout);
            el.addClass(settings.timer_paused_class);
            var end = new Date().getTime();
            left = left - (end - start);
            var w = 100 - ((left / duration) * 100);
            self.update_progress(w);
            el.trigger('timer-stopped.fndtn.orbit');
        };
    };

    var SlideAnimation = function (settings, container) {
        var duration = settings.animation_speed;
        var is_rtl = ($('html[dir=rtl]').length === 1);
        var margin = is_rtl ? 'marginRight' : 'marginLeft';
        var animMargin = {};
        animMargin[margin] = '0%';

        this.next = function (current, next, callback) {
            current.animate({marginLeft: '-100%'}, duration);
            next.animate(animMargin, duration, function () {
                current.css(margin, '100%');
                callback();
            });
        };

        this.prev = function (current, prev, callback) {
            current.animate({marginLeft: '100%'}, duration);
            prev.css(margin, '-100%');
            prev.animate(animMargin, duration, function () {
                current.css(margin, '100%');
                callback();
            });
        };
    };

    var FadeAnimation = function (settings, container) {
        var duration = settings.animation_speed;
        var is_rtl = ($('html[dir=rtl]').length === 1);
        var margin = is_rtl ? 'marginRight' : 'marginLeft';

        this.next = function (current, next, callback) {
            next.css({'margin': '0%', 'opacity': '0.01'});
            next.animate({'opacity': '1'}, duration, 'linear', function () {
                current.css('margin', '100%');
                callback();
            });
        };

        this.prev = function (current, prev, callback) {
            prev.css({'margin': '0%', 'opacity': '0.01'});
            prev.animate({'opacity': '1'}, duration, 'linear', function () {
                current.css('margin', '100%');
                callback();
            });
        };
    };

    Foundation.libs = Foundation.libs || {};

    Foundation.libs.orbit = {
        name: 'orbit',

        version: '5.5.1',

        settings: {
            animation: 'slide',
            timer_speed: 10000,
            pause_on_hover: true,
            resume_on_mouseout: false,
            next_on_click: true,
            animation_speed: 500,
            stack_on_small: false,
            navigation_arrows: true,
            slide_number: true,
            slide_number_text: 'of',
            container_class: 'orbit-container',
            stack_on_small_class: 'orbit-stack-on-small',
            next_class: 'orbit-next',
            prev_class: 'orbit-prev',
            timer_container_class: 'orbit-timer',
            timer_paused_class: 'paused',
            timer_progress_class: 'orbit-progress',
            slides_container_class: 'orbit-slides-container',
            preloader_class: 'preloader',
            slide_selector: '*',
            bullets_container_class: 'orbit-bullets',
            bullets_active_class: 'active',
            slide_number_class: 'orbit-slide-number',
            caption_class: 'orbit-caption',
            active_slide_class: 'active',
            orbit_transition_class: 'orbit-transitioning',
            bullets: true,
            circular: true,
            timer: true,
            variable_height: false,
            swipe: true,
            before_slide_change: noop,
            after_slide_change: noop
        },

        init: function (scope, method, options) {
            var self = this;
            this.bindings(method, options);
        },

        events: function (instance) {
            var orbit_instance = new Orbit(this.S(instance), this.S(instance).data('orbit-init'));
            this.S(instance).data(this.name + '-instance', orbit_instance);
        },

        reflow: function () {
            var self = this;

            if (self.S(self.scope).is('[data-orbit]')) {
                var $el = self.S(self.scope);
                var instance = $el.data(self.name + '-instance');
                instance.compute_dimensions();
            } else {
                self.S('[data-orbit]', self.scope).each(function (idx, el) {
                    var $el = self.S(el);
                    var opts = self.data_options($el);
                    var instance = $el.data(self.name + '-instance');
                    instance.compute_dimensions();
                });
            }
        }
    };

}(jQuery, window, window.document));

;
(function ($, window, document, undefined) {
    'use strict';

    Foundation.libs.reveal = {
        name: 'reveal',

        version: '5.5.1',

        locked: false,

        settings: {
            animation: 'fadeAndPop',
            animation_speed: 250,
            close_on_background_click: true,
            close_on_esc: true,
            dismiss_modal_class: 'close-reveal-modal',
            multiple_opened: false,
            bg_class: 'reveal-modal-bg',
            root_element: 'body',
            open: function () {
            },
            opened: function () {
            },
            close: function () {
            },
            closed: function () {
            },
            bg: $('.reveal-modal-bg'),
            css: {
                open: {
                    'opacity': 0,
                    'visibility': 'visible',
                    'display': 'block'
                },
                close: {
                    'opacity': 1,
                    'visibility': 'hidden',
                    'display': 'none'
                }
            }
        },

        init: function (scope, method, options) {
            $.extend(true, this.settings, method, options);
            this.bindings(method, options);
        },

        events: function (scope) {
            var self = this,
                S = self.S;

            S(this.scope)
                .off('.reveal')
                .on('click.fndtn.reveal', '[' + this.add_namespace('data-reveal-id') + ']:not([disabled])', function (e) {
                    e.preventDefault();

                    if (!self.locked) {
                        var element = S(this),
                            ajax = element.data(self.data_attr('reveal-ajax'));

                        self.locked = true;

                        if (typeof ajax === 'undefined') {
                            self.open.call(self, element);
                        } else {
                            var url = ajax === true ? element.attr('href') : ajax;

                            self.open.call(self, element, {url: url});
                        }
                    }
                });

            S(document)
                .on('click.fndtn.reveal', this.close_targets(), function (e) {
                    e.preventDefault();
                    if (!self.locked) {
                        var settings = S('[' + self.attr_name() + '].open').data(self.attr_name(true) + '-init') || self.settings,
                            bg_clicked = S(e.target)[0] === S('.' + settings.bg_class)[0];

                        if (bg_clicked) {
                            if (settings.close_on_background_click) {
                                e.stopPropagation();
                            } else {
                                return;
                            }
                        }

                        self.locked = true;
                        self.close.call(self, bg_clicked ? S('[' + self.attr_name() + '].open') : S(this).closest('[' + self.attr_name() + ']'));
                    }
                });

            if (S('[' + self.attr_name() + ']', this.scope).length > 0) {
                S(this.scope)
                    // .off('.reveal')
                    .on('open.fndtn.reveal', this.settings.open)
                    .on('opened.fndtn.reveal', this.settings.opened)
                    .on('opened.fndtn.reveal', this.open_video)
                    .on('close.fndtn.reveal', this.settings.close)
                    .on('closed.fndtn.reveal', this.settings.closed)
                    .on('closed.fndtn.reveal', this.close_video);
            } else {
                S(this.scope)
                    // .off('.reveal')
                    .on('open.fndtn.reveal', '[' + self.attr_name() + ']', this.settings.open)
                    .on('opened.fndtn.reveal', '[' + self.attr_name() + ']', this.settings.opened)
                    .on('opened.fndtn.reveal', '[' + self.attr_name() + ']', this.open_video)
                    .on('close.fndtn.reveal', '[' + self.attr_name() + ']', this.settings.close)
                    .on('closed.fndtn.reveal', '[' + self.attr_name() + ']', this.settings.closed)
                    .on('closed.fndtn.reveal', '[' + self.attr_name() + ']', this.close_video);
            }

            return true;
        },

        // PATCH #3: turning on key up capture only when a reveal window is open
        key_up_on: function (scope) {
            var self = this;

            // PATCH #1: fixing multiple keyup event trigger from single key press
            self.S('body').off('keyup.fndtn.reveal').on('keyup.fndtn.reveal', function (event) {
                var open_modal = self.S('[' + self.attr_name() + '].open'),
                    settings = open_modal.data(self.attr_name(true) + '-init') || self.settings;
                // PATCH #2: making sure that the close event can be called only while unlocked,
                //           so that multiple keyup.fndtn.reveal events don't prevent clean closing of the reveal window.
                if (settings && event.which === 27 && settings.close_on_esc && !self.locked) { // 27 is the keycode for the Escape key
                    self.close.call(self, open_modal);
                }
            });

            return true;
        },

        // PATCH #3: turning on key up capture only when a reveal window is open
        key_up_off: function (scope) {
            this.S('body').off('keyup.fndtn.reveal');
            return true;
        },

        open: function (target, ajax_settings) {
            var self = this,
                modal;

            if (target) {
                if (typeof target.selector !== 'undefined') {
                    // Find the named node; only use the first one found, since the rest of the code assumes there's only one node
                    modal = self.S('#' + target.data(self.data_attr('reveal-id'))).first();
                } else {
                    modal = self.S(this.scope);

                    ajax_settings = target;
                }
            } else {
                modal = self.S(this.scope);
            }

            var settings = modal.data(self.attr_name(true) + '-init');
            settings = settings || this.settings;

            if (modal.hasClass('open') && target.attr('data-reveal-id') == modal.attr('id')) {
                return self.close(modal);
            }

            if (!modal.hasClass('open')) {
                var open_modal = self.S('[' + self.attr_name() + '].open');

                if (typeof modal.data('css-top') === 'undefined') {
                    modal.data('css-top', parseInt(modal.css('top'), 10))
                        .data('offset', this.cache_offset(modal));
                }

                this.key_up_on(modal);    // PATCH #3: turning on key up capture only when a reveal window is open

                modal.on('open.fndtn.reveal').trigger('open.fndtn.reveal');

                if (open_modal.length < 1) {
                    this.toggle_bg(modal, true);
                }

                if (typeof ajax_settings === 'string') {
                    ajax_settings = {
                        url: ajax_settings
                    };
                }

                if (typeof ajax_settings === 'undefined' || !ajax_settings.url) {
                    if (open_modal.length > 0) {
                        if (settings.multiple_opened) {
                            this.to_back(open_modal);
                        } else {
                            this.hide(open_modal, settings.css.close);
                        }
                    }

                    this.show(modal, settings.css.open);
                } else {
                    var old_success = typeof ajax_settings.success !== 'undefined' ? ajax_settings.success : null;

                    $.extend(ajax_settings, {
                        success: function (data, textStatus, jqXHR) {
                            if ($.isFunction(old_success)) {
                                var result = old_success(data, textStatus, jqXHR);
                                if (typeof result == 'string') {
                                    data = result;
                                }
                            }

                            modal.html(data);
                            self.S(modal).foundation('section', 'reflow');
                            self.S(modal).children().foundation();

                            if (open_modal.length > 0) {
                                if (settings.multiple_opened) {
                                    this.to_back(open_modal);
                                } else {
                                    this.hide(open_modal, settings.css.close);
                                }
                            }
                            self.show(modal, settings.css.open);
                        }
                    });

                    $.ajax(ajax_settings);
                }
            }
            self.S(window).trigger('resize');
        },

        close: function (modal) {
            var modal = modal && modal.length ? modal : this.S(this.scope),
                open_modals = this.S('[' + this.attr_name() + '].open'),
                settings = modal.data(this.attr_name(true) + '-init') || this.settings;

            if (open_modals.length > 0) {
                this.locked = true;
                this.key_up_off(modal);   // PATCH #3: turning on key up capture only when a reveal window is open
                modal.trigger('close').trigger('close.fndtn.reveal');

                if ((settings.multiple_opened && open_modals.length === 1) || !settings.multiple_opened || modal.length > 1) {
                    this.toggle_bg(modal, false);
                    this.to_front(modal);
                }

                if (settings.multiple_opened) {
                    this.hide(modal, settings.css.close, settings);
                    this.to_front($($.makeArray(open_modals).reverse()[1]));
                } else {
                    this.hide(open_modals, settings.css.close, settings);
                }
            }
        },

        close_targets: function () {
            var base = '.' + this.settings.dismiss_modal_class;

            if (this.settings.close_on_background_click) {
                return base + ', .' + this.settings.bg_class;
            }

            return base;
        },

        toggle_bg: function (modal, state) {
            if (this.S('.' + this.settings.bg_class).length === 0) {
                this.settings.bg = $('<div />', {'class': this.settings.bg_class})
                    .appendTo('body').hide();
            }

            var visible = this.settings.bg.filter(':visible').length > 0;
            if (state != visible) {
                if (state == undefined ? visible : !state) {
                    this.hide(this.settings.bg);
                } else {
                    this.show(this.settings.bg);
                }
            }
        },

        show: function (el, css) {
            // is modal
            if (css) {
                var settings = el.data(this.attr_name(true) + '-init') || this.settings,
                    root_element = settings.root_element;

                if (el.parent(root_element).length === 0) {
                    var placeholder = el.wrap('<div style="display: none;" />').parent();

                    el.on('closed.fndtn.reveal.wrapped', function () {
                        el.detach().appendTo(placeholder);
                        el.unwrap().unbind('closed.fndtn.reveal.wrapped');
                    });

                    el.detach().appendTo(root_element);
                }

                var animData = getAnimationData(settings.animation);
                if (!animData.animate) {
                    this.locked = false;
                }
                if (animData.pop) {
                    css.top = $(window).scrollTop() - el.data('offset') + 'px';
                    var end_css = {
                        top: $(window).scrollTop() + el.data('css-top') + 'px',
                        opacity: 1
                    };

                    return setTimeout(function () {
                        return el
                            .css(css)
                            .animate(end_css, settings.animation_speed, 'linear', function () {
                                this.locked = false;
                                el.trigger('opened').trigger('opened.fndtn.reveal');
                            }.bind(this))
                            .addClass('open');
                    }.bind(this), settings.animation_speed / 2);
                }

                if (animData.fade) {
                    css.top = $(window).scrollTop() + el.data('css-top') + 'px';
                    var end_css = {opacity: 1};

                    return setTimeout(function () {
                        return el
                            .css(css)
                            .animate(end_css, settings.animation_speed, 'linear', function () {
                                this.locked = false;
                                el.trigger('opened').trigger('opened.fndtn.reveal');
                            }.bind(this))
                            .addClass('open');
                    }.bind(this), settings.animation_speed / 2);
                }

                return el.css(css).show().css({opacity: 1}).addClass('open').trigger('opened').trigger('opened.fndtn.reveal');
            }

            var settings = this.settings;

            // should we animate the background?
            if (getAnimationData(settings.animation).fade) {
                return el.fadeIn(settings.animation_speed / 2);
            }

            this.locked = false;

            return el.show();
        },

        to_back: function (el) {
            el.addClass('toback');
        },

        to_front: function (el) {
            el.removeClass('toback');
        },

        hide: function (el, css) {
            // is modal
            if (css) {
                var settings = el.data(this.attr_name(true) + '-init');
                settings = settings || this.settings;

                var animData = getAnimationData(settings.animation);
                if (!animData.animate) {
                    this.locked = false;
                }
                if (animData.pop) {
                    var end_css = {
                        top: -$(window).scrollTop() - el.data('offset') + 'px',
                        opacity: 0
                    };

                    return setTimeout(function () {
                        return el
                            .animate(end_css, settings.animation_speed, 'linear', function () {
                                this.locked = false;
                                el.css(css).trigger('closed').trigger('closed.fndtn.reveal');
                            }.bind(this))
                            .removeClass('open');
                    }.bind(this), settings.animation_speed / 2);
                }

                if (animData.fade) {
                    var end_css = {opacity: 0};

                    return setTimeout(function () {
                        return el
                            .animate(end_css, settings.animation_speed, 'linear', function () {
                                this.locked = false;
                                el.css(css).trigger('closed').trigger('closed.fndtn.reveal');
                            }.bind(this))
                            .removeClass('open');
                    }.bind(this), settings.animation_speed / 2);
                }

                return el.hide().css(css).removeClass('open').trigger('closed').trigger('closed.fndtn.reveal');
            }

            var settings = this.settings;

            // should we animate the background?
            if (getAnimationData(settings.animation).fade) {
                return el.fadeOut(settings.animation_speed / 2);
            }

            return el.hide();
        },

        close_video: function (e) {
            var video = $('.flex-video', e.target),
                iframe = $('iframe', video);

            if (iframe.length > 0) {
                iframe.attr('data-src', iframe[0].src);
                iframe.attr('src', iframe.attr('src'));
                video.hide();
            }
        },

        open_video: function (e) {
            var video = $('.flex-video', e.target),
                iframe = video.find('iframe');

            if (iframe.length > 0) {
                var data_src = iframe.attr('data-src');
                if (typeof data_src === 'string') {
                    iframe[0].src = iframe.attr('data-src');
                } else {
                    var src = iframe[0].src;
                    iframe[0].src = undefined;
                    iframe[0].src = src;
                }
                video.show();
            }
        },

        data_attr: function (str) {
            if (this.namespace.length > 0) {
                return this.namespace + '-' + str;
            }

            return str;
        },

        cache_offset: function (modal) {
            var offset = modal.show().height() + parseInt(modal.css('top'), 10);

            modal.hide();

            return offset;
        },

        off: function () {
            $(this.scope).off('.fndtn.reveal');
        },

        reflow: function () {
        }
    };

    /*
     * getAnimationData('popAndFade') // {animate: true,  pop: true,  fade: true}
     * getAnimationData('fade')       // {animate: true,  pop: false, fade: true}
     * getAnimationData('pop')        // {animate: true,  pop: true,  fade: false}
     * getAnimationData('foo')        // {animate: false, pop: false, fade: false}
     * getAnimationData(null)         // {animate: false, pop: false, fade: false}
     */
    function getAnimationData(str) {
        var fade = /fade/i.test(str);
        var pop = /pop/i.test(str);
        return {
            animate: fade || pop,
            pop: pop,
            fade: fade
        };
    }
}(jQuery, window, window.document));

;
(function ($, window, document, undefined) {
    'use strict';

    Foundation.libs.slider = {
        name: 'slider',

        version: '5.5.1',

        settings: {
            start: 0,
            end: 100,
            step: 1,
            precision: null,
            initial: null,
            display_selector: '',
            vertical: false,
            trigger_input_change: false,
            on_change: function () {
            }
        },

        cache: {},

        init: function (scope, method, options) {
            Foundation.inherit(this, 'throttle');
            this.bindings(method, options);
            this.reflow();
        },

        events: function () {
            var self = this;

            $(this.scope)
                .off('.slider')
                .on('mousedown.fndtn.slider touchstart.fndtn.slider pointerdown.fndtn.slider',
                '[' + self.attr_name() + ']:not(.disabled, [disabled]) .range-slider-handle', function (e) {
                    if (!self.cache.active) {
                        e.preventDefault();
                        self.set_active_slider($(e.target));
                    }
                })
                .on('mousemove.fndtn.slider touchmove.fndtn.slider pointermove.fndtn.slider', function (e) {
                    if (!!self.cache.active) {
                        e.preventDefault();
                        if ($.data(self.cache.active[0], 'settings').vertical) {
                            var scroll_offset = 0;
                            if (!e.pageY) {
                                scroll_offset = window.scrollY;
                            }
                            self.calculate_position(self.cache.active, self.get_cursor_position(e, 'y') + scroll_offset);
                        } else {
                            self.calculate_position(self.cache.active, self.get_cursor_position(e, 'x'));
                        }
                    }
                })
                .on('mouseup.fndtn.slider touchend.fndtn.slider pointerup.fndtn.slider', function (e) {
                    self.remove_active_slider();
                })
                .on('change.fndtn.slider', function (e) {
                    self.settings.on_change();
                });

            self.S(window)
                .on('resize.fndtn.slider', self.throttle(function (e) {
                    self.reflow();
                }, 300));
        },

        get_cursor_position: function (e, xy) {
            var pageXY = 'page' + xy.toUpperCase(),
                clientXY = 'client' + xy.toUpperCase(),
                position;

            if (typeof e[pageXY] !== 'undefined') {
                position = e[pageXY];
            } else if (typeof e.originalEvent[clientXY] !== 'undefined') {
                position = e.originalEvent[clientXY];
            } else if (e.originalEvent.touches && e.originalEvent.touches[0] && typeof e.originalEvent.touches[0][clientXY] !== 'undefined') {
                position = e.originalEvent.touches[0][clientXY];
            } else if (e.currentPoint && typeof e.currentPoint[xy] !== 'undefined') {
                position = e.currentPoint[xy];
            }

            return position;
        },

        set_active_slider: function ($handle) {
            this.cache.active = $handle;
        },

        remove_active_slider: function () {
            this.cache.active = null;
        },

        calculate_position: function ($handle, cursor_x) {
            var self = this,
                settings = $.data($handle[0], 'settings'),
                handle_l = $.data($handle[0], 'handle_l'),
                handle_o = $.data($handle[0], 'handle_o'),
                bar_l = $.data($handle[0], 'bar_l'),
                bar_o = $.data($handle[0], 'bar_o');

            requestAnimationFrame(function () {
                var pct;

                if (Foundation.rtl && !settings.vertical) {
                    pct = self.limit_to(((bar_o + bar_l - cursor_x) / bar_l), 0, 1);
                } else {
                    pct = self.limit_to(((cursor_x - bar_o) / bar_l), 0, 1);
                }

                pct = settings.vertical ? 1 - pct : pct;

                var norm = self.normalized_value(pct, settings.start, settings.end, settings.step, settings.precision);

                self.set_ui($handle, norm);
            });
        },

        set_ui: function ($handle, value) {
            var settings = $.data($handle[0], 'settings'),
                handle_l = $.data($handle[0], 'handle_l'),
                bar_l = $.data($handle[0], 'bar_l'),
                norm_pct = this.normalized_percentage(value, settings.start, settings.end),
                handle_offset = norm_pct * (bar_l - handle_l) - 1,
                progress_bar_length = norm_pct * 100,
                $handle_parent = $handle.parent(),
                $hidden_inputs = $handle.parent().children('input[type=hidden]');

            if (Foundation.rtl && !settings.vertical) {
                handle_offset = -handle_offset;
            }

            handle_offset = settings.vertical ? -handle_offset + bar_l - handle_l + 1 : handle_offset;
            this.set_translate($handle, handle_offset, settings.vertical);

            if (settings.vertical) {
                $handle.siblings('.range-slider-active-segment').css('height', progress_bar_length + '%');
            } else {
                $handle.siblings('.range-slider-active-segment').css('width', progress_bar_length + '%');
            }

            $handle_parent.attr(this.attr_name(), value).trigger('change').trigger('change.fndtn.slider');

            $hidden_inputs.val(value);
            if (settings.trigger_input_change) {
                $hidden_inputs.trigger('change');
            }

            if (!$handle[0].hasAttribute('aria-valuemin')) {
                $handle.attr({
                    'aria-valuemin': settings.start,
                    'aria-valuemax': settings.end
                });
            }
            $handle.attr('aria-valuenow', value);

            if (settings.display_selector != '') {
                $(settings.display_selector).each(function () {
                    if (this.hasOwnProperty('value')) {
                        $(this).val(value);
                    } else {
                        $(this).text(value);
                    }
                });
            }

        },

        normalized_percentage: function (val, start, end) {
            return Math.min(1, (val - start) / (end - start));
        },

        normalized_value: function (val, start, end, step, precision) {
            var range = end - start,
                point = val * range,
                mod = (point - (point % step)) / step,
                rem = point % step,
                round = ( rem >= step * 0.5 ? step : 0);
            return ((mod * step + round) + start).toFixed(precision);
        },

        set_translate: function (ele, offset, vertical) {
            if (vertical) {
                $(ele)
                    .css('-webkit-transform', 'translateY(' + offset + 'px)')
                    .css('-moz-transform', 'translateY(' + offset + 'px)')
                    .css('-ms-transform', 'translateY(' + offset + 'px)')
                    .css('-o-transform', 'translateY(' + offset + 'px)')
                    .css('transform', 'translateY(' + offset + 'px)');
            } else {
                $(ele)
                    .css('-webkit-transform', 'translateX(' + offset + 'px)')
                    .css('-moz-transform', 'translateX(' + offset + 'px)')
                    .css('-ms-transform', 'translateX(' + offset + 'px)')
                    .css('-o-transform', 'translateX(' + offset + 'px)')
                    .css('transform', 'translateX(' + offset + 'px)');
            }
        },

        limit_to: function (val, min, max) {
            return Math.min(Math.max(val, min), max);
        },

        initialize_settings: function (handle) {
            var settings = $.extend({}, this.settings, this.data_options($(handle).parent())),
                decimal_places_match_result;

            if (settings.precision === null) {
                decimal_places_match_result = ('' + settings.step).match(/\.([\d]*)/);
                settings.precision = decimal_places_match_result && decimal_places_match_result[1] ? decimal_places_match_result[1].length : 0;
            }

            if (settings.vertical) {
                $.data(handle, 'bar_o', $(handle).parent().offset().top);
                $.data(handle, 'bar_l', $(handle).parent().outerHeight());
                $.data(handle, 'handle_o', $(handle).offset().top);
                $.data(handle, 'handle_l', $(handle).outerHeight());
            } else {
                $.data(handle, 'bar_o', $(handle).parent().offset().left);
                $.data(handle, 'bar_l', $(handle).parent().outerWidth());
                $.data(handle, 'handle_o', $(handle).offset().left);
                $.data(handle, 'handle_l', $(handle).outerWidth());
            }

            $.data(handle, 'bar', $(handle).parent());
            $.data(handle, 'settings', settings);
        },

        set_initial_position: function ($ele) {
            var settings = $.data($ele.children('.range-slider-handle')[0], 'settings'),
                initial = ((typeof settings.initial == 'number' && !isNaN(settings.initial)) ? settings.initial : Math.floor((settings.end - settings.start) * 0.5 / settings.step) * settings.step + settings.start),
                $handle = $ele.children('.range-slider-handle');
            this.set_ui($handle, initial);
        },

        set_value: function (value) {
            var self = this;
            $('[' + self.attr_name() + ']', this.scope).each(function () {
                $(this).attr(self.attr_name(), value);
            });
            if (!!$(this.scope).attr(self.attr_name())) {
                $(this.scope).attr(self.attr_name(), value);
            }
            self.reflow();
        },

        reflow: function () {
            var self = this;
            self.S('[' + this.attr_name() + ']').each(function () {
                var handle = $(this).children('.range-slider-handle')[0],
                    val = $(this).attr(self.attr_name());
                self.initialize_settings(handle);

                if (val) {
                    self.set_ui($(handle), parseFloat(val));
                } else {
                    self.set_initial_position($(this));
                }
            });
        }
    };

}(jQuery, window, window.document));

;
(function ($, window, document, undefined) {
    'use strict';

    Foundation.libs.tab = {
        name: 'tab',

        version: '5.5.1',

        settings: {
            active_class: 'active',
            callback: function () {
            },
            deep_linking: false,
            scroll_to_content: true,
            is_hover: false
        },

        default_tab_hashes: [],

        init: function (scope, method, options) {
            var self = this,
                S = this.S;

            this.bindings(method, options);

            // store the initial href, which is used to allow correct behaviour of the
            // browser back button when deep linking is turned on.
            self.entry_location = window.location.href;

            this.handle_location_hash_change();

            // Store the default active tabs which will be referenced when the
            // location hash is absent, as in the case of navigating the tabs and
            // returning to the first viewing via the browser Back button.
            S('[' + this.attr_name() + '] > .active > a', this.scope).each(function () {
                self.default_tab_hashes.push(this.hash);
            });
        },

        events: function () {
            var self = this,
                S = this.S;

            var usual_tab_behavior = function (e) {
                var settings = S(this).closest('[' + self.attr_name() + ']').data(self.attr_name(true) + '-init');
                if (!settings.is_hover || Modernizr.touch) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.toggle_active_tab(S(this).parent());
                }
            };

            S(this.scope)
                .off('.tab')
                // Click event: tab title
                .on('focus.fndtn.tab', '[' + this.attr_name() + '] > * > a', usual_tab_behavior)
                .on('click.fndtn.tab', '[' + this.attr_name() + '] > * > a', usual_tab_behavior)
                // Hover event: tab title
                .on('mouseenter.fndtn.tab', '[' + this.attr_name() + '] > * > a', function (e) {
                    var settings = S(this).closest('[' + self.attr_name() + ']').data(self.attr_name(true) + '-init');
                    if (settings.is_hover) {
                        self.toggle_active_tab(S(this).parent());
                    }
                });

            // Location hash change event
            S(window).on('hashchange.fndtn.tab', function (e) {
                e.preventDefault();
                self.handle_location_hash_change();
            });
        },

        handle_location_hash_change: function () {

            var self = this,
                S = this.S;

            S('[' + this.attr_name() + ']', this.scope).each(function () {
                var settings = S(this).data(self.attr_name(true) + '-init');
                if (settings.deep_linking) {
                    // Match the location hash to a label
                    var hash;
                    if (settings.scroll_to_content) {
                        hash = self.scope.location.hash;
                    } else {
                        // prefix the hash to prevent anchor scrolling
                        hash = self.scope.location.hash.replace('fndtn-', '');
                    }
                    if (hash != '') {
                        // Check whether the location hash references a tab content div or
                        // another element on the page (inside or outside the tab content div)
                        var hash_element = S(hash);
                        if (hash_element.hasClass('content') && hash_element.parent().hasClass('tabs-content')) {
                            // Tab content div
                            self.toggle_active_tab($('[' + self.attr_name() + '] > * > a[href=' + hash + ']').parent());
                        } else {
                            // Not the tab content div. If inside the tab content, find the
                            // containing tab and toggle it as active.
                            var hash_tab_container_id = hash_element.closest('.content').attr('id');
                            if (hash_tab_container_id != undefined) {
                                self.toggle_active_tab($('[' + self.attr_name() + '] > * > a[href=#' + hash_tab_container_id + ']').parent(), hash);
                            }
                        }
                    } else {
                        // Reference the default tab hashes which were initialized in the init function
                        for (var ind = 0; ind < self.default_tab_hashes.length; ind++) {
                            self.toggle_active_tab($('[' + self.attr_name() + '] > * > a[href=' + self.default_tab_hashes[ind] + ']').parent());
                        }
                    }
                }
            });
        },

        toggle_active_tab: function (tab, location_hash) {
            var self = this,
                S = self.S,
                tabs = tab.closest('[' + this.attr_name() + ']'),
                tab_link = tab.find('a'),
                anchor = tab.children('a').first(),
                target_hash = '#' + anchor.attr('href').split('#')[1],
                target = S(target_hash),
                siblings = tab.siblings(),
                settings = tabs.data(this.attr_name(true) + '-init'),
                interpret_keyup_action = function (e) {
                    // Light modification of Heydon Pickering's Practical ARIA Examples: http://heydonworks.com/practical_aria_examples/js/a11y.js

                    // define current, previous and next (possible) tabs

                    var $original = $(this);
                    var $prev = $(this).parents('li').prev().children('[role="tab"]');
                    var $next = $(this).parents('li').next().children('[role="tab"]');
                    var $target;

                    // find the direction (prev or next)

                    switch (e.keyCode) {
                        case 37:
                            $target = $prev;
                            break;
                        case 39:
                            $target = $next;
                            break;
                        default:
                            $target = false
                            break;
                    }

                    if ($target.length) {
                        $original.attr({
                            'tabindex': '-1',
                            'aria-selected': null
                        });
                        $target.attr({
                            'tabindex': '0',
                            'aria-selected': true
                        }).focus();
                    }

                    // Hide panels

                    $('[role="tabpanel"]')
                        .attr('aria-hidden', 'true');

                    // Show panel which corresponds to target

                    $('#' + $(document.activeElement).attr('href').substring(1))
                        .attr('aria-hidden', null);

                },
                go_to_hash = function (hash) {
                    // This function allows correct behaviour of the browser's back button when deep linking is enabled. Without it
                    // the user would get continually redirected to the default hash.
                    var is_entry_location = window.location.href === self.entry_location,
                        default_hash = settings.scroll_to_content ? self.default_tab_hashes[0] : is_entry_location ? window.location.hash : 'fndtn-' + self.default_tab_hashes[0].replace('#', '')

                    if (!(is_entry_location && hash === default_hash)) {
                        window.location.hash = hash;
                    }
                };

            // allow usage of data-tab-content attribute instead of href
            if (S(this).data(this.data_attr('tab-content'))) {
                target_hash = '#' + S(this).data(this.data_attr('tab-content')).split('#')[1];
                target = S(target_hash);
            }

            if (settings.deep_linking) {

                if (settings.scroll_to_content) {

                    // retain current hash to scroll to content
                    go_to_hash(location_hash || target_hash);

                    if (location_hash == undefined || location_hash == target_hash) {
                        tab.parent()[0].scrollIntoView();
                    } else {
                        S(target_hash)[0].scrollIntoView();
                    }
                } else {
                    // prefix the hashes so that the browser doesn't scroll down
                    if (location_hash != undefined) {
                        go_to_hash('fndtn-' + location_hash.replace('#', ''));
                    } else {
                        go_to_hash('fndtn-' + target_hash.replace('#', ''));
                    }
                }
            }

            // WARNING: The activation and deactivation of the tab content must
            // occur after the deep linking in order to properly refresh the browser
            // window (notably in Chrome).
            // Clean up multiple attr instances to done once
            tab.addClass(settings.active_class).triggerHandler('opened');
            tab_link.attr({'aria-selected': 'true', tabindex: 0});
            siblings.removeClass(settings.active_class)
            siblings.find('a').attr({'aria-selected': 'false', tabindex: -1});
            target.siblings().removeClass(settings.active_class).attr({'aria-hidden': 'true', tabindex: -1});
            target.addClass(settings.active_class).attr('aria-hidden', 'false').removeAttr('tabindex');
            settings.callback(tab);
            target.triggerHandler('toggled', [tab]);
            tabs.triggerHandler('toggled', [target]);

            tab_link.off('keydown').on('keydown', interpret_keyup_action);
        },

        data_attr: function (str) {
            if (this.namespace.length > 0) {
                return this.namespace + '-' + str;
            }

            return str;
        },

        off: function () {
        },

        reflow: function () {
        }
    };
}(jQuery, window, window.document));

;
(function ($, window, document, undefined) {
    'use strict';

    Foundation.libs.tooltip = {
        name: 'tooltip',

        version: '5.5.1',

        settings: {
            additional_inheritable_classes: [],
            tooltip_class: '.tooltip',
            append_to: 'body',
            touch_close_text: 'Tap To Close',
            disable_for_touch: false,
            hover_delay: 200,
            show_on: 'all',
            tip_template: function (selector, content) {
                return '<span data-selector="' + selector + '" id="' + selector + '" class="'
                    + Foundation.libs.tooltip.settings.tooltip_class.substring(1)
                    + '" role="tooltip">' + content + '<span class="nub"></span></span>';
            }
        },

        cache: {},

        init: function (scope, method, options) {
            Foundation.inherit(this, 'random_str');
            this.bindings(method, options);
        },

        should_show: function (target, tip) {
            var settings = $.extend({}, this.settings, this.data_options(target));

            if (settings.show_on === 'all') {
                return true;
            } else if (this.small() && settings.show_on === 'small') {
                return true;
            } else if (this.medium() && settings.show_on === 'medium') {
                return true;
            } else if (this.large() && settings.show_on === 'large') {
                return true;
            }
            return false;
        },

        medium: function () {
            return matchMedia(Foundation.media_queries['medium']).matches;
        },

        large: function () {
            return matchMedia(Foundation.media_queries['large']).matches;
        },

        events: function (instance) {
            var self = this,
                S = self.S;

            self.create(this.S(instance));

            $(this.scope)
                .off('.tooltip')
                .on('mouseenter.fndtn.tooltip mouseleave.fndtn.tooltip touchstart.fndtn.tooltip MSPointerDown.fndtn.tooltip',
                '[' + this.attr_name() + ']', function (e) {
                    var $this = S(this),
                        settings = $.extend({}, self.settings, self.data_options($this)),
                        is_touch = false;

                    if (Modernizr.touch && /touchstart|MSPointerDown/i.test(e.type) && S(e.target).is('a')) {
                        return false;
                    }

                    if (/mouse/i.test(e.type) && self.ie_touch(e)) {
                        return false;
                    }

                    if ($this.hasClass('open')) {
                        if (Modernizr.touch && /touchstart|MSPointerDown/i.test(e.type)) {
                            e.preventDefault();
                        }
                        self.hide($this);
                    } else {
                        if (settings.disable_for_touch && Modernizr.touch && /touchstart|MSPointerDown/i.test(e.type)) {
                            return;
                        } else if (!settings.disable_for_touch && Modernizr.touch && /touchstart|MSPointerDown/i.test(e.type)) {
                            e.preventDefault();
                            S(settings.tooltip_class + '.open').hide();
                            is_touch = true;
                        }

                        if (/enter|over/i.test(e.type)) {
                            this.timer = setTimeout(function () {
                                var tip = self.showTip($this);
                            }.bind(this), self.settings.hover_delay);
                        } else if (e.type === 'mouseout' || e.type === 'mouseleave') {
                            clearTimeout(this.timer);
                            self.hide($this);
                        } else {
                            self.showTip($this);
                        }
                    }
                })
                .on('mouseleave.fndtn.tooltip touchstart.fndtn.tooltip MSPointerDown.fndtn.tooltip', '[' + this.attr_name() + '].open', function (e) {
                    if (/mouse/i.test(e.type) && self.ie_touch(e)) {
                        return false;
                    }

                    if ($(this).data('tooltip-open-event-type') == 'touch' && e.type == 'mouseleave') {
                        return;
                    } else if ($(this).data('tooltip-open-event-type') == 'mouse' && /MSPointerDown|touchstart/i.test(e.type)) {
                        self.convert_to_touch($(this));
                    } else {
                        self.hide($(this));
                    }
                })
                .on('DOMNodeRemoved DOMAttrModified', '[' + this.attr_name() + ']:not(a)', function (e) {
                    self.hide(S(this));
                });
        },

        ie_touch: function (e) {
            // How do I distinguish between IE11 and Windows Phone 8?????
            return false;
        },

        showTip: function ($target) {
            var $tip = this.getTip($target);
            if (this.should_show($target, $tip)) {
                return this.show($target);
            }
            return;
        },

        getTip: function ($target) {
            var selector = this.selector($target),
                settings = $.extend({}, this.settings, this.data_options($target)),
                tip = null;

            if (selector) {
                tip = this.S('span[data-selector="' + selector + '"]' + settings.tooltip_class);
            }

            return (typeof tip === 'object') ? tip : false;
        },

        selector: function ($target) {
            var id = $target.attr('id'),
                dataSelector = $target.attr(this.attr_name()) || $target.attr('data-selector');

            if ((id && id.length < 1 || !id) && typeof dataSelector != 'string') {
                dataSelector = this.random_str(6);
                $target
                    .attr('data-selector', dataSelector)
                    .attr('aria-describedby', dataSelector);
            }

            return (id && id.length > 0) ? id : dataSelector;
        },

        create: function ($target) {
            var self = this,
                settings = $.extend({}, this.settings, this.data_options($target)),
                tip_template = this.settings.tip_template;

            if (typeof settings.tip_template === 'string' && window.hasOwnProperty(settings.tip_template)) {
                tip_template = window[settings.tip_template];
            }

            var $tip = $(tip_template(this.selector($target), $('<div></div>').html($target.attr('title')).html())),
                classes = this.inheritable_classes($target);

            $tip.addClass(classes).appendTo(settings.append_to);

            if (Modernizr.touch) {
                $tip.append('<span class="tap-to-close">' + settings.touch_close_text + '</span>');
                $tip.on('touchstart.fndtn.tooltip MSPointerDown.fndtn.tooltip', function (e) {
                    self.hide($target);
                });
            }

            $target.removeAttr('title').attr('title', '');
        },

        reposition: function (target, tip, classes) {
            var width, nub, nubHeight, nubWidth, column, objPos;

            tip.css('visibility', 'hidden').show();

            width = target.data('width');
            nub = tip.children('.nub');
            nubHeight = nub.outerHeight();
            nubWidth = nub.outerHeight();

            if (this.small()) {
                tip.css({'width': '100%'});
            } else {
                tip.css({'width': (width) ? width : 'auto'});
            }

            objPos = function (obj, top, right, bottom, left, width) {
                return obj.css({
                    'top': (top) ? top : 'auto',
                    'bottom': (bottom) ? bottom : 'auto',
                    'left': (left) ? left : 'auto',
                    'right': (right) ? right : 'auto'
                }).end();
            };

            objPos(tip, (target.offset().top + target.outerHeight() + 10), 'auto', 'auto', target.offset().left);

            if (this.small()) {
                objPos(tip, (target.offset().top + target.outerHeight() + 10), 'auto', 'auto', 12.5, $(this.scope).width());
                tip.addClass('tip-override');
                objPos(nub, -nubHeight, 'auto', 'auto', target.offset().left);
            } else {
                var left = target.offset().left;
                if (Foundation.rtl) {
                    nub.addClass('rtl');
                    left = target.offset().left + target.outerWidth() - tip.outerWidth();
                }
                objPos(tip, (target.offset().top + target.outerHeight() + 10), 'auto', 'auto', left);
                tip.removeClass('tip-override');
                if (classes && classes.indexOf('tip-top') > -1) {
                    if (Foundation.rtl) {
                        nub.addClass('rtl');
                    }
                    objPos(tip, (target.offset().top - tip.outerHeight()), 'auto', 'auto', left)
                        .removeClass('tip-override');
                } else if (classes && classes.indexOf('tip-left') > -1) {
                    objPos(tip, (target.offset().top + (target.outerHeight() / 2) - (tip.outerHeight() / 2)), 'auto', 'auto', (target.offset().left - tip.outerWidth() - nubHeight))
                        .removeClass('tip-override');
                    nub.removeClass('rtl');
                } else if (classes && classes.indexOf('tip-right') > -1) {
                    objPos(tip, (target.offset().top + (target.outerHeight() / 2) - (tip.outerHeight() / 2)), 'auto', 'auto', (target.offset().left + target.outerWidth() + nubHeight))
                        .removeClass('tip-override');
                    nub.removeClass('rtl');
                }
            }

            tip.css('visibility', 'visible').hide();
        },

        small: function () {
            return matchMedia(Foundation.media_queries.small).matches && !matchMedia(Foundation.media_queries.medium).matches;
        },

        inheritable_classes: function ($target) {
            var settings = $.extend({}, this.settings, this.data_options($target)),
                inheritables = ['tip-top', 'tip-left', 'tip-bottom', 'tip-right', 'radius', 'round'].concat(settings.additional_inheritable_classes),
                classes = $target.attr('class'),
                filtered = classes ? $.map(classes.split(' '), function (el, i) {
                    if ($.inArray(el, inheritables) !== -1) {
                        return el;
                    }
                }).join(' ') : '';

            return $.trim(filtered);
        },

        convert_to_touch: function ($target) {
            var self = this,
                $tip = self.getTip($target),
                settings = $.extend({}, self.settings, self.data_options($target));

            if ($tip.find('.tap-to-close').length === 0) {
                $tip.append('<span class="tap-to-close">' + settings.touch_close_text + '</span>');
                $tip.on('click.fndtn.tooltip.tapclose touchstart.fndtn.tooltip.tapclose MSPointerDown.fndtn.tooltip.tapclose', function (e) {
                    self.hide($target);
                });
            }

            $target.data('tooltip-open-event-type', 'touch');
        },

        show: function ($target) {
            var $tip = this.getTip($target);

            if ($target.data('tooltip-open-event-type') == 'touch') {
                this.convert_to_touch($target);
            }

            this.reposition($target, $tip, $target.attr('class'));
            $target.addClass('open');
            $tip.fadeIn(150);
        },

        hide: function ($target) {
            var $tip = this.getTip($target);

            $tip.fadeOut(150, function () {
                $tip.find('.tap-to-close').remove();
                $tip.off('click.fndtn.tooltip.tapclose MSPointerDown.fndtn.tapclose');
                $target.removeClass('open');
            });
        },

        off: function () {
            var self = this;
            this.S(this.scope).off('.fndtn.tooltip');
            this.S(this.settings.tooltip_class).each(function (i) {
                $('[' + self.attr_name() + ']').eq(i).attr('title', $(this).text());
            }).remove();
        },

        reflow: function () {
        }
    };
}(jQuery, window, window.document));

;
(function ($, window, document, undefined) {
    'use strict';

    Foundation.libs.topbar = {
        name: 'topbar',

        version: '5.5.1',

        settings: {
            index: 0,
            sticky_class: 'sticky',
            custom_back_text: true,
            back_text: 'Back',
            mobile_show_parent_link: true,
            is_hover: true,
            scrolltop: true, // jump to top when sticky nav menu toggle is clicked
            sticky_on: 'all'
        },

        init: function (section, method, options) {
            Foundation.inherit(this, 'add_custom_rule register_media throttle');
            var self = this;

            self.register_media('topbar', 'foundation-mq-topbar');

            this.bindings(method, options);

            self.S('[' + this.attr_name() + ']', this.scope).each(function () {
                var topbar = $(this),
                    settings = topbar.data(self.attr_name(true) + '-init'),
                    section = self.S('section, .top-bar-section', this);
                topbar.data('index', 0);
                var topbarContainer = topbar.parent();
                if (topbarContainer.hasClass('fixed') || self.is_sticky(topbar, topbarContainer, settings)) {
                    self.settings.sticky_class = settings.sticky_class;
                    self.settings.sticky_topbar = topbar;
                    topbar.data('height', topbarContainer.outerHeight());
                    topbar.data('stickyoffset', topbarContainer.offset().top);
                } else {
                    topbar.data('height', topbar.outerHeight());
                }

                if (!settings.assembled) {
                    self.assemble(topbar);
                }

                if (settings.is_hover) {
                    self.S('.has-dropdown', topbar).addClass('not-click');
                } else {
                    self.S('.has-dropdown', topbar).removeClass('not-click');
                }

                // Pad body when sticky (scrolled) or fixed.
                self.add_custom_rule('.f-topbar-fixed { padding-top: ' + topbar.data('height') + 'px }');

                if (topbarContainer.hasClass('fixed')) {
                    self.S('body').addClass('f-topbar-fixed');
                }
            });

        },

        is_sticky: function (topbar, topbarContainer, settings) {
            var sticky = topbarContainer.hasClass(settings.sticky_class);
            var smallMatch = matchMedia(Foundation.media_queries.small).matches;
            var medMatch = matchMedia(Foundation.media_queries.medium).matches;
            var lrgMatch = matchMedia(Foundation.media_queries.large).matches;

            if (sticky && settings.sticky_on === 'all') {
                return true;
            }
            if (sticky && this.small() && settings.sticky_on.indexOf('small') !== -1) {
                if (smallMatch && !medMatch && !lrgMatch) {
                    return true;
                }
            }
            if (sticky && this.medium() && settings.sticky_on.indexOf('medium') !== -1) {
                if (smallMatch && medMatch && !lrgMatch) {
                    return true;
                }
            }
            if (sticky && this.large() && settings.sticky_on.indexOf('large') !== -1) {
                if (smallMatch && medMatch && lrgMatch) {
                    return true;
                }
            }

            // fix for iOS browsers
            if (sticky && navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
                return true;
            }
            return false;
        },

        toggle: function (toggleEl) {
            var self = this,
                topbar;

            if (toggleEl) {
                topbar = self.S(toggleEl).closest('[' + this.attr_name() + ']');
            } else {
                topbar = self.S('[' + this.attr_name() + ']');
            }

            var settings = topbar.data(this.attr_name(true) + '-init');

            var section = self.S('section, .top-bar-section', topbar);

            if (self.breakpoint()) {
                if (!self.rtl) {
                    section.css({left: '0%'});
                    $('>.name', section).css({left: '100%'});
                } else {
                    section.css({right: '0%'});
                    $('>.name', section).css({right: '100%'});
                }

                self.S('li.moved', section).removeClass('moved');
                topbar.data('index', 0);

                topbar
                    .toggleClass('expanded')
                    .css('height', '');
            }

            if (settings.scrolltop) {
                if (!topbar.hasClass('expanded')) {
                    if (topbar.hasClass('fixed')) {
                        topbar.parent().addClass('fixed');
                        topbar.removeClass('fixed');
                        self.S('body').addClass('f-topbar-fixed');
                    }
                } else if (topbar.parent().hasClass('fixed')) {
                    if (settings.scrolltop) {
                        topbar.parent().removeClass('fixed');
                        topbar.addClass('fixed');
                        self.S('body').removeClass('f-topbar-fixed');

                        window.scrollTo(0, 0);
                    } else {
                        topbar.parent().removeClass('expanded');
                    }
                }
            } else {
                if (self.is_sticky(topbar, topbar.parent(), settings)) {
                    topbar.parent().addClass('fixed');
                }

                if (topbar.parent().hasClass('fixed')) {
                    if (!topbar.hasClass('expanded')) {
                        topbar.removeClass('fixed');
                        topbar.parent().removeClass('expanded');
                        self.update_sticky_positioning();
                    } else {
                        topbar.addClass('fixed');
                        topbar.parent().addClass('expanded');
                        self.S('body').addClass('f-topbar-fixed');
                    }
                }
            }
        },

        timer: null,

        events: function (bar) {
            var self = this,
                S = this.S;

            S(this.scope)
                .off('.topbar')
                .on('click.fndtn.topbar', '[' + this.attr_name() + '] .toggle-topbar', function (e) {
                    e.preventDefault();
                    self.toggle(this);
                })
                .on('click.fndtn.topbar', '.top-bar .top-bar-section li a[href^="#"],[' + this.attr_name() + '] .top-bar-section li a[href^="#"]', function (e) {
                    var li = $(this).closest('li');
                    if (self.breakpoint() && !li.hasClass('back') && !li.hasClass('has-dropdown')) {
                        self.toggle();
                    }
                })
                .on('click.fndtn.topbar', '[' + this.attr_name() + '] li.has-dropdown', function (e) {
                    var li = S(this),
                        target = S(e.target),
                        topbar = li.closest('[' + self.attr_name() + ']'),
                        settings = topbar.data(self.attr_name(true) + '-init');

                    if (target.data('revealId')) {
                        self.toggle();
                        return;
                    }

                    if (self.breakpoint()) {
                        return;
                    }

                    if (settings.is_hover && !Modernizr.touch) {
                        return;
                    }

                    e.stopImmediatePropagation();

                    if (li.hasClass('hover')) {
                        li
                            .removeClass('hover')
                            .find('li')
                            .removeClass('hover');

                        li.parents('li.hover')
                            .removeClass('hover');
                    } else {
                        li.addClass('hover');

                        $(li).siblings().removeClass('hover');

                        if (target[0].nodeName === 'A' && target.parent().hasClass('has-dropdown')) {
                            e.preventDefault();
                        }
                    }
                })
                .on('click.fndtn.topbar', '[' + this.attr_name() + '] .has-dropdown>a', function (e) {
                    if (self.breakpoint()) {

                        e.preventDefault();

                        var $this = S(this),
                            topbar = $this.closest('[' + self.attr_name() + ']'),
                            section = topbar.find('section, .top-bar-section'),
                            dropdownHeight = $this.next('.dropdown').outerHeight(),
                            $selectedLi = $this.closest('li');

                        topbar.data('index', topbar.data('index') + 1);
                        $selectedLi.addClass('moved');

                        if (!self.rtl) {
                            section.css({left: -(100 * topbar.data('index')) + '%'});
                            section.find('>.name').css({left: 100 * topbar.data('index') + '%'});
                        } else {
                            section.css({right: -(100 * topbar.data('index')) + '%'});
                            section.find('>.name').css({right: 100 * topbar.data('index') + '%'});
                        }

                        topbar.css('height', $this.siblings('ul').outerHeight(true) + topbar.data('height'));
                    }
                });

            S(window).off('.topbar').on('resize.fndtn.topbar', self.throttle(function () {
                self.resize.call(self);
            }, 50)).trigger('resize').trigger('resize.fndtn.topbar').load(function () {
                // Ensure that the offset is calculated after all of the pages resources have loaded
                S(this).trigger('resize.fndtn.topbar');
            });

            S('body').off('.topbar').on('click.fndtn.topbar', function (e) {
                var parent = S(e.target).closest('li').closest('li.hover');

                if (parent.length > 0) {
                    return;
                }

                S('[' + self.attr_name() + '] li.hover').removeClass('hover');
            });

            // Go up a level on Click
            S(this.scope).on('click.fndtn.topbar', '[' + this.attr_name() + '] .has-dropdown .back', function (e) {
                e.preventDefault();

                var $this = S(this),
                    topbar = $this.closest('[' + self.attr_name() + ']'),
                    section = topbar.find('section, .top-bar-section'),
                    settings = topbar.data(self.attr_name(true) + '-init'),
                    $movedLi = $this.closest('li.moved'),
                    $previousLevelUl = $movedLi.parent();

                topbar.data('index', topbar.data('index') - 1);

                if (!self.rtl) {
                    section.css({left: -(100 * topbar.data('index')) + '%'});
                    section.find('>.name').css({left: 100 * topbar.data('index') + '%'});
                } else {
                    section.css({right: -(100 * topbar.data('index')) + '%'});
                    section.find('>.name').css({right: 100 * topbar.data('index') + '%'});
                }

                if (topbar.data('index') === 0) {
                    topbar.css('height', '');
                } else {
                    topbar.css('height', $previousLevelUl.outerHeight(true) + topbar.data('height'));
                }

                setTimeout(function () {
                    $movedLi.removeClass('moved');
                }, 300);
            });

            // Show dropdown menus when their items are focused
            S(this.scope).find('.dropdown a')
                .focus(function () {
                    $(this).parents('.has-dropdown').addClass('hover');
                })
                .blur(function () {
                    $(this).parents('.has-dropdown').removeClass('hover');
                });
        },

        resize: function () {
            var self = this;
            self.S('[' + this.attr_name() + ']').each(function () {
                var topbar = self.S(this),
                    settings = topbar.data(self.attr_name(true) + '-init');

                var stickyContainer = topbar.parent('.' + self.settings.sticky_class);
                var stickyOffset;

                if (!self.breakpoint()) {
                    var doToggle = topbar.hasClass('expanded');
                    topbar
                        .css('height', '')
                        .removeClass('expanded')
                        .find('li')
                        .removeClass('hover');

                    if (doToggle) {
                        self.toggle(topbar);
                    }
                }

                if (self.is_sticky(topbar, stickyContainer, settings)) {
                    if (stickyContainer.hasClass('fixed')) {
                        // Remove the fixed to allow for correct calculation of the offset.
                        stickyContainer.removeClass('fixed');

                        stickyOffset = stickyContainer.offset().top;
                        if (self.S(document.body).hasClass('f-topbar-fixed')) {
                            stickyOffset -= topbar.data('height');
                        }

                        topbar.data('stickyoffset', stickyOffset);
                        stickyContainer.addClass('fixed');
                    } else {
                        stickyOffset = stickyContainer.offset().top;
                        topbar.data('stickyoffset', stickyOffset);
                    }
                }

            });
        },

        breakpoint: function () {
            return !matchMedia(Foundation.media_queries['topbar']).matches;
        },

        small: function () {
            return matchMedia(Foundation.media_queries['small']).matches;
        },

        medium: function () {
            return matchMedia(Foundation.media_queries['medium']).matches;
        },

        large: function () {
            return matchMedia(Foundation.media_queries['large']).matches;
        },

        assemble: function (topbar) {
            var self = this,
                settings = topbar.data(this.attr_name(true) + '-init'),
                section = self.S('section, .top-bar-section', topbar);

            // Pull element out of the DOM for manipulation
            section.detach();

            self.S('.has-dropdown>a', section).each(function () {
                var $link = self.S(this),
                    $dropdown = $link.siblings('.dropdown'),
                    url = $link.attr('href'),
                    $titleLi;

                if (!$dropdown.find('.title.back').length) {

                    if (settings.mobile_show_parent_link == true && url) {
                        $titleLi = $('<li class="title back js-generated"><h5><a href="javascript:void(0)"></a></h5></li><li class="parent-link hide-for-large-up"><a class="parent-link js-generated" href="' + url + '">' + $link.html() + '</a></li>');
                    } else {
                        $titleLi = $('<li class="title back js-generated"><h5><a href="javascript:void(0)"></a></h5>');
                    }

                    // Copy link to subnav
                    if (settings.custom_back_text == true) {
                        $('h5>a', $titleLi).html(settings.back_text);
                    } else {
                        $('h5>a', $titleLi).html('&laquo; ' + $link.html());
                    }
                    $dropdown.prepend($titleLi);
                }
            });

            // Put element back in the DOM
            section.appendTo(topbar);

            // check for sticky
            this.sticky();

            this.assembled(topbar);
        },

        assembled: function (topbar) {
            topbar.data(this.attr_name(true), $.extend({}, topbar.data(this.attr_name(true)), {assembled: true}));
        },

        height: function (ul) {
            var total = 0,
                self = this;

            $('> li', ul).each(function () {
                total += self.S(this).outerHeight(true);
            });

            return total;
        },

        sticky: function () {
            var self = this;

            this.S(window).on('scroll', function () {
                self.update_sticky_positioning();
            });
        },

        update_sticky_positioning: function () {
            var klass = '.' + this.settings.sticky_class,
                $window = this.S(window),
                self = this;

            if (self.settings.sticky_topbar && self.is_sticky(this.settings.sticky_topbar, this.settings.sticky_topbar.parent(), this.settings)) {
                var distance = this.settings.sticky_topbar.data('stickyoffset');
                if (!self.S(klass).hasClass('expanded')) {
                    if ($window.scrollTop() > (distance)) {
                        if (!self.S(klass).hasClass('fixed')) {
                            self.S(klass).addClass('fixed');
                            self.S('body').addClass('f-topbar-fixed');
                        }
                    } else if ($window.scrollTop() <= distance) {
                        if (self.S(klass).hasClass('fixed')) {
                            self.S(klass).removeClass('fixed');
                            self.S('body').removeClass('f-topbar-fixed');
                        }
                    }
                }
            }
        },

        off: function () {
            this.S(this.scope).off('.fndtn.topbar');
            this.S(window).off('.fndtn.topbar');
        },

        reflow: function () {
        }
    };
}(jQuery, window, window.document));

;
(function ($, window, document, undefined) {
    'use strict';

    Foundation.libs.topbar = {
        name: 'topbar',

        version: '5.5.1',

        settings: {
            index: 0,
            sticky_class: 'sticky',
            custom_back_text: true,
            back_text: 'Back',
            mobile_show_parent_link: true,
            is_hover: true,
            scrolltop: true, // jump to top when sticky nav menu toggle is clicked
            sticky_on: 'all'
        },

        init: function (section, method, options) {
            Foundation.inherit(this, 'add_custom_rule register_media throttle');
            var self = this;

            self.register_media('topbar', 'foundation-mq-topbar');

            this.bindings(method, options);

            self.S('[' + this.attr_name() + ']', this.scope).each(function () {
                var topbar = $(this),
                    settings = topbar.data(self.attr_name(true) + '-init'),
                    section = self.S('section, .top-bar-section', this);
                topbar.data('index', 0);
                var topbarContainer = topbar.parent();
                if (topbarContainer.hasClass('fixed') || self.is_sticky(topbar, topbarContainer, settings)) {
                    self.settings.sticky_class = settings.sticky_class;
                    self.settings.sticky_topbar = topbar;
                    topbar.data('height', topbarContainer.outerHeight());
                    topbar.data('stickyoffset', topbarContainer.offset().top);
                } else {
                    topbar.data('height', topbar.outerHeight());
                }

                if (!settings.assembled) {
                    self.assemble(topbar);
                }

                if (settings.is_hover) {
                    self.S('.has-dropdown', topbar).addClass('not-click');
                } else {
                    self.S('.has-dropdown', topbar).removeClass('not-click');
                }

                // Pad body when sticky (scrolled) or fixed.
                self.add_custom_rule('.f-topbar-fixed { padding-top: ' + topbar.data('height') + 'px }');

                if (topbarContainer.hasClass('fixed')) {
                    self.S('body').addClass('f-topbar-fixed');
                }
            });

        },

        is_sticky: function (topbar, topbarContainer, settings) {
            var sticky = topbarContainer.hasClass(settings.sticky_class);
            var smallMatch = matchMedia(Foundation.media_queries.small).matches;
            var medMatch = matchMedia(Foundation.media_queries.medium).matches;
            var lrgMatch = matchMedia(Foundation.media_queries.large).matches;

            if (sticky && settings.sticky_on === 'all') {
                return true;
            }
            if (sticky && this.small() && settings.sticky_on.indexOf('small') !== -1) {
                if (smallMatch && !medMatch && !lrgMatch) {
                    return true;
                }
            }
            if (sticky && this.medium() && settings.sticky_on.indexOf('medium') !== -1) {
                if (smallMatch && medMatch && !lrgMatch) {
                    return true;
                }
            }
            if (sticky && this.large() && settings.sticky_on.indexOf('large') !== -1) {
                if (smallMatch && medMatch && lrgMatch) {
                    return true;
                }
            }

            // fix for iOS browsers
            if (sticky && navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
                return true;
            }
            return false;
        },

        toggle: function (toggleEl) {
            var self = this,
                topbar;

            if (toggleEl) {
                topbar = self.S(toggleEl).closest('[' + this.attr_name() + ']');
            } else {
                topbar = self.S('[' + this.attr_name() + ']');
            }

            var settings = topbar.data(this.attr_name(true) + '-init');

            var section = self.S('section, .top-bar-section', topbar);

            if (self.breakpoint()) {
                if (!self.rtl) {
                    section.css({left: '0%'});
                    $('>.name', section).css({left: '100%'});
                } else {
                    section.css({right: '0%'});
                    $('>.name', section).css({right: '100%'});
                }

                self.S('li.moved', section).removeClass('moved');
                topbar.data('index', 0);

                topbar
                    .toggleClass('expanded')
                    .css('height', '');
            }

            if (settings.scrolltop) {
                if (!topbar.hasClass('expanded')) {
                    if (topbar.hasClass('fixed')) {
                        topbar.parent().addClass('fixed');
                        topbar.removeClass('fixed');
                        self.S('body').addClass('f-topbar-fixed');
                    }
                } else if (topbar.parent().hasClass('fixed')) {
                    if (settings.scrolltop) {
                        topbar.parent().removeClass('fixed');
                        topbar.addClass('fixed');
                        self.S('body').removeClass('f-topbar-fixed');

                        window.scrollTo(0, 0);
                    } else {
                        topbar.parent().removeClass('expanded');
                    }
                }
            } else {
                if (self.is_sticky(topbar, topbar.parent(), settings)) {
                    topbar.parent().addClass('fixed');
                }

                if (topbar.parent().hasClass('fixed')) {
                    if (!topbar.hasClass('expanded')) {
                        topbar.removeClass('fixed');
                        topbar.parent().removeClass('expanded');
                        self.update_sticky_positioning();
                    } else {
                        topbar.addClass('fixed');
                        topbar.parent().addClass('expanded');
                        self.S('body').addClass('f-topbar-fixed');
                    }
                }
            }
        },

        timer: null,

        events: function (bar) {
            var self = this,
                S = this.S;

            S(this.scope)
                .off('.topbar')
                .on('click.fndtn.topbar', '[' + this.attr_name() + '] .toggle-topbar', function (e) {
                    e.preventDefault();
                    self.toggle(this);
                })
                .on('click.fndtn.topbar', '.top-bar .top-bar-section li a[href^="#"],[' + this.attr_name() + '] .top-bar-section li a[href^="#"]', function (e) {
                    var li = $(this).closest('li');
                    if (self.breakpoint() && !li.hasClass('back') && !li.hasClass('has-dropdown')) {
                        self.toggle();
                    }
                })
                .on('click.fndtn.topbar', '[' + this.attr_name() + '] li.has-dropdown', function (e) {
                    var li = S(this),
                        target = S(e.target),
                        topbar = li.closest('[' + self.attr_name() + ']'),
                        settings = topbar.data(self.attr_name(true) + '-init');

                    if (target.data('revealId')) {
                        self.toggle();
                        return;
                    }

                    if (self.breakpoint()) {
                        return;
                    }

                    if (settings.is_hover && !Modernizr.touch) {
                        return;
                    }

                    e.stopImmediatePropagation();

                    if (li.hasClass('hover')) {
                        li
                            .removeClass('hover')
                            .find('li')
                            .removeClass('hover');

                        li.parents('li.hover')
                            .removeClass('hover');
                    } else {
                        li.addClass('hover');

                        $(li).siblings().removeClass('hover');

                        if (target[0].nodeName === 'A' && target.parent().hasClass('has-dropdown')) {
                            e.preventDefault();
                        }
                    }
                })
                .on('click.fndtn.topbar', '[' + this.attr_name() + '] .has-dropdown>a', function (e) {
                    if (self.breakpoint()) {

                        e.preventDefault();

                        var $this = S(this),
                            topbar = $this.closest('[' + self.attr_name() + ']'),
                            section = topbar.find('section, .top-bar-section'),
                            dropdownHeight = $this.next('.dropdown').outerHeight(),
                            $selectedLi = $this.closest('li');

                        topbar.data('index', topbar.data('index') + 1);
                        $selectedLi.addClass('moved');

                        if (!self.rtl) {
                            section.css({left: -(100 * topbar.data('index')) + '%'});
                            section.find('>.name').css({left: 100 * topbar.data('index') + '%'});
                        } else {
                            section.css({right: -(100 * topbar.data('index')) + '%'});
                            section.find('>.name').css({right: 100 * topbar.data('index') + '%'});
                        }

                        topbar.css('height', $this.siblings('ul').outerHeight(true) + topbar.data('height'));
                    }
                });

            S(window).off('.topbar').on('resize.fndtn.topbar', self.throttle(function () {
                self.resize.call(self);
            }, 50)).trigger('resize').trigger('resize.fndtn.topbar').load(function () {
                // Ensure that the offset is calculated after all of the pages resources have loaded
                S(this).trigger('resize.fndtn.topbar');
            });

            S('body').off('.topbar').on('click.fndtn.topbar', function (e) {
                var parent = S(e.target).closest('li').closest('li.hover');

                if (parent.length > 0) {
                    return;
                }

                S('[' + self.attr_name() + '] li.hover').removeClass('hover');
            });

            // Go up a level on Click
            S(this.scope).on('click.fndtn.topbar', '[' + this.attr_name() + '] .has-dropdown .back', function (e) {
                e.preventDefault();

                var $this = S(this),
                    topbar = $this.closest('[' + self.attr_name() + ']'),
                    section = topbar.find('section, .top-bar-section'),
                    settings = topbar.data(self.attr_name(true) + '-init'),
                    $movedLi = $this.closest('li.moved'),
                    $previousLevelUl = $movedLi.parent();

                topbar.data('index', topbar.data('index') - 1);

                if (!self.rtl) {
                    section.css({left: -(100 * topbar.data('index')) + '%'});
                    section.find('>.name').css({left: 100 * topbar.data('index') + '%'});
                } else {
                    section.css({right: -(100 * topbar.data('index')) + '%'});
                    section.find('>.name').css({right: 100 * topbar.data('index') + '%'});
                }

                if (topbar.data('index') === 0) {
                    topbar.css('height', '');
                } else {
                    topbar.css('height', $previousLevelUl.outerHeight(true) + topbar.data('height'));
                }

                setTimeout(function () {
                    $movedLi.removeClass('moved');
                }, 300);
            });

            // Show dropdown menus when their items are focused
            S(this.scope).find('.dropdown a')
                .focus(function () {
                    $(this).parents('.has-dropdown').addClass('hover');
                })
                .blur(function () {
                    $(this).parents('.has-dropdown').removeClass('hover');
                });
        },

        resize: function () {
            var self = this;
            self.S('[' + this.attr_name() + ']').each(function () {
                var topbar = self.S(this),
                    settings = topbar.data(self.attr_name(true) + '-init');

                var stickyContainer = topbar.parent('.' + self.settings.sticky_class);
                var stickyOffset;

                if (!self.breakpoint()) {
                    var doToggle = topbar.hasClass('expanded');
                    topbar
                        .css('height', '')
                        .removeClass('expanded')
                        .find('li')
                        .removeClass('hover');

                    if (doToggle) {
                        self.toggle(topbar);
                    }
                }

                if (self.is_sticky(topbar, stickyContainer, settings)) {
                    if (stickyContainer.hasClass('fixed')) {
                        // Remove the fixed to allow for correct calculation of the offset.
                        stickyContainer.removeClass('fixed');

                        stickyOffset = stickyContainer.offset().top;
                        if (self.S(document.body).hasClass('f-topbar-fixed')) {
                            stickyOffset -= topbar.data('height');
                        }

                        topbar.data('stickyoffset', stickyOffset);
                        stickyContainer.addClass('fixed');
                    } else {
                        stickyOffset = stickyContainer.offset().top;
                        topbar.data('stickyoffset', stickyOffset);
                    }
                }

            });
        },

        breakpoint: function () {
            return !matchMedia(Foundation.media_queries['topbar']).matches;
        },

        small: function () {
            return matchMedia(Foundation.media_queries['small']).matches;
        },

        medium: function () {
            return matchMedia(Foundation.media_queries['medium']).matches;
        },

        large: function () {
            return matchMedia(Foundation.media_queries['large']).matches;
        },

        assemble: function (topbar) {
            var self = this,
                settings = topbar.data(this.attr_name(true) + '-init'),
                section = self.S('section, .top-bar-section', topbar);

            // Pull element out of the DOM for manipulation
            section.detach();

            self.S('.has-dropdown>a', section).each(function () {
                var $link = self.S(this),
                    $dropdown = $link.siblings('.dropdown'),
                    url = $link.attr('href'),
                    $titleLi;

                if (!$dropdown.find('.title.back').length) {

                    if (settings.mobile_show_parent_link == true && url) {
                        $titleLi = $('<li class="title back js-generated"><h5><a href="javascript:void(0)"></a></h5></li><li class="parent-link hide-for-large-up"><a class="parent-link js-generated" href="' + url + '">' + $link.html() + '</a></li>');
                    } else {
                        $titleLi = $('<li class="title back js-generated"><h5><a href="javascript:void(0)"></a></h5>');
                    }

                    // Copy link to subnav
                    if (settings.custom_back_text == true) {
                        $('h5>a', $titleLi).html(settings.back_text);
                    } else {
                        $('h5>a', $titleLi).html('&laquo; ' + $link.html());
                    }
                    $dropdown.prepend($titleLi);
                }
            });

            // Put element back in the DOM
            section.appendTo(topbar);

            // check for sticky
            this.sticky();

            this.assembled(topbar);
        },

        assembled: function (topbar) {
            topbar.data(this.attr_name(true), $.extend({}, topbar.data(this.attr_name(true)), {assembled: true}));
        },

        height: function (ul) {
            var total = 0,
                self = this;

            $('> li', ul).each(function () {
                total += self.S(this).outerHeight(true);
            });

            return total;
        },

        sticky: function () {
            var self = this;

            this.S(window).on('scroll', function () {
                self.update_sticky_positioning();
            });
        },

        update_sticky_positioning: function () {
            var klass = '.' + this.settings.sticky_class,
                $window = this.S(window),
                self = this;

            if (self.settings.sticky_topbar && self.is_sticky(this.settings.sticky_topbar, this.settings.sticky_topbar.parent(), this.settings)) {
                var distance = this.settings.sticky_topbar.data('stickyoffset');
                if (!self.S(klass).hasClass('expanded')) {
                    if ($window.scrollTop() > (distance)) {
                        if (!self.S(klass).hasClass('fixed')) {
                            self.S(klass).addClass('fixed');
                            self.S('body').addClass('f-topbar-fixed');
                        }
                    } else if ($window.scrollTop() <= distance) {
                        if (self.S(klass).hasClass('fixed')) {
                            self.S(klass).removeClass('fixed');
                            self.S('body').removeClass('f-topbar-fixed');
                        }
                    }
                }
            }
        },

        off: function () {
            this.S(this.scope).off('.fndtn.topbar');
            this.S(window).off('.fndtn.topbar');
        },

        reflow: function () {
        }
    };
}(jQuery, window, window.document));

// This is what makes sure that foundation is invoked
jQuery(document).foundation();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZGVybml6ci5qcyIsImZvdW5kYXRpb24uanMiLCJmb3VuZGF0aW9uLnRvcGJhci5qcyIsImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5M0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BjQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogTW9kZXJuaXpyIHYyLjguM1xuICogd3d3Lm1vZGVybml6ci5jb21cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIEZhcnVrIEF0ZXMsIFBhdWwgSXJpc2gsIEFsZXggU2V4dG9uXG4gKiBBdmFpbGFibGUgdW5kZXIgdGhlIEJTRCBhbmQgTUlUIGxpY2Vuc2VzOiB3d3cubW9kZXJuaXpyLmNvbS9saWNlbnNlL1xuICovXG5cbi8qXG4gKiBNb2Rlcm5penIgdGVzdHMgd2hpY2ggbmF0aXZlIENTUzMgYW5kIEhUTUw1IGZlYXR1cmVzIGFyZSBhdmFpbGFibGUgaW5cbiAqIHRoZSBjdXJyZW50IFVBIGFuZCBtYWtlcyB0aGUgcmVzdWx0cyBhdmFpbGFibGUgdG8geW91IGluIHR3byB3YXlzOlxuICogYXMgcHJvcGVydGllcyBvbiBhIGdsb2JhbCBNb2Rlcm5penIgb2JqZWN0LCBhbmQgYXMgY2xhc3NlcyBvbiB0aGVcbiAqIDxodG1sPiBlbGVtZW50LiBUaGlzIGluZm9ybWF0aW9uIGFsbG93cyB5b3UgdG8gcHJvZ3Jlc3NpdmVseSBlbmhhbmNlXG4gKiB5b3VyIHBhZ2VzIHdpdGggYSBncmFudWxhciBsZXZlbCBvZiBjb250cm9sIG92ZXIgdGhlIGV4cGVyaWVuY2UuXG4gKlxuICogTW9kZXJuaXpyIGhhcyBhbiBvcHRpb25hbCAobm90IGluY2x1ZGVkKSBjb25kaXRpb25hbCByZXNvdXJjZSBsb2FkZXJcbiAqIGNhbGxlZCBNb2Rlcm5penIubG9hZCgpLCBiYXNlZCBvbiBZZXBub3BlLmpzICh5ZXBub3BlanMuY29tKS5cbiAqIFRvIGdldCBhIGJ1aWxkIHRoYXQgaW5jbHVkZXMgTW9kZXJuaXpyLmxvYWQoKSwgYXMgd2VsbCBhcyBjaG9vc2luZ1xuICogd2hpY2ggdGVzdHMgdG8gaW5jbHVkZSwgZ28gdG8gd3d3Lm1vZGVybml6ci5jb20vZG93bmxvYWQvXG4gKlxuICogQXV0aG9ycyAgICAgICAgRmFydWsgQXRlcywgUGF1bCBJcmlzaCwgQWxleCBTZXh0b25cbiAqIENvbnRyaWJ1dG9ycyAgIFJ5YW4gU2VkZG9uLCBCZW4gQWxtYW5cbiAqL1xuXG53aW5kb3cuTW9kZXJuaXpyID0gKGZ1bmN0aW9uKCB3aW5kb3csIGRvY3VtZW50LCB1bmRlZmluZWQgKSB7XG5cbiAgICB2YXIgdmVyc2lvbiA9ICcyLjguMycsXG5cbiAgICBNb2Rlcm5penIgPSB7fSxcblxuICAgIC8qPj5jc3NjbGFzc2VzKi9cbiAgICAvLyBvcHRpb24gZm9yIGVuYWJsaW5nIHRoZSBIVE1MIGNsYXNzZXMgdG8gYmUgYWRkZWRcbiAgICBlbmFibGVDbGFzc2VzID0gdHJ1ZSxcbiAgICAvKj4+Y3NzY2xhc3NlcyovXG5cbiAgICBkb2NFbGVtZW50ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIG91ciBcIm1vZGVybml6clwiIGVsZW1lbnQgdGhhdCB3ZSBkbyBtb3N0IGZlYXR1cmUgdGVzdHMgb24uXG4gICAgICovXG4gICAgbW9kID0gJ21vZGVybml6cicsXG4gICAgbW9kRWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobW9kKSxcbiAgICBtU3R5bGUgPSBtb2RFbGVtLnN0eWxlLFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIHRoZSBpbnB1dCBlbGVtZW50IGZvciB2YXJpb3VzIFdlYiBGb3JtcyBmZWF0dXJlIHRlc3RzLlxuICAgICAqL1xuICAgIGlucHV0RWxlbSAvKj4+aW5wdXRlbGVtKi8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpIC8qPj5pbnB1dGVsZW0qLyAsXG5cbiAgICAvKj4+c21pbGUqL1xuICAgIHNtaWxlID0gJzopJyxcbiAgICAvKj4+c21pbGUqL1xuXG4gICAgdG9TdHJpbmcgPSB7fS50b1N0cmluZyxcblxuICAgIC8vIFRPRE8gOjogbWFrZSB0aGUgcHJlZml4ZXMgbW9yZSBncmFudWxhclxuICAgIC8qPj5wcmVmaXhlcyovXG4gICAgLy8gTGlzdCBvZiBwcm9wZXJ0eSB2YWx1ZXMgdG8gc2V0IGZvciBjc3MgdGVzdHMuIFNlZSB0aWNrZXQgIzIxXG4gICAgcHJlZml4ZXMgPSAnIC13ZWJraXQtIC1tb3otIC1vLSAtbXMtICcuc3BsaXQoJyAnKSxcbiAgICAvKj4+cHJlZml4ZXMqL1xuXG4gICAgLyo+PmRvbXByZWZpeGVzKi9cbiAgICAvLyBGb2xsb3dpbmcgc3BlYyBpcyB0byBleHBvc2UgdmVuZG9yLXNwZWNpZmljIHN0eWxlIHByb3BlcnRpZXMgYXM6XG4gICAgLy8gICBlbGVtLnN0eWxlLldlYmtpdEJvcmRlclJhZGl1c1xuICAgIC8vIGFuZCB0aGUgZm9sbG93aW5nIHdvdWxkIGJlIGluY29ycmVjdDpcbiAgICAvLyAgIGVsZW0uc3R5bGUud2Via2l0Qm9yZGVyUmFkaXVzXG5cbiAgICAvLyBXZWJraXQgZ2hvc3RzIHRoZWlyIHByb3BlcnRpZXMgaW4gbG93ZXJjYXNlIGJ1dCBPcGVyYSAmIE1veiBkbyBub3QuXG4gICAgLy8gTWljcm9zb2Z0IHVzZXMgYSBsb3dlcmNhc2UgYG1zYCBpbnN0ZWFkIG9mIHRoZSBjb3JyZWN0IGBNc2AgaW4gSUU4K1xuICAgIC8vICAgZXJpay5lYWUubmV0L2FyY2hpdmVzLzIwMDgvMDMvMTAvMjEuNDguMTAvXG5cbiAgICAvLyBNb3JlIGhlcmU6IGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvaXNzdWUvMjFcbiAgICBvbVByZWZpeGVzID0gJ1dlYmtpdCBNb3ogTyBtcycsXG5cbiAgICBjc3NvbVByZWZpeGVzID0gb21QcmVmaXhlcy5zcGxpdCgnICcpLFxuXG4gICAgZG9tUHJlZml4ZXMgPSBvbVByZWZpeGVzLnRvTG93ZXJDYXNlKCkuc3BsaXQoJyAnKSxcbiAgICAvKj4+ZG9tcHJlZml4ZXMqL1xuXG4gICAgLyo+Pm5zKi9cbiAgICBucyA9IHsnc3ZnJzogJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJ30sXG4gICAgLyo+Pm5zKi9cblxuICAgIHRlc3RzID0ge30sXG4gICAgaW5wdXRzID0ge30sXG4gICAgYXR0cnMgPSB7fSxcblxuICAgIGNsYXNzZXMgPSBbXSxcblxuICAgIHNsaWNlID0gY2xhc3Nlcy5zbGljZSxcblxuICAgIGZlYXR1cmVOYW1lLCAvLyB1c2VkIGluIHRlc3RpbmcgbG9vcFxuXG5cbiAgICAvKj4+dGVzdHN0eWxlcyovXG4gICAgLy8gSW5qZWN0IGVsZW1lbnQgd2l0aCBzdHlsZSBlbGVtZW50IGFuZCBzb21lIENTUyBydWxlc1xuICAgIGluamVjdEVsZW1lbnRXaXRoU3R5bGVzID0gZnVuY3Rpb24oIHJ1bGUsIGNhbGxiYWNrLCBub2RlcywgdGVzdG5hbWVzICkge1xuXG4gICAgICB2YXIgc3R5bGUsIHJldCwgbm9kZSwgZG9jT3ZlcmZsb3csXG4gICAgICAgICAgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICAgICAgLy8gQWZ0ZXIgcGFnZSBsb2FkIGluamVjdGluZyBhIGZha2UgYm9keSBkb2Vzbid0IHdvcmsgc28gY2hlY2sgaWYgYm9keSBleGlzdHNcbiAgICAgICAgICBib2R5ID0gZG9jdW1lbnQuYm9keSxcbiAgICAgICAgICAvLyBJRTYgYW5kIDcgd29uJ3QgcmV0dXJuIG9mZnNldFdpZHRoIG9yIG9mZnNldEhlaWdodCB1bmxlc3MgaXQncyBpbiB0aGUgYm9keSBlbGVtZW50LCBzbyB3ZSBmYWtlIGl0LlxuICAgICAgICAgIGZha2VCb2R5ID0gYm9keSB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdib2R5Jyk7XG5cbiAgICAgIGlmICggcGFyc2VJbnQobm9kZXMsIDEwKSApIHtcbiAgICAgICAgICAvLyBJbiBvcmRlciBub3QgdG8gZ2l2ZSBmYWxzZSBwb3NpdGl2ZXMgd2UgY3JlYXRlIGEgbm9kZSBmb3IgZWFjaCB0ZXN0XG4gICAgICAgICAgLy8gVGhpcyBhbHNvIGFsbG93cyB0aGUgbWV0aG9kIHRvIHNjYWxlIGZvciB1bnNwZWNpZmllZCB1c2VzXG4gICAgICAgICAgd2hpbGUgKCBub2Rlcy0tICkge1xuICAgICAgICAgICAgICBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgIG5vZGUuaWQgPSB0ZXN0bmFtZXMgPyB0ZXN0bmFtZXNbbm9kZXNdIDogbW9kICsgKG5vZGVzICsgMSk7XG4gICAgICAgICAgICAgIGRpdi5hcHBlbmRDaGlsZChub2RlKTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIDxzdHlsZT4gZWxlbWVudHMgaW4gSUU2LTkgYXJlIGNvbnNpZGVyZWQgJ05vU2NvcGUnIGVsZW1lbnRzIGFuZCB0aGVyZWZvcmUgd2lsbCBiZSByZW1vdmVkXG4gICAgICAvLyB3aGVuIGluamVjdGVkIHdpdGggaW5uZXJIVE1MLiBUbyBnZXQgYXJvdW5kIHRoaXMgeW91IG5lZWQgdG8gcHJlcGVuZCB0aGUgJ05vU2NvcGUnIGVsZW1lbnRcbiAgICAgIC8vIHdpdGggYSAnc2NvcGVkJyBlbGVtZW50LCBpbiBvdXIgY2FzZSB0aGUgc29mdC1oeXBoZW4gZW50aXR5IGFzIGl0IHdvbid0IG1lc3Mgd2l0aCBvdXIgbWVhc3VyZW1lbnRzLlxuICAgICAgLy8gbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvbXM1MzM4OTclMjhWUy44NSUyOS5hc3B4XG4gICAgICAvLyBEb2N1bWVudHMgc2VydmVkIGFzIHhtbCB3aWxsIHRocm93IGlmIHVzaW5nICZzaHk7IHNvIHVzZSB4bWwgZnJpZW5kbHkgZW5jb2RlZCB2ZXJzaW9uLiBTZWUgaXNzdWUgIzI3N1xuICAgICAgc3R5bGUgPSBbJyYjMTczOycsJzxzdHlsZSBpZD1cInMnLCBtb2QsICdcIj4nLCBydWxlLCAnPC9zdHlsZT4nXS5qb2luKCcnKTtcbiAgICAgIGRpdi5pZCA9IG1vZDtcbiAgICAgIC8vIElFNiB3aWxsIGZhbHNlIHBvc2l0aXZlIG9uIHNvbWUgdGVzdHMgZHVlIHRvIHRoZSBzdHlsZSBlbGVtZW50IGluc2lkZSB0aGUgdGVzdCBkaXYgc29tZWhvdyBpbnRlcmZlcmluZyBvZmZzZXRIZWlnaHQsIHNvIGluc2VydCBpdCBpbnRvIGJvZHkgb3IgZmFrZWJvZHkuXG4gICAgICAvLyBPcGVyYSB3aWxsIGFjdCBhbGwgcXVpcmt5IHdoZW4gaW5qZWN0aW5nIGVsZW1lbnRzIGluIGRvY3VtZW50RWxlbWVudCB3aGVuIHBhZ2UgaXMgc2VydmVkIGFzIHhtbCwgbmVlZHMgZmFrZWJvZHkgdG9vLiAjMjcwXG4gICAgICAoYm9keSA/IGRpdiA6IGZha2VCb2R5KS5pbm5lckhUTUwgKz0gc3R5bGU7XG4gICAgICBmYWtlQm9keS5hcHBlbmRDaGlsZChkaXYpO1xuICAgICAgaWYgKCAhYm9keSApIHtcbiAgICAgICAgICAvL2F2b2lkIGNyYXNoaW5nIElFOCwgaWYgYmFja2dyb3VuZCBpbWFnZSBpcyB1c2VkXG4gICAgICAgICAgZmFrZUJvZHkuc3R5bGUuYmFja2dyb3VuZCA9ICcnO1xuICAgICAgICAgIC8vU2FmYXJpIDUuMTMvNS4xLjQgT1NYIHN0b3BzIGxvYWRpbmcgaWYgOjotd2Via2l0LXNjcm9sbGJhciBpcyB1c2VkIGFuZCBzY3JvbGxiYXJzIGFyZSB2aXNpYmxlXG4gICAgICAgICAgZmFrZUJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgICAgICAgICBkb2NPdmVyZmxvdyA9IGRvY0VsZW1lbnQuc3R5bGUub3ZlcmZsb3c7XG4gICAgICAgICAgZG9jRWxlbWVudC5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuICAgICAgICAgIGRvY0VsZW1lbnQuYXBwZW5kQ2hpbGQoZmFrZUJvZHkpO1xuICAgICAgfVxuXG4gICAgICByZXQgPSBjYWxsYmFjayhkaXYsIHJ1bGUpO1xuICAgICAgLy8gSWYgdGhpcyBpcyBkb25lIGFmdGVyIHBhZ2UgbG9hZCB3ZSBkb24ndCB3YW50IHRvIHJlbW92ZSB0aGUgYm9keSBzbyBjaGVjayBpZiBib2R5IGV4aXN0c1xuICAgICAgaWYgKCAhYm9keSApIHtcbiAgICAgICAgICBmYWtlQm9keS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGZha2VCb2R5KTtcbiAgICAgICAgICBkb2NFbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gZG9jT3ZlcmZsb3c7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRpdi5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGRpdik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAhIXJldDtcblxuICAgIH0sXG4gICAgLyo+PnRlc3RzdHlsZXMqL1xuXG4gICAgLyo+Pm1xKi9cbiAgICAvLyBhZGFwdGVkIGZyb20gbWF0Y2hNZWRpYSBwb2x5ZmlsbFxuICAgIC8vIGJ5IFNjb3R0IEplaGwgYW5kIFBhdWwgSXJpc2hcbiAgICAvLyBnaXN0LmdpdGh1Yi5jb20vNzg2NzY4XG4gICAgdGVzdE1lZGlhUXVlcnkgPSBmdW5jdGlvbiggbXEgKSB7XG5cbiAgICAgIHZhciBtYXRjaE1lZGlhID0gd2luZG93Lm1hdGNoTWVkaWEgfHwgd2luZG93Lm1zTWF0Y2hNZWRpYTtcbiAgICAgIGlmICggbWF0Y2hNZWRpYSApIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoTWVkaWEobXEpICYmIG1hdGNoTWVkaWEobXEpLm1hdGNoZXMgfHwgZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHZhciBib29sO1xuXG4gICAgICBpbmplY3RFbGVtZW50V2l0aFN0eWxlcygnQG1lZGlhICcgKyBtcSArICcgeyAjJyArIG1vZCArICcgeyBwb3NpdGlvbjogYWJzb2x1dGU7IH0gfScsIGZ1bmN0aW9uKCBub2RlICkge1xuICAgICAgICBib29sID0gKHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlID9cbiAgICAgICAgICAgICAgICAgIGdldENvbXB1dGVkU3R5bGUobm9kZSwgbnVsbCkgOlxuICAgICAgICAgICAgICAgICAgbm9kZS5jdXJyZW50U3R5bGUpWydwb3NpdGlvbiddID09ICdhYnNvbHV0ZSc7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGJvb2w7XG5cbiAgICAgfSxcbiAgICAgLyo+Pm1xKi9cblxuXG4gICAgLyo+Pmhhc2V2ZW50Ki9cbiAgICAvL1xuICAgIC8vIGlzRXZlbnRTdXBwb3J0ZWQgZGV0ZXJtaW5lcyBpZiBhIGdpdmVuIGVsZW1lbnQgc3VwcG9ydHMgdGhlIGdpdmVuIGV2ZW50XG4gICAgLy8ga2FuZ2F4LmdpdGh1Yi5jb20vaXNldmVudHN1cHBvcnRlZC9cbiAgICAvL1xuICAgIC8vIFRoZSBmb2xsb3dpbmcgcmVzdWx0cyBhcmUga25vd24gaW5jb3JyZWN0czpcbiAgICAvLyAgIE1vZGVybml6ci5oYXNFdmVudChcIndlYmtpdFRyYW5zaXRpb25FbmRcIiwgZWxlbSkgLy8gZmFsc2UgbmVnYXRpdmVcbiAgICAvLyAgIE1vZGVybml6ci5oYXNFdmVudChcInRleHRJbnB1dFwiKSAvLyBpbiBXZWJraXQuIGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvMzMzXG4gICAgLy8gICAuLi5cbiAgICBpc0V2ZW50U3VwcG9ydGVkID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgICB2YXIgVEFHTkFNRVMgPSB7XG4gICAgICAgICdzZWxlY3QnOiAnaW5wdXQnLCAnY2hhbmdlJzogJ2lucHV0JyxcbiAgICAgICAgJ3N1Ym1pdCc6ICdmb3JtJywgJ3Jlc2V0JzogJ2Zvcm0nLFxuICAgICAgICAnZXJyb3InOiAnaW1nJywgJ2xvYWQnOiAnaW1nJywgJ2Fib3J0JzogJ2ltZydcbiAgICAgIH07XG5cbiAgICAgIGZ1bmN0aW9uIGlzRXZlbnRTdXBwb3J0ZWQoIGV2ZW50TmFtZSwgZWxlbWVudCApIHtcblxuICAgICAgICBlbGVtZW50ID0gZWxlbWVudCB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFRBR05BTUVTW2V2ZW50TmFtZV0gfHwgJ2RpdicpO1xuICAgICAgICBldmVudE5hbWUgPSAnb24nICsgZXZlbnROYW1lO1xuXG4gICAgICAgIC8vIFdoZW4gdXNpbmcgYHNldEF0dHJpYnV0ZWAsIElFIHNraXBzIFwidW5sb2FkXCIsIFdlYktpdCBza2lwcyBcInVubG9hZFwiIGFuZCBcInJlc2l6ZVwiLCB3aGVyZWFzIGBpbmAgXCJjYXRjaGVzXCIgdGhvc2VcbiAgICAgICAgdmFyIGlzU3VwcG9ydGVkID0gZXZlbnROYW1lIGluIGVsZW1lbnQ7XG5cbiAgICAgICAgaWYgKCAhaXNTdXBwb3J0ZWQgKSB7XG4gICAgICAgICAgLy8gSWYgaXQgaGFzIG5vIGBzZXRBdHRyaWJ1dGVgIChpLmUuIGRvZXNuJ3QgaW1wbGVtZW50IE5vZGUgaW50ZXJmYWNlKSwgdHJ5IGdlbmVyaWMgZWxlbWVudFxuICAgICAgICAgIGlmICggIWVsZW1lbnQuc2V0QXR0cmlidXRlICkge1xuICAgICAgICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIGVsZW1lbnQuc2V0QXR0cmlidXRlICYmIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlICkge1xuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoZXZlbnROYW1lLCAnJyk7XG4gICAgICAgICAgICBpc1N1cHBvcnRlZCA9IGlzKGVsZW1lbnRbZXZlbnROYW1lXSwgJ2Z1bmN0aW9uJyk7XG5cbiAgICAgICAgICAgIC8vIElmIHByb3BlcnR5IHdhcyBjcmVhdGVkLCBcInJlbW92ZSBpdFwiIChieSBzZXR0aW5nIHZhbHVlIHRvIGB1bmRlZmluZWRgKVxuICAgICAgICAgICAgaWYgKCAhaXMoZWxlbWVudFtldmVudE5hbWVdLCAndW5kZWZpbmVkJykgKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnRbZXZlbnROYW1lXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKGV2ZW50TmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudCA9IG51bGw7XG4gICAgICAgIHJldHVybiBpc1N1cHBvcnRlZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpc0V2ZW50U3VwcG9ydGVkO1xuICAgIH0pKCksXG4gICAgLyo+Pmhhc2V2ZW50Ki9cblxuICAgIC8vIFRPRE8gOjogQWRkIGZsYWcgZm9yIGhhc293bnByb3AgPyBkaWRuJ3QgbGFzdCB0aW1lXG5cbiAgICAvLyBoYXNPd25Qcm9wZXJ0eSBzaGltIGJ5IGthbmdheCBuZWVkZWQgZm9yIFNhZmFyaSAyLjAgc3VwcG9ydFxuICAgIF9oYXNPd25Qcm9wZXJ0eSA9ICh7fSkuaGFzT3duUHJvcGVydHksIGhhc093blByb3A7XG5cbiAgICBpZiAoICFpcyhfaGFzT3duUHJvcGVydHksICd1bmRlZmluZWQnKSAmJiAhaXMoX2hhc093blByb3BlcnR5LmNhbGwsICd1bmRlZmluZWQnKSApIHtcbiAgICAgIGhhc093blByb3AgPSBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgICAgICByZXR1cm4gX2hhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7XG4gICAgICB9O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGhhc093blByb3AgPSBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkgeyAvKiB5ZXMsIHRoaXMgY2FuIGdpdmUgZmFsc2UgcG9zaXRpdmVzL25lZ2F0aXZlcywgYnV0IG1vc3Qgb2YgdGhlIHRpbWUgd2UgZG9uJ3QgY2FyZSBhYm91dCB0aG9zZSAqL1xuICAgICAgICByZXR1cm4gKChwcm9wZXJ0eSBpbiBvYmplY3QpICYmIGlzKG9iamVjdC5jb25zdHJ1Y3Rvci5wcm90b3R5cGVbcHJvcGVydHldLCAndW5kZWZpbmVkJykpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBBZGFwdGVkIGZyb20gRVM1LXNoaW0gaHR0cHM6Ly9naXRodWIuY29tL2tyaXNrb3dhbC9lczUtc2hpbS9ibG9iL21hc3Rlci9lczUtc2hpbS5qc1xuICAgIC8vIGVzNS5naXRodWIuY29tLyN4MTUuMy40LjVcblxuICAgIGlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcbiAgICAgIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gYmluZCh0aGF0KSB7XG5cbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXM7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXQgIT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSxcbiAgICAgICAgICAgIGJvdW5kID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICBpZiAodGhpcyBpbnN0YW5jZW9mIGJvdW5kKSB7XG5cbiAgICAgICAgICAgICAgdmFyIEYgPSBmdW5jdGlvbigpe307XG4gICAgICAgICAgICAgIEYucHJvdG90eXBlID0gdGFyZ2V0LnByb3RvdHlwZTtcbiAgICAgICAgICAgICAgdmFyIHNlbGYgPSBuZXcgRigpO1xuXG4gICAgICAgICAgICAgIHZhciByZXN1bHQgPSB0YXJnZXQuYXBwbHkoXG4gICAgICAgICAgICAgICAgICBzZWxmLFxuICAgICAgICAgICAgICAgICAgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBpZiAoT2JqZWN0KHJlc3VsdCkgPT09IHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gc2VsZjtcblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0LmFwcGx5KFxuICAgICAgICAgICAgICAgICAgdGhhdCxcbiAgICAgICAgICAgICAgICAgIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSlcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGJvdW5kO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBzZXRDc3MgYXBwbGllcyBnaXZlbiBzdHlsZXMgdG8gdGhlIE1vZGVybml6ciBET00gbm9kZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzZXRDc3MoIHN0ciApIHtcbiAgICAgICAgbVN0eWxlLmNzc1RleHQgPSBzdHI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogc2V0Q3NzQWxsIGV4dHJhcG9sYXRlcyBhbGwgdmVuZG9yLXNwZWNpZmljIGNzcyBzdHJpbmdzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHNldENzc0FsbCggc3RyMSwgc3RyMiApIHtcbiAgICAgICAgcmV0dXJuIHNldENzcyhwcmVmaXhlcy5qb2luKHN0cjEgKyAnOycpICsgKCBzdHIyIHx8ICcnICkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGlzIHJldHVybnMgYSBib29sZWFuIGZvciBpZiB0eXBlb2Ygb2JqIGlzIGV4YWN0bHkgdHlwZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpcyggb2JqLCB0eXBlICkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIG9iaiA9PT0gdHlwZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBjb250YWlucyByZXR1cm5zIGEgYm9vbGVhbiBmb3IgaWYgc3Vic3RyIGlzIGZvdW5kIHdpdGhpbiBzdHIuXG4gICAgICovXG4gICAgZnVuY3Rpb24gY29udGFpbnMoIHN0ciwgc3Vic3RyICkge1xuICAgICAgICByZXR1cm4gISF+KCcnICsgc3RyKS5pbmRleE9mKHN1YnN0cik7XG4gICAgfVxuXG4gICAgLyo+PnRlc3Rwcm9wKi9cblxuICAgIC8vIHRlc3RQcm9wcyBpcyBhIGdlbmVyaWMgQ1NTIC8gRE9NIHByb3BlcnR5IHRlc3QuXG5cbiAgICAvLyBJbiB0ZXN0aW5nIHN1cHBvcnQgZm9yIGEgZ2l2ZW4gQ1NTIHByb3BlcnR5LCBpdCdzIGxlZ2l0IHRvIHRlc3Q6XG4gICAgLy8gICAgYGVsZW0uc3R5bGVbc3R5bGVOYW1lXSAhPT0gdW5kZWZpbmVkYFxuICAgIC8vIElmIHRoZSBwcm9wZXJ0eSBpcyBzdXBwb3J0ZWQgaXQgd2lsbCByZXR1cm4gYW4gZW1wdHkgc3RyaW5nLFxuICAgIC8vIGlmIHVuc3VwcG9ydGVkIGl0IHdpbGwgcmV0dXJuIHVuZGVmaW5lZC5cblxuICAgIC8vIFdlJ2xsIHRha2UgYWR2YW50YWdlIG9mIHRoaXMgcXVpY2sgdGVzdCBhbmQgc2tpcCBzZXR0aW5nIGEgc3R5bGVcbiAgICAvLyBvbiBvdXIgbW9kZXJuaXpyIGVsZW1lbnQsIGJ1dCBpbnN0ZWFkIGp1c3QgdGVzdGluZyB1bmRlZmluZWQgdnNcbiAgICAvLyBlbXB0eSBzdHJpbmcuXG5cbiAgICAvLyBCZWNhdXNlIHRoZSB0ZXN0aW5nIG9mIHRoZSBDU1MgcHJvcGVydHkgbmFtZXMgKHdpdGggXCItXCIsIGFzXG4gICAgLy8gb3Bwb3NlZCB0byB0aGUgY2FtZWxDYXNlIERPTSBwcm9wZXJ0aWVzKSBpcyBub24tcG9ydGFibGUgYW5kXG4gICAgLy8gbm9uLXN0YW5kYXJkIGJ1dCB3b3JrcyBpbiBXZWJLaXQgYW5kIElFIChidXQgbm90IEdlY2tvIG9yIE9wZXJhKSxcbiAgICAvLyB3ZSBleHBsaWNpdGx5IHJlamVjdCBwcm9wZXJ0aWVzIHdpdGggZGFzaGVzIHNvIHRoYXQgYXV0aG9yc1xuICAgIC8vIGRldmVsb3BpbmcgaW4gV2ViS2l0IG9yIElFIGZpcnN0IGRvbid0IGVuZCB1cCB3aXRoXG4gICAgLy8gYnJvd3Nlci1zcGVjaWZpYyBjb250ZW50IGJ5IGFjY2lkZW50LlxuXG4gICAgZnVuY3Rpb24gdGVzdFByb3BzKCBwcm9wcywgcHJlZml4ZWQgKSB7XG4gICAgICAgIGZvciAoIHZhciBpIGluIHByb3BzICkge1xuICAgICAgICAgICAgdmFyIHByb3AgPSBwcm9wc1tpXTtcbiAgICAgICAgICAgIGlmICggIWNvbnRhaW5zKHByb3AsIFwiLVwiKSAmJiBtU3R5bGVbcHJvcF0gIT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJlZml4ZWQgPT0gJ3BmeCcgPyBwcm9wIDogdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8qPj50ZXN0cHJvcCovXG5cbiAgICAvLyBUT0RPIDo6IGFkZCB0ZXN0RE9NUHJvcHNcbiAgICAvKipcbiAgICAgKiB0ZXN0RE9NUHJvcHMgaXMgYSBnZW5lcmljIERPTSBwcm9wZXJ0eSB0ZXN0OyBpZiBhIGJyb3dzZXIgc3VwcG9ydHNcbiAgICAgKiAgIGEgY2VydGFpbiBwcm9wZXJ0eSwgaXQgd29uJ3QgcmV0dXJuIHVuZGVmaW5lZCBmb3IgaXQuXG4gICAgICovXG4gICAgZnVuY3Rpb24gdGVzdERPTVByb3BzKCBwcm9wcywgb2JqLCBlbGVtICkge1xuICAgICAgICBmb3IgKCB2YXIgaSBpbiBwcm9wcyApIHtcbiAgICAgICAgICAgIHZhciBpdGVtID0gb2JqW3Byb3BzW2ldXTtcbiAgICAgICAgICAgIGlmICggaXRlbSAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gdGhlIHByb3BlcnR5IG5hbWUgYXMgYSBzdHJpbmdcbiAgICAgICAgICAgICAgICBpZiAoZWxlbSA9PT0gZmFsc2UpIHJldHVybiBwcm9wc1tpXTtcblxuICAgICAgICAgICAgICAgIC8vIGxldCdzIGJpbmQgYSBmdW5jdGlvblxuICAgICAgICAgICAgICAgIGlmIChpcyhpdGVtLCAnZnVuY3Rpb24nKSl7XG4gICAgICAgICAgICAgICAgICAvLyBkZWZhdWx0IHRvIGF1dG9iaW5kIHVubGVzcyBvdmVycmlkZVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uYmluZChlbGVtIHx8IG9iaik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1bmJvdW5kIGZ1bmN0aW9uIG9yIG9iaiBvciB2YWx1ZVxuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKj4+dGVzdGFsbHByb3BzKi9cbiAgICAvKipcbiAgICAgKiB0ZXN0UHJvcHNBbGwgdGVzdHMgYSBsaXN0IG9mIERPTSBwcm9wZXJ0aWVzIHdlIHdhbnQgdG8gY2hlY2sgYWdhaW5zdC5cbiAgICAgKiAgIFdlIHNwZWNpZnkgbGl0ZXJhbGx5IEFMTCBwb3NzaWJsZSAoa25vd24gYW5kL29yIGxpa2VseSkgcHJvcGVydGllcyBvblxuICAgICAqICAgdGhlIGVsZW1lbnQgaW5jbHVkaW5nIHRoZSBub24tdmVuZG9yIHByZWZpeGVkIG9uZSwgZm9yIGZvcndhcmQtXG4gICAgICogICBjb21wYXRpYmlsaXR5LlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRlc3RQcm9wc0FsbCggcHJvcCwgcHJlZml4ZWQsIGVsZW0gKSB7XG5cbiAgICAgICAgdmFyIHVjUHJvcCAgPSBwcm9wLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcHJvcC5zbGljZSgxKSxcbiAgICAgICAgICAgIHByb3BzICAgPSAocHJvcCArICcgJyArIGNzc29tUHJlZml4ZXMuam9pbih1Y1Byb3AgKyAnICcpICsgdWNQcm9wKS5zcGxpdCgnICcpO1xuXG4gICAgICAgIC8vIGRpZCB0aGV5IGNhbGwgLnByZWZpeGVkKCdib3hTaXppbmcnKSBvciBhcmUgd2UganVzdCB0ZXN0aW5nIGEgcHJvcD9cbiAgICAgICAgaWYoaXMocHJlZml4ZWQsIFwic3RyaW5nXCIpIHx8IGlzKHByZWZpeGVkLCBcInVuZGVmaW5lZFwiKSkge1xuICAgICAgICAgIHJldHVybiB0ZXN0UHJvcHMocHJvcHMsIHByZWZpeGVkKTtcblxuICAgICAgICAvLyBvdGhlcndpc2UsIHRoZXkgY2FsbGVkIC5wcmVmaXhlZCgncmVxdWVzdEFuaW1hdGlvbkZyYW1lJywgd2luZG93WywgZWxlbV0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvcHMgPSAocHJvcCArICcgJyArIChkb21QcmVmaXhlcykuam9pbih1Y1Byb3AgKyAnICcpICsgdWNQcm9wKS5zcGxpdCgnICcpO1xuICAgICAgICAgIHJldHVybiB0ZXN0RE9NUHJvcHMocHJvcHMsIHByZWZpeGVkLCBlbGVtKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKj4+dGVzdGFsbHByb3BzKi9cblxuXG4gICAgLyoqXG4gICAgICogVGVzdHNcbiAgICAgKiAtLS0tLVxuICAgICAqL1xuXG4gICAgLy8gVGhlICpuZXcqIGZsZXhib3hcbiAgICAvLyBkZXYudzMub3JnL2Nzc3dnL2NzczMtZmxleGJveFxuXG4gICAgdGVzdHNbJ2ZsZXhib3gnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRlc3RQcm9wc0FsbCgnZmxleFdyYXAnKTtcbiAgICB9O1xuXG4gICAgLy8gVGhlICpvbGQqIGZsZXhib3hcbiAgICAvLyB3d3cudzMub3JnL1RSLzIwMDkvV0QtY3NzMy1mbGV4Ym94LTIwMDkwNzIzL1xuXG4gICAgdGVzdHNbJ2ZsZXhib3hsZWdhY3knXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdib3hEaXJlY3Rpb24nKTtcbiAgICB9O1xuXG4gICAgLy8gT24gdGhlIFM2MCBhbmQgQkIgU3Rvcm0sIGdldENvbnRleHQgZXhpc3RzLCBidXQgYWx3YXlzIHJldHVybnMgdW5kZWZpbmVkXG4gICAgLy8gc28gd2UgYWN0dWFsbHkgaGF2ZSB0byBjYWxsIGdldENvbnRleHQoKSB0byB2ZXJpZnlcbiAgICAvLyBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzL2lzc3VlLzk3L1xuXG4gICAgdGVzdHNbJ2NhbnZhcyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIHJldHVybiAhIShlbGVtLmdldENvbnRleHQgJiYgZWxlbS5nZXRDb250ZXh0KCcyZCcpKTtcbiAgICB9O1xuXG4gICAgdGVzdHNbJ2NhbnZhc3RleHQnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gISEoTW9kZXJuaXpyWydjYW52YXMnXSAmJiBpcyhkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKS5nZXRDb250ZXh0KCcyZCcpLmZpbGxUZXh0LCAnZnVuY3Rpb24nKSk7XG4gICAgfTtcblxuICAgIC8vIHdlYmsuaXQvNzAxMTcgaXMgdHJhY2tpbmcgYSBsZWdpdCBXZWJHTCBmZWF0dXJlIGRldGVjdCBwcm9wb3NhbFxuXG4gICAgLy8gV2UgZG8gYSBzb2Z0IGRldGVjdCB3aGljaCBtYXkgZmFsc2UgcG9zaXRpdmUgaW4gb3JkZXIgdG8gYXZvaWRcbiAgICAvLyBhbiBleHBlbnNpdmUgY29udGV4dCBjcmVhdGlvbjogYnVnemlsLmxhLzczMjQ0MVxuXG4gICAgdGVzdHNbJ3dlYmdsJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICEhd2luZG93LldlYkdMUmVuZGVyaW5nQ29udGV4dDtcbiAgICB9O1xuXG4gICAgLypcbiAgICAgKiBUaGUgTW9kZXJuaXpyLnRvdWNoIHRlc3Qgb25seSBpbmRpY2F0ZXMgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHNcbiAgICAgKiAgICB0b3VjaCBldmVudHMsIHdoaWNoIGRvZXMgbm90IG5lY2Vzc2FyaWx5IHJlZmxlY3QgYSB0b3VjaHNjcmVlblxuICAgICAqICAgIGRldmljZSwgYXMgZXZpZGVuY2VkIGJ5IHRhYmxldHMgcnVubmluZyBXaW5kb3dzIDcgb3IsIGFsYXMsXG4gICAgICogICAgdGhlIFBhbG0gUHJlIC8gV2ViT1MgKHRvdWNoKSBwaG9uZXMuXG4gICAgICpcbiAgICAgKiBBZGRpdGlvbmFsbHksIENocm9tZSAoZGVza3RvcCkgdXNlZCB0byBsaWUgYWJvdXQgaXRzIHN1cHBvcnQgb24gdGhpcyxcbiAgICAgKiAgICBidXQgdGhhdCBoYXMgc2luY2UgYmVlbiByZWN0aWZpZWQ6IGNyYnVnLmNvbS8zNjQxNVxuICAgICAqXG4gICAgICogV2UgYWxzbyB0ZXN0IGZvciBGaXJlZm94IDQgTXVsdGl0b3VjaCBTdXBwb3J0LlxuICAgICAqXG4gICAgICogRm9yIG1vcmUgaW5mbywgc2VlOiBtb2Rlcm5penIuZ2l0aHViLmNvbS9Nb2Rlcm5penIvdG91Y2guaHRtbFxuICAgICAqL1xuXG4gICAgdGVzdHNbJ3RvdWNoJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGJvb2w7XG5cbiAgICAgICAgaWYoKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdykgfHwgd2luZG93LkRvY3VtZW50VG91Y2ggJiYgZG9jdW1lbnQgaW5zdGFuY2VvZiBEb2N1bWVudFRvdWNoKSB7XG4gICAgICAgICAgYm9vbCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW5qZWN0RWxlbWVudFdpdGhTdHlsZXMoWydAbWVkaWEgKCcscHJlZml4ZXMuam9pbigndG91Y2gtZW5hYmxlZCksKCcpLG1vZCwnKScsJ3sjbW9kZXJuaXpye3RvcDo5cHg7cG9zaXRpb246YWJzb2x1dGV9fSddLmpvaW4oJycpLCBmdW5jdGlvbiggbm9kZSApIHtcbiAgICAgICAgICAgIGJvb2wgPSBub2RlLm9mZnNldFRvcCA9PT0gOTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBib29sO1xuICAgIH07XG5cblxuICAgIC8vIGdlb2xvY2F0aW9uIGlzIG9mdGVuIGNvbnNpZGVyZWQgYSB0cml2aWFsIGZlYXR1cmUgZGV0ZWN0Li4uXG4gICAgLy8gVHVybnMgb3V0LCBpdCdzIHF1aXRlIHRyaWNreSB0byBnZXQgcmlnaHQ6XG4gICAgLy9cbiAgICAvLyBVc2luZyAhIW5hdmlnYXRvci5nZW9sb2NhdGlvbiBkb2VzIHR3byB0aGluZ3Mgd2UgZG9uJ3Qgd2FudC4gSXQ6XG4gICAgLy8gICAxLiBMZWFrcyBtZW1vcnkgaW4gSUU5OiBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzLzUxM1xuICAgIC8vICAgMi4gRGlzYWJsZXMgcGFnZSBjYWNoaW5nIGluIFdlYktpdDogd2Viay5pdC80Mzk1NlxuICAgIC8vXG4gICAgLy8gTWVhbndoaWxlLCBpbiBGaXJlZm94IDwgOCwgYW4gYWJvdXQ6Y29uZmlnIHNldHRpbmcgY291bGQgZXhwb3NlXG4gICAgLy8gYSBmYWxzZSBwb3NpdGl2ZSB0aGF0IHdvdWxkIHRocm93IGFuIGV4Y2VwdGlvbjogYnVnemlsLmxhLzY4ODE1OFxuXG4gICAgdGVzdHNbJ2dlb2xvY2F0aW9uJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICdnZW9sb2NhdGlvbicgaW4gbmF2aWdhdG9yO1xuICAgIH07XG5cblxuICAgIHRlc3RzWydwb3N0bWVzc2FnZSddID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gISF3aW5kb3cucG9zdE1lc3NhZ2U7XG4gICAgfTtcblxuXG4gICAgLy8gQ2hyb21lIGluY29nbml0byBtb2RlIHVzZWQgdG8gdGhyb3cgYW4gZXhjZXB0aW9uIHdoZW4gdXNpbmcgb3BlbkRhdGFiYXNlXG4gICAgLy8gSXQgZG9lc24ndCBhbnltb3JlLlxuICAgIHRlc3RzWyd3ZWJzcWxkYXRhYmFzZSddID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gISF3aW5kb3cub3BlbkRhdGFiYXNlO1xuICAgIH07XG5cbiAgICAvLyBWZW5kb3JzIGhhZCBpbmNvbnNpc3RlbnQgcHJlZml4aW5nIHdpdGggdGhlIGV4cGVyaW1lbnRhbCBJbmRleGVkIERCOlxuICAgIC8vIC0gV2Via2l0J3MgaW1wbGVtZW50YXRpb24gaXMgYWNjZXNzaWJsZSB0aHJvdWdoIHdlYmtpdEluZGV4ZWREQlxuICAgIC8vIC0gRmlyZWZveCBzaGlwcGVkIG1vel9pbmRleGVkREIgYmVmb3JlIEZGNGI5LCBidXQgc2luY2UgdGhlbiBoYXMgYmVlbiBtb3pJbmRleGVkREJcbiAgICAvLyBGb3Igc3BlZWQsIHdlIGRvbid0IHRlc3QgdGhlIGxlZ2FjeSAoYW5kIGJldGEtb25seSkgaW5kZXhlZERCXG4gICAgdGVzdHNbJ2luZGV4ZWREQiddID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gISF0ZXN0UHJvcHNBbGwoXCJpbmRleGVkREJcIiwgd2luZG93KTtcbiAgICB9O1xuXG4gICAgLy8gZG9jdW1lbnRNb2RlIGxvZ2ljIGZyb20gWVVJIHRvIGZpbHRlciBvdXQgSUU4IENvbXBhdCBNb2RlXG4gICAgLy8gICB3aGljaCBmYWxzZSBwb3NpdGl2ZXMuXG4gICAgdGVzdHNbJ2hhc2hjaGFuZ2UnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGlzRXZlbnRTdXBwb3J0ZWQoJ2hhc2hjaGFuZ2UnLCB3aW5kb3cpICYmIChkb2N1bWVudC5kb2N1bWVudE1vZGUgPT09IHVuZGVmaW5lZCB8fCBkb2N1bWVudC5kb2N1bWVudE1vZGUgPiA3KTtcbiAgICB9O1xuXG4gICAgLy8gUGVyIDEuNjpcbiAgICAvLyBUaGlzIHVzZWQgdG8gYmUgTW9kZXJuaXpyLmhpc3RvcnltYW5hZ2VtZW50IGJ1dCB0aGUgbG9uZ2VyXG4gICAgLy8gbmFtZSBoYXMgYmVlbiBkZXByZWNhdGVkIGluIGZhdm9yIG9mIGEgc2hvcnRlciBhbmQgcHJvcGVydHktbWF0Y2hpbmcgb25lLlxuICAgIC8vIFRoZSBvbGQgQVBJIGlzIHN0aWxsIGF2YWlsYWJsZSBpbiAxLjYsIGJ1dCBhcyBvZiAyLjAgd2lsbCB0aHJvdyBhIHdhcm5pbmcsXG4gICAgLy8gYW5kIGluIHRoZSBmaXJzdCByZWxlYXNlIHRoZXJlYWZ0ZXIgZGlzYXBwZWFyIGVudGlyZWx5LlxuICAgIHRlc3RzWydoaXN0b3J5J10gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAhISh3aW5kb3cuaGlzdG9yeSAmJiBoaXN0b3J5LnB1c2hTdGF0ZSk7XG4gICAgfTtcblxuICAgIHRlc3RzWydkcmFnYW5kZHJvcCddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgcmV0dXJuICgnZHJhZ2dhYmxlJyBpbiBkaXYpIHx8ICgnb25kcmFnc3RhcnQnIGluIGRpdiAmJiAnb25kcm9wJyBpbiBkaXYpO1xuICAgIH07XG5cbiAgICAvLyBGRjMuNiB3YXMgRU9MJ2VkIG9uIDQvMjQvMTIsIGJ1dCB0aGUgRVNSIHZlcnNpb24gb2YgRkYxMFxuICAgIC8vIHdpbGwgYmUgc3VwcG9ydGVkIHVudGlsIEZGMTkgKDIvMTIvMTMpLCBhdCB3aGljaCB0aW1lLCBFU1IgYmVjb21lcyBGRjE3LlxuICAgIC8vIEZGMTAgc3RpbGwgdXNlcyBwcmVmaXhlcywgc28gY2hlY2sgZm9yIGl0IHVudGlsIHRoZW4uXG4gICAgLy8gZm9yIG1vcmUgRVNSIGluZm8sIHNlZTogbW96aWxsYS5vcmcvZW4tVVMvZmlyZWZveC9vcmdhbml6YXRpb25zL2ZhcS9cbiAgICB0ZXN0c1snd2Vic29ja2V0cyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAnV2ViU29ja2V0JyBpbiB3aW5kb3cgfHwgJ01veldlYlNvY2tldCcgaW4gd2luZG93O1xuICAgIH07XG5cblxuICAgIC8vIGNzcy10cmlja3MuY29tL3JnYmEtYnJvd3Nlci1zdXBwb3J0L1xuICAgIHRlc3RzWydyZ2JhJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gU2V0IGFuIHJnYmEoKSBjb2xvciBhbmQgY2hlY2sgdGhlIHJldHVybmVkIHZhbHVlXG5cbiAgICAgICAgc2V0Q3NzKCdiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTUwLDI1NSwxNTAsLjUpJyk7XG5cbiAgICAgICAgcmV0dXJuIGNvbnRhaW5zKG1TdHlsZS5iYWNrZ3JvdW5kQ29sb3IsICdyZ2JhJyk7XG4gICAgfTtcblxuICAgIHRlc3RzWydoc2xhJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gU2FtZSBhcyByZ2JhKCksIGluIGZhY3QsIGJyb3dzZXJzIHJlLW1hcCBoc2xhKCkgdG8gcmdiYSgpIGludGVybmFsbHksXG4gICAgICAgIC8vICAgZXhjZXB0IElFOSB3aG8gcmV0YWlucyBpdCBhcyBoc2xhXG5cbiAgICAgICAgc2V0Q3NzKCdiYWNrZ3JvdW5kLWNvbG9yOmhzbGEoMTIwLDQwJSwxMDAlLC41KScpO1xuXG4gICAgICAgIHJldHVybiBjb250YWlucyhtU3R5bGUuYmFja2dyb3VuZENvbG9yLCAncmdiYScpIHx8IGNvbnRhaW5zKG1TdHlsZS5iYWNrZ3JvdW5kQ29sb3IsICdoc2xhJyk7XG4gICAgfTtcblxuICAgIHRlc3RzWydtdWx0aXBsZWJncyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFNldHRpbmcgbXVsdGlwbGUgaW1hZ2VzIEFORCBhIGNvbG9yIG9uIHRoZSBiYWNrZ3JvdW5kIHNob3J0aGFuZCBwcm9wZXJ0eVxuICAgICAgICAvLyAgYW5kIHRoZW4gcXVlcnlpbmcgdGhlIHN0eWxlLmJhY2tncm91bmQgcHJvcGVydHkgdmFsdWUgZm9yIHRoZSBudW1iZXIgb2ZcbiAgICAgICAgLy8gIG9jY3VycmVuY2VzIG9mIFwidXJsKFwiIGlzIGEgcmVsaWFibGUgbWV0aG9kIGZvciBkZXRlY3RpbmcgQUNUVUFMIHN1cHBvcnQgZm9yIHRoaXMhXG5cbiAgICAgICAgc2V0Q3NzKCdiYWNrZ3JvdW5kOnVybChodHRwczovLyksdXJsKGh0dHBzOi8vKSxyZWQgdXJsKGh0dHBzOi8vKScpO1xuXG4gICAgICAgIC8vIElmIHRoZSBVQSBzdXBwb3J0cyBtdWx0aXBsZSBiYWNrZ3JvdW5kcywgdGhlcmUgc2hvdWxkIGJlIHRocmVlIG9jY3VycmVuY2VzXG4gICAgICAgIC8vICAgb2YgdGhlIHN0cmluZyBcInVybChcIiBpbiB0aGUgcmV0dXJuIHZhbHVlIGZvciBlbGVtU3R5bGUuYmFja2dyb3VuZFxuXG4gICAgICAgIHJldHVybiAoLyh1cmxcXHMqXFwoLio/KXszfS8pLnRlc3QobVN0eWxlLmJhY2tncm91bmQpO1xuICAgIH07XG5cblxuXG4gICAgLy8gdGhpcyB3aWxsIGZhbHNlIHBvc2l0aXZlIGluIE9wZXJhIE1pbmlcbiAgICAvLyAgIGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvMzk2XG5cbiAgICB0ZXN0c1snYmFja2dyb3VuZHNpemUnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdiYWNrZ3JvdW5kU2l6ZScpO1xuICAgIH07XG5cbiAgICB0ZXN0c1snYm9yZGVyaW1hZ2UnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdib3JkZXJJbWFnZScpO1xuICAgIH07XG5cblxuICAgIC8vIFN1cGVyIGNvbXByZWhlbnNpdmUgdGFibGUgYWJvdXQgYWxsIHRoZSB1bmlxdWUgaW1wbGVtZW50YXRpb25zIG9mXG4gICAgLy8gYm9yZGVyLXJhZGl1czogbXVkZGxlZHJhbWJsaW5ncy5jb20vdGFibGUtb2YtY3NzMy1ib3JkZXItcmFkaXVzLWNvbXBsaWFuY2VcblxuICAgIHRlc3RzWydib3JkZXJyYWRpdXMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdib3JkZXJSYWRpdXMnKTtcbiAgICB9O1xuXG4gICAgLy8gV2ViT1MgdW5mb3J0dW5hdGVseSBmYWxzZSBwb3NpdGl2ZXMgb24gdGhpcyB0ZXN0LlxuICAgIHRlc3RzWydib3hzaGFkb3cnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdib3hTaGFkb3cnKTtcbiAgICB9O1xuXG4gICAgLy8gRkYzLjAgd2lsbCBmYWxzZSBwb3NpdGl2ZSBvbiB0aGlzIHRlc3RcbiAgICB0ZXN0c1sndGV4dHNoYWRvdyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKS5zdHlsZS50ZXh0U2hhZG93ID09PSAnJztcbiAgICB9O1xuXG5cbiAgICB0ZXN0c1snb3BhY2l0eSddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIEJyb3dzZXJzIHRoYXQgYWN0dWFsbHkgaGF2ZSBDU1MgT3BhY2l0eSBpbXBsZW1lbnRlZCBoYXZlIGRvbmUgc29cbiAgICAgICAgLy8gIGFjY29yZGluZyB0byBzcGVjLCB3aGljaCBtZWFucyB0aGVpciByZXR1cm4gdmFsdWVzIGFyZSB3aXRoaW4gdGhlXG4gICAgICAgIC8vICByYW5nZSBvZiBbMC4wLDEuMF0gLSBpbmNsdWRpbmcgdGhlIGxlYWRpbmcgemVyby5cblxuICAgICAgICBzZXRDc3NBbGwoJ29wYWNpdHk6LjU1Jyk7XG5cbiAgICAgICAgLy8gVGhlIG5vbi1saXRlcmFsIC4gaW4gdGhpcyByZWdleCBpcyBpbnRlbnRpb25hbDpcbiAgICAgICAgLy8gICBHZXJtYW4gQ2hyb21lIHJldHVybnMgdGhpcyB2YWx1ZSBhcyAwLDU1XG4gICAgICAgIC8vIGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvI2lzc3VlLzU5L2NvbW1lbnQvNTE2NjMyXG4gICAgICAgIHJldHVybiAoL14wLjU1JC8pLnRlc3QobVN0eWxlLm9wYWNpdHkpO1xuICAgIH07XG5cblxuICAgIC8vIE5vdGUsIEFuZHJvaWQgPCA0IHdpbGwgcGFzcyB0aGlzIHRlc3QsIGJ1dCBjYW4gb25seSBhbmltYXRlXG4gICAgLy8gICBhIHNpbmdsZSBwcm9wZXJ0eSBhdCBhIHRpbWVcbiAgICAvLyAgIGdvby5nbC92M1Y0R3BcbiAgICB0ZXN0c1snY3NzYW5pbWF0aW9ucyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0ZXN0UHJvcHNBbGwoJ2FuaW1hdGlvbk5hbWUnKTtcbiAgICB9O1xuXG5cbiAgICB0ZXN0c1snY3NzY29sdW1ucyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0ZXN0UHJvcHNBbGwoJ2NvbHVtbkNvdW50Jyk7XG4gICAgfTtcblxuXG4gICAgdGVzdHNbJ2Nzc2dyYWRpZW50cyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGb3IgQ1NTIEdyYWRpZW50cyBzeW50YXgsIHBsZWFzZSBzZWU6XG4gICAgICAgICAqIHdlYmtpdC5vcmcvYmxvZy8xNzUvaW50cm9kdWNpbmctY3NzLWdyYWRpZW50cy9cbiAgICAgICAgICogZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0NTUy8tbW96LWxpbmVhci1ncmFkaWVudFxuICAgICAgICAgKiBkZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vQ1NTLy1tb3otcmFkaWFsLWdyYWRpZW50XG4gICAgICAgICAqIGRldi53My5vcmcvY3Nzd2cvY3NzMy1pbWFnZXMvI2dyYWRpZW50cy1cbiAgICAgICAgICovXG5cbiAgICAgICAgdmFyIHN0cjEgPSAnYmFja2dyb3VuZC1pbWFnZTonLFxuICAgICAgICAgICAgc3RyMiA9ICdncmFkaWVudChsaW5lYXIsbGVmdCB0b3AscmlnaHQgYm90dG9tLGZyb20oIzlmOSksdG8od2hpdGUpKTsnLFxuICAgICAgICAgICAgc3RyMyA9ICdsaW5lYXItZ3JhZGllbnQobGVmdCB0b3AsIzlmOSwgd2hpdGUpOyc7XG5cbiAgICAgICAgc2V0Q3NzKFxuICAgICAgICAgICAgIC8vIGxlZ2FjeSB3ZWJraXQgc3ludGF4IChGSVhNRTogcmVtb3ZlIHdoZW4gc3ludGF4IG5vdCBpbiB1c2UgYW55bW9yZSlcbiAgICAgICAgICAgICAgKHN0cjEgKyAnLXdlYmtpdC0gJy5zcGxpdCgnICcpLmpvaW4oc3RyMiArIHN0cjEpICtcbiAgICAgICAgICAgICAvLyBzdGFuZGFyZCBzeW50YXggICAgICAgICAgICAgLy8gdHJhaWxpbmcgJ2JhY2tncm91bmQtaW1hZ2U6J1xuICAgICAgICAgICAgICBwcmVmaXhlcy5qb2luKHN0cjMgKyBzdHIxKSkuc2xpY2UoMCwgLXN0cjEubGVuZ3RoKVxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiBjb250YWlucyhtU3R5bGUuYmFja2dyb3VuZEltYWdlLCAnZ3JhZGllbnQnKTtcbiAgICB9O1xuXG5cbiAgICB0ZXN0c1snY3NzcmVmbGVjdGlvbnMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCdib3hSZWZsZWN0Jyk7XG4gICAgfTtcblxuXG4gICAgdGVzdHNbJ2Nzc3RyYW5zZm9ybXMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gISF0ZXN0UHJvcHNBbGwoJ3RyYW5zZm9ybScpO1xuICAgIH07XG5cblxuICAgIHRlc3RzWydjc3N0cmFuc2Zvcm1zM2QnXSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciByZXQgPSAhIXRlc3RQcm9wc0FsbCgncGVyc3BlY3RpdmUnKTtcblxuICAgICAgICAvLyBXZWJraXQncyAzRCB0cmFuc2Zvcm1zIGFyZSBwYXNzZWQgb2ZmIHRvIHRoZSBicm93c2VyJ3Mgb3duIGdyYXBoaWNzIHJlbmRlcmVyLlxuICAgICAgICAvLyAgIEl0IHdvcmtzIGZpbmUgaW4gU2FmYXJpIG9uIExlb3BhcmQgYW5kIFNub3cgTGVvcGFyZCwgYnV0IG5vdCBpbiBDaHJvbWUgaW5cbiAgICAgICAgLy8gICBzb21lIGNvbmRpdGlvbnMuIEFzIGEgcmVzdWx0LCBXZWJraXQgdHlwaWNhbGx5IHJlY29nbml6ZXMgdGhlIHN5bnRheCBidXRcbiAgICAgICAgLy8gICB3aWxsIHNvbWV0aW1lcyB0aHJvdyBhIGZhbHNlIHBvc2l0aXZlLCB0aHVzIHdlIG11c3QgZG8gYSBtb3JlIHRob3JvdWdoIGNoZWNrOlxuICAgICAgICBpZiAoIHJldCAmJiAnd2Via2l0UGVyc3BlY3RpdmUnIGluIGRvY0VsZW1lbnQuc3R5bGUgKSB7XG5cbiAgICAgICAgICAvLyBXZWJraXQgYWxsb3dzIHRoaXMgbWVkaWEgcXVlcnkgdG8gc3VjY2VlZCBvbmx5IGlmIHRoZSBmZWF0dXJlIGlzIGVuYWJsZWQuXG4gICAgICAgICAgLy8gYEBtZWRpYSAodHJhbnNmb3JtLTNkKSwoLXdlYmtpdC10cmFuc2Zvcm0tM2QpeyAuLi4gfWBcbiAgICAgICAgICBpbmplY3RFbGVtZW50V2l0aFN0eWxlcygnQG1lZGlhICh0cmFuc2Zvcm0tM2QpLCgtd2Via2l0LXRyYW5zZm9ybS0zZCl7I21vZGVybml6cntsZWZ0OjlweDtwb3NpdGlvbjphYnNvbHV0ZTtoZWlnaHQ6M3B4O319JywgZnVuY3Rpb24oIG5vZGUsIHJ1bGUgKSB7XG4gICAgICAgICAgICByZXQgPSBub2RlLm9mZnNldExlZnQgPT09IDkgJiYgbm9kZS5vZmZzZXRIZWlnaHQgPT09IDM7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9O1xuXG5cbiAgICB0ZXN0c1snY3NzdHJhbnNpdGlvbnMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzQWxsKCd0cmFuc2l0aW9uJyk7XG4gICAgfTtcblxuXG4gICAgLyo+PmZvbnRmYWNlKi9cbiAgICAvLyBAZm9udC1mYWNlIGRldGVjdGlvbiByb3V0aW5lIGJ5IERpZWdvIFBlcmluaVxuICAgIC8vIGphdmFzY3JpcHQubndib3guY29tL0NTU1N1cHBvcnQvXG5cbiAgICAvLyBmYWxzZSBwb3NpdGl2ZXM6XG4gICAgLy8gICBXZWJPUyBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzLzM0MlxuICAgIC8vICAgV1A3ICAgZ2l0aHViLmNvbS9Nb2Rlcm5penIvTW9kZXJuaXpyL2lzc3Vlcy81MzhcbiAgICB0ZXN0c1snZm9udGZhY2UnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYm9vbDtcblxuICAgICAgICBpbmplY3RFbGVtZW50V2l0aFN0eWxlcygnQGZvbnQtZmFjZSB7Zm9udC1mYW1pbHk6XCJmb250XCI7c3JjOnVybChcImh0dHBzOi8vXCIpfScsIGZ1bmN0aW9uKCBub2RlLCBydWxlICkge1xuICAgICAgICAgIHZhciBzdHlsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzbW9kZXJuaXpyJyksXG4gICAgICAgICAgICAgIHNoZWV0ID0gc3R5bGUuc2hlZXQgfHwgc3R5bGUuc3R5bGVTaGVldCxcbiAgICAgICAgICAgICAgY3NzVGV4dCA9IHNoZWV0ID8gKHNoZWV0LmNzc1J1bGVzICYmIHNoZWV0LmNzc1J1bGVzWzBdID8gc2hlZXQuY3NzUnVsZXNbMF0uY3NzVGV4dCA6IHNoZWV0LmNzc1RleHQgfHwgJycpIDogJyc7XG5cbiAgICAgICAgICBib29sID0gL3NyYy9pLnRlc3QoY3NzVGV4dCkgJiYgY3NzVGV4dC5pbmRleE9mKHJ1bGUuc3BsaXQoJyAnKVswXSkgPT09IDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBib29sO1xuICAgIH07XG4gICAgLyo+PmZvbnRmYWNlKi9cblxuICAgIC8vIENTUyBnZW5lcmF0ZWQgY29udGVudCBkZXRlY3Rpb25cbiAgICB0ZXN0c1snZ2VuZXJhdGVkY29udGVudCddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBib29sO1xuXG4gICAgICAgIGluamVjdEVsZW1lbnRXaXRoU3R5bGVzKFsnIycsbW9kLCd7Zm9udDowLzAgYX0jJyxtb2QsJzphZnRlcntjb250ZW50OlwiJyxzbWlsZSwnXCI7dmlzaWJpbGl0eTpoaWRkZW47Zm9udDozcHgvMSBhfSddLmpvaW4oJycpLCBmdW5jdGlvbiggbm9kZSApIHtcbiAgICAgICAgICBib29sID0gbm9kZS5vZmZzZXRIZWlnaHQgPj0gMztcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGJvb2w7XG4gICAgfTtcblxuXG5cbiAgICAvLyBUaGVzZSB0ZXN0cyBldmFsdWF0ZSBzdXBwb3J0IG9mIHRoZSB2aWRlby9hdWRpbyBlbGVtZW50cywgYXMgd2VsbCBhc1xuICAgIC8vIHRlc3Rpbmcgd2hhdCB0eXBlcyBvZiBjb250ZW50IHRoZXkgc3VwcG9ydC5cbiAgICAvL1xuICAgIC8vIFdlJ3JlIHVzaW5nIHRoZSBCb29sZWFuIGNvbnN0cnVjdG9yIGhlcmUsIHNvIHRoYXQgd2UgY2FuIGV4dGVuZCB0aGUgdmFsdWVcbiAgICAvLyBlLmcuICBNb2Rlcm5penIudmlkZW8gICAgIC8vIHRydWVcbiAgICAvLyAgICAgICBNb2Rlcm5penIudmlkZW8ub2dnIC8vICdwcm9iYWJseSdcbiAgICAvL1xuICAgIC8vIENvZGVjIHZhbHVlcyBmcm9tIDogZ2l0aHViLmNvbS9OaWVsc0xlZW5oZWVyL2h0bWw1dGVzdC9ibG9iLzkxMDZhOC9pbmRleC5odG1sI0w4NDVcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHRoeCB0byBOaWVsc0xlZW5oZWVyIGFuZCB6Y29ycGFuXG5cbiAgICAvLyBOb3RlOiBpbiBzb21lIG9sZGVyIGJyb3dzZXJzLCBcIm5vXCIgd2FzIGEgcmV0dXJuIHZhbHVlIGluc3RlYWQgb2YgZW1wdHkgc3RyaW5nLlxuICAgIC8vICAgSXQgd2FzIGxpdmUgaW4gRkYzLjUuMCBhbmQgMy41LjEsIGJ1dCBmaXhlZCBpbiAzLjUuMlxuICAgIC8vICAgSXQgd2FzIGFsc28gbGl2ZSBpbiBTYWZhcmkgNC4wLjAgLSA0LjAuNCwgYnV0IGZpeGVkIGluIDQuMC41XG5cbiAgICB0ZXN0c1sndmlkZW8nXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJyksXG4gICAgICAgICAgICBib29sID0gZmFsc2U7XG5cbiAgICAgICAgLy8gSUU5IFJ1bm5pbmcgb24gV2luZG93cyBTZXJ2ZXIgU0tVIGNhbiBjYXVzZSBhbiBleGNlcHRpb24gdG8gYmUgdGhyb3duLCBidWcgIzIyNFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCBib29sID0gISFlbGVtLmNhblBsYXlUeXBlICkge1xuICAgICAgICAgICAgICAgIGJvb2wgICAgICA9IG5ldyBCb29sZWFuKGJvb2wpO1xuICAgICAgICAgICAgICAgIGJvb2wub2dnICA9IGVsZW0uY2FuUGxheVR5cGUoJ3ZpZGVvL29nZzsgY29kZWNzPVwidGhlb3JhXCInKSAgICAgIC5yZXBsYWNlKC9ebm8kLywnJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBXaXRob3V0IFF1aWNrVGltZSwgdGhpcyB2YWx1ZSB3aWxsIGJlIGB1bmRlZmluZWRgLiBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzLzU0NlxuICAgICAgICAgICAgICAgIGJvb2wuaDI2NCA9IGVsZW0uY2FuUGxheVR5cGUoJ3ZpZGVvL21wNDsgY29kZWNzPVwiYXZjMS40MkUwMUVcIicpIC5yZXBsYWNlKC9ebm8kLywnJyk7XG5cbiAgICAgICAgICAgICAgICBib29sLndlYm0gPSBlbGVtLmNhblBsYXlUeXBlKCd2aWRlby93ZWJtOyBjb2RlY3M9XCJ2cDgsIHZvcmJpc1wiJykucmVwbGFjZSgvXm5vJC8sJycpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gY2F0Y2goZSkgeyB9XG5cbiAgICAgICAgcmV0dXJuIGJvb2w7XG4gICAgfTtcblxuICAgIHRlc3RzWydhdWRpbyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXVkaW8nKSxcbiAgICAgICAgICAgIGJvb2wgPSBmYWxzZTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCBib29sID0gISFlbGVtLmNhblBsYXlUeXBlICkge1xuICAgICAgICAgICAgICAgIGJvb2wgICAgICA9IG5ldyBCb29sZWFuKGJvb2wpO1xuICAgICAgICAgICAgICAgIGJvb2wub2dnICA9IGVsZW0uY2FuUGxheVR5cGUoJ2F1ZGlvL29nZzsgY29kZWNzPVwidm9yYmlzXCInKS5yZXBsYWNlKC9ebm8kLywnJyk7XG4gICAgICAgICAgICAgICAgYm9vbC5tcDMgID0gZWxlbS5jYW5QbGF5VHlwZSgnYXVkaW8vbXBlZzsnKSAgICAgICAgICAgICAgIC5yZXBsYWNlKC9ebm8kLywnJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBNaW1ldHlwZXMgYWNjZXB0ZWQ6XG4gICAgICAgICAgICAgICAgLy8gICBkZXZlbG9wZXIubW96aWxsYS5vcmcvRW4vTWVkaWFfZm9ybWF0c19zdXBwb3J0ZWRfYnlfdGhlX2F1ZGlvX2FuZF92aWRlb19lbGVtZW50c1xuICAgICAgICAgICAgICAgIC8vICAgYml0Lmx5L2lwaG9uZW9zY29kZWNzXG4gICAgICAgICAgICAgICAgYm9vbC53YXYgID0gZWxlbS5jYW5QbGF5VHlwZSgnYXVkaW8vd2F2OyBjb2RlY3M9XCIxXCInKSAgICAgLnJlcGxhY2UoL15ubyQvLCcnKTtcbiAgICAgICAgICAgICAgICBib29sLm00YSAgPSAoIGVsZW0uY2FuUGxheVR5cGUoJ2F1ZGlvL3gtbTRhOycpICAgICAgICAgICAgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uY2FuUGxheVR5cGUoJ2F1ZGlvL2FhYzsnKSkgICAgICAgICAgICAgLnJlcGxhY2UoL15ubyQvLCcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaChlKSB7IH1cblxuICAgICAgICByZXR1cm4gYm9vbDtcbiAgICB9O1xuXG5cbiAgICAvLyBJbiBGRjQsIGlmIGRpc2FibGVkLCB3aW5kb3cubG9jYWxTdG9yYWdlIHNob3VsZCA9PT0gbnVsbC5cblxuICAgIC8vIE5vcm1hbGx5LCB3ZSBjb3VsZCBub3QgdGVzdCB0aGF0IGRpcmVjdGx5IGFuZCBuZWVkIHRvIGRvIGFcbiAgICAvLyAgIGAoJ2xvY2FsU3RvcmFnZScgaW4gd2luZG93KSAmJiBgIHRlc3QgZmlyc3QgYmVjYXVzZSBvdGhlcndpc2UgRmlyZWZveCB3aWxsXG4gICAgLy8gICB0aHJvdyBidWd6aWwubGEvMzY1NzcyIGlmIGNvb2tpZXMgYXJlIGRpc2FibGVkXG5cbiAgICAvLyBBbHNvIGluIGlPUzUgUHJpdmF0ZSBCcm93c2luZyBtb2RlLCBhdHRlbXB0aW5nIHRvIHVzZSBsb2NhbFN0b3JhZ2Uuc2V0SXRlbVxuICAgIC8vIHdpbGwgdGhyb3cgdGhlIGV4Y2VwdGlvbjpcbiAgICAvLyAgIFFVT1RBX0VYQ0VFREVEX0VSUlJPUiBET00gRXhjZXB0aW9uIDIyLlxuICAgIC8vIFBlY3VsaWFybHksIGdldEl0ZW0gYW5kIHJlbW92ZUl0ZW0gY2FsbHMgZG8gbm90IHRocm93LlxuXG4gICAgLy8gQmVjYXVzZSB3ZSBhcmUgZm9yY2VkIHRvIHRyeS9jYXRjaCB0aGlzLCB3ZSdsbCBnbyBhZ2dyZXNzaXZlLlxuXG4gICAgLy8gSnVzdCBGV0lXOiBJRTggQ29tcGF0IG1vZGUgc3VwcG9ydHMgdGhlc2UgZmVhdHVyZXMgY29tcGxldGVseTpcbiAgICAvLyAgIHd3dy5xdWlya3Ntb2RlLm9yZy9kb20vaHRtbDUuaHRtbFxuICAgIC8vIEJ1dCBJRTggZG9lc24ndCBzdXBwb3J0IGVpdGhlciB3aXRoIGxvY2FsIGZpbGVzXG5cbiAgICB0ZXN0c1snbG9jYWxzdG9yYWdlJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKG1vZCwgbW9kKTtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKG1vZCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdGVzdHNbJ3Nlc3Npb25zdG9yYWdlJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0obW9kLCBtb2QpO1xuICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShtb2QpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgdGVzdHNbJ3dlYndvcmtlcnMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gISF3aW5kb3cuV29ya2VyO1xuICAgIH07XG5cblxuICAgIHRlc3RzWydhcHBsaWNhdGlvbmNhY2hlJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICEhd2luZG93LmFwcGxpY2F0aW9uQ2FjaGU7XG4gICAgfTtcblxuXG4gICAgLy8gVGhhbmtzIHRvIEVyaWsgRGFobHN0cm9tXG4gICAgdGVzdHNbJ3N2ZyddID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAhIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyAmJiAhIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhucy5zdmcsICdzdmcnKS5jcmVhdGVTVkdSZWN0O1xuICAgIH07XG5cbiAgICAvLyBzcGVjaWZpY2FsbHkgZm9yIFNWRyBpbmxpbmUgaW4gSFRNTCwgbm90IHdpdGhpbiBYSFRNTFxuICAgIC8vIHRlc3QgcGFnZTogcGF1bGlyaXNoLmNvbS9kZW1vL2lubGluZS1zdmdcbiAgICB0ZXN0c1snaW5saW5lc3ZnJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIGRpdi5pbm5lckhUTUwgPSAnPHN2Zy8+JztcbiAgICAgIHJldHVybiAoZGl2LmZpcnN0Q2hpbGQgJiYgZGl2LmZpcnN0Q2hpbGQubmFtZXNwYWNlVVJJKSA9PSBucy5zdmc7XG4gICAgfTtcblxuICAgIC8vIFNWRyBTTUlMIGFuaW1hdGlvblxuICAgIHRlc3RzWydzbWlsJ10gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICEhZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TICYmIC9TVkdBbmltYXRlLy50ZXN0KHRvU3RyaW5nLmNhbGwoZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5zLnN2ZywgJ2FuaW1hdGUnKSkpO1xuICAgIH07XG5cbiAgICAvLyBUaGlzIHRlc3QgaXMgb25seSBmb3IgY2xpcCBwYXRocyBpbiBTVkcgcHJvcGVyLCBub3QgY2xpcCBwYXRocyBvbiBIVE1MIGNvbnRlbnRcbiAgICAvLyBkZW1vOiBzcnVmYWN1bHR5LnNydS5lZHUvZGF2aWQuZGFpbGV5L3N2Zy9uZXdzdHVmZi9jbGlwUGF0aDQuc3ZnXG5cbiAgICAvLyBIb3dldmVyIHJlYWQgdGhlIGNvbW1lbnRzIHRvIGRpZyBpbnRvIGFwcGx5aW5nIFNWRyBjbGlwcGF0aHMgdG8gSFRNTCBjb250ZW50IGhlcmU6XG4gICAgLy8gICBnaXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvaXNzdWVzLzIxMyNpc3N1ZWNvbW1lbnQtMTE0OTQ5MVxuICAgIHRlc3RzWydzdmdjbGlwcGF0aHMnXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gISFkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMgJiYgL1NWR0NsaXBQYXRoLy50ZXN0KHRvU3RyaW5nLmNhbGwoZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5zLnN2ZywgJ2NsaXBQYXRoJykpKTtcbiAgICB9O1xuXG4gICAgLyo+PndlYmZvcm1zKi9cbiAgICAvLyBpbnB1dCBmZWF0dXJlcyBhbmQgaW5wdXQgdHlwZXMgZ28gZGlyZWN0bHkgb250byB0aGUgcmV0IG9iamVjdCwgYnlwYXNzaW5nIHRoZSB0ZXN0cyBsb29wLlxuICAgIC8vIEhvbGQgdGhpcyBndXkgdG8gZXhlY3V0ZSBpbiBhIG1vbWVudC5cbiAgICBmdW5jdGlvbiB3ZWJmb3JtcygpIHtcbiAgICAgICAgLyo+PmlucHV0Ki9cbiAgICAgICAgLy8gUnVuIHRocm91Z2ggSFRNTDUncyBuZXcgaW5wdXQgYXR0cmlidXRlcyB0byBzZWUgaWYgdGhlIFVBIHVuZGVyc3RhbmRzIGFueS5cbiAgICAgICAgLy8gV2UncmUgdXNpbmcgZiB3aGljaCBpcyB0aGUgPGlucHV0PiBlbGVtZW50IGNyZWF0ZWQgZWFybHkgb25cbiAgICAgICAgLy8gTWlrZSBUYXlsciBoYXMgY3JlYXRlZCBhIGNvbXByZWhlbnNpdmUgcmVzb3VyY2UgZm9yIHRlc3RpbmcgdGhlc2UgYXR0cmlidXRlc1xuICAgICAgICAvLyAgIHdoZW4gYXBwbGllZCB0byBhbGwgaW5wdXQgdHlwZXM6XG4gICAgICAgIC8vICAgbWlrZXRheWxyLmNvbS9jb2RlL2lucHV0LXR5cGUtYXR0ci5odG1sXG4gICAgICAgIC8vIHNwZWM6IHd3dy53aGF0d2cub3JnL3NwZWNzL3dlYi1hcHBzL2N1cnJlbnQtd29yay9tdWx0aXBhZ2UvdGhlLWlucHV0LWVsZW1lbnQuaHRtbCNpbnB1dC10eXBlLWF0dHItc3VtbWFyeVxuXG4gICAgICAgIC8vIE9ubHkgaW5wdXQgcGxhY2Vob2xkZXIgaXMgdGVzdGVkIHdoaWxlIHRleHRhcmVhJ3MgcGxhY2Vob2xkZXIgaXMgbm90LlxuICAgICAgICAvLyBDdXJyZW50bHkgU2FmYXJpIDQgYW5kIE9wZXJhIDExIGhhdmUgc3VwcG9ydCBvbmx5IGZvciB0aGUgaW5wdXQgcGxhY2Vob2xkZXJcbiAgICAgICAgLy8gQm90aCB0ZXN0cyBhcmUgYXZhaWxhYmxlIGluIGZlYXR1cmUtZGV0ZWN0cy9mb3Jtcy1wbGFjZWhvbGRlci5qc1xuICAgICAgICBNb2Rlcm5penJbJ2lucHV0J10gPSAoZnVuY3Rpb24oIHByb3BzICkge1xuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsZW4gPSBwcm9wcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgICAgICAgICAgICBhdHRyc1sgcHJvcHNbaV0gXSA9ICEhKHByb3BzW2ldIGluIGlucHV0RWxlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXR0cnMubGlzdCl7XG4gICAgICAgICAgICAgIC8vIHNhZmFyaSBmYWxzZSBwb3NpdGl2ZSdzIG9uIGRhdGFsaXN0OiB3ZWJrLml0Lzc0MjUyXG4gICAgICAgICAgICAgIC8vIHNlZSBhbHNvIGdpdGh1Yi5jb20vTW9kZXJuaXpyL01vZGVybml6ci9pc3N1ZXMvMTQ2XG4gICAgICAgICAgICAgIGF0dHJzLmxpc3QgPSAhIShkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkYXRhbGlzdCcpICYmIHdpbmRvdy5IVE1MRGF0YUxpc3RFbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhdHRycztcbiAgICAgICAgfSkoJ2F1dG9jb21wbGV0ZSBhdXRvZm9jdXMgbGlzdCBwbGFjZWhvbGRlciBtYXggbWluIG11bHRpcGxlIHBhdHRlcm4gcmVxdWlyZWQgc3RlcCcuc3BsaXQoJyAnKSk7XG4gICAgICAgIC8qPj5pbnB1dCovXG5cbiAgICAgICAgLyo+PmlucHV0dHlwZXMqL1xuICAgICAgICAvLyBSdW4gdGhyb3VnaCBIVE1MNSdzIG5ldyBpbnB1dCB0eXBlcyB0byBzZWUgaWYgdGhlIFVBIHVuZGVyc3RhbmRzIGFueS5cbiAgICAgICAgLy8gICBUaGlzIGlzIHB1dCBiZWhpbmQgdGhlIHRlc3RzIHJ1bmxvb3AgYmVjYXVzZSBpdCBkb2Vzbid0IHJldHVybiBhXG4gICAgICAgIC8vICAgdHJ1ZS9mYWxzZSBsaWtlIGFsbCB0aGUgb3RoZXIgdGVzdHM7IGluc3RlYWQsIGl0IHJldHVybnMgYW4gb2JqZWN0XG4gICAgICAgIC8vICAgY29udGFpbmluZyBlYWNoIGlucHV0IHR5cGUgd2l0aCBpdHMgY29ycmVzcG9uZGluZyB0cnVlL2ZhbHNlIHZhbHVlXG5cbiAgICAgICAgLy8gQmlnIHRoYW5rcyB0byBAbWlrZXRheWxyIGZvciB0aGUgaHRtbDUgZm9ybXMgZXhwZXJ0aXNlLiBtaWtldGF5bHIuY29tL1xuICAgICAgICBNb2Rlcm5penJbJ2lucHV0dHlwZXMnXSA9IChmdW5jdGlvbihwcm9wcykge1xuXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGJvb2wsIGlucHV0RWxlbVR5cGUsIGRlZmF1bHRWaWV3LCBsZW4gPSBwcm9wcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblxuICAgICAgICAgICAgICAgIGlucHV0RWxlbS5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCBpbnB1dEVsZW1UeXBlID0gcHJvcHNbaV0pO1xuICAgICAgICAgICAgICAgIGJvb2wgPSBpbnB1dEVsZW0udHlwZSAhPT0gJ3RleHQnO1xuXG4gICAgICAgICAgICAgICAgLy8gV2UgZmlyc3QgY2hlY2sgdG8gc2VlIGlmIHRoZSB0eXBlIHdlIGdpdmUgaXQgc3RpY2tzLi5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgdHlwZSBkb2VzLCB3ZSBmZWVkIGl0IGEgdGV4dHVhbCB2YWx1ZSwgd2hpY2ggc2hvdWxkbid0IGJlIHZhbGlkLlxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSB2YWx1ZSBkb2Vzbid0IHN0aWNrLCB3ZSBrbm93IHRoZXJlJ3MgaW5wdXQgc2FuaXRpemF0aW9uIHdoaWNoIGluZmVycyBhIGN1c3RvbSBVSVxuICAgICAgICAgICAgICAgIGlmICggYm9vbCApIHtcblxuICAgICAgICAgICAgICAgICAgICBpbnB1dEVsZW0udmFsdWUgICAgICAgICA9IHNtaWxlO1xuICAgICAgICAgICAgICAgICAgICBpbnB1dEVsZW0uc3R5bGUuY3NzVGV4dCA9ICdwb3NpdGlvbjphYnNvbHV0ZTt2aXNpYmlsaXR5OmhpZGRlbjsnO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICggL15yYW5nZSQvLnRlc3QoaW5wdXRFbGVtVHlwZSkgJiYgaW5wdXRFbGVtLnN0eWxlLldlYmtpdEFwcGVhcmFuY2UgIT09IHVuZGVmaW5lZCApIHtcblxuICAgICAgICAgICAgICAgICAgICAgIGRvY0VsZW1lbnQuYXBwZW5kQ2hpbGQoaW5wdXRFbGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0VmlldyA9IGRvY3VtZW50LmRlZmF1bHRWaWV3O1xuXG4gICAgICAgICAgICAgICAgICAgICAgLy8gU2FmYXJpIDItNCBhbGxvd3MgdGhlIHNtaWxleSBhcyBhIHZhbHVlLCBkZXNwaXRlIG1ha2luZyBhIHNsaWRlclxuICAgICAgICAgICAgICAgICAgICAgIGJvb2wgPSAgZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShpbnB1dEVsZW0sIG51bGwpLldlYmtpdEFwcGVhcmFuY2UgIT09ICd0ZXh0ZmllbGQnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNb2JpbGUgYW5kcm9pZCB3ZWIgYnJvd3NlciBoYXMgZmFsc2UgcG9zaXRpdmUsIHNvIG11c3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIHRoZSBoZWlnaHQgdG8gc2VlIGlmIHRoZSB3aWRnZXQgaXMgYWN0dWFsbHkgdGhlcmUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaW5wdXRFbGVtLm9mZnNldEhlaWdodCAhPT0gMCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICBkb2NFbGVtZW50LnJlbW92ZUNoaWxkKGlucHV0RWxlbSk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICggL14oc2VhcmNofHRlbCkkLy50ZXN0KGlucHV0RWxlbVR5cGUpICl7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gU3BlYyBkb2Vzbid0IGRlZmluZSBhbnkgc3BlY2lhbCBwYXJzaW5nIG9yIGRldGVjdGFibGUgVUlcbiAgICAgICAgICAgICAgICAgICAgICAvLyAgIGJlaGF2aW9ycyBzbyB3ZSBwYXNzIHRoZXNlIHRocm91Z2ggYXMgdHJ1ZVxuXG4gICAgICAgICAgICAgICAgICAgICAgLy8gSW50ZXJlc3RpbmdseSwgb3BlcmEgZmFpbHMgdGhlIGVhcmxpZXIgdGVzdCwgc28gaXQgZG9lc24ndFxuICAgICAgICAgICAgICAgICAgICAgIC8vICBldmVuIG1ha2UgaXQgaGVyZS5cblxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCAvXih1cmx8ZW1haWwpJC8udGVzdChpbnB1dEVsZW1UeXBlKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBSZWFsIHVybCBhbmQgZW1haWwgc3VwcG9ydCBjb21lcyB3aXRoIHByZWJha2VkIHZhbGlkYXRpb24uXG4gICAgICAgICAgICAgICAgICAgICAgYm9vbCA9IGlucHV0RWxlbS5jaGVja1ZhbGlkaXR5ICYmIGlucHV0RWxlbS5jaGVja1ZhbGlkaXR5KCkgPT09IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIHVwZ3JhZGVkIGlucHV0IGNvbXBvbnRlbnQgcmVqZWN0cyB0aGUgOikgdGV4dCwgd2UgZ290IGEgd2lubmVyXG4gICAgICAgICAgICAgICAgICAgICAgYm9vbCA9IGlucHV0RWxlbS52YWx1ZSAhPSBzbWlsZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlucHV0c1sgcHJvcHNbaV0gXSA9ICEhYm9vbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpbnB1dHM7XG4gICAgICAgIH0pKCdzZWFyY2ggdGVsIHVybCBlbWFpbCBkYXRldGltZSBkYXRlIG1vbnRoIHdlZWsgdGltZSBkYXRldGltZS1sb2NhbCBudW1iZXIgcmFuZ2UgY29sb3InLnNwbGl0KCcgJykpO1xuICAgICAgICAvKj4+aW5wdXR0eXBlcyovXG4gICAgfVxuICAgIC8qPj53ZWJmb3JtcyovXG5cblxuICAgIC8vIEVuZCBvZiB0ZXN0IGRlZmluaXRpb25zXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXG5cbiAgICAvLyBSdW4gdGhyb3VnaCBhbGwgdGVzdHMgYW5kIGRldGVjdCB0aGVpciBzdXBwb3J0IGluIHRoZSBjdXJyZW50IFVBLlxuICAgIC8vIHRvZG86IGh5cG90aGV0aWNhbGx5IHdlIGNvdWxkIGJlIGRvaW5nIGFuIGFycmF5IG9mIHRlc3RzIGFuZCB1c2UgYSBiYXNpYyBsb29wIGhlcmUuXG4gICAgZm9yICggdmFyIGZlYXR1cmUgaW4gdGVzdHMgKSB7XG4gICAgICAgIGlmICggaGFzT3duUHJvcCh0ZXN0cywgZmVhdHVyZSkgKSB7XG4gICAgICAgICAgICAvLyBydW4gdGhlIHRlc3QsIHRocm93IHRoZSByZXR1cm4gdmFsdWUgaW50byB0aGUgTW9kZXJuaXpyLFxuICAgICAgICAgICAgLy8gICB0aGVuIGJhc2VkIG9uIHRoYXQgYm9vbGVhbiwgZGVmaW5lIGFuIGFwcHJvcHJpYXRlIGNsYXNzTmFtZVxuICAgICAgICAgICAgLy8gICBhbmQgcHVzaCBpdCBpbnRvIGFuIGFycmF5IG9mIGNsYXNzZXMgd2UnbGwgam9pbiBsYXRlci5cbiAgICAgICAgICAgIGZlYXR1cmVOYW1lICA9IGZlYXR1cmUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIE1vZGVybml6cltmZWF0dXJlTmFtZV0gPSB0ZXN0c1tmZWF0dXJlXSgpO1xuXG4gICAgICAgICAgICBjbGFzc2VzLnB1c2goKE1vZGVybml6cltmZWF0dXJlTmFtZV0gPyAnJyA6ICduby0nKSArIGZlYXR1cmVOYW1lKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qPj53ZWJmb3JtcyovXG4gICAgLy8gaW5wdXQgdGVzdHMgbmVlZCB0byBydW4uXG4gICAgTW9kZXJuaXpyLmlucHV0IHx8IHdlYmZvcm1zKCk7XG4gICAgLyo+PndlYmZvcm1zKi9cblxuXG4gICAgLyoqXG4gICAgICogYWRkVGVzdCBhbGxvd3MgdGhlIHVzZXIgdG8gZGVmaW5lIHRoZWlyIG93biBmZWF0dXJlIHRlc3RzXG4gICAgICogdGhlIHJlc3VsdCB3aWxsIGJlIGFkZGVkIG9udG8gdGhlIE1vZGVybml6ciBvYmplY3QsXG4gICAgICogYXMgd2VsbCBhcyBhbiBhcHByb3ByaWF0ZSBjbGFzc05hbWUgc2V0IG9uIHRoZSBodG1sIGVsZW1lbnRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBmZWF0dXJlIC0gU3RyaW5nIG5hbWluZyB0aGUgZmVhdHVyZVxuICAgICAqIEBwYXJhbSB0ZXN0IC0gRnVuY3Rpb24gcmV0dXJuaW5nIHRydWUgaWYgZmVhdHVyZSBpcyBzdXBwb3J0ZWQsIGZhbHNlIGlmIG5vdFxuICAgICAqL1xuICAgICBNb2Rlcm5penIuYWRkVGVzdCA9IGZ1bmN0aW9uICggZmVhdHVyZSwgdGVzdCApIHtcbiAgICAgICBpZiAoIHR5cGVvZiBmZWF0dXJlID09ICdvYmplY3QnICkge1xuICAgICAgICAgZm9yICggdmFyIGtleSBpbiBmZWF0dXJlICkge1xuICAgICAgICAgICBpZiAoIGhhc093blByb3AoIGZlYXR1cmUsIGtleSApICkge1xuICAgICAgICAgICAgIE1vZGVybml6ci5hZGRUZXN0KCBrZXksIGZlYXR1cmVbIGtleSBdICk7XG4gICAgICAgICAgIH1cbiAgICAgICAgIH1cbiAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICBmZWF0dXJlID0gZmVhdHVyZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICBpZiAoIE1vZGVybml6cltmZWF0dXJlXSAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAvLyB3ZSdyZSBnb2luZyB0byBxdWl0IGlmIHlvdSdyZSB0cnlpbmcgdG8gb3ZlcndyaXRlIGFuIGV4aXN0aW5nIHRlc3RcbiAgICAgICAgICAgLy8gaWYgd2Ugd2VyZSB0byBhbGxvdyBpdCwgd2UnZCBkbyB0aGlzOlxuICAgICAgICAgICAvLyAgIHZhciByZSA9IG5ldyBSZWdFeHAoXCJcXFxcYihuby0pP1wiICsgZmVhdHVyZSArIFwiXFxcXGJcIik7XG4gICAgICAgICAgIC8vICAgZG9jRWxlbWVudC5jbGFzc05hbWUgPSBkb2NFbGVtZW50LmNsYXNzTmFtZS5yZXBsYWNlKCByZSwgJycgKTtcbiAgICAgICAgICAgLy8gYnV0LCBubyBybHksIHN0dWZmICdlbS5cbiAgICAgICAgICAgcmV0dXJuIE1vZGVybml6cjtcbiAgICAgICAgIH1cblxuICAgICAgICAgdGVzdCA9IHR5cGVvZiB0ZXN0ID09ICdmdW5jdGlvbicgPyB0ZXN0KCkgOiB0ZXN0O1xuXG4gICAgICAgICBpZiAodHlwZW9mIGVuYWJsZUNsYXNzZXMgIT09IFwidW5kZWZpbmVkXCIgJiYgZW5hYmxlQ2xhc3Nlcykge1xuICAgICAgICAgICBkb2NFbGVtZW50LmNsYXNzTmFtZSArPSAnICcgKyAodGVzdCA/ICcnIDogJ25vLScpICsgZmVhdHVyZTtcbiAgICAgICAgIH1cbiAgICAgICAgIE1vZGVybml6cltmZWF0dXJlXSA9IHRlc3Q7XG5cbiAgICAgICB9XG5cbiAgICAgICByZXR1cm4gTW9kZXJuaXpyOyAvLyBhbGxvdyBjaGFpbmluZy5cbiAgICAgfTtcblxuXG4gICAgLy8gUmVzZXQgbW9kRWxlbS5jc3NUZXh0IHRvIG5vdGhpbmcgdG8gcmVkdWNlIG1lbW9yeSBmb290cHJpbnQuXG4gICAgc2V0Q3NzKCcnKTtcbiAgICBtb2RFbGVtID0gaW5wdXRFbGVtID0gbnVsbDtcblxuICAgIC8qPj5zaGl2Ki9cbiAgICAvKipcbiAgICAgKiBAcHJlc2VydmUgSFRNTDUgU2hpdiBwcmV2My43LjEgfCBAYWZhcmthcyBAamRhbHRvbiBAam9uX25lYWwgQHJlbSB8IE1JVC9HUEwyIExpY2Vuc2VkXG4gICAgICovXG4gICAgOyhmdW5jdGlvbih3aW5kb3csIGRvY3VtZW50KSB7XG4gICAgICAgIC8qanNoaW50IGV2aWw6dHJ1ZSAqL1xuICAgICAgICAvKiogdmVyc2lvbiAqL1xuICAgICAgICB2YXIgdmVyc2lvbiA9ICczLjcuMCc7XG5cbiAgICAgICAgLyoqIFByZXNldCBvcHRpb25zICovXG4gICAgICAgIHZhciBvcHRpb25zID0gd2luZG93Lmh0bWw1IHx8IHt9O1xuXG4gICAgICAgIC8qKiBVc2VkIHRvIHNraXAgcHJvYmxlbSBlbGVtZW50cyAqL1xuICAgICAgICB2YXIgcmVTa2lwID0gL148fF4oPzpidXR0b258bWFwfHNlbGVjdHx0ZXh0YXJlYXxvYmplY3R8aWZyYW1lfG9wdGlvbnxvcHRncm91cCkkL2k7XG5cbiAgICAgICAgLyoqIE5vdCBhbGwgZWxlbWVudHMgY2FuIGJlIGNsb25lZCBpbiBJRSAqKi9cbiAgICAgICAgdmFyIHNhdmVDbG9uZXMgPSAvXig/OmF8Ynxjb2RlfGRpdnxmaWVsZHNldHxoMXxoMnxoM3xoNHxoNXxoNnxpfGxhYmVsfGxpfG9sfHB8cXxzcGFufHN0cm9uZ3xzdHlsZXx0YWJsZXx0Ym9keXx0ZHx0aHx0cnx1bCkkL2k7XG5cbiAgICAgICAgLyoqIERldGVjdCB3aGV0aGVyIHRoZSBicm93c2VyIHN1cHBvcnRzIGRlZmF1bHQgaHRtbDUgc3R5bGVzICovXG4gICAgICAgIHZhciBzdXBwb3J0c0h0bWw1U3R5bGVzO1xuXG4gICAgICAgIC8qKiBOYW1lIG9mIHRoZSBleHBhbmRvLCB0byB3b3JrIHdpdGggbXVsdGlwbGUgZG9jdW1lbnRzIG9yIHRvIHJlLXNoaXYgb25lIGRvY3VtZW50ICovXG4gICAgICAgIHZhciBleHBhbmRvID0gJ19odG1sNXNoaXYnO1xuXG4gICAgICAgIC8qKiBUaGUgaWQgZm9yIHRoZSB0aGUgZG9jdW1lbnRzIGV4cGFuZG8gKi9cbiAgICAgICAgdmFyIGV4cGFuSUQgPSAwO1xuXG4gICAgICAgIC8qKiBDYWNoZWQgZGF0YSBmb3IgZWFjaCBkb2N1bWVudCAqL1xuICAgICAgICB2YXIgZXhwYW5kb0RhdGEgPSB7fTtcblxuICAgICAgICAvKiogRGV0ZWN0IHdoZXRoZXIgdGhlIGJyb3dzZXIgc3VwcG9ydHMgdW5rbm93biBlbGVtZW50cyAqL1xuICAgICAgICB2YXIgc3VwcG9ydHNVbmtub3duRWxlbWVudHM7XG5cbiAgICAgICAgKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgICAgIGEuaW5uZXJIVE1MID0gJzx4eXo+PC94eXo+JztcbiAgICAgICAgICAgIC8vaWYgdGhlIGhpZGRlbiBwcm9wZXJ0eSBpcyBpbXBsZW1lbnRlZCB3ZSBjYW4gYXNzdW1lLCB0aGF0IHRoZSBicm93c2VyIHN1cHBvcnRzIGJhc2ljIEhUTUw1IFN0eWxlc1xuICAgICAgICAgICAgc3VwcG9ydHNIdG1sNVN0eWxlcyA9ICgnaGlkZGVuJyBpbiBhKTtcblxuICAgICAgICAgICAgc3VwcG9ydHNVbmtub3duRWxlbWVudHMgPSBhLmNoaWxkTm9kZXMubGVuZ3RoID09IDEgfHwgKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAvLyBhc3NpZ24gYSBmYWxzZSBwb3NpdGl2ZSBpZiB1bmFibGUgdG8gc2hpdlxuICAgICAgICAgICAgICAoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCkoJ2EnKTtcbiAgICAgICAgICAgICAgdmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgdHlwZW9mIGZyYWcuY2xvbmVOb2RlID09ICd1bmRlZmluZWQnIHx8XG4gICAgICAgICAgICAgICAgdHlwZW9mIGZyYWcuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCA9PSAndW5kZWZpbmVkJyB8fFxuICAgICAgICAgICAgICAgIHR5cGVvZiBmcmFnLmNyZWF0ZUVsZW1lbnQgPT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0oKSk7XG4gICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAvLyBhc3NpZ24gYSBmYWxzZSBwb3NpdGl2ZSBpZiBkZXRlY3Rpb24gZmFpbHMgPT4gdW5hYmxlIHRvIHNoaXZcbiAgICAgICAgICAgIHN1cHBvcnRzSHRtbDVTdHlsZXMgPSB0cnVlO1xuICAgICAgICAgICAgc3VwcG9ydHNVbmtub3duRWxlbWVudHMgPSB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICB9KCkpO1xuXG4gICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGVzIGEgc3R5bGUgc2hlZXQgd2l0aCB0aGUgZ2l2ZW4gQ1NTIHRleHQgYW5kIGFkZHMgaXQgdG8gdGhlIGRvY3VtZW50LlxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKiBAcGFyYW0ge0RvY3VtZW50fSBvd25lckRvY3VtZW50IFRoZSBkb2N1bWVudC5cbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGNzc1RleHQgVGhlIENTUyB0ZXh0LlxuICAgICAgICAgKiBAcmV0dXJucyB7U3R5bGVTaGVldH0gVGhlIHN0eWxlIGVsZW1lbnQuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBhZGRTdHlsZVNoZWV0KG93bmVyRG9jdW1lbnQsIGNzc1RleHQpIHtcbiAgICAgICAgICB2YXIgcCA9IG93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpLFxuICAgICAgICAgIHBhcmVudCA9IG93bmVyRG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSB8fCBvd25lckRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblxuICAgICAgICAgIHAuaW5uZXJIVE1MID0gJ3g8c3R5bGU+JyArIGNzc1RleHQgKyAnPC9zdHlsZT4nO1xuICAgICAgICAgIHJldHVybiBwYXJlbnQuaW5zZXJ0QmVmb3JlKHAubGFzdENoaWxkLCBwYXJlbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyB0aGUgdmFsdWUgb2YgYGh0bWw1LmVsZW1lbnRzYCBhcyBhbiBhcnJheS5cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHJldHVybnMge0FycmF5fSBBbiBhcnJheSBvZiBzaGl2ZWQgZWxlbWVudCBub2RlIG5hbWVzLlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZ2V0RWxlbWVudHMoKSB7XG4gICAgICAgICAgdmFyIGVsZW1lbnRzID0gaHRtbDUuZWxlbWVudHM7XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBlbGVtZW50cyA9PSAnc3RyaW5nJyA/IGVsZW1lbnRzLnNwbGl0KCcgJykgOiBlbGVtZW50cztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHRoZSBkYXRhIGFzc29jaWF0ZWQgdG8gdGhlIGdpdmVuIGRvY3VtZW50XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEBwYXJhbSB7RG9jdW1lbnR9IG93bmVyRG9jdW1lbnQgVGhlIGRvY3VtZW50LlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBbiBvYmplY3Qgb2YgZGF0YS5cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIGdldEV4cGFuZG9EYXRhKG93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgICB2YXIgZGF0YSA9IGV4cGFuZG9EYXRhW293bmVyRG9jdW1lbnRbZXhwYW5kb11dO1xuICAgICAgICAgIGlmICghZGF0YSkge1xuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZXhwYW5JRCsrO1xuICAgICAgICAgICAgb3duZXJEb2N1bWVudFtleHBhbmRvXSA9IGV4cGFuSUQ7XG4gICAgICAgICAgICBleHBhbmRvRGF0YVtleHBhbklEXSA9IGRhdGE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIHJldHVybnMgYSBzaGl2ZWQgZWxlbWVudCBmb3IgdGhlIGdpdmVuIG5vZGVOYW1lIGFuZCBkb2N1bWVudFxuICAgICAgICAgKiBAbWVtYmVyT2YgaHRtbDVcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG5vZGVOYW1lIG5hbWUgb2YgdGhlIGVsZW1lbnRcbiAgICAgICAgICogQHBhcmFtIHtEb2N1bWVudH0gb3duZXJEb2N1bWVudCBUaGUgY29udGV4dCBkb2N1bWVudC5cbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gVGhlIHNoaXZlZCBlbGVtZW50LlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlRWxlbWVudChub2RlTmFtZSwgb3duZXJEb2N1bWVudCwgZGF0YSl7XG4gICAgICAgICAgaWYgKCFvd25lckRvY3VtZW50KSB7XG4gICAgICAgICAgICBvd25lckRvY3VtZW50ID0gZG9jdW1lbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKHN1cHBvcnRzVW5rbm93bkVsZW1lbnRzKXtcbiAgICAgICAgICAgIHJldHVybiBvd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZU5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgICAgIGRhdGEgPSBnZXRFeHBhbmRvRGF0YShvd25lckRvY3VtZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIG5vZGU7XG5cbiAgICAgICAgICBpZiAoZGF0YS5jYWNoZVtub2RlTmFtZV0pIHtcbiAgICAgICAgICAgIG5vZGUgPSBkYXRhLmNhY2hlW25vZGVOYW1lXS5jbG9uZU5vZGUoKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHNhdmVDbG9uZXMudGVzdChub2RlTmFtZSkpIHtcbiAgICAgICAgICAgIG5vZGUgPSAoZGF0YS5jYWNoZVtub2RlTmFtZV0gPSBkYXRhLmNyZWF0ZUVsZW0obm9kZU5hbWUpKS5jbG9uZU5vZGUoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZSA9IGRhdGEuY3JlYXRlRWxlbShub2RlTmFtZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQXZvaWQgYWRkaW5nIHNvbWUgZWxlbWVudHMgdG8gZnJhZ21lbnRzIGluIElFIDwgOSBiZWNhdXNlXG4gICAgICAgICAgLy8gKiBBdHRyaWJ1dGVzIGxpa2UgYG5hbWVgIG9yIGB0eXBlYCBjYW5ub3QgYmUgc2V0L2NoYW5nZWQgb25jZSBhbiBlbGVtZW50XG4gICAgICAgICAgLy8gICBpcyBpbnNlcnRlZCBpbnRvIGEgZG9jdW1lbnQvZnJhZ21lbnRcbiAgICAgICAgICAvLyAqIExpbmsgZWxlbWVudHMgd2l0aCBgc3JjYCBhdHRyaWJ1dGVzIHRoYXQgYXJlIGluYWNjZXNzaWJsZSwgYXMgd2l0aFxuICAgICAgICAgIC8vICAgYSA0MDMgcmVzcG9uc2UsIHdpbGwgY2F1c2UgdGhlIHRhYi93aW5kb3cgdG8gY3Jhc2hcbiAgICAgICAgICAvLyAqIFNjcmlwdCBlbGVtZW50cyBhcHBlbmRlZCB0byBmcmFnbWVudHMgd2lsbCBleGVjdXRlIHdoZW4gdGhlaXIgYHNyY2BcbiAgICAgICAgICAvLyAgIG9yIGB0ZXh0YCBwcm9wZXJ0eSBpcyBzZXRcbiAgICAgICAgICByZXR1cm4gbm9kZS5jYW5IYXZlQ2hpbGRyZW4gJiYgIXJlU2tpcC50ZXN0KG5vZGVOYW1lKSAmJiAhbm9kZS50YWdVcm4gPyBkYXRhLmZyYWcuYXBwZW5kQ2hpbGQobm9kZSkgOiBub2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIHJldHVybnMgYSBzaGl2ZWQgRG9jdW1lbnRGcmFnbWVudCBmb3IgdGhlIGdpdmVuIGRvY3VtZW50XG4gICAgICAgICAqIEBtZW1iZXJPZiBodG1sNVxuICAgICAgICAgKiBAcGFyYW0ge0RvY3VtZW50fSBvd25lckRvY3VtZW50IFRoZSBjb250ZXh0IGRvY3VtZW50LlxuICAgICAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBUaGUgc2hpdmVkIERvY3VtZW50RnJhZ21lbnQuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBjcmVhdGVEb2N1bWVudEZyYWdtZW50KG93bmVyRG9jdW1lbnQsIGRhdGEpe1xuICAgICAgICAgIGlmICghb3duZXJEb2N1bWVudCkge1xuICAgICAgICAgICAgb3duZXJEb2N1bWVudCA9IGRvY3VtZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZihzdXBwb3J0c1Vua25vd25FbGVtZW50cyl7XG4gICAgICAgICAgICByZXR1cm4gb3duZXJEb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRhdGEgPSBkYXRhIHx8IGdldEV4cGFuZG9EYXRhKG93bmVyRG9jdW1lbnQpO1xuICAgICAgICAgIHZhciBjbG9uZSA9IGRhdGEuZnJhZy5jbG9uZU5vZGUoKSxcbiAgICAgICAgICBpID0gMCxcbiAgICAgICAgICBlbGVtcyA9IGdldEVsZW1lbnRzKCksXG4gICAgICAgICAgbCA9IGVsZW1zLmxlbmd0aDtcbiAgICAgICAgICBmb3IoO2k8bDtpKyspe1xuICAgICAgICAgICAgY2xvbmUuY3JlYXRlRWxlbWVudChlbGVtc1tpXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBjbG9uZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTaGl2cyB0aGUgYGNyZWF0ZUVsZW1lbnRgIGFuZCBgY3JlYXRlRG9jdW1lbnRGcmFnbWVudGAgbWV0aG9kcyBvZiB0aGUgZG9jdW1lbnQuXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqIEBwYXJhbSB7RG9jdW1lbnR8RG9jdW1lbnRGcmFnbWVudH0gb3duZXJEb2N1bWVudCBUaGUgZG9jdW1lbnQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIG9mIHRoZSBkb2N1bWVudC5cbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIHNoaXZNZXRob2RzKG93bmVyRG9jdW1lbnQsIGRhdGEpIHtcbiAgICAgICAgICBpZiAoIWRhdGEuY2FjaGUpIHtcbiAgICAgICAgICAgIGRhdGEuY2FjaGUgPSB7fTtcbiAgICAgICAgICAgIGRhdGEuY3JlYXRlRWxlbSA9IG93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudDtcbiAgICAgICAgICAgIGRhdGEuY3JlYXRlRnJhZyA9IG93bmVyRG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudDtcbiAgICAgICAgICAgIGRhdGEuZnJhZyA9IGRhdGEuY3JlYXRlRnJhZygpO1xuICAgICAgICAgIH1cblxuXG4gICAgICAgICAgb3duZXJEb2N1bWVudC5jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24obm9kZU5hbWUpIHtcbiAgICAgICAgICAgIC8vYWJvcnQgc2hpdlxuICAgICAgICAgICAgaWYgKCFodG1sNS5zaGl2TWV0aG9kcykge1xuICAgICAgICAgICAgICByZXR1cm4gZGF0YS5jcmVhdGVFbGVtKG5vZGVOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjcmVhdGVFbGVtZW50KG5vZGVOYW1lLCBvd25lckRvY3VtZW50LCBkYXRhKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgb3duZXJEb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50ID0gRnVuY3Rpb24oJ2gsZicsICdyZXR1cm4gZnVuY3Rpb24oKXsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndmFyIG49Zi5jbG9uZU5vZGUoKSxjPW4uY3JlYXRlRWxlbWVudDsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaC5zaGl2TWV0aG9kcyYmKCcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVucm9sbCB0aGUgYGNyZWF0ZUVsZW1lbnRgIGNhbGxzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0RWxlbWVudHMoKS5qb2luKCkucmVwbGFjZSgvW1xcd1xcLV0rL2csIGZ1bmN0aW9uKG5vZGVOYW1lKSB7XG4gICAgICAgICAgICBkYXRhLmNyZWF0ZUVsZW0obm9kZU5hbWUpO1xuICAgICAgICAgICAgZGF0YS5mcmFnLmNyZWF0ZUVsZW1lbnQobm9kZU5hbWUpO1xuICAgICAgICAgICAgcmV0dXJuICdjKFwiJyArIG5vZGVOYW1lICsgJ1wiKSc7XG4gICAgICAgICAgfSkgK1xuICAgICAgICAgICAgJyk7cmV0dXJuIG59J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKShodG1sNSwgZGF0YS5mcmFnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTaGl2cyB0aGUgZ2l2ZW4gZG9jdW1lbnQuXG4gICAgICAgICAqIEBtZW1iZXJPZiBodG1sNVxuICAgICAgICAgKiBAcGFyYW0ge0RvY3VtZW50fSBvd25lckRvY3VtZW50IFRoZSBkb2N1bWVudCB0byBzaGl2LlxuICAgICAgICAgKiBAcmV0dXJucyB7RG9jdW1lbnR9IFRoZSBzaGl2ZWQgZG9jdW1lbnQuXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBzaGl2RG9jdW1lbnQob3duZXJEb2N1bWVudCkge1xuICAgICAgICAgIGlmICghb3duZXJEb2N1bWVudCkge1xuICAgICAgICAgICAgb3duZXJEb2N1bWVudCA9IGRvY3VtZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgZGF0YSA9IGdldEV4cGFuZG9EYXRhKG93bmVyRG9jdW1lbnQpO1xuXG4gICAgICAgICAgaWYgKGh0bWw1LnNoaXZDU1MgJiYgIXN1cHBvcnRzSHRtbDVTdHlsZXMgJiYgIWRhdGEuaGFzQ1NTKSB7XG4gICAgICAgICAgICBkYXRhLmhhc0NTUyA9ICEhYWRkU3R5bGVTaGVldChvd25lckRvY3VtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29ycmVjdHMgYmxvY2sgZGlzcGxheSBub3QgZGVmaW5lZCBpbiBJRTYvNy84LzlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdhcnRpY2xlLGFzaWRlLGRpYWxvZyxmaWdjYXB0aW9uLGZpZ3VyZSxmb290ZXIsaGVhZGVyLGhncm91cCxtYWluLG5hdixzZWN0aW9ue2Rpc3BsYXk6YmxvY2t9JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFkZHMgc3R5bGluZyBub3QgcHJlc2VudCBpbiBJRTYvNy84LzlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ21hcmt7YmFja2dyb3VuZDojRkYwO2NvbG9yOiMwMDB9JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhpZGVzIG5vbi1yZW5kZXJlZCBlbGVtZW50c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndGVtcGxhdGV7ZGlzcGxheTpub25lfSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFzdXBwb3J0c1Vua25vd25FbGVtZW50cykge1xuICAgICAgICAgICAgc2hpdk1ldGhvZHMob3duZXJEb2N1bWVudCwgZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBvd25lckRvY3VtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBgaHRtbDVgIG9iamVjdCBpcyBleHBvc2VkIHNvIHRoYXQgbW9yZSBlbGVtZW50cyBjYW4gYmUgc2hpdmVkIGFuZFxuICAgICAgICAgKiBleGlzdGluZyBzaGl2aW5nIGNhbiBiZSBkZXRlY3RlZCBvbiBpZnJhbWVzLlxuICAgICAgICAgKiBAdHlwZSBPYmplY3RcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICpcbiAgICAgICAgICogLy8gb3B0aW9ucyBjYW4gYmUgY2hhbmdlZCBiZWZvcmUgdGhlIHNjcmlwdCBpcyBpbmNsdWRlZFxuICAgICAgICAgKiBodG1sNSA9IHsgJ2VsZW1lbnRzJzogJ21hcmsgc2VjdGlvbicsICdzaGl2Q1NTJzogZmFsc2UsICdzaGl2TWV0aG9kcyc6IGZhbHNlIH07XG4gICAgICAgICAqL1xuICAgICAgICB2YXIgaHRtbDUgPSB7XG5cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBBbiBhcnJheSBvciBzcGFjZSBzZXBhcmF0ZWQgc3RyaW5nIG9mIG5vZGUgbmFtZXMgb2YgdGhlIGVsZW1lbnRzIHRvIHNoaXYuXG4gICAgICAgICAgICogQG1lbWJlck9mIGh0bWw1XG4gICAgICAgICAgICogQHR5cGUgQXJyYXl8U3RyaW5nXG4gICAgICAgICAgICovXG4gICAgICAgICAgJ2VsZW1lbnRzJzogb3B0aW9ucy5lbGVtZW50cyB8fCAnYWJiciBhcnRpY2xlIGFzaWRlIGF1ZGlvIGJkaSBjYW52YXMgZGF0YSBkYXRhbGlzdCBkZXRhaWxzIGRpYWxvZyBmaWdjYXB0aW9uIGZpZ3VyZSBmb290ZXIgaGVhZGVyIGhncm91cCBtYWluIG1hcmsgbWV0ZXIgbmF2IG91dHB1dCBwcm9ncmVzcyBzZWN0aW9uIHN1bW1hcnkgdGVtcGxhdGUgdGltZSB2aWRlbycsXG5cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBjdXJyZW50IHZlcnNpb24gb2YgaHRtbDVzaGl2XG4gICAgICAgICAgICovXG4gICAgICAgICAgJ3ZlcnNpb24nOiB2ZXJzaW9uLFxuXG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogQSBmbGFnIHRvIGluZGljYXRlIHRoYXQgdGhlIEhUTUw1IHN0eWxlIHNoZWV0IHNob3VsZCBiZSBpbnNlcnRlZC5cbiAgICAgICAgICAgKiBAbWVtYmVyT2YgaHRtbDVcbiAgICAgICAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICAgICAgICovXG4gICAgICAgICAgJ3NoaXZDU1MnOiAob3B0aW9ucy5zaGl2Q1NTICE9PSBmYWxzZSksXG5cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBJcyBlcXVhbCB0byB0cnVlIGlmIGEgYnJvd3NlciBzdXBwb3J0cyBjcmVhdGluZyB1bmtub3duL0hUTUw1IGVsZW1lbnRzXG4gICAgICAgICAgICogQG1lbWJlck9mIGh0bWw1XG4gICAgICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAgICAqL1xuICAgICAgICAgICdzdXBwb3J0c1Vua25vd25FbGVtZW50cyc6IHN1cHBvcnRzVW5rbm93bkVsZW1lbnRzLFxuXG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogQSBmbGFnIHRvIGluZGljYXRlIHRoYXQgdGhlIGRvY3VtZW50J3MgYGNyZWF0ZUVsZW1lbnRgIGFuZCBgY3JlYXRlRG9jdW1lbnRGcmFnbWVudGBcbiAgICAgICAgICAgKiBtZXRob2RzIHNob3VsZCBiZSBvdmVyd3JpdHRlbi5cbiAgICAgICAgICAgKiBAbWVtYmVyT2YgaHRtbDVcbiAgICAgICAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICAgICAgICovXG4gICAgICAgICAgJ3NoaXZNZXRob2RzJzogKG9wdGlvbnMuc2hpdk1ldGhvZHMgIT09IGZhbHNlKSxcblxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIEEgc3RyaW5nIHRvIGRlc2NyaWJlIHRoZSB0eXBlIG9mIGBodG1sNWAgb2JqZWN0IChcImRlZmF1bHRcIiBvciBcImRlZmF1bHQgcHJpbnRcIikuXG4gICAgICAgICAgICogQG1lbWJlck9mIGh0bWw1XG4gICAgICAgICAgICogQHR5cGUgU3RyaW5nXG4gICAgICAgICAgICovXG4gICAgICAgICAgJ3R5cGUnOiAnZGVmYXVsdCcsXG5cbiAgICAgICAgICAvLyBzaGl2cyB0aGUgZG9jdW1lbnQgYWNjb3JkaW5nIHRvIHRoZSBzcGVjaWZpZWQgYGh0bWw1YCBvYmplY3Qgb3B0aW9uc1xuICAgICAgICAgICdzaGl2RG9jdW1lbnQnOiBzaGl2RG9jdW1lbnQsXG5cbiAgICAgICAgICAvL2NyZWF0ZXMgYSBzaGl2ZWQgZWxlbWVudFxuICAgICAgICAgIGNyZWF0ZUVsZW1lbnQ6IGNyZWF0ZUVsZW1lbnQsXG5cbiAgICAgICAgICAvL2NyZWF0ZXMgYSBzaGl2ZWQgZG9jdW1lbnRGcmFnbWVudFxuICAgICAgICAgIGNyZWF0ZURvY3VtZW50RnJhZ21lbnQ6IGNyZWF0ZURvY3VtZW50RnJhZ21lbnRcbiAgICAgICAgfTtcblxuICAgICAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAgICAgICAvLyBleHBvc2UgaHRtbDVcbiAgICAgICAgd2luZG93Lmh0bWw1ID0gaHRtbDU7XG5cbiAgICAgICAgLy8gc2hpdiB0aGUgZG9jdW1lbnRcbiAgICAgICAgc2hpdkRvY3VtZW50KGRvY3VtZW50KTtcblxuICAgIH0odGhpcywgZG9jdW1lbnQpKTtcbiAgICAvKj4+c2hpdiovXG5cbiAgICAvLyBBc3NpZ24gcHJpdmF0ZSBwcm9wZXJ0aWVzIHRvIHRoZSByZXR1cm4gb2JqZWN0IHdpdGggcHJlZml4XG4gICAgTW9kZXJuaXpyLl92ZXJzaW9uICAgICAgPSB2ZXJzaW9uO1xuXG4gICAgLy8gZXhwb3NlIHRoZXNlIGZvciB0aGUgcGx1Z2luIEFQSS4gTG9vayBpbiB0aGUgc291cmNlIGZvciBob3cgdG8gam9pbigpIHRoZW0gYWdhaW5zdCB5b3VyIGlucHV0XG4gICAgLyo+PnByZWZpeGVzKi9cbiAgICBNb2Rlcm5penIuX3ByZWZpeGVzICAgICA9IHByZWZpeGVzO1xuICAgIC8qPj5wcmVmaXhlcyovXG4gICAgLyo+PmRvbXByZWZpeGVzKi9cbiAgICBNb2Rlcm5penIuX2RvbVByZWZpeGVzICA9IGRvbVByZWZpeGVzO1xuICAgIE1vZGVybml6ci5fY3Nzb21QcmVmaXhlcyAgPSBjc3NvbVByZWZpeGVzO1xuICAgIC8qPj5kb21wcmVmaXhlcyovXG5cbiAgICAvKj4+bXEqL1xuICAgIC8vIE1vZGVybml6ci5tcSB0ZXN0cyBhIGdpdmVuIG1lZGlhIHF1ZXJ5LCBsaXZlIGFnYWluc3QgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIHdpbmRvd1xuICAgIC8vIEEgZmV3IGltcG9ydGFudCBub3RlczpcbiAgICAvLyAgICogSWYgYSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgbWVkaWEgcXVlcmllcyBhdCBhbGwgKGVnLiBvbGRJRSkgdGhlIG1xKCkgd2lsbCBhbHdheXMgcmV0dXJuIGZhbHNlXG4gICAgLy8gICAqIEEgbWF4LXdpZHRoIG9yIG9yaWVudGF0aW9uIHF1ZXJ5IHdpbGwgYmUgZXZhbHVhdGVkIGFnYWluc3QgdGhlIGN1cnJlbnQgc3RhdGUsIHdoaWNoIG1heSBjaGFuZ2UgbGF0ZXIuXG4gICAgLy8gICAqIFlvdSBtdXN0IHNwZWNpZnkgdmFsdWVzLiBFZy4gSWYgeW91IGFyZSB0ZXN0aW5nIHN1cHBvcnQgZm9yIHRoZSBtaW4td2lkdGggbWVkaWEgcXVlcnkgdXNlOlxuICAgIC8vICAgICAgIE1vZGVybml6ci5tcSgnKG1pbi13aWR0aDowKScpXG4gICAgLy8gdXNhZ2U6XG4gICAgLy8gTW9kZXJuaXpyLm1xKCdvbmx5IHNjcmVlbiBhbmQgKG1heC13aWR0aDo3NjgpJylcbiAgICBNb2Rlcm5penIubXEgICAgICAgICAgICA9IHRlc3RNZWRpYVF1ZXJ5O1xuICAgIC8qPj5tcSovXG5cbiAgICAvKj4+aGFzZXZlbnQqL1xuICAgIC8vIE1vZGVybml6ci5oYXNFdmVudCgpIGRldGVjdHMgc3VwcG9ydCBmb3IgYSBnaXZlbiBldmVudCwgd2l0aCBhbiBvcHRpb25hbCBlbGVtZW50IHRvIHRlc3Qgb25cbiAgICAvLyBNb2Rlcm5penIuaGFzRXZlbnQoJ2dlc3R1cmVzdGFydCcsIGVsZW0pXG4gICAgTW9kZXJuaXpyLmhhc0V2ZW50ICAgICAgPSBpc0V2ZW50U3VwcG9ydGVkO1xuICAgIC8qPj5oYXNldmVudCovXG5cbiAgICAvKj4+dGVzdHByb3AqL1xuICAgIC8vIE1vZGVybml6ci50ZXN0UHJvcCgpIGludmVzdGlnYXRlcyB3aGV0aGVyIGEgZ2l2ZW4gc3R5bGUgcHJvcGVydHkgaXMgcmVjb2duaXplZFxuICAgIC8vIE5vdGUgdGhhdCB0aGUgcHJvcGVydHkgbmFtZXMgbXVzdCBiZSBwcm92aWRlZCBpbiB0aGUgY2FtZWxDYXNlIHZhcmlhbnQuXG4gICAgLy8gTW9kZXJuaXpyLnRlc3RQcm9wKCdwb2ludGVyRXZlbnRzJylcbiAgICBNb2Rlcm5penIudGVzdFByb3AgICAgICA9IGZ1bmN0aW9uKHByb3Ape1xuICAgICAgICByZXR1cm4gdGVzdFByb3BzKFtwcm9wXSk7XG4gICAgfTtcbiAgICAvKj4+dGVzdHByb3AqL1xuXG4gICAgLyo+PnRlc3RhbGxwcm9wcyovXG4gICAgLy8gTW9kZXJuaXpyLnRlc3RBbGxQcm9wcygpIGludmVzdGlnYXRlcyB3aGV0aGVyIGEgZ2l2ZW4gc3R5bGUgcHJvcGVydHksXG4gICAgLy8gICBvciBhbnkgb2YgaXRzIHZlbmRvci1wcmVmaXhlZCB2YXJpYW50cywgaXMgcmVjb2duaXplZFxuICAgIC8vIE5vdGUgdGhhdCB0aGUgcHJvcGVydHkgbmFtZXMgbXVzdCBiZSBwcm92aWRlZCBpbiB0aGUgY2FtZWxDYXNlIHZhcmlhbnQuXG4gICAgLy8gTW9kZXJuaXpyLnRlc3RBbGxQcm9wcygnYm94U2l6aW5nJylcbiAgICBNb2Rlcm5penIudGVzdEFsbFByb3BzICA9IHRlc3RQcm9wc0FsbDtcbiAgICAvKj4+dGVzdGFsbHByb3BzKi9cblxuXG4gICAgLyo+PnRlc3RzdHlsZXMqL1xuICAgIC8vIE1vZGVybml6ci50ZXN0U3R5bGVzKCkgYWxsb3dzIHlvdSB0byBhZGQgY3VzdG9tIHN0eWxlcyB0byB0aGUgZG9jdW1lbnQgYW5kIHRlc3QgYW4gZWxlbWVudCBhZnRlcndhcmRzXG4gICAgLy8gTW9kZXJuaXpyLnRlc3RTdHlsZXMoJyNtb2Rlcm5penIgeyBwb3NpdGlvbjphYnNvbHV0ZSB9JywgZnVuY3Rpb24oZWxlbSwgcnVsZSl7IC4uLiB9KVxuICAgIE1vZGVybml6ci50ZXN0U3R5bGVzICAgID0gaW5qZWN0RWxlbWVudFdpdGhTdHlsZXM7XG4gICAgLyo+PnRlc3RzdHlsZXMqL1xuXG5cbiAgICAvKj4+cHJlZml4ZWQqL1xuICAgIC8vIE1vZGVybml6ci5wcmVmaXhlZCgpIHJldHVybnMgdGhlIHByZWZpeGVkIG9yIG5vbnByZWZpeGVkIHByb3BlcnR5IG5hbWUgdmFyaWFudCBvZiB5b3VyIGlucHV0XG4gICAgLy8gTW9kZXJuaXpyLnByZWZpeGVkKCdib3hTaXppbmcnKSAvLyAnTW96Qm94U2l6aW5nJ1xuXG4gICAgLy8gUHJvcGVydGllcyBtdXN0IGJlIHBhc3NlZCBhcyBkb20tc3R5bGUgY2FtZWxjYXNlLCByYXRoZXIgdGhhbiBgYm94LXNpemluZ2AgaHlwZW50YXRlZCBzdHlsZS5cbiAgICAvLyBSZXR1cm4gdmFsdWVzIHdpbGwgYWxzbyBiZSB0aGUgY2FtZWxDYXNlIHZhcmlhbnQsIGlmIHlvdSBuZWVkIHRvIHRyYW5zbGF0ZSB0aGF0IHRvIGh5cGVuYXRlZCBzdHlsZSB1c2U6XG4gICAgLy9cbiAgICAvLyAgICAgc3RyLnJlcGxhY2UoLyhbQS1aXSkvZywgZnVuY3Rpb24oc3RyLG0xKXsgcmV0dXJuICctJyArIG0xLnRvTG93ZXJDYXNlKCk7IH0pLnJlcGxhY2UoL15tcy0vLCctbXMtJyk7XG5cbiAgICAvLyBJZiB5b3UncmUgdHJ5aW5nIHRvIGFzY2VydGFpbiB3aGljaCB0cmFuc2l0aW9uIGVuZCBldmVudCB0byBiaW5kIHRvLCB5b3UgbWlnaHQgZG8gc29tZXRoaW5nIGxpa2UuLi5cbiAgICAvL1xuICAgIC8vICAgICB2YXIgdHJhbnNFbmRFdmVudE5hbWVzID0ge1xuICAgIC8vICAgICAgICdXZWJraXRUcmFuc2l0aW9uJyA6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAvLyAgICAgICAnTW96VHJhbnNpdGlvbicgICAgOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgLy8gICAgICAgJ09UcmFuc2l0aW9uJyAgICAgIDogJ29UcmFuc2l0aW9uRW5kJyxcbiAgICAvLyAgICAgICAnbXNUcmFuc2l0aW9uJyAgICAgOiAnTVNUcmFuc2l0aW9uRW5kJyxcbiAgICAvLyAgICAgICAndHJhbnNpdGlvbicgICAgICAgOiAndHJhbnNpdGlvbmVuZCdcbiAgICAvLyAgICAgfSxcbiAgICAvLyAgICAgdHJhbnNFbmRFdmVudE5hbWUgPSB0cmFuc0VuZEV2ZW50TmFtZXNbIE1vZGVybml6ci5wcmVmaXhlZCgndHJhbnNpdGlvbicpIF07XG5cbiAgICBNb2Rlcm5penIucHJlZml4ZWQgICAgICA9IGZ1bmN0aW9uKHByb3AsIG9iaiwgZWxlbSl7XG4gICAgICBpZighb2JqKSB7XG4gICAgICAgIHJldHVybiB0ZXN0UHJvcHNBbGwocHJvcCwgJ3BmeCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGVzdGluZyBET00gcHJvcGVydHkgZS5nLiBNb2Rlcm5penIucHJlZml4ZWQoJ3JlcXVlc3RBbmltYXRpb25GcmFtZScsIHdpbmRvdykgLy8gJ21velJlcXVlc3RBbmltYXRpb25GcmFtZSdcbiAgICAgICAgcmV0dXJuIHRlc3RQcm9wc0FsbChwcm9wLCBvYmosIGVsZW0pO1xuICAgICAgfVxuICAgIH07XG4gICAgLyo+PnByZWZpeGVkKi9cblxuXG4gICAgLyo+PmNzc2NsYXNzZXMqL1xuICAgIC8vIFJlbW92ZSBcIm5vLWpzXCIgY2xhc3MgZnJvbSA8aHRtbD4gZWxlbWVudCwgaWYgaXQgZXhpc3RzOlxuICAgIGRvY0VsZW1lbnQuY2xhc3NOYW1lID0gZG9jRWxlbWVudC5jbGFzc05hbWUucmVwbGFjZSgvKF58XFxzKW5vLWpzKFxcc3wkKS8sICckMSQyJykgK1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBuZXcgY2xhc3NlcyB0byB0aGUgPGh0bWw+IGVsZW1lbnQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGVuYWJsZUNsYXNzZXMgPyAnIGpzICcgKyBjbGFzc2VzLmpvaW4oJyAnKSA6ICcnKTtcbiAgICAvKj4+Y3NzY2xhc3NlcyovXG5cbiAgICByZXR1cm4gTW9kZXJuaXpyO1xuXG59KSh0aGlzLCB0aGlzLmRvY3VtZW50KTtcbiIsIi8qXG4gKiBGb3VuZGF0aW9uIFJlc3BvbnNpdmUgTGlicmFyeVxuICogaHR0cDovL2ZvdW5kYXRpb24uenVyYi5jb21cbiAqIENvcHlyaWdodCAyMDE0LCBaVVJCXG4gKiBGcmVlIHRvIHVzZSB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4gKiBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxuKi9cblxuKGZ1bmN0aW9uICgkLCB3aW5kb3csIGRvY3VtZW50LCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBoZWFkZXJfaGVscGVycyA9IGZ1bmN0aW9uIChjbGFzc19hcnJheSkge1xuICAgIHZhciBpID0gY2xhc3NfYXJyYXkubGVuZ3RoO1xuICAgIHZhciBoZWFkID0gJCgnaGVhZCcpO1xuXG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgaWYgKGhlYWQuaGFzKCcuJyArIGNsYXNzX2FycmF5W2ldKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgaGVhZC5hcHBlbmQoJzxtZXRhIGNsYXNzPVwiJyArIGNsYXNzX2FycmF5W2ldICsgJ1wiIC8+Jyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGhlYWRlcl9oZWxwZXJzKFtcbiAgICAnZm91bmRhdGlvbi1tcS1zbWFsbCcsXG4gICAgJ2ZvdW5kYXRpb24tbXEtc21hbGwtb25seScsXG4gICAgJ2ZvdW5kYXRpb24tbXEtbWVkaXVtJyxcbiAgICAnZm91bmRhdGlvbi1tcS1tZWRpdW0tb25seScsXG4gICAgJ2ZvdW5kYXRpb24tbXEtbGFyZ2UnLFxuICAgICdmb3VuZGF0aW9uLW1xLWxhcmdlLW9ubHknLFxuICAgICdmb3VuZGF0aW9uLW1xLXhsYXJnZScsXG4gICAgJ2ZvdW5kYXRpb24tbXEteGxhcmdlLW9ubHknLFxuICAgICdmb3VuZGF0aW9uLW1xLXh4bGFyZ2UnLFxuICAgICdmb3VuZGF0aW9uLWRhdGEtYXR0cmlidXRlLW5hbWVzcGFjZSddKTtcblxuICAvLyBFbmFibGUgRmFzdENsaWNrIGlmIHByZXNlbnRcblxuICAkKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIEZhc3RDbGljayAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIC8vIERvbid0IGF0dGFjaCB0byBib2R5IGlmIHVuZGVmaW5lZFxuICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudC5ib2R5ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBGYXN0Q2xpY2suYXR0YWNoKGRvY3VtZW50LmJvZHkpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLy8gcHJpdmF0ZSBGYXN0IFNlbGVjdG9yIHdyYXBwZXIsXG4gIC8vIHJldHVybnMgalF1ZXJ5IG9iamVjdC4gT25seSB1c2Ugd2hlcmVcbiAgLy8gZ2V0RWxlbWVudEJ5SWQgaXMgbm90IGF2YWlsYWJsZS5cbiAgdmFyIFMgPSBmdW5jdGlvbiAoc2VsZWN0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKGNvbnRleHQpIHtcbiAgICAgICAgdmFyIGNvbnQ7XG4gICAgICAgIGlmIChjb250ZXh0LmpxdWVyeSkge1xuICAgICAgICAgIGNvbnQgPSBjb250ZXh0WzBdO1xuICAgICAgICAgIGlmICghY29udCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQ7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnQgPSBjb250ZXh0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkKGNvbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gJChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuICQoc2VsZWN0b3IsIGNvbnRleHQpO1xuICB9O1xuXG4gIC8vIE5hbWVzcGFjZSBmdW5jdGlvbnMuXG5cbiAgdmFyIGF0dHJfbmFtZSA9IGZ1bmN0aW9uIChpbml0KSB7XG4gICAgdmFyIGFyciA9IFtdO1xuICAgIGlmICghaW5pdCkge1xuICAgICAgYXJyLnB1c2goJ2RhdGEnKTtcbiAgICB9XG4gICAgaWYgKHRoaXMubmFtZXNwYWNlLmxlbmd0aCA+IDApIHtcbiAgICAgIGFyci5wdXNoKHRoaXMubmFtZXNwYWNlKTtcbiAgICB9XG4gICAgYXJyLnB1c2godGhpcy5uYW1lKTtcblxuICAgIHJldHVybiBhcnIuam9pbignLScpO1xuICB9O1xuXG4gIHZhciBhZGRfbmFtZXNwYWNlID0gZnVuY3Rpb24gKHN0cikge1xuICAgIHZhciBwYXJ0cyA9IHN0ci5zcGxpdCgnLScpLFxuICAgICAgICBpID0gcGFydHMubGVuZ3RoLFxuICAgICAgICBhcnIgPSBbXTtcblxuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIGlmIChpICE9PSAwKSB7XG4gICAgICAgIGFyci5wdXNoKHBhcnRzW2ldKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLm5hbWVzcGFjZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgYXJyLnB1c2godGhpcy5uYW1lc3BhY2UsIHBhcnRzW2ldKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhcnIucHVzaChwYXJ0c1tpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYXJyLnJldmVyc2UoKS5qb2luKCctJyk7XG4gIH07XG5cbiAgLy8gRXZlbnQgYmluZGluZyBhbmQgZGF0YS1vcHRpb25zIHVwZGF0aW5nLlxuXG4gIHZhciBiaW5kaW5ncyA9IGZ1bmN0aW9uIChtZXRob2QsIG9wdGlvbnMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgIGJpbmQgPSBmdW5jdGlvbigpe1xuICAgICAgICAgIHZhciAkdGhpcyA9IFModGhpcyksXG4gICAgICAgICAgICAgIHNob3VsZF9iaW5kX2V2ZW50cyA9ICEkdGhpcy5kYXRhKHNlbGYuYXR0cl9uYW1lKHRydWUpICsgJy1pbml0Jyk7XG4gICAgICAgICAgJHRoaXMuZGF0YShzZWxmLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcsICQuZXh0ZW5kKHt9LCBzZWxmLnNldHRpbmdzLCAob3B0aW9ucyB8fCBtZXRob2QpLCBzZWxmLmRhdGFfb3B0aW9ucygkdGhpcykpKTtcblxuICAgICAgICAgIGlmIChzaG91bGRfYmluZF9ldmVudHMpIHtcbiAgICAgICAgICAgIHNlbGYuZXZlbnRzKHRoaXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgIGlmIChTKHRoaXMuc2NvcGUpLmlzKCdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyddJykpIHtcbiAgICAgIGJpbmQuY2FsbCh0aGlzLnNjb3BlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgUygnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsnXScsIHRoaXMuc2NvcGUpLmVhY2goYmluZCk7XG4gICAgfVxuICAgIC8vICMgUGF0Y2ggdG8gZml4ICM1MDQzIHRvIG1vdmUgdGhpcyAqYWZ0ZXIqIHRoZSBpZi9lbHNlIGNsYXVzZSBpbiBvcmRlciBmb3IgQmFja2JvbmUgYW5kIHNpbWlsYXIgZnJhbWV3b3JrcyB0byBoYXZlIGltcHJvdmVkIGNvbnRyb2wgb3ZlciBldmVudCBiaW5kaW5nIGFuZCBkYXRhLW9wdGlvbnMgdXBkYXRpbmcuXG4gICAgaWYgKHR5cGVvZiBtZXRob2QgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gdGhpc1ttZXRob2RdLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgfVxuXG4gIH07XG5cbiAgdmFyIHNpbmdsZV9pbWFnZV9sb2FkZWQgPSBmdW5jdGlvbiAoaW1hZ2UsIGNhbGxiYWNrKSB7XG4gICAgZnVuY3Rpb24gbG9hZGVkICgpIHtcbiAgICAgIGNhbGxiYWNrKGltYWdlWzBdKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBiaW5kTG9hZCAoKSB7XG4gICAgICB0aGlzLm9uZSgnbG9hZCcsIGxvYWRlZCk7XG5cbiAgICAgIGlmICgvTVNJRSAoXFxkK1xcLlxcZCspOy8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkge1xuICAgICAgICB2YXIgc3JjID0gdGhpcy5hdHRyKCAnc3JjJyApLFxuICAgICAgICAgICAgcGFyYW0gPSBzcmMubWF0Y2goIC9cXD8vICkgPyAnJicgOiAnPyc7XG5cbiAgICAgICAgcGFyYW0gKz0gJ3JhbmRvbT0nICsgKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICAgICAgdGhpcy5hdHRyKCdzcmMnLCBzcmMgKyBwYXJhbSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFpbWFnZS5hdHRyKCdzcmMnKSkge1xuICAgICAgbG9hZGVkKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGltYWdlWzBdLmNvbXBsZXRlIHx8IGltYWdlWzBdLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgIGxvYWRlZCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBiaW5kTG9hZC5jYWxsKGltYWdlKTtcbiAgICB9XG4gIH07XG5cbiAgLypcbiAgICBodHRwczovL2dpdGh1Yi5jb20vcGF1bGlyaXNoL21hdGNoTWVkaWEuanNcbiAgKi9cblxuICB3aW5kb3cubWF0Y2hNZWRpYSA9IHdpbmRvdy5tYXRjaE1lZGlhIHx8IChmdW5jdGlvbiAoIGRvYyApIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBib29sLFxuICAgICAgICBkb2NFbGVtID0gZG9jLmRvY3VtZW50RWxlbWVudCxcbiAgICAgICAgcmVmTm9kZSA9IGRvY0VsZW0uZmlyc3RFbGVtZW50Q2hpbGQgfHwgZG9jRWxlbS5maXJzdENoaWxkLFxuICAgICAgICAvLyBmYWtlQm9keSByZXF1aXJlZCBmb3IgPEZGNCB3aGVuIGV4ZWN1dGVkIGluIDxoZWFkPlxuICAgICAgICBmYWtlQm9keSA9IGRvYy5jcmVhdGVFbGVtZW50KCAnYm9keScgKSxcbiAgICAgICAgZGl2ID0gZG9jLmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG5cbiAgICBkaXYuaWQgPSAnbXEtdGVzdC0xJztcbiAgICBkaXYuc3R5bGUuY3NzVGV4dCA9ICdwb3NpdGlvbjphYnNvbHV0ZTt0b3A6LTEwMGVtJztcbiAgICBmYWtlQm9keS5zdHlsZS5iYWNrZ3JvdW5kID0gJ25vbmUnO1xuICAgIGZha2VCb2R5LmFwcGVuZENoaWxkKGRpdik7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKHEpIHtcblxuICAgICAgZGl2LmlubmVySFRNTCA9ICcmc2h5OzxzdHlsZSBtZWRpYT1cIicgKyBxICsgJ1wiPiAjbXEtdGVzdC0xIHsgd2lkdGg6IDQycHg7IH08L3N0eWxlPic7XG5cbiAgICAgIGRvY0VsZW0uaW5zZXJ0QmVmb3JlKCBmYWtlQm9keSwgcmVmTm9kZSApO1xuICAgICAgYm9vbCA9IGRpdi5vZmZzZXRXaWR0aCA9PT0gNDI7XG4gICAgICBkb2NFbGVtLnJlbW92ZUNoaWxkKCBmYWtlQm9keSApO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBtYXRjaGVzIDogYm9vbCxcbiAgICAgICAgbWVkaWEgOiBxXG4gICAgICB9O1xuXG4gICAgfTtcblxuICB9KCBkb2N1bWVudCApKTtcblxuICAvKlxuICAgKiBqcXVlcnkucmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9nbmFyZjM3L2pxdWVyeS1yZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICogUmVxdWlyZXMgalF1ZXJ5IDEuOCtcbiAgICpcbiAgICogQ29weXJpZ2h0IChjKSAyMDEyIENvcmV5IEZyYW5nXG4gICAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAgICovXG5cbiAgKGZ1bmN0aW9uKGpRdWVyeSkge1xuXG5cbiAgLy8gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHBvbHlmaWxsIGFkYXB0ZWQgZnJvbSBFcmlrIE3DtmxsZXJcbiAgLy8gZml4ZXMgZnJvbSBQYXVsIElyaXNoIGFuZCBUaW5vIFppamRlbFxuICAvLyBodHRwOi8vcGF1bGlyaXNoLmNvbS8yMDExL3JlcXVlc3RhbmltYXRpb25mcmFtZS1mb3Itc21hcnQtYW5pbWF0aW5nL1xuICAvLyBodHRwOi8vbXkub3BlcmEuY29tL2Vtb2xsZXIvYmxvZy8yMDExLzEyLzIwL3JlcXVlc3RhbmltYXRpb25mcmFtZS1mb3Itc21hcnQtZXItYW5pbWF0aW5nXG5cbiAgdmFyIGFuaW1hdGluZyxcbiAgICAgIGxhc3RUaW1lID0gMCxcbiAgICAgIHZlbmRvcnMgPSBbJ3dlYmtpdCcsICdtb3onXSxcbiAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUsXG4gICAgICBjYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSxcbiAgICAgIGpxdWVyeUZ4QXZhaWxhYmxlID0gJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBqUXVlcnkuZng7XG5cbiAgZm9yICg7IGxhc3RUaW1lIDwgdmVuZG9ycy5sZW5ndGggJiYgIXJlcXVlc3RBbmltYXRpb25GcmFtZTsgbGFzdFRpbWUrKykge1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1sgdmVuZG9yc1tsYXN0VGltZV0gKyAnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJyBdO1xuICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lID0gY2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgIHdpbmRvd1sgdmVuZG9yc1tsYXN0VGltZV0gKyAnQ2FuY2VsQW5pbWF0aW9uRnJhbWUnIF0gfHxcbiAgICAgIHdpbmRvd1sgdmVuZG9yc1tsYXN0VGltZV0gKyAnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJyBdO1xuICB9XG5cbiAgZnVuY3Rpb24gcmFmKCkge1xuICAgIGlmIChhbmltYXRpbmcpIHtcbiAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShyYWYpO1xuXG4gICAgICBpZiAoanF1ZXJ5RnhBdmFpbGFibGUpIHtcbiAgICAgICAgalF1ZXJ5LmZ4LnRpY2soKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAocmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgLy8gdXNlIHJBRlxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gY2FuY2VsQW5pbWF0aW9uRnJhbWU7XG5cbiAgICBpZiAoanF1ZXJ5RnhBdmFpbGFibGUpIHtcbiAgICAgIGpRdWVyeS5meC50aW1lciA9IGZ1bmN0aW9uICh0aW1lcikge1xuICAgICAgICBpZiAodGltZXIoKSAmJiBqUXVlcnkudGltZXJzLnB1c2godGltZXIpICYmICFhbmltYXRpbmcpIHtcbiAgICAgICAgICBhbmltYXRpbmcgPSB0cnVlO1xuICAgICAgICAgIHJhZigpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBqUXVlcnkuZnguc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICB9O1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBwb2x5ZmlsbFxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgIHZhciBjdXJyVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxuICAgICAgICB0aW1lVG9DYWxsID0gTWF0aC5tYXgoMCwgMTYgLSAoY3VyclRpbWUgLSBsYXN0VGltZSkpLFxuICAgICAgICBpZCA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjYWxsYmFjayhjdXJyVGltZSArIHRpbWVUb0NhbGwpO1xuICAgICAgICB9LCB0aW1lVG9DYWxsKTtcbiAgICAgIGxhc3RUaW1lID0gY3VyclRpbWUgKyB0aW1lVG9DYWxsO1xuICAgICAgcmV0dXJuIGlkO1xuICAgIH07XG5cbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgIGNsZWFyVGltZW91dChpZCk7XG4gICAgfTtcblxuICB9XG5cbiAgfSggJCApKTtcblxuICBmdW5jdGlvbiByZW1vdmVRdW90ZXMgKHN0cmluZykge1xuICAgIGlmICh0eXBlb2Ygc3RyaW5nID09PSAnc3RyaW5nJyB8fCBzdHJpbmcgaW5zdGFuY2VvZiBTdHJpbmcpIHtcbiAgICAgIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKC9eWydcXFxcL1wiXSt8KDtcXHM/fSkrfFsnXFxcXC9cIl0rJC9nLCAnJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZztcbiAgfVxuXG4gIHdpbmRvdy5Gb3VuZGF0aW9uID0ge1xuICAgIG5hbWUgOiAnRm91bmRhdGlvbicsXG5cbiAgICB2ZXJzaW9uIDogJzUuNS4xJyxcblxuICAgIG1lZGlhX3F1ZXJpZXMgOiB7XG4gICAgICAnc21hbGwnICAgICAgIDogUygnLmZvdW5kYXRpb24tbXEtc21hbGwnKS5jc3MoJ2ZvbnQtZmFtaWx5JykucmVwbGFjZSgvXltcXC9cXFxcJ1wiXSt8KDtcXHM/fSkrfFtcXC9cXFxcJ1wiXSskL2csICcnKSxcbiAgICAgICdzbWFsbC1vbmx5JyAgOiBTKCcuZm91bmRhdGlvbi1tcS1zbWFsbC1vbmx5JykuY3NzKCdmb250LWZhbWlseScpLnJlcGxhY2UoL15bXFwvXFxcXCdcIl0rfCg7XFxzP30pK3xbXFwvXFxcXCdcIl0rJC9nLCAnJyksXG4gICAgICAnbWVkaXVtJyAgICAgIDogUygnLmZvdW5kYXRpb24tbXEtbWVkaXVtJykuY3NzKCdmb250LWZhbWlseScpLnJlcGxhY2UoL15bXFwvXFxcXCdcIl0rfCg7XFxzP30pK3xbXFwvXFxcXCdcIl0rJC9nLCAnJyksXG4gICAgICAnbWVkaXVtLW9ubHknIDogUygnLmZvdW5kYXRpb24tbXEtbWVkaXVtLW9ubHknKS5jc3MoJ2ZvbnQtZmFtaWx5JykucmVwbGFjZSgvXltcXC9cXFxcJ1wiXSt8KDtcXHM/fSkrfFtcXC9cXFxcJ1wiXSskL2csICcnKSxcbiAgICAgICdsYXJnZScgICAgICAgOiBTKCcuZm91bmRhdGlvbi1tcS1sYXJnZScpLmNzcygnZm9udC1mYW1pbHknKS5yZXBsYWNlKC9eW1xcL1xcXFwnXCJdK3woO1xccz99KSt8W1xcL1xcXFwnXCJdKyQvZywgJycpLFxuICAgICAgJ2xhcmdlLW9ubHknICA6IFMoJy5mb3VuZGF0aW9uLW1xLWxhcmdlLW9ubHknKS5jc3MoJ2ZvbnQtZmFtaWx5JykucmVwbGFjZSgvXltcXC9cXFxcJ1wiXSt8KDtcXHM/fSkrfFtcXC9cXFxcJ1wiXSskL2csICcnKSxcbiAgICAgICd4bGFyZ2UnICAgICAgOiBTKCcuZm91bmRhdGlvbi1tcS14bGFyZ2UnKS5jc3MoJ2ZvbnQtZmFtaWx5JykucmVwbGFjZSgvXltcXC9cXFxcJ1wiXSt8KDtcXHM/fSkrfFtcXC9cXFxcJ1wiXSskL2csICcnKSxcbiAgICAgICd4bGFyZ2Utb25seScgOiBTKCcuZm91bmRhdGlvbi1tcS14bGFyZ2Utb25seScpLmNzcygnZm9udC1mYW1pbHknKS5yZXBsYWNlKC9eW1xcL1xcXFwnXCJdK3woO1xccz99KSt8W1xcL1xcXFwnXCJdKyQvZywgJycpLFxuICAgICAgJ3h4bGFyZ2UnICAgICA6IFMoJy5mb3VuZGF0aW9uLW1xLXh4bGFyZ2UnKS5jc3MoJ2ZvbnQtZmFtaWx5JykucmVwbGFjZSgvXltcXC9cXFxcJ1wiXSt8KDtcXHM/fSkrfFtcXC9cXFxcJ1wiXSskL2csICcnKVxuICAgIH0sXG5cbiAgICBzdHlsZXNoZWV0IDogJCgnPHN0eWxlPjwvc3R5bGU+JykuYXBwZW5kVG8oJ2hlYWQnKVswXS5zaGVldCxcblxuICAgIGdsb2JhbCA6IHtcbiAgICAgIG5hbWVzcGFjZSA6IHVuZGVmaW5lZFxuICAgIH0sXG5cbiAgICBpbml0IDogZnVuY3Rpb24gKHNjb3BlLCBsaWJyYXJpZXMsIG1ldGhvZCwgb3B0aW9ucywgcmVzcG9uc2UpIHtcbiAgICAgIHZhciBhcmdzID0gW3Njb3BlLCBtZXRob2QsIG9wdGlvbnMsIHJlc3BvbnNlXSxcbiAgICAgICAgICByZXNwb25zZXMgPSBbXTtcblxuICAgICAgLy8gY2hlY2sgUlRMXG4gICAgICB0aGlzLnJ0bCA9IC9ydGwvaS50ZXN0KFMoJ2h0bWwnKS5hdHRyKCdkaXInKSk7XG5cbiAgICAgIC8vIHNldCBmb3VuZGF0aW9uIGdsb2JhbCBzY29wZVxuICAgICAgdGhpcy5zY29wZSA9IHNjb3BlIHx8IHRoaXMuc2NvcGU7XG5cbiAgICAgIHRoaXMuc2V0X25hbWVzcGFjZSgpO1xuXG4gICAgICBpZiAobGlicmFyaWVzICYmIHR5cGVvZiBsaWJyYXJpZXMgPT09ICdzdHJpbmcnICYmICEvcmVmbG93L2kudGVzdChsaWJyYXJpZXMpKSB7XG4gICAgICAgIGlmICh0aGlzLmxpYnMuaGFzT3duUHJvcGVydHkobGlicmFyaWVzKSkge1xuICAgICAgICAgIHJlc3BvbnNlcy5wdXNoKHRoaXMuaW5pdF9saWIobGlicmFyaWVzLCBhcmdzKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAodmFyIGxpYiBpbiB0aGlzLmxpYnMpIHtcbiAgICAgICAgICByZXNwb25zZXMucHVzaCh0aGlzLmluaXRfbGliKGxpYiwgbGlicmFyaWVzKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgUyh3aW5kb3cpLmxvYWQoZnVuY3Rpb24gKCkge1xuICAgICAgICBTKHdpbmRvdylcbiAgICAgICAgICAudHJpZ2dlcigncmVzaXplLmZuZHRuLmNsZWFyaW5nJylcbiAgICAgICAgICAudHJpZ2dlcigncmVzaXplLmZuZHRuLmRyb3Bkb3duJylcbiAgICAgICAgICAudHJpZ2dlcigncmVzaXplLmZuZHRuLmVxdWFsaXplcicpXG4gICAgICAgICAgLnRyaWdnZXIoJ3Jlc2l6ZS5mbmR0bi5pbnRlcmNoYW5nZScpXG4gICAgICAgICAgLnRyaWdnZXIoJ3Jlc2l6ZS5mbmR0bi5qb3lyaWRlJylcbiAgICAgICAgICAudHJpZ2dlcigncmVzaXplLmZuZHRuLm1hZ2VsbGFuJylcbiAgICAgICAgICAudHJpZ2dlcigncmVzaXplLmZuZHRuLnRvcGJhcicpXG4gICAgICAgICAgLnRyaWdnZXIoJ3Jlc2l6ZS5mbmR0bi5zbGlkZXInKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gc2NvcGU7XG4gICAgfSxcblxuICAgIGluaXRfbGliIDogZnVuY3Rpb24gKGxpYiwgYXJncykge1xuICAgICAgaWYgKHRoaXMubGlicy5oYXNPd25Qcm9wZXJ0eShsaWIpKSB7XG4gICAgICAgIHRoaXMucGF0Y2godGhpcy5saWJzW2xpYl0pO1xuXG4gICAgICAgIGlmIChhcmdzICYmIGFyZ3MuaGFzT3duUHJvcGVydHkobGliKSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmxpYnNbbGliXS5zZXR0aW5ncyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgJC5leHRlbmQodHJ1ZSwgdGhpcy5saWJzW2xpYl0uc2V0dGluZ3MsIGFyZ3NbbGliXSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLmxpYnNbbGliXS5kZWZhdWx0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgJC5leHRlbmQodHJ1ZSwgdGhpcy5saWJzW2xpYl0uZGVmYXVsdHMsIGFyZ3NbbGliXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRoaXMubGlic1tsaWJdLmluaXQuYXBwbHkodGhpcy5saWJzW2xpYl0sIFt0aGlzLnNjb3BlLCBhcmdzW2xpYl1dKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFyZ3MgPSBhcmdzIGluc3RhbmNlb2YgQXJyYXkgPyBhcmdzIDogbmV3IEFycmF5KGFyZ3MpO1xuICAgICAgICByZXR1cm4gdGhpcy5saWJzW2xpYl0uaW5pdC5hcHBseSh0aGlzLmxpYnNbbGliXSwgYXJncyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7fTtcbiAgICB9LFxuXG4gICAgcGF0Y2ggOiBmdW5jdGlvbiAobGliKSB7XG4gICAgICBsaWIuc2NvcGUgPSB0aGlzLnNjb3BlO1xuICAgICAgbGliLm5hbWVzcGFjZSA9IHRoaXMuZ2xvYmFsLm5hbWVzcGFjZTtcbiAgICAgIGxpYi5ydGwgPSB0aGlzLnJ0bDtcbiAgICAgIGxpYlsnZGF0YV9vcHRpb25zJ10gPSB0aGlzLnV0aWxzLmRhdGFfb3B0aW9ucztcbiAgICAgIGxpYlsnYXR0cl9uYW1lJ10gPSBhdHRyX25hbWU7XG4gICAgICBsaWJbJ2FkZF9uYW1lc3BhY2UnXSA9IGFkZF9uYW1lc3BhY2U7XG4gICAgICBsaWJbJ2JpbmRpbmdzJ10gPSBiaW5kaW5ncztcbiAgICAgIGxpYlsnUyddID0gdGhpcy51dGlscy5TO1xuICAgIH0sXG5cbiAgICBpbmhlcml0IDogZnVuY3Rpb24gKHNjb3BlLCBtZXRob2RzKSB7XG4gICAgICB2YXIgbWV0aG9kc19hcnIgPSBtZXRob2RzLnNwbGl0KCcgJyksXG4gICAgICAgICAgaSA9IG1ldGhvZHNfYXJyLmxlbmd0aDtcblxuICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICBpZiAodGhpcy51dGlscy5oYXNPd25Qcm9wZXJ0eShtZXRob2RzX2FycltpXSkpIHtcbiAgICAgICAgICBzY29wZVttZXRob2RzX2FycltpXV0gPSB0aGlzLnV0aWxzW21ldGhvZHNfYXJyW2ldXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBzZXRfbmFtZXNwYWNlIDogZnVuY3Rpb24gKCkge1xuXG4gICAgICAvLyBEZXNjcmlwdGlvbjpcbiAgICAgIC8vICAgIERvbid0IGJvdGhlciByZWFkaW5nIHRoZSBuYW1lc3BhY2Ugb3V0IG9mIHRoZSBtZXRhIHRhZ1xuICAgICAgLy8gICAgaWYgdGhlIG5hbWVzcGFjZSBoYXMgYmVlbiBzZXQgZ2xvYmFsbHkgaW4gamF2YXNjcmlwdFxuICAgICAgLy9cbiAgICAgIC8vIEV4YW1wbGU6XG4gICAgICAvLyAgICBGb3VuZGF0aW9uLmdsb2JhbC5uYW1lc3BhY2UgPSAnbXktbmFtZXNwYWNlJztcbiAgICAgIC8vIG9yIG1ha2UgaXQgYW4gZW1wdHkgc3RyaW5nOlxuICAgICAgLy8gICAgRm91bmRhdGlvbi5nbG9iYWwubmFtZXNwYWNlID0gJyc7XG4gICAgICAvL1xuICAgICAgLy9cblxuICAgICAgLy8gSWYgdGhlIG5hbWVzcGFjZSBoYXMgbm90IGJlZW4gc2V0IChpcyB1bmRlZmluZWQpLCB0cnkgdG8gcmVhZCBpdCBvdXQgb2YgdGhlIG1ldGEgZWxlbWVudC5cbiAgICAgIC8vIE90aGVyd2lzZSB1c2UgdGhlIGdsb2JhbGx5IGRlZmluZWQgbmFtZXNwYWNlLCBldmVuIGlmIGl0J3MgZW1wdHkgKCcnKVxuICAgICAgdmFyIG5hbWVzcGFjZSA9ICggdGhpcy5nbG9iYWwubmFtZXNwYWNlID09PSB1bmRlZmluZWQgKSA/ICQoJy5mb3VuZGF0aW9uLWRhdGEtYXR0cmlidXRlLW5hbWVzcGFjZScpLmNzcygnZm9udC1mYW1pbHknKSA6IHRoaXMuZ2xvYmFsLm5hbWVzcGFjZTtcblxuICAgICAgLy8gRmluYWxseSwgaWYgdGhlIG5hbXNlcGFjZSBpcyBlaXRoZXIgdW5kZWZpbmVkIG9yIGZhbHNlLCBzZXQgaXQgdG8gYW4gZW1wdHkgc3RyaW5nLlxuICAgICAgLy8gT3RoZXJ3aXNlIHVzZSB0aGUgbmFtZXNwYWNlIHZhbHVlLlxuICAgICAgdGhpcy5nbG9iYWwubmFtZXNwYWNlID0gKCBuYW1lc3BhY2UgPT09IHVuZGVmaW5lZCB8fCAvZmFsc2UvaS50ZXN0KG5hbWVzcGFjZSkgKSA/ICcnIDogbmFtZXNwYWNlO1xuICAgIH0sXG5cbiAgICBsaWJzIDoge30sXG5cbiAgICAvLyBtZXRob2RzIHRoYXQgY2FuIGJlIGluaGVyaXRlZCBpbiBsaWJyYXJpZXNcbiAgICB1dGlscyA6IHtcblxuICAgICAgLy8gRGVzY3JpcHRpb246XG4gICAgICAvLyAgICBGYXN0IFNlbGVjdG9yIHdyYXBwZXIgcmV0dXJucyBqUXVlcnkgb2JqZWN0LiBPbmx5IHVzZSB3aGVyZSBnZXRFbGVtZW50QnlJZFxuICAgICAgLy8gICAgaXMgbm90IGF2YWlsYWJsZS5cbiAgICAgIC8vXG4gICAgICAvLyBBcmd1bWVudHM6XG4gICAgICAvLyAgICBTZWxlY3RvciAoU3RyaW5nKTogQ1NTIHNlbGVjdG9yIGRlc2NyaWJpbmcgdGhlIGVsZW1lbnQocykgdG8gYmVcbiAgICAgIC8vICAgIHJldHVybmVkIGFzIGEgalF1ZXJ5IG9iamVjdC5cbiAgICAgIC8vXG4gICAgICAvLyAgICBTY29wZSAoU3RyaW5nKTogQ1NTIHNlbGVjdG9yIGRlc2NyaWJpbmcgdGhlIGFyZWEgdG8gYmUgc2VhcmNoZWQuIERlZmF1bHRcbiAgICAgIC8vICAgIGlzIGRvY3VtZW50LlxuICAgICAgLy9cbiAgICAgIC8vIFJldHVybnM6XG4gICAgICAvLyAgICBFbGVtZW50IChqUXVlcnkgT2JqZWN0KTogalF1ZXJ5IG9iamVjdCBjb250YWluaW5nIGVsZW1lbnRzIG1hdGNoaW5nIHRoZVxuICAgICAgLy8gICAgc2VsZWN0b3Igd2l0aGluIHRoZSBzY29wZS5cbiAgICAgIFMgOiBTLFxuXG4gICAgICAvLyBEZXNjcmlwdGlvbjpcbiAgICAgIC8vICAgIEV4ZWN1dGVzIGEgZnVuY3Rpb24gYSBtYXggb2Ygb25jZSBldmVyeSBuIG1pbGxpc2Vjb25kc1xuICAgICAgLy9cbiAgICAgIC8vIEFyZ3VtZW50czpcbiAgICAgIC8vICAgIEZ1bmMgKEZ1bmN0aW9uKTogRnVuY3Rpb24gdG8gYmUgdGhyb3R0bGVkLlxuICAgICAgLy9cbiAgICAgIC8vICAgIERlbGF5IChJbnRlZ2VyKTogRnVuY3Rpb24gZXhlY3V0aW9uIHRocmVzaG9sZCBpbiBtaWxsaXNlY29uZHMuXG4gICAgICAvL1xuICAgICAgLy8gUmV0dXJuczpcbiAgICAgIC8vICAgIExhenlfZnVuY3Rpb24gKEZ1bmN0aW9uKTogRnVuY3Rpb24gd2l0aCB0aHJvdHRsaW5nIGFwcGxpZWQuXG4gICAgICB0aHJvdHRsZSA6IGZ1bmN0aW9uIChmdW5jLCBkZWxheSkge1xuICAgICAgICB2YXIgdGltZXIgPSBudWxsO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuXG4gICAgICAgICAgaWYgKHRpbWVyID09IG51bGwpIHtcbiAgICAgICAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgICAgICAgIH0sIGRlbGF5KTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9LFxuXG4gICAgICAvLyBEZXNjcmlwdGlvbjpcbiAgICAgIC8vICAgIEV4ZWN1dGVzIGEgZnVuY3Rpb24gd2hlbiBpdCBzdG9wcyBiZWluZyBpbnZva2VkIGZvciBuIHNlY29uZHNcbiAgICAgIC8vICAgIE1vZGlmaWVkIHZlcnNpb24gb2YgXy5kZWJvdW5jZSgpIGh0dHA6Ly91bmRlcnNjb3JlanMub3JnXG4gICAgICAvL1xuICAgICAgLy8gQXJndW1lbnRzOlxuICAgICAgLy8gICAgRnVuYyAoRnVuY3Rpb24pOiBGdW5jdGlvbiB0byBiZSBkZWJvdW5jZWQuXG4gICAgICAvL1xuICAgICAgLy8gICAgRGVsYXkgKEludGVnZXIpOiBGdW5jdGlvbiBleGVjdXRpb24gdGhyZXNob2xkIGluIG1pbGxpc2Vjb25kcy5cbiAgICAgIC8vXG4gICAgICAvLyAgICBJbW1lZGlhdGUgKEJvb2wpOiBXaGV0aGVyIHRoZSBmdW5jdGlvbiBzaG91bGQgYmUgY2FsbGVkIGF0IHRoZSBiZWdpbm5pbmdcbiAgICAgIC8vICAgIG9mIHRoZSBkZWxheSBpbnN0ZWFkIG9mIHRoZSBlbmQuIERlZmF1bHQgaXMgZmFsc2UuXG4gICAgICAvL1xuICAgICAgLy8gUmV0dXJuczpcbiAgICAgIC8vICAgIExhenlfZnVuY3Rpb24gKEZ1bmN0aW9uKTogRnVuY3Rpb24gd2l0aCBkZWJvdW5jaW5nIGFwcGxpZWQuXG4gICAgICBkZWJvdW5jZSA6IGZ1bmN0aW9uIChmdW5jLCBkZWxheSwgaW1tZWRpYXRlKSB7XG4gICAgICAgIHZhciB0aW1lb3V0LCByZXN1bHQ7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgICAgaWYgKCFpbW1lZGlhdGUpIHtcbiAgICAgICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICAgIHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xuICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgZGVsYXkpO1xuICAgICAgICAgIGlmIChjYWxsTm93KSB7XG4gICAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgfSxcblxuICAgICAgLy8gRGVzY3JpcHRpb246XG4gICAgICAvLyAgICBQYXJzZXMgZGF0YS1vcHRpb25zIGF0dHJpYnV0ZVxuICAgICAgLy9cbiAgICAgIC8vIEFyZ3VtZW50czpcbiAgICAgIC8vICAgIEVsIChqUXVlcnkgT2JqZWN0KTogRWxlbWVudCB0byBiZSBwYXJzZWQuXG4gICAgICAvL1xuICAgICAgLy8gUmV0dXJuczpcbiAgICAgIC8vICAgIE9wdGlvbnMgKEphdmFzY3JpcHQgT2JqZWN0KTogQ29udGVudHMgb2YgdGhlIGVsZW1lbnQncyBkYXRhLW9wdGlvbnNcbiAgICAgIC8vICAgIGF0dHJpYnV0ZS5cbiAgICAgIGRhdGFfb3B0aW9ucyA6IGZ1bmN0aW9uIChlbCwgZGF0YV9hdHRyX25hbWUpIHtcbiAgICAgICAgZGF0YV9hdHRyX25hbWUgPSBkYXRhX2F0dHJfbmFtZSB8fCAnb3B0aW9ucyc7XG4gICAgICAgIHZhciBvcHRzID0ge30sIGlpLCBwLCBvcHRzX2FycixcbiAgICAgICAgICAgIGRhdGFfb3B0aW9ucyA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICB2YXIgbmFtZXNwYWNlID0gRm91bmRhdGlvbi5nbG9iYWwubmFtZXNwYWNlO1xuXG4gICAgICAgICAgICAgIGlmIChuYW1lc3BhY2UubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbC5kYXRhKG5hbWVzcGFjZSArICctJyArIGRhdGFfYXR0cl9uYW1lKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHJldHVybiBlbC5kYXRhKGRhdGFfYXR0cl9uYW1lKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgdmFyIGNhY2hlZF9vcHRpb25zID0gZGF0YV9vcHRpb25zKGVsKTtcblxuICAgICAgICBpZiAodHlwZW9mIGNhY2hlZF9vcHRpb25zID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIHJldHVybiBjYWNoZWRfb3B0aW9ucztcbiAgICAgICAgfVxuXG4gICAgICAgIG9wdHNfYXJyID0gKGNhY2hlZF9vcHRpb25zIHx8ICc6Jykuc3BsaXQoJzsnKTtcbiAgICAgICAgaWkgPSBvcHRzX2Fyci5sZW5ndGg7XG5cbiAgICAgICAgZnVuY3Rpb24gaXNOdW1iZXIgKG8pIHtcbiAgICAgICAgICByZXR1cm4gIWlzTmFOIChvIC0gMCkgJiYgbyAhPT0gbnVsbCAmJiBvICE9PSAnJyAmJiBvICE9PSBmYWxzZSAmJiBvICE9PSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gdHJpbSAoc3RyKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBzdHIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gJC50cmltKHN0cik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cblxuICAgICAgICB3aGlsZSAoaWktLSkge1xuICAgICAgICAgIHAgPSBvcHRzX2FycltpaV0uc3BsaXQoJzonKTtcbiAgICAgICAgICBwID0gW3BbMF0sIHAuc2xpY2UoMSkuam9pbignOicpXTtcblxuICAgICAgICAgIGlmICgvdHJ1ZS9pLnRlc3QocFsxXSkpIHtcbiAgICAgICAgICAgIHBbMV0gPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoL2ZhbHNlL2kudGVzdChwWzFdKSkge1xuICAgICAgICAgICAgcFsxXSA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaXNOdW1iZXIocFsxXSkpIHtcbiAgICAgICAgICAgIGlmIChwWzFdLmluZGV4T2YoJy4nKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgcFsxXSA9IHBhcnNlSW50KHBbMV0sIDEwKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHBbMV0gPSBwYXJzZUZsb2F0KHBbMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChwLmxlbmd0aCA9PT0gMiAmJiBwWzBdLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG9wdHNbdHJpbShwWzBdKV0gPSB0cmltKHBbMV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvcHRzO1xuICAgICAgfSxcblxuICAgICAgLy8gRGVzY3JpcHRpb246XG4gICAgICAvLyAgICBBZGRzIEpTLXJlY29nbml6YWJsZSBtZWRpYSBxdWVyaWVzXG4gICAgICAvL1xuICAgICAgLy8gQXJndW1lbnRzOlxuICAgICAgLy8gICAgTWVkaWEgKFN0cmluZyk6IEtleSBzdHJpbmcgZm9yIHRoZSBtZWRpYSBxdWVyeSB0byBiZSBzdG9yZWQgYXMgaW5cbiAgICAgIC8vICAgIEZvdW5kYXRpb24ubWVkaWFfcXVlcmllc1xuICAgICAgLy9cbiAgICAgIC8vICAgIENsYXNzIChTdHJpbmcpOiBDbGFzcyBuYW1lIGZvciB0aGUgZ2VuZXJhdGVkIDxtZXRhPiB0YWdcbiAgICAgIHJlZ2lzdGVyX21lZGlhIDogZnVuY3Rpb24gKG1lZGlhLCBtZWRpYV9jbGFzcykge1xuICAgICAgICBpZiAoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzW21lZGlhXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgJCgnaGVhZCcpLmFwcGVuZCgnPG1ldGEgY2xhc3M9XCInICsgbWVkaWFfY2xhc3MgKyAnXCIvPicpO1xuICAgICAgICAgIEZvdW5kYXRpb24ubWVkaWFfcXVlcmllc1ttZWRpYV0gPSByZW1vdmVRdW90ZXMoJCgnLicgKyBtZWRpYV9jbGFzcykuY3NzKCdmb250LWZhbWlseScpKTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgLy8gRGVzY3JpcHRpb246XG4gICAgICAvLyAgICBBZGQgY3VzdG9tIENTUyB3aXRoaW4gYSBKUy1kZWZpbmVkIG1lZGlhIHF1ZXJ5XG4gICAgICAvL1xuICAgICAgLy8gQXJndW1lbnRzOlxuICAgICAgLy8gICAgUnVsZSAoU3RyaW5nKTogQ1NTIHJ1bGUgdG8gYmUgYXBwZW5kZWQgdG8gdGhlIGRvY3VtZW50LlxuICAgICAgLy9cbiAgICAgIC8vICAgIE1lZGlhIChTdHJpbmcpOiBPcHRpb25hbCBtZWRpYSBxdWVyeSBzdHJpbmcgZm9yIHRoZSBDU1MgcnVsZSB0byBiZVxuICAgICAgLy8gICAgbmVzdGVkIHVuZGVyLlxuICAgICAgYWRkX2N1c3RvbV9ydWxlIDogZnVuY3Rpb24gKHJ1bGUsIG1lZGlhKSB7XG4gICAgICAgIGlmIChtZWRpYSA9PT0gdW5kZWZpbmVkICYmIEZvdW5kYXRpb24uc3R5bGVzaGVldCkge1xuICAgICAgICAgIEZvdW5kYXRpb24uc3R5bGVzaGVldC5pbnNlcnRSdWxlKHJ1bGUsIEZvdW5kYXRpb24uc3R5bGVzaGVldC5jc3NSdWxlcy5sZW5ndGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBxdWVyeSA9IEZvdW5kYXRpb24ubWVkaWFfcXVlcmllc1ttZWRpYV07XG5cbiAgICAgICAgICBpZiAocXVlcnkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgRm91bmRhdGlvbi5zdHlsZXNoZWV0Lmluc2VydFJ1bGUoJ0BtZWRpYSAnICtcbiAgICAgICAgICAgICAgRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzW21lZGlhXSArICd7ICcgKyBydWxlICsgJyB9Jyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICAvLyBEZXNjcmlwdGlvbjpcbiAgICAgIC8vICAgIFBlcmZvcm1zIGEgY2FsbGJhY2sgZnVuY3Rpb24gd2hlbiBhbiBpbWFnZSBpcyBmdWxseSBsb2FkZWRcbiAgICAgIC8vXG4gICAgICAvLyBBcmd1bWVudHM6XG4gICAgICAvLyAgICBJbWFnZSAoalF1ZXJ5IE9iamVjdCk6IEltYWdlKHMpIHRvIGNoZWNrIGlmIGxvYWRlZC5cbiAgICAgIC8vXG4gICAgICAvLyAgICBDYWxsYmFjayAoRnVuY3Rpb24pOiBGdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gaW1hZ2UgaXMgZnVsbHkgbG9hZGVkLlxuICAgICAgaW1hZ2VfbG9hZGVkIDogZnVuY3Rpb24gKGltYWdlcywgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgdW5sb2FkZWQgPSBpbWFnZXMubGVuZ3RoO1xuXG4gICAgICAgIGlmICh1bmxvYWRlZCA9PT0gMCkge1xuICAgICAgICAgIGNhbGxiYWNrKGltYWdlcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpbWFnZXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgc2luZ2xlX2ltYWdlX2xvYWRlZChzZWxmLlModGhpcyksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHVubG9hZGVkIC09IDE7XG4gICAgICAgICAgICBpZiAodW5sb2FkZWQgPT09IDApIHtcbiAgICAgICAgICAgICAgY2FsbGJhY2soaW1hZ2VzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuXG4gICAgICAvLyBEZXNjcmlwdGlvbjpcbiAgICAgIC8vICAgIFJldHVybnMgYSByYW5kb20sIGFscGhhbnVtZXJpYyBzdHJpbmdcbiAgICAgIC8vXG4gICAgICAvLyBBcmd1bWVudHM6XG4gICAgICAvLyAgICBMZW5ndGggKEludGVnZXIpOiBMZW5ndGggb2Ygc3RyaW5nIHRvIGJlIGdlbmVyYXRlZC4gRGVmYXVsdHMgdG8gcmFuZG9tXG4gICAgICAvLyAgICBpbnRlZ2VyLlxuICAgICAgLy9cbiAgICAgIC8vIFJldHVybnM6XG4gICAgICAvLyAgICBSYW5kIChTdHJpbmcpOiBQc2V1ZG8tcmFuZG9tLCBhbHBoYW51bWVyaWMgc3RyaW5nLlxuICAgICAgcmFuZG9tX3N0ciA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmZpZHgpIHtcbiAgICAgICAgICB0aGlzLmZpZHggPSAwO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucHJlZml4ID0gdGhpcy5wcmVmaXggfHwgWyh0aGlzLm5hbWUgfHwgJ0YnKSwgKCtuZXcgRGF0ZSkudG9TdHJpbmcoMzYpXS5qb2luKCctJyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMucHJlZml4ICsgKHRoaXMuZmlkeCsrKS50b1N0cmluZygzNik7XG4gICAgICB9LFxuXG4gICAgICAvLyBEZXNjcmlwdGlvbjpcbiAgICAgIC8vICAgIEhlbHBlciBmb3Igd2luZG93Lm1hdGNoTWVkaWFcbiAgICAgIC8vXG4gICAgICAvLyBBcmd1bWVudHM6XG4gICAgICAvLyAgICBtcSAoU3RyaW5nKTogTWVkaWEgcXVlcnlcbiAgICAgIC8vXG4gICAgICAvLyBSZXR1cm5zOlxuICAgICAgLy8gICAgKEJvb2xlYW4pOiBXaGV0aGVyIHRoZSBtZWRpYSBxdWVyeSBwYXNzZXMgb3Igbm90XG4gICAgICBtYXRjaCA6IGZ1bmN0aW9uIChtcSkge1xuICAgICAgICByZXR1cm4gd2luZG93Lm1hdGNoTWVkaWEobXEpLm1hdGNoZXM7XG4gICAgICB9LFxuXG4gICAgICAvLyBEZXNjcmlwdGlvbjpcbiAgICAgIC8vICAgIEhlbHBlcnMgZm9yIGNoZWNraW5nIEZvdW5kYXRpb24gZGVmYXVsdCBtZWRpYSBxdWVyaWVzIHdpdGggSlNcbiAgICAgIC8vXG4gICAgICAvLyBSZXR1cm5zOlxuICAgICAgLy8gICAgKEJvb2xlYW4pOiBXaGV0aGVyIHRoZSBtZWRpYSBxdWVyeSBwYXNzZXMgb3Igbm90XG5cbiAgICAgIGlzX3NtYWxsX3VwIDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tYXRjaChGb3VuZGF0aW9uLm1lZGlhX3F1ZXJpZXMuc21hbGwpO1xuICAgICAgfSxcblxuICAgICAgaXNfbWVkaXVtX3VwIDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tYXRjaChGb3VuZGF0aW9uLm1lZGlhX3F1ZXJpZXMubWVkaXVtKTtcbiAgICAgIH0sXG5cbiAgICAgIGlzX2xhcmdlX3VwIDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tYXRjaChGb3VuZGF0aW9uLm1lZGlhX3F1ZXJpZXMubGFyZ2UpO1xuICAgICAgfSxcblxuICAgICAgaXNfeGxhcmdlX3VwIDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tYXRjaChGb3VuZGF0aW9uLm1lZGlhX3F1ZXJpZXMueGxhcmdlKTtcbiAgICAgIH0sXG5cbiAgICAgIGlzX3h4bGFyZ2VfdXAgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1hdGNoKEZvdW5kYXRpb24ubWVkaWFfcXVlcmllcy54eGxhcmdlKTtcbiAgICAgIH0sXG5cbiAgICAgIGlzX3NtYWxsX29ubHkgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAhdGhpcy5pc19tZWRpdW1fdXAoKSAmJiAhdGhpcy5pc19sYXJnZV91cCgpICYmICF0aGlzLmlzX3hsYXJnZV91cCgpICYmICF0aGlzLmlzX3h4bGFyZ2VfdXAoKTtcbiAgICAgIH0sXG5cbiAgICAgIGlzX21lZGl1bV9vbmx5IDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc19tZWRpdW1fdXAoKSAmJiAhdGhpcy5pc19sYXJnZV91cCgpICYmICF0aGlzLmlzX3hsYXJnZV91cCgpICYmICF0aGlzLmlzX3h4bGFyZ2VfdXAoKTtcbiAgICAgIH0sXG5cbiAgICAgIGlzX2xhcmdlX29ubHkgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzX21lZGl1bV91cCgpICYmIHRoaXMuaXNfbGFyZ2VfdXAoKSAmJiAhdGhpcy5pc194bGFyZ2VfdXAoKSAmJiAhdGhpcy5pc194eGxhcmdlX3VwKCk7XG4gICAgICB9LFxuXG4gICAgICBpc194bGFyZ2Vfb25seSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNfbWVkaXVtX3VwKCkgJiYgdGhpcy5pc19sYXJnZV91cCgpICYmIHRoaXMuaXNfeGxhcmdlX3VwKCkgJiYgIXRoaXMuaXNfeHhsYXJnZV91cCgpO1xuICAgICAgfSxcblxuICAgICAgaXNfeHhsYXJnZV9vbmx5IDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc19tZWRpdW1fdXAoKSAmJiB0aGlzLmlzX2xhcmdlX3VwKCkgJiYgdGhpcy5pc194bGFyZ2VfdXAoKSAmJiB0aGlzLmlzX3h4bGFyZ2VfdXAoKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgJC5mbi5mb3VuZGF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcblxuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgRm91bmRhdGlvbi5pbml0LmFwcGx5KEZvdW5kYXRpb24sIFt0aGlzXS5jb25jYXQoYXJncykpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSk7XG4gIH07XG5cbn0oalF1ZXJ5LCB3aW5kb3csIHdpbmRvdy5kb2N1bWVudCkpO1xuXG47KGZ1bmN0aW9uICgkLCB3aW5kb3csIGRvY3VtZW50LCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIEZvdW5kYXRpb24ubGlicy5hYmlkZSA9IHtcbiAgICBuYW1lIDogJ2FiaWRlJyxcblxuICAgIHZlcnNpb24gOiAnNS41LjEnLFxuXG4gICAgc2V0dGluZ3MgOiB7XG4gICAgICBsaXZlX3ZhbGlkYXRlIDogdHJ1ZSxcbiAgICAgIHZhbGlkYXRlX29uX2JsdXIgOiB0cnVlLFxuICAgICAgZm9jdXNfb25faW52YWxpZCA6IHRydWUsXG4gICAgICBlcnJvcl9sYWJlbHMgOiB0cnVlLCAvLyBsYWJlbHMgd2l0aCBhIGZvcj1cImlucHV0SWRcIiB3aWxsIHJlY2lldmUgYW4gYGVycm9yYCBjbGFzc1xuICAgICAgZXJyb3JfY2xhc3MgOiAnZXJyb3InLFxuICAgICAgdGltZW91dCA6IDEwMDAsXG4gICAgICBwYXR0ZXJucyA6IHtcbiAgICAgICAgYWxwaGEgOiAvXlthLXpBLVpdKyQvLFxuICAgICAgICBhbHBoYV9udW1lcmljIDogL15bYS16QS1aMC05XSskLyxcbiAgICAgICAgaW50ZWdlciA6IC9eWy0rXT9cXGQrJC8sXG4gICAgICAgIG51bWJlciA6IC9eWy0rXT9cXGQqKD86W1xcLlxcLF1cXGQrKT8kLyxcblxuICAgICAgICAvLyBhbWV4LCB2aXNhLCBkaW5lcnNcbiAgICAgICAgY2FyZCA6IC9eKD86NFswLTldezEyfSg/OlswLTldezN9KT98NVsxLTVdWzAtOV17MTR9fDYoPzowMTF8NVswLTldWzAtOV0pWzAtOV17MTJ9fDNbNDddWzAtOV17MTN9fDMoPzowWzAtNV18WzY4XVswLTldKVswLTldezExfXwoPzoyMTMxfDE4MDB8MzVcXGR7M30pXFxkezExfSkkLyxcbiAgICAgICAgY3Z2IDogL14oWzAtOV0pezMsNH0kLyxcblxuICAgICAgICAvLyBodHRwOi8vd3d3LndoYXR3Zy5vcmcvc3BlY3Mvd2ViLWFwcHMvY3VycmVudC13b3JrL211bHRpcGFnZS9zdGF0ZXMtb2YtdGhlLXR5cGUtYXR0cmlidXRlLmh0bWwjdmFsaWQtZS1tYWlsLWFkZHJlc3NcbiAgICAgICAgZW1haWwgOiAvXlthLXpBLVowLTkuISMkJSYnKitcXC89P15fYHt8fX4tXStAW2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/KD86XFwuW2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/KSskLyxcblxuICAgICAgICB1cmwgOiAvXihodHRwcz98ZnRwfGZpbGV8c3NoKTpcXC9cXC8oKCgoW2EtekEtWl18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KCVbXFxkYS1mXXsyfSl8WyFcXCQmJ1xcKFxcKVxcKlxcKyw7PV18OikqQCk/KCgoXFxkfFsxLTldXFxkfDFcXGRcXGR8MlswLTRdXFxkfDI1WzAtNV0pXFwuKFxcZHxbMS05XVxcZHwxXFxkXFxkfDJbMC00XVxcZHwyNVswLTVdKVxcLihcXGR8WzEtOV1cXGR8MVxcZFxcZHwyWzAtNF1cXGR8MjVbMC01XSlcXC4oXFxkfFsxLTldXFxkfDFcXGRcXGR8MlswLTRdXFxkfDI1WzAtNV0pKXwoKChbYS16QS1aXXxcXGR8W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCgoW2EtekEtWl18XFxkfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKShbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSooW2EtekEtWl18XFxkfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSkpXFwuKSsoKFthLXpBLVpdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoKFthLXpBLVpdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKShbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSooW2EtekEtWl18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKSlcXC4/KSg6XFxkKik/KShcXC8oKChbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoJVtcXGRhLWZdezJ9KXxbIVxcJCYnXFwoXFwpXFwqXFwrLDs9XXw6fEApKyhcXC8oKFthLXpBLVpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCglW1xcZGEtZl17Mn0pfFshXFwkJidcXChcXClcXCpcXCssOz1dfDp8QCkqKSopPyk/KFxcPygoKFthLXpBLVpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCglW1xcZGEtZl17Mn0pfFshXFwkJidcXChcXClcXCpcXCssOz1dfDp8QCl8W1xcdUUwMDAtXFx1RjhGRl18XFwvfFxcPykqKT8oXFwjKCgoW2EtekEtWl18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KCVbXFxkYS1mXXsyfSl8WyFcXCQmJ1xcKFxcKVxcKlxcKyw7PV18OnxAKXxcXC98XFw/KSopPyQvLFxuICAgICAgICAvLyBhYmMuZGVcbiAgICAgICAgZG9tYWluIDogL14oW2EtekEtWjAtOV0oW2EtekEtWjAtOVxcLV17MCw2MX1bYS16QS1aMC05XSk/XFwuKStbYS16QS1aXXsyLDh9JC8sXG5cbiAgICAgICAgZGF0ZXRpbWUgOiAvXihbMC0yXVswLTldezN9KVxcLShbMC0xXVswLTldKVxcLShbMC0zXVswLTldKVQoWzAtNV1bMC05XSlcXDooWzAtNV1bMC05XSlcXDooWzAtNV1bMC05XSkoWnwoW1xcLVxcK10oWzAtMV1bMC05XSlcXDowMCkpJC8sXG4gICAgICAgIC8vIFlZWVktTU0tRERcbiAgICAgICAgZGF0ZSA6IC8oPzoxOXwyMClbMC05XXsyfS0oPzooPzowWzEtOV18MVswLTJdKS0oPzowWzEtOV18MVswLTldfDJbMC05XSl8KD86KD8hMDIpKD86MFsxLTldfDFbMC0yXSktKD86MzApKXwoPzooPzowWzEzNTc4XXwxWzAyXSktMzEpKSQvLFxuICAgICAgICAvLyBISDpNTTpTU1xuICAgICAgICB0aW1lIDogL14oMFswLTldfDFbMC05XXwyWzAtM10pKDpbMC01XVswLTldKXsyfSQvLFxuICAgICAgICBkYXRlSVNPIDogL15cXGR7NH1bXFwvXFwtXVxcZHsxLDJ9W1xcL1xcLV1cXGR7MSwyfSQvLFxuICAgICAgICAvLyBNTS9ERC9ZWVlZXG4gICAgICAgIG1vbnRoX2RheV95ZWFyIDogL14oMFsxLTldfDFbMDEyXSlbLSBcXC8uXSgwWzEtOV18WzEyXVswLTldfDNbMDFdKVstIFxcLy5dXFxkezR9JC8sXG4gICAgICAgIC8vIEREL01NL1lZWVlcbiAgICAgICAgZGF5X21vbnRoX3llYXIgOiAvXigwWzEtOV18WzEyXVswLTldfDNbMDFdKVstIFxcLy5dKDBbMS05XXwxWzAxMl0pWy0gXFwvLl1cXGR7NH0kLyxcblxuICAgICAgICAvLyAjRkZGIG9yICNGRkZGRkZcbiAgICAgICAgY29sb3IgOiAvXiM/KFthLWZBLUYwLTldezZ9fFthLWZBLUYwLTldezN9KSQvXG4gICAgICB9LFxuICAgICAgdmFsaWRhdG9ycyA6IHtcbiAgICAgICAgZXF1YWxUbyA6IGZ1bmN0aW9uIChlbCwgcmVxdWlyZWQsIHBhcmVudCkge1xuICAgICAgICAgIHZhciBmcm9tICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGVsLmdldEF0dHJpYnV0ZSh0aGlzLmFkZF9uYW1lc3BhY2UoJ2RhdGEtZXF1YWx0bycpKSkudmFsdWUsXG4gICAgICAgICAgICAgIHRvICAgID0gZWwudmFsdWUsXG4gICAgICAgICAgICAgIHZhbGlkID0gKGZyb20gPT09IHRvKTtcblxuICAgICAgICAgIHJldHVybiB2YWxpZDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICB0aW1lciA6IG51bGwsXG5cbiAgICBpbml0IDogZnVuY3Rpb24gKHNjb3BlLCBtZXRob2QsIG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuYmluZGluZ3MobWV0aG9kLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgZXZlbnRzIDogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgZm9ybSA9IHNlbGYuUyhzY29wZSkuYXR0cignbm92YWxpZGF0ZScsICdub3ZhbGlkYXRlJyksXG4gICAgICAgICAgc2V0dGluZ3MgPSBmb3JtLmRhdGEodGhpcy5hdHRyX25hbWUodHJ1ZSkgKyAnLWluaXQnKSB8fCB7fTtcblxuICAgICAgdGhpcy5pbnZhbGlkX2F0dHIgPSB0aGlzLmFkZF9uYW1lc3BhY2UoJ2RhdGEtaW52YWxpZCcpO1xuXG4gICAgICBmb3JtXG4gICAgICAgIC5vZmYoJy5hYmlkZScpXG4gICAgICAgIC5vbignc3VibWl0LmZuZHRuLmFiaWRlIHZhbGlkYXRlLmZuZHRuLmFiaWRlJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICB2YXIgaXNfYWpheCA9IC9hamF4L2kudGVzdChzZWxmLlModGhpcykuYXR0cihzZWxmLmF0dHJfbmFtZSgpKSk7XG4gICAgICAgICAgcmV0dXJuIHNlbGYudmFsaWRhdGUoc2VsZi5TKHRoaXMpLmZpbmQoJ2lucHV0LCB0ZXh0YXJlYSwgc2VsZWN0JykuZ2V0KCksIGUsIGlzX2FqYXgpO1xuICAgICAgICB9KVxuICAgICAgICAub24oJ3Jlc2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBzZWxmLnJlc2V0KCQodGhpcykpO1xuICAgICAgICB9KVxuICAgICAgICAuZmluZCgnaW5wdXQsIHRleHRhcmVhLCBzZWxlY3QnKVxuICAgICAgICAgIC5vZmYoJy5hYmlkZScpXG4gICAgICAgICAgLm9uKCdibHVyLmZuZHRuLmFiaWRlIGNoYW5nZS5mbmR0bi5hYmlkZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBpZiAoc2V0dGluZ3MudmFsaWRhdGVfb25fYmx1ciA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICBzZWxmLnZhbGlkYXRlKFt0aGlzXSwgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgICAub24oJ2tleWRvd24uZm5kdG4uYWJpZGUnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKHNldHRpbmdzLmxpdmVfdmFsaWRhdGUgPT09IHRydWUgJiYgZS53aGljaCAhPSA5KSB7XG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dChzZWxmLnRpbWVyKTtcbiAgICAgICAgICAgICAgc2VsZi50aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNlbGYudmFsaWRhdGUoW3RoaXNdLCBlKTtcbiAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpLCBzZXR0aW5ncy50aW1lb3V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgcmVzZXQgOiBmdW5jdGlvbiAoZm9ybSkge1xuICAgICAgZm9ybS5yZW1vdmVBdHRyKHRoaXMuaW52YWxpZF9hdHRyKTtcbiAgICAgICQodGhpcy5pbnZhbGlkX2F0dHIsIGZvcm0pLnJlbW92ZUF0dHIodGhpcy5pbnZhbGlkX2F0dHIpO1xuICAgICAgJCgnLicgKyB0aGlzLnNldHRpbmdzLmVycm9yX2NsYXNzLCBmb3JtKS5ub3QoJ3NtYWxsJykucmVtb3ZlQ2xhc3ModGhpcy5zZXR0aW5ncy5lcnJvcl9jbGFzcyk7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlIDogZnVuY3Rpb24gKGVscywgZSwgaXNfYWpheCkge1xuICAgICAgdmFyIHZhbGlkYXRpb25zID0gdGhpcy5wYXJzZV9wYXR0ZXJucyhlbHMpLFxuICAgICAgICAgIHZhbGlkYXRpb25fY291bnQgPSB2YWxpZGF0aW9ucy5sZW5ndGgsXG4gICAgICAgICAgZm9ybSA9IHRoaXMuUyhlbHNbMF0pLmNsb3Nlc3QoJ2Zvcm0nKSxcbiAgICAgICAgICBzdWJtaXRfZXZlbnQgPSAvc3VibWl0Ly50ZXN0KGUudHlwZSk7XG5cbiAgICAgIC8vIEhhcyB0byBjb3VudCB1cCB0byBtYWtlIHN1cmUgdGhlIGZvY3VzIGdldHMgYXBwbGllZCB0byB0aGUgdG9wIGVycm9yXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbGlkYXRpb25fY291bnQ7IGkrKykge1xuICAgICAgICBpZiAoIXZhbGlkYXRpb25zW2ldICYmIChzdWJtaXRfZXZlbnQgfHwgaXNfYWpheCkpIHtcbiAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5mb2N1c19vbl9pbnZhbGlkKSB7XG4gICAgICAgICAgICBlbHNbaV0uZm9jdXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm9ybS50cmlnZ2VyKCdpbnZhbGlkJykudHJpZ2dlcignaW52YWxpZC5mbmR0bi5hYmlkZScpO1xuICAgICAgICAgIHRoaXMuUyhlbHNbaV0pLmNsb3Nlc3QoJ2Zvcm0nKS5hdHRyKHRoaXMuaW52YWxpZF9hdHRyLCAnJyk7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChzdWJtaXRfZXZlbnQgfHwgaXNfYWpheCkge1xuICAgICAgICBmb3JtLnRyaWdnZXIoJ3ZhbGlkJykudHJpZ2dlcigndmFsaWQuZm5kdG4uYWJpZGUnKTtcbiAgICAgIH1cblxuICAgICAgZm9ybS5yZW1vdmVBdHRyKHRoaXMuaW52YWxpZF9hdHRyKTtcblxuICAgICAgaWYgKGlzX2FqYXgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuXG4gICAgcGFyc2VfcGF0dGVybnMgOiBmdW5jdGlvbiAoZWxzKSB7XG4gICAgICB2YXIgaSA9IGVscy5sZW5ndGgsXG4gICAgICAgICAgZWxfcGF0dGVybnMgPSBbXTtcblxuICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICBlbF9wYXR0ZXJucy5wdXNoKHRoaXMucGF0dGVybihlbHNbaV0pKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuY2hlY2tfdmFsaWRhdGlvbl9hbmRfYXBwbHlfc3R5bGVzKGVsX3BhdHRlcm5zKTtcbiAgICB9LFxuXG4gICAgcGF0dGVybiA6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgdmFyIHR5cGUgPSBlbC5nZXRBdHRyaWJ1dGUoJ3R5cGUnKSxcbiAgICAgICAgICByZXF1aXJlZCA9IHR5cGVvZiBlbC5nZXRBdHRyaWJ1dGUoJ3JlcXVpcmVkJykgPT09ICdzdHJpbmcnO1xuXG4gICAgICB2YXIgcGF0dGVybiA9IGVsLmdldEF0dHJpYnV0ZSgncGF0dGVybicpIHx8ICcnO1xuXG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy5wYXR0ZXJucy5oYXNPd25Qcm9wZXJ0eShwYXR0ZXJuKSAmJiBwYXR0ZXJuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIFtlbCwgdGhpcy5zZXR0aW5ncy5wYXR0ZXJuc1twYXR0ZXJuXSwgcmVxdWlyZWRdO1xuICAgICAgfSBlbHNlIGlmIChwYXR0ZXJuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIFtlbCwgbmV3IFJlZ0V4cChwYXR0ZXJuKSwgcmVxdWlyZWRdO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy5wYXR0ZXJucy5oYXNPd25Qcm9wZXJ0eSh0eXBlKSkge1xuICAgICAgICByZXR1cm4gW2VsLCB0aGlzLnNldHRpbmdzLnBhdHRlcm5zW3R5cGVdLCByZXF1aXJlZF07XG4gICAgICB9XG5cbiAgICAgIHBhdHRlcm4gPSAvLiovO1xuXG4gICAgICByZXR1cm4gW2VsLCBwYXR0ZXJuLCByZXF1aXJlZF07XG4gICAgfSxcblxuICAgIC8vIFRPRE86IEJyZWFrIHRoaXMgdXAgaW50byBzbWFsbGVyIG1ldGhvZHMsIGdldHRpbmcgaGFyZCB0byByZWFkLlxuICAgIGNoZWNrX3ZhbGlkYXRpb25fYW5kX2FwcGx5X3N0eWxlcyA6IGZ1bmN0aW9uIChlbF9wYXR0ZXJucykge1xuICAgICAgdmFyIGkgPSBlbF9wYXR0ZXJucy5sZW5ndGgsXG4gICAgICAgICAgdmFsaWRhdGlvbnMgPSBbXSxcbiAgICAgICAgICBmb3JtID0gdGhpcy5TKGVsX3BhdHRlcm5zWzBdWzBdKS5jbG9zZXN0KCdbZGF0YS0nICsgdGhpcy5hdHRyX25hbWUodHJ1ZSkgKyAnXScpLFxuICAgICAgICAgIHNldHRpbmdzID0gZm9ybS5kYXRhKHRoaXMuYXR0cl9uYW1lKHRydWUpICsgJy1pbml0JykgfHwge307XG4gICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIHZhciBlbCA9IGVsX3BhdHRlcm5zW2ldWzBdLFxuICAgICAgICAgICAgcmVxdWlyZWQgPSBlbF9wYXR0ZXJuc1tpXVsyXSxcbiAgICAgICAgICAgIHZhbHVlID0gZWwudmFsdWUudHJpbSgpLFxuICAgICAgICAgICAgZGlyZWN0X3BhcmVudCA9IHRoaXMuUyhlbCkucGFyZW50KCksXG4gICAgICAgICAgICB2YWxpZGF0b3IgPSBlbC5nZXRBdHRyaWJ1dGUodGhpcy5hZGRfbmFtZXNwYWNlKCdkYXRhLWFiaWRlLXZhbGlkYXRvcicpKSxcbiAgICAgICAgICAgIGlzX3JhZGlvID0gZWwudHlwZSA9PT0gJ3JhZGlvJyxcbiAgICAgICAgICAgIGlzX2NoZWNrYm94ID0gZWwudHlwZSA9PT0gJ2NoZWNrYm94JyxcbiAgICAgICAgICAgIGxhYmVsID0gdGhpcy5TKCdsYWJlbFtmb3I9XCInICsgZWwuZ2V0QXR0cmlidXRlKCdpZCcpICsgJ1wiXScpLFxuICAgICAgICAgICAgdmFsaWRfbGVuZ3RoID0gKHJlcXVpcmVkKSA/IChlbC52YWx1ZS5sZW5ndGggPiAwKSA6IHRydWUsXG4gICAgICAgICAgICBlbF92YWxpZGF0aW9ucyA9IFtdO1xuXG4gICAgICAgIHZhciBwYXJlbnQsIHZhbGlkO1xuXG4gICAgICAgIC8vIHN1cHBvcnQgb2xkIHdheSB0byBkbyBlcXVhbFRvIHZhbGlkYXRpb25zXG4gICAgICAgIGlmIChlbC5nZXRBdHRyaWJ1dGUodGhpcy5hZGRfbmFtZXNwYWNlKCdkYXRhLWVxdWFsdG8nKSkpIHsgdmFsaWRhdG9yID0gJ2VxdWFsVG8nIH1cblxuICAgICAgICBpZiAoIWRpcmVjdF9wYXJlbnQuaXMoJ2xhYmVsJykpIHtcbiAgICAgICAgICBwYXJlbnQgPSBkaXJlY3RfcGFyZW50O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBhcmVudCA9IGRpcmVjdF9wYXJlbnQucGFyZW50KCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsaWRhdG9yKSB7XG4gICAgICAgICAgdmFsaWQgPSB0aGlzLnNldHRpbmdzLnZhbGlkYXRvcnNbdmFsaWRhdG9yXS5hcHBseSh0aGlzLCBbZWwsIHJlcXVpcmVkLCBwYXJlbnRdKTtcbiAgICAgICAgICBlbF92YWxpZGF0aW9ucy5wdXNoKHZhbGlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc19yYWRpbyAmJiByZXF1aXJlZCkge1xuICAgICAgICAgIGVsX3ZhbGlkYXRpb25zLnB1c2godGhpcy52YWxpZF9yYWRpbyhlbCwgcmVxdWlyZWQpKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc19jaGVja2JveCAmJiByZXF1aXJlZCkge1xuICAgICAgICAgIGVsX3ZhbGlkYXRpb25zLnB1c2godGhpcy52YWxpZF9jaGVja2JveChlbCwgcmVxdWlyZWQpKTtcbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgIGlmIChlbF9wYXR0ZXJuc1tpXVsxXS50ZXN0KHZhbHVlKSAmJiB2YWxpZF9sZW5ndGggfHxcbiAgICAgICAgICAgICFyZXF1aXJlZCAmJiBlbC52YWx1ZS5sZW5ndGggPCAxIHx8ICQoZWwpLmF0dHIoJ2Rpc2FibGVkJykpIHtcbiAgICAgICAgICAgIGVsX3ZhbGlkYXRpb25zLnB1c2godHJ1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsX3ZhbGlkYXRpb25zLnB1c2goZmFsc2UpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGVsX3ZhbGlkYXRpb25zID0gW2VsX3ZhbGlkYXRpb25zLmV2ZXJ5KGZ1bmN0aW9uICh2YWxpZCkge3JldHVybiB2YWxpZDt9KV07XG5cbiAgICAgICAgICBpZiAoZWxfdmFsaWRhdGlvbnNbMF0pIHtcbiAgICAgICAgICAgIHRoaXMuUyhlbCkucmVtb3ZlQXR0cih0aGlzLmludmFsaWRfYXR0cik7XG4gICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaW52YWxpZCcsICdmYWxzZScpO1xuICAgICAgICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKCdhcmlhLWRlc2NyaWJlZGJ5Jyk7XG4gICAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2xhc3ModGhpcy5zZXR0aW5ncy5lcnJvcl9jbGFzcyk7XG4gICAgICAgICAgICBpZiAobGFiZWwubGVuZ3RoID4gMCAmJiB0aGlzLnNldHRpbmdzLmVycm9yX2xhYmVscykge1xuICAgICAgICAgICAgICBsYWJlbC5yZW1vdmVDbGFzcyh0aGlzLnNldHRpbmdzLmVycm9yX2NsYXNzKS5yZW1vdmVBdHRyKCdyb2xlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkKGVsKS50cmlnZ2VySGFuZGxlcigndmFsaWQnKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5TKGVsKS5hdHRyKHRoaXMuaW52YWxpZF9hdHRyLCAnJyk7XG4gICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaW52YWxpZCcsICd0cnVlJyk7XG5cbiAgICAgICAgICAgIC8vIFRyeSB0byBmaW5kIHRoZSBlcnJvciBhc3NvY2lhdGVkIHdpdGggdGhlIGlucHV0XG4gICAgICAgICAgICB2YXIgZXJyb3JFbGVtID0gcGFyZW50LmZpbmQoJ3NtYWxsLicgKyB0aGlzLnNldHRpbmdzLmVycm9yX2NsYXNzLCAnc3Bhbi4nICsgdGhpcy5zZXR0aW5ncy5lcnJvcl9jbGFzcyk7XG4gICAgICAgICAgICB2YXIgZXJyb3JJRCA9IGVycm9yRWxlbS5sZW5ndGggPiAwID8gZXJyb3JFbGVtWzBdLmlkIDogJyc7XG4gICAgICAgICAgICBpZiAoZXJyb3JJRC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZSgnYXJpYS1kZXNjcmliZWRieScsIGVycm9ySUQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBlbC5zZXRBdHRyaWJ1dGUoJ2FyaWEtZGVzY3JpYmVkYnknLCAkKGVsKS5maW5kKCcuZXJyb3InKVswXS5pZCk7XG4gICAgICAgICAgICBwYXJlbnQuYWRkQ2xhc3ModGhpcy5zZXR0aW5ncy5lcnJvcl9jbGFzcyk7XG4gICAgICAgICAgICBpZiAobGFiZWwubGVuZ3RoID4gMCAmJiB0aGlzLnNldHRpbmdzLmVycm9yX2xhYmVscykge1xuICAgICAgICAgICAgICBsYWJlbC5hZGRDbGFzcyh0aGlzLnNldHRpbmdzLmVycm9yX2NsYXNzKS5hdHRyKCdyb2xlJywgJ2FsZXJ0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkKGVsKS50cmlnZ2VySGFuZGxlcignaW52YWxpZCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YWxpZGF0aW9ucy5wdXNoKGVsX3ZhbGlkYXRpb25zWzBdKTtcbiAgICAgIH1cbiAgICAgIHZhbGlkYXRpb25zID0gW3ZhbGlkYXRpb25zLmV2ZXJ5KGZ1bmN0aW9uICh2YWxpZCkge3JldHVybiB2YWxpZDt9KV07XG4gICAgICByZXR1cm4gdmFsaWRhdGlvbnM7XG4gICAgfSxcblxuICAgIHZhbGlkX2NoZWNrYm94IDogZnVuY3Rpb24gKGVsLCByZXF1aXJlZCkge1xuICAgICAgdmFyIGVsID0gdGhpcy5TKGVsKSxcbiAgICAgICAgICB2YWxpZCA9IChlbC5pcygnOmNoZWNrZWQnKSB8fCAhcmVxdWlyZWQgfHwgZWwuZ2V0KDApLmdldEF0dHJpYnV0ZSgnZGlzYWJsZWQnKSk7XG5cbiAgICAgIGlmICh2YWxpZCkge1xuICAgICAgICBlbC5yZW1vdmVBdHRyKHRoaXMuaW52YWxpZF9hdHRyKS5wYXJlbnQoKS5yZW1vdmVDbGFzcyh0aGlzLnNldHRpbmdzLmVycm9yX2NsYXNzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLmF0dHIodGhpcy5pbnZhbGlkX2F0dHIsICcnKS5wYXJlbnQoKS5hZGRDbGFzcyh0aGlzLnNldHRpbmdzLmVycm9yX2NsYXNzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHZhbGlkO1xuICAgIH0sXG5cbiAgICB2YWxpZF9yYWRpbyA6IGZ1bmN0aW9uIChlbCwgcmVxdWlyZWQpIHtcbiAgICAgIHZhciBuYW1lID0gZWwuZ2V0QXR0cmlidXRlKCduYW1lJyksXG4gICAgICAgICAgZ3JvdXAgPSB0aGlzLlMoZWwpLmNsb3Nlc3QoJ1tkYXRhLScgKyB0aGlzLmF0dHJfbmFtZSh0cnVlKSArICddJykuZmluZChcIltuYW1lPSdcIiArIG5hbWUgKyBcIiddXCIpLFxuICAgICAgICAgIGNvdW50ID0gZ3JvdXAubGVuZ3RoLFxuICAgICAgICAgIHZhbGlkID0gZmFsc2UsXG4gICAgICAgICAgZGlzYWJsZWQgPSBmYWxzZTtcblxuICAgICAgLy8gSGFzIHRvIGNvdW50IHVwIHRvIG1ha2Ugc3VyZSB0aGUgZm9jdXMgZ2V0cyBhcHBsaWVkIHRvIHRoZSB0b3AgZXJyb3JcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgaWYoIGdyb3VwW2ldLmdldEF0dHJpYnV0ZSgnZGlzYWJsZWQnKSApe1xuICAgICAgICAgICAgICAgIGRpc2FibGVkPXRydWU7XG4gICAgICAgICAgICAgICAgdmFsaWQ9dHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGdyb3VwW2ldLmNoZWNrZWQpe1xuICAgICAgICAgICAgICAgICAgICB2YWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYoIGRpc2FibGVkICl7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxpZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgIC8vIEhhcyB0byBjb3VudCB1cCB0byBtYWtlIHN1cmUgdGhlIGZvY3VzIGdldHMgYXBwbGllZCB0byB0aGUgdG9wIGVycm9yXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgaWYgKHZhbGlkKSB7XG4gICAgICAgICAgdGhpcy5TKGdyb3VwW2ldKS5yZW1vdmVBdHRyKHRoaXMuaW52YWxpZF9hdHRyKS5wYXJlbnQoKS5yZW1vdmVDbGFzcyh0aGlzLnNldHRpbmdzLmVycm9yX2NsYXNzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLlMoZ3JvdXBbaV0pLmF0dHIodGhpcy5pbnZhbGlkX2F0dHIsICcnKS5wYXJlbnQoKS5hZGRDbGFzcyh0aGlzLnNldHRpbmdzLmVycm9yX2NsYXNzKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdmFsaWQ7XG4gICAgfSxcblxuICAgIHZhbGlkX2VxdWFsIDogZnVuY3Rpb24gKGVsLCByZXF1aXJlZCwgcGFyZW50KSB7XG4gICAgICB2YXIgZnJvbSAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChlbC5nZXRBdHRyaWJ1dGUodGhpcy5hZGRfbmFtZXNwYWNlKCdkYXRhLWVxdWFsdG8nKSkpLnZhbHVlLFxuICAgICAgICAgIHRvICAgID0gZWwudmFsdWUsXG4gICAgICAgICAgdmFsaWQgPSAoZnJvbSA9PT0gdG8pO1xuXG4gICAgICBpZiAodmFsaWQpIHtcbiAgICAgICAgdGhpcy5TKGVsKS5yZW1vdmVBdHRyKHRoaXMuaW52YWxpZF9hdHRyKTtcbiAgICAgICAgcGFyZW50LnJlbW92ZUNsYXNzKHRoaXMuc2V0dGluZ3MuZXJyb3JfY2xhc3MpO1xuICAgICAgICBpZiAobGFiZWwubGVuZ3RoID4gMCAmJiBzZXR0aW5ncy5lcnJvcl9sYWJlbHMpIHtcbiAgICAgICAgICBsYWJlbC5yZW1vdmVDbGFzcyh0aGlzLnNldHRpbmdzLmVycm9yX2NsYXNzKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5TKGVsKS5hdHRyKHRoaXMuaW52YWxpZF9hdHRyLCAnJyk7XG4gICAgICAgIHBhcmVudC5hZGRDbGFzcyh0aGlzLnNldHRpbmdzLmVycm9yX2NsYXNzKTtcbiAgICAgICAgaWYgKGxhYmVsLmxlbmd0aCA+IDAgJiYgc2V0dGluZ3MuZXJyb3JfbGFiZWxzKSB7XG4gICAgICAgICAgbGFiZWwuYWRkQ2xhc3ModGhpcy5zZXR0aW5ncy5lcnJvcl9jbGFzcyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHZhbGlkO1xuICAgIH0sXG5cbiAgICB2YWxpZF9vbmVvZiA6IGZ1bmN0aW9uIChlbCwgcmVxdWlyZWQsIHBhcmVudCwgZG9Ob3RWYWxpZGF0ZU90aGVycykge1xuICAgICAgdmFyIGVsID0gdGhpcy5TKGVsKSxcbiAgICAgICAgb3RoZXJzID0gdGhpcy5TKCdbJyArIHRoaXMuYWRkX25hbWVzcGFjZSgnZGF0YS1vbmVvZicpICsgJ10nKSxcbiAgICAgICAgdmFsaWQgPSBvdGhlcnMuZmlsdGVyKCc6Y2hlY2tlZCcpLmxlbmd0aCA+IDA7XG5cbiAgICAgIGlmICh2YWxpZCkge1xuICAgICAgICBlbC5yZW1vdmVBdHRyKHRoaXMuaW52YWxpZF9hdHRyKS5wYXJlbnQoKS5yZW1vdmVDbGFzcyh0aGlzLnNldHRpbmdzLmVycm9yX2NsYXNzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLmF0dHIodGhpcy5pbnZhbGlkX2F0dHIsICcnKS5wYXJlbnQoKS5hZGRDbGFzcyh0aGlzLnNldHRpbmdzLmVycm9yX2NsYXNzKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFkb05vdFZhbGlkYXRlT3RoZXJzKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIG90aGVycy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBfdGhpcy52YWxpZF9vbmVvZi5jYWxsKF90aGlzLCB0aGlzLCBudWxsLCBudWxsLCB0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2YWxpZDtcbiAgICB9XG4gIH07XG59KGpRdWVyeSwgd2luZG93LCB3aW5kb3cuZG9jdW1lbnQpKTtcblxuOyhmdW5jdGlvbiAoJCwgd2luZG93LCBkb2N1bWVudCwgdW5kZWZpbmVkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBGb3VuZGF0aW9uLmxpYnMuYWNjb3JkaW9uID0ge1xuICAgIG5hbWUgOiAnYWNjb3JkaW9uJyxcblxuICAgIHZlcnNpb24gOiAnNS41LjEnLFxuXG4gICAgc2V0dGluZ3MgOiB7XG4gICAgICBjb250ZW50X2NsYXNzIDogJ2NvbnRlbnQnLFxuICAgICAgYWN0aXZlX2NsYXNzIDogJ2FjdGl2ZScsXG4gICAgICBtdWx0aV9leHBhbmQgOiBmYWxzZSxcbiAgICAgIHRvZ2dsZWFibGUgOiB0cnVlLFxuICAgICAgY2FsbGJhY2sgOiBmdW5jdGlvbiAoKSB7fVxuICAgIH0sXG5cbiAgICBpbml0IDogZnVuY3Rpb24gKHNjb3BlLCBtZXRob2QsIG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuYmluZGluZ3MobWV0aG9kLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgZXZlbnRzIDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIFMgPSB0aGlzLlM7XG4gICAgICBTKHRoaXMuc2NvcGUpXG4gICAgICAub2ZmKCcuZm5kdG4uYWNjb3JkaW9uJylcbiAgICAgIC5vbignY2xpY2suZm5kdG4uYWNjb3JkaW9uJywgJ1snICsgdGhpcy5hdHRyX25hbWUoKSArICddID4gLmFjY29yZGlvbi1uYXZpZ2F0aW9uID4gYScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBhY2NvcmRpb24gPSBTKHRoaXMpLmNsb3Nlc3QoJ1snICsgc2VsZi5hdHRyX25hbWUoKSArICddJyksXG4gICAgICAgICAgICBncm91cFNlbGVjdG9yID0gc2VsZi5hdHRyX25hbWUoKSArICc9JyArIGFjY29yZGlvbi5hdHRyKHNlbGYuYXR0cl9uYW1lKCkpLFxuICAgICAgICAgICAgc2V0dGluZ3MgPSBhY2NvcmRpb24uZGF0YShzZWxmLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpIHx8IHNlbGYuc2V0dGluZ3MsXG4gICAgICAgICAgICB0YXJnZXQgPSBTKCcjJyArIHRoaXMuaHJlZi5zcGxpdCgnIycpWzFdKSxcbiAgICAgICAgICAgIGF1bnRzID0gJCgnPiAuYWNjb3JkaW9uLW5hdmlnYXRpb24nLCBhY2NvcmRpb24pLFxuICAgICAgICAgICAgc2libGluZ3MgPSBhdW50cy5jaGlsZHJlbignLicgKyBzZXR0aW5ncy5jb250ZW50X2NsYXNzKSxcbiAgICAgICAgICAgIGFjdGl2ZV9jb250ZW50ID0gc2libGluZ3MuZmlsdGVyKCcuJyArIHNldHRpbmdzLmFjdGl2ZV9jbGFzcyk7XG5cbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGlmIChhY2NvcmRpb24uYXR0cihzZWxmLmF0dHJfbmFtZSgpKSkge1xuICAgICAgICAgIHNpYmxpbmdzID0gc2libGluZ3MuYWRkKCdbJyArIGdyb3VwU2VsZWN0b3IgKyAnXSBkZCA+ICcgKyAnLicgKyBzZXR0aW5ncy5jb250ZW50X2NsYXNzKTtcbiAgICAgICAgICBhdW50cyA9IGF1bnRzLmFkZCgnWycgKyBncm91cFNlbGVjdG9yICsgJ10gLmFjY29yZGlvbi1uYXZpZ2F0aW9uJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2V0dGluZ3MudG9nZ2xlYWJsZSAmJiB0YXJnZXQuaXMoYWN0aXZlX2NvbnRlbnQpKSB7XG4gICAgICAgICAgdGFyZ2V0LnBhcmVudCgnLmFjY29yZGlvbi1uYXZpZ2F0aW9uJykudG9nZ2xlQ2xhc3Moc2V0dGluZ3MuYWN0aXZlX2NsYXNzLCBmYWxzZSk7XG4gICAgICAgICAgdGFyZ2V0LnRvZ2dsZUNsYXNzKHNldHRpbmdzLmFjdGl2ZV9jbGFzcywgZmFsc2UpO1xuICAgICAgICAgIHNldHRpbmdzLmNhbGxiYWNrKHRhcmdldCk7XG4gICAgICAgICAgdGFyZ2V0LnRyaWdnZXJIYW5kbGVyKCd0b2dnbGVkJywgW2FjY29yZGlvbl0pO1xuICAgICAgICAgIGFjY29yZGlvbi50cmlnZ2VySGFuZGxlcigndG9nZ2xlZCcsIFt0YXJnZXRdKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXNldHRpbmdzLm11bHRpX2V4cGFuZCkge1xuICAgICAgICAgIHNpYmxpbmdzLnJlbW92ZUNsYXNzKHNldHRpbmdzLmFjdGl2ZV9jbGFzcyk7XG4gICAgICAgICAgYXVudHMucmVtb3ZlQ2xhc3Moc2V0dGluZ3MuYWN0aXZlX2NsYXNzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRhcmdldC5hZGRDbGFzcyhzZXR0aW5ncy5hY3RpdmVfY2xhc3MpLnBhcmVudCgpLmFkZENsYXNzKHNldHRpbmdzLmFjdGl2ZV9jbGFzcyk7XG4gICAgICAgIHNldHRpbmdzLmNhbGxiYWNrKHRhcmdldCk7XG4gICAgICAgIHRhcmdldC50cmlnZ2VySGFuZGxlcigndG9nZ2xlZCcsIFthY2NvcmRpb25dKTtcbiAgICAgICAgYWNjb3JkaW9uLnRyaWdnZXJIYW5kbGVyKCd0b2dnbGVkJywgW3RhcmdldF0pO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9mZiA6IGZ1bmN0aW9uICgpIHt9LFxuXG4gICAgcmVmbG93IDogZnVuY3Rpb24gKCkge31cbiAgfTtcbn0oalF1ZXJ5LCB3aW5kb3csIHdpbmRvdy5kb2N1bWVudCkpO1xuXG47KGZ1bmN0aW9uICgkLCB3aW5kb3csIGRvY3VtZW50LCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIEZvdW5kYXRpb24ubGlicy5hbGVydCA9IHtcbiAgICBuYW1lIDogJ2FsZXJ0JyxcblxuICAgIHZlcnNpb24gOiAnNS41LjEnLFxuXG4gICAgc2V0dGluZ3MgOiB7XG4gICAgICBjYWxsYmFjayA6IGZ1bmN0aW9uICgpIHt9XG4gICAgfSxcblxuICAgIGluaXQgOiBmdW5jdGlvbiAoc2NvcGUsIG1ldGhvZCwgb3B0aW9ucykge1xuICAgICAgdGhpcy5iaW5kaW5ncyhtZXRob2QsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBldmVudHMgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgUyA9IHRoaXMuUztcblxuICAgICAgJCh0aGlzLnNjb3BlKS5vZmYoJy5hbGVydCcpLm9uKCdjbGljay5mbmR0bi5hbGVydCcsICdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXSAuY2xvc2UnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgYWxlcnRCb3ggPSBTKHRoaXMpLmNsb3Nlc3QoJ1snICsgc2VsZi5hdHRyX25hbWUoKSArICddJyksXG4gICAgICAgICAgICBzZXR0aW5ncyA9IGFsZXJ0Qm94LmRhdGEoc2VsZi5hdHRyX25hbWUodHJ1ZSkgKyAnLWluaXQnKSB8fCBzZWxmLnNldHRpbmdzO1xuXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaWYgKE1vZGVybml6ci5jc3N0cmFuc2l0aW9ucykge1xuICAgICAgICAgIGFsZXJ0Qm94LmFkZENsYXNzKCdhbGVydC1jbG9zZScpO1xuICAgICAgICAgIGFsZXJ0Qm94Lm9uKCd0cmFuc2l0aW9uZW5kIHdlYmtpdFRyYW5zaXRpb25FbmQgb1RyYW5zaXRpb25FbmQnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgUyh0aGlzKS50cmlnZ2VyKCdjbG9zZScpLnRyaWdnZXIoJ2Nsb3NlLmZuZHRuLmFsZXJ0JykucmVtb3ZlKCk7XG4gICAgICAgICAgICBzZXR0aW5ncy5jYWxsYmFjaygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFsZXJ0Qm94LmZhZGVPdXQoMzAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBTKHRoaXMpLnRyaWdnZXIoJ2Nsb3NlJykudHJpZ2dlcignY2xvc2UuZm5kdG4uYWxlcnQnKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIHNldHRpbmdzLmNhbGxiYWNrKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICByZWZsb3cgOiBmdW5jdGlvbiAoKSB7fVxuICB9O1xufShqUXVlcnksIHdpbmRvdywgd2luZG93LmRvY3VtZW50KSk7XG5cbjsoZnVuY3Rpb24gKCQsIHdpbmRvdywgZG9jdW1lbnQsIHVuZGVmaW5lZCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgRm91bmRhdGlvbi5saWJzLmNsZWFyaW5nID0ge1xuICAgIG5hbWUgOiAnY2xlYXJpbmcnLFxuXG4gICAgdmVyc2lvbiA6ICc1LjUuMScsXG5cbiAgICBzZXR0aW5ncyA6IHtcbiAgICAgIHRlbXBsYXRlcyA6IHtcbiAgICAgICAgdmlld2luZyA6ICc8YSBocmVmPVwiI1wiIGNsYXNzPVwiY2xlYXJpbmctY2xvc2VcIj4mdGltZXM7PC9hPicgK1xuICAgICAgICAgICc8ZGl2IGNsYXNzPVwidmlzaWJsZS1pbWdcIiBzdHlsZT1cImRpc3BsYXk6IG5vbmVcIj48ZGl2IGNsYXNzPVwiY2xlYXJpbmctdG91Y2gtbGFiZWxcIj48L2Rpdj48aW1nIHNyYz1cImRhdGE6aW1hZ2UvZ2lmO2Jhc2U2NCxSMGxHT0RsaEFRQUJBQUQvQUN3QUFBQUFBUUFCQUFBQ0FEcyUzRFwiIGFsdD1cIlwiIC8+JyArXG4gICAgICAgICAgJzxwIGNsYXNzPVwiY2xlYXJpbmctY2FwdGlvblwiPjwvcD48YSBocmVmPVwiI1wiIGNsYXNzPVwiY2xlYXJpbmctbWFpbi1wcmV2XCI+PHNwYW4+PC9zcGFuPjwvYT4nICtcbiAgICAgICAgICAnPGEgaHJlZj1cIiNcIiBjbGFzcz1cImNsZWFyaW5nLW1haW4tbmV4dFwiPjxzcGFuPjwvc3Bhbj48L2E+PC9kaXY+J1xuICAgICAgfSxcblxuICAgICAgLy8gY29tbWEgZGVsaW1pdGVkIGxpc3Qgb2Ygc2VsZWN0b3JzIHRoYXQsIG9uIGNsaWNrLCB3aWxsIGNsb3NlIGNsZWFyaW5nLFxuICAgICAgLy8gYWRkICdkaXYuY2xlYXJpbmctYmxhY2tvdXQsIGRpdi52aXNpYmxlLWltZycgdG8gY2xvc2Ugb24gYmFja2dyb3VuZCBjbGlja1xuICAgICAgY2xvc2Vfc2VsZWN0b3JzIDogJy5jbGVhcmluZy1jbG9zZSwgZGl2LmNsZWFyaW5nLWJsYWNrb3V0JyxcblxuICAgICAgLy8gRGVmYXVsdCB0byB0aGUgZW50aXJlIGxpIGVsZW1lbnQuXG4gICAgICBvcGVuX3NlbGVjdG9ycyA6ICcnLFxuXG4gICAgICAvLyBJbWFnZSB3aWxsIGJlIHNraXBwZWQgaW4gY2Fyb3VzZWwuXG4gICAgICBza2lwX3NlbGVjdG9yIDogJycsXG5cbiAgICAgIHRvdWNoX2xhYmVsIDogJycsXG5cbiAgICAgIC8vIGV2ZW50IGluaXRpYWxpemVycyBhbmQgbG9ja3NcbiAgICAgIGluaXQgOiBmYWxzZSxcbiAgICAgIGxvY2tlZCA6IGZhbHNlXG4gICAgfSxcblxuICAgIGluaXQgOiBmdW5jdGlvbiAoc2NvcGUsIG1ldGhvZCwgb3B0aW9ucykge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgRm91bmRhdGlvbi5pbmhlcml0KHRoaXMsICd0aHJvdHRsZSBpbWFnZV9sb2FkZWQnKTtcblxuICAgICAgdGhpcy5iaW5kaW5ncyhtZXRob2QsIG9wdGlvbnMpO1xuXG4gICAgICBpZiAoc2VsZi5TKHRoaXMuc2NvcGUpLmlzKCdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXScpKSB7XG4gICAgICAgIHRoaXMuYXNzZW1ibGUoc2VsZi5TKCdsaScsIHRoaXMuc2NvcGUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbGYuUygnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10nLCB0aGlzLnNjb3BlKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBzZWxmLmFzc2VtYmxlKHNlbGYuUygnbGknLCB0aGlzKSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBldmVudHMgOiBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICBTID0gc2VsZi5TLFxuICAgICAgICAgICRzY3JvbGxfY29udGFpbmVyID0gJCgnLnNjcm9sbC1jb250YWluZXInKTtcblxuICAgICAgaWYgKCRzY3JvbGxfY29udGFpbmVyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGhpcy5zY29wZSA9ICRzY3JvbGxfY29udGFpbmVyO1xuICAgICAgfVxuXG4gICAgICBTKHRoaXMuc2NvcGUpXG4gICAgICAgIC5vZmYoJy5jbGVhcmluZycpXG4gICAgICAgIC5vbignY2xpY2suZm5kdG4uY2xlYXJpbmcnLCAndWxbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXSBsaSAnICsgdGhpcy5zZXR0aW5ncy5vcGVuX3NlbGVjdG9ycyxcbiAgICAgICAgICBmdW5jdGlvbiAoZSwgY3VycmVudCwgdGFyZ2V0KSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudCA9IGN1cnJlbnQgfHwgUyh0aGlzKSxcbiAgICAgICAgICAgICAgICB0YXJnZXQgPSB0YXJnZXQgfHwgY3VycmVudCxcbiAgICAgICAgICAgICAgICBuZXh0ID0gY3VycmVudC5uZXh0KCdsaScpLFxuICAgICAgICAgICAgICAgIHNldHRpbmdzID0gY3VycmVudC5jbG9zZXN0KCdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnXScpLmRhdGEoc2VsZi5hdHRyX25hbWUodHJ1ZSkgKyAnLWluaXQnKSxcbiAgICAgICAgICAgICAgICBpbWFnZSA9IFMoZS50YXJnZXQpO1xuXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIGlmICghc2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgc2VsZi5pbml0KCk7XG4gICAgICAgICAgICAgIHNldHRpbmdzID0gY3VycmVudC5jbG9zZXN0KCdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnXScpLmRhdGEoc2VsZi5hdHRyX25hbWUodHJ1ZSkgKyAnLWluaXQnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgY2xlYXJpbmcgaXMgb3BlbiBhbmQgdGhlIGN1cnJlbnQgaW1hZ2UgaXNcbiAgICAgICAgICAgIC8vIGNsaWNrZWQsIGdvIHRvIHRoZSBuZXh0IGltYWdlIGluIHNlcXVlbmNlXG4gICAgICAgICAgICBpZiAodGFyZ2V0Lmhhc0NsYXNzKCd2aXNpYmxlJykgJiZcbiAgICAgICAgICAgICAgY3VycmVudFswXSA9PT0gdGFyZ2V0WzBdICYmXG4gICAgICAgICAgICAgIG5leHQubGVuZ3RoID4gMCAmJiBzZWxmLmlzX29wZW4oY3VycmVudCkpIHtcbiAgICAgICAgICAgICAgdGFyZ2V0ID0gbmV4dDtcbiAgICAgICAgICAgICAgaW1hZ2UgPSBTKCdpbWcnLCB0YXJnZXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzZXQgY3VycmVudCBhbmQgdGFyZ2V0IHRvIHRoZSBjbGlja2VkIGxpIGlmIG5vdCBvdGhlcndpc2UgZGVmaW5lZC5cbiAgICAgICAgICAgIHNlbGYub3BlbihpbWFnZSwgY3VycmVudCwgdGFyZ2V0KTtcbiAgICAgICAgICAgIHNlbGYudXBkYXRlX3BhZGRsZXModGFyZ2V0KTtcbiAgICAgICAgICB9KVxuXG4gICAgICAgIC5vbignY2xpY2suZm5kdG4uY2xlYXJpbmcnLCAnLmNsZWFyaW5nLW1haW4tbmV4dCcsXG4gICAgICAgICAgZnVuY3Rpb24gKGUpIHsgc2VsZi5uYXYoZSwgJ25leHQnKSB9KVxuICAgICAgICAub24oJ2NsaWNrLmZuZHRuLmNsZWFyaW5nJywgJy5jbGVhcmluZy1tYWluLXByZXYnLFxuICAgICAgICAgIGZ1bmN0aW9uIChlKSB7IHNlbGYubmF2KGUsICdwcmV2JykgfSlcbiAgICAgICAgLm9uKCdjbGljay5mbmR0bi5jbGVhcmluZycsIHRoaXMuc2V0dGluZ3MuY2xvc2Vfc2VsZWN0b3JzLFxuICAgICAgICAgIGZ1bmN0aW9uIChlKSB7IEZvdW5kYXRpb24ubGlicy5jbGVhcmluZy5jbG9zZShlLCB0aGlzKSB9KTtcblxuICAgICAgJChkb2N1bWVudCkub24oJ2tleWRvd24uZm5kdG4uY2xlYXJpbmcnLFxuICAgICAgICAgIGZ1bmN0aW9uIChlKSB7IHNlbGYua2V5ZG93bihlKSB9KTtcblxuICAgICAgUyh3aW5kb3cpLm9mZignLmNsZWFyaW5nJykub24oJ3Jlc2l6ZS5mbmR0bi5jbGVhcmluZycsXG4gICAgICAgIGZ1bmN0aW9uICgpIHsgc2VsZi5yZXNpemUoKSB9KTtcblxuICAgICAgdGhpcy5zd2lwZV9ldmVudHMoc2NvcGUpO1xuICAgIH0sXG5cbiAgICBzd2lwZV9ldmVudHMgOiBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgIFMgPSBzZWxmLlM7XG5cbiAgICAgIFModGhpcy5zY29wZSlcbiAgICAgICAgLm9uKCd0b3VjaHN0YXJ0LmZuZHRuLmNsZWFyaW5nJywgJy52aXNpYmxlLWltZycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgaWYgKCFlLnRvdWNoZXMpIHsgZSA9IGUub3JpZ2luYWxFdmVudDsgfVxuICAgICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgICAgIHN0YXJ0X3BhZ2VfeCA6IGUudG91Y2hlc1swXS5wYWdlWCxcbiAgICAgICAgICAgICAgICBzdGFydF9wYWdlX3kgOiBlLnRvdWNoZXNbMF0ucGFnZVksXG4gICAgICAgICAgICAgICAgc3RhcnRfdGltZSA6IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCksXG4gICAgICAgICAgICAgICAgZGVsdGFfeCA6IDAsXG4gICAgICAgICAgICAgICAgaXNfc2Nyb2xsaW5nIDogdW5kZWZpbmVkXG4gICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICBTKHRoaXMpLmRhdGEoJ3N3aXBlLXRyYW5zaXRpb24nLCBkYXRhKTtcbiAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9KVxuICAgICAgICAub24oJ3RvdWNobW92ZS5mbmR0bi5jbGVhcmluZycsICcudmlzaWJsZS1pbWcnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIGlmICghZS50b3VjaGVzKSB7XG4gICAgICAgICAgICBlID0gZS5vcmlnaW5hbEV2ZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBJZ25vcmUgcGluY2gvem9vbSBldmVudHNcbiAgICAgICAgICBpZiAoZS50b3VjaGVzLmxlbmd0aCA+IDEgfHwgZS5zY2FsZSAmJiBlLnNjYWxlICE9PSAxKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIGRhdGEgPSBTKHRoaXMpLmRhdGEoJ3N3aXBlLXRyYW5zaXRpb24nKTtcblxuICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBkYXRhLmRlbHRhX3ggPSBlLnRvdWNoZXNbMF0ucGFnZVggLSBkYXRhLnN0YXJ0X3BhZ2VfeDtcblxuICAgICAgICAgIGlmIChGb3VuZGF0aW9uLnJ0bCkge1xuICAgICAgICAgICAgZGF0YS5kZWx0YV94ID0gLWRhdGEuZGVsdGFfeDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodHlwZW9mIGRhdGEuaXNfc2Nyb2xsaW5nID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgZGF0YS5pc19zY3JvbGxpbmcgPSAhISggZGF0YS5pc19zY3JvbGxpbmcgfHwgTWF0aC5hYnMoZGF0YS5kZWx0YV94KSA8IE1hdGguYWJzKGUudG91Y2hlc1swXS5wYWdlWSAtIGRhdGEuc3RhcnRfcGFnZV95KSApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghZGF0YS5pc19zY3JvbGxpbmcgJiYgIWRhdGEuYWN0aXZlKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB2YXIgZGlyZWN0aW9uID0gKGRhdGEuZGVsdGFfeCA8IDApID8gJ25leHQnIDogJ3ByZXYnO1xuICAgICAgICAgICAgZGF0YS5hY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgc2VsZi5uYXYoZSwgZGlyZWN0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbigndG91Y2hlbmQuZm5kdG4uY2xlYXJpbmcnLCAnLnZpc2libGUtaW1nJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICBTKHRoaXMpLmRhdGEoJ3N3aXBlLXRyYW5zaXRpb24nLCB7fSk7XG4gICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGFzc2VtYmxlIDogZnVuY3Rpb24gKCRsaSkge1xuICAgICAgdmFyICRlbCA9ICRsaS5wYXJlbnQoKTtcblxuICAgICAgaWYgKCRlbC5wYXJlbnQoKS5oYXNDbGFzcygnY2Fyb3VzZWwnKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgICRlbC5hZnRlcignPGRpdiBpZD1cImZvdW5kYXRpb25DbGVhcmluZ0hvbGRlclwiPjwvZGl2PicpO1xuXG4gICAgICB2YXIgZ3JpZCA9ICRlbC5kZXRhY2goKSxcbiAgICAgICAgICBncmlkX291dGVySFRNTCA9ICcnO1xuXG4gICAgICBpZiAoZ3JpZFswXSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGdyaWRfb3V0ZXJIVE1MID0gZ3JpZFswXS5vdXRlckhUTUw7XG4gICAgICB9XG5cbiAgICAgIHZhciBob2xkZXIgPSB0aGlzLlMoJyNmb3VuZGF0aW9uQ2xlYXJpbmdIb2xkZXInKSxcbiAgICAgICAgICBzZXR0aW5ncyA9ICRlbC5kYXRhKHRoaXMuYXR0cl9uYW1lKHRydWUpICsgJy1pbml0JyksXG4gICAgICAgICAgZGF0YSA9IHtcbiAgICAgICAgICAgIGdyaWQgOiAnPGRpdiBjbGFzcz1cImNhcm91c2VsXCI+JyArIGdyaWRfb3V0ZXJIVE1MICsgJzwvZGl2PicsXG4gICAgICAgICAgICB2aWV3aW5nIDogc2V0dGluZ3MudGVtcGxhdGVzLnZpZXdpbmdcbiAgICAgICAgICB9LFxuICAgICAgICAgIHdyYXBwZXIgPSAnPGRpdiBjbGFzcz1cImNsZWFyaW5nLWFzc2VtYmxlZFwiPjxkaXY+JyArIGRhdGEudmlld2luZyArXG4gICAgICAgICAgICBkYXRhLmdyaWQgKyAnPC9kaXY+PC9kaXY+JyxcbiAgICAgICAgICB0b3VjaF9sYWJlbCA9IHRoaXMuc2V0dGluZ3MudG91Y2hfbGFiZWw7XG5cbiAgICAgIGlmIChNb2Rlcm5penIudG91Y2gpIHtcbiAgICAgICAgd3JhcHBlciA9ICQod3JhcHBlcikuZmluZCgnLmNsZWFyaW5nLXRvdWNoLWxhYmVsJykuaHRtbCh0b3VjaF9sYWJlbCkuZW5kKCk7XG4gICAgICB9XG5cbiAgICAgIGhvbGRlci5hZnRlcih3cmFwcGVyKS5yZW1vdmUoKTtcbiAgICB9LFxuXG4gICAgb3BlbiA6IGZ1bmN0aW9uICgkaW1hZ2UsIGN1cnJlbnQsIHRhcmdldCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgIGJvZHkgPSAkKGRvY3VtZW50LmJvZHkpLFxuICAgICAgICAgIHJvb3QgPSB0YXJnZXQuY2xvc2VzdCgnLmNsZWFyaW5nLWFzc2VtYmxlZCcpLFxuICAgICAgICAgIGNvbnRhaW5lciA9IHNlbGYuUygnZGl2Jywgcm9vdCkuZmlyc3QoKSxcbiAgICAgICAgICB2aXNpYmxlX2ltYWdlID0gc2VsZi5TKCcudmlzaWJsZS1pbWcnLCBjb250YWluZXIpLFxuICAgICAgICAgIGltYWdlID0gc2VsZi5TKCdpbWcnLCB2aXNpYmxlX2ltYWdlKS5ub3QoJGltYWdlKSxcbiAgICAgICAgICBsYWJlbCA9IHNlbGYuUygnLmNsZWFyaW5nLXRvdWNoLWxhYmVsJywgY29udGFpbmVyKSxcbiAgICAgICAgICBlcnJvciA9IGZhbHNlO1xuXG4gICAgICAvLyBFdmVudCB0byBkaXNhYmxlIHNjcm9sbGluZyBvbiB0b3VjaCBkZXZpY2VzIHdoZW4gQ2xlYXJpbmcgaXMgYWN0aXZhdGVkXG4gICAgICAkKCdib2R5Jykub24oJ3RvdWNobW92ZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0pO1xuXG4gICAgICBpbWFnZS5lcnJvcihmdW5jdGlvbiAoKSB7XG4gICAgICAgIGVycm9yID0gdHJ1ZTtcbiAgICAgIH0pO1xuXG4gICAgICBmdW5jdGlvbiBzdGFydExvYWQoKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHRoaXMuaW1hZ2VfbG9hZGVkKGltYWdlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoaW1hZ2Uub3V0ZXJXaWR0aCgpID09PSAxICYmICFlcnJvcikge1xuICAgICAgICAgICAgICBzdGFydExvYWQuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNiLmNhbGwodGhpcywgaW1hZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIH0uYmluZCh0aGlzKSwgMTAwKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gY2IgKGltYWdlKSB7XG4gICAgICAgIHZhciAkaW1hZ2UgPSAkKGltYWdlKTtcbiAgICAgICAgJGltYWdlLmNzcygndmlzaWJpbGl0eScsICd2aXNpYmxlJyk7XG4gICAgICAgIC8vIHRvZ2dsZSB0aGUgZ2FsbGVyeVxuICAgICAgICBib2R5LmNzcygnb3ZlcmZsb3cnLCAnaGlkZGVuJyk7XG4gICAgICAgIHJvb3QuYWRkQ2xhc3MoJ2NsZWFyaW5nLWJsYWNrb3V0Jyk7XG4gICAgICAgIGNvbnRhaW5lci5hZGRDbGFzcygnY2xlYXJpbmctY29udGFpbmVyJyk7XG4gICAgICAgIHZpc2libGVfaW1hZ2Uuc2hvdygpO1xuICAgICAgICB0aGlzLmZpeF9oZWlnaHQodGFyZ2V0KVxuICAgICAgICAgIC5jYXB0aW9uKHNlbGYuUygnLmNsZWFyaW5nLWNhcHRpb24nLCB2aXNpYmxlX2ltYWdlKSwgc2VsZi5TKCdpbWcnLCB0YXJnZXQpKVxuICAgICAgICAgIC5jZW50ZXJfYW5kX2xhYmVsKGltYWdlLCBsYWJlbClcbiAgICAgICAgICAuc2hpZnQoY3VycmVudCwgdGFyZ2V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0YXJnZXQuY2xvc2VzdCgnbGknKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XG4gICAgICAgICAgICB0YXJnZXQuY2xvc2VzdCgnbGknKS5hZGRDbGFzcygndmlzaWJsZScpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB2aXNpYmxlX2ltYWdlLnRyaWdnZXIoJ29wZW5lZC5mbmR0bi5jbGVhcmluZycpXG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5sb2NrZWQoKSkge1xuICAgICAgICB2aXNpYmxlX2ltYWdlLnRyaWdnZXIoJ29wZW4uZm5kdG4uY2xlYXJpbmcnKTtcbiAgICAgICAgLy8gc2V0IHRoZSBpbWFnZSB0byB0aGUgc2VsZWN0ZWQgdGh1bWJuYWlsXG4gICAgICAgIGltYWdlXG4gICAgICAgICAgLmF0dHIoJ3NyYycsIHRoaXMubG9hZCgkaW1hZ2UpKVxuICAgICAgICAgIC5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XG5cbiAgICAgICAgc3RhcnRMb2FkLmNhbGwodGhpcyk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGNsb3NlIDogZnVuY3Rpb24gKGUsIGVsKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIHZhciByb290ID0gKGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgICAgICAgIGlmICgvYmxhY2tvdXQvLnRlc3QodGFyZ2V0LnNlbGVjdG9yKSkge1xuICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRhcmdldC5jbG9zZXN0KCcuY2xlYXJpbmctYmxhY2tvdXQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KCQoZWwpKSksXG4gICAgICAgICAgYm9keSA9ICQoZG9jdW1lbnQuYm9keSksIGNvbnRhaW5lciwgdmlzaWJsZV9pbWFnZTtcblxuICAgICAgaWYgKGVsID09PSBlLnRhcmdldCAmJiByb290KSB7XG4gICAgICAgIGJvZHkuY3NzKCdvdmVyZmxvdycsICcnKTtcbiAgICAgICAgY29udGFpbmVyID0gJCgnZGl2Jywgcm9vdCkuZmlyc3QoKTtcbiAgICAgICAgdmlzaWJsZV9pbWFnZSA9ICQoJy52aXNpYmxlLWltZycsIGNvbnRhaW5lcik7XG4gICAgICAgIHZpc2libGVfaW1hZ2UudHJpZ2dlcignY2xvc2UuZm5kdG4uY2xlYXJpbmcnKTtcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5wcmV2X2luZGV4ID0gMDtcbiAgICAgICAgJCgndWxbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXScsIHJvb3QpXG4gICAgICAgICAgLmF0dHIoJ3N0eWxlJywgJycpLmNsb3Nlc3QoJy5jbGVhcmluZy1ibGFja291dCcpXG4gICAgICAgICAgLnJlbW92ZUNsYXNzKCdjbGVhcmluZy1ibGFja291dCcpO1xuICAgICAgICBjb250YWluZXIucmVtb3ZlQ2xhc3MoJ2NsZWFyaW5nLWNvbnRhaW5lcicpO1xuICAgICAgICB2aXNpYmxlX2ltYWdlLmhpZGUoKTtcbiAgICAgICAgdmlzaWJsZV9pbWFnZS50cmlnZ2VyKCdjbG9zZWQuZm5kdG4uY2xlYXJpbmcnKTtcbiAgICAgIH1cblxuICAgICAgLy8gRXZlbnQgdG8gcmUtZW5hYmxlIHNjcm9sbGluZyBvbiB0b3VjaCBkZXZpY2VzXG4gICAgICAkKCdib2R5Jykub2ZmKCd0b3VjaG1vdmUnKTtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICBpc19vcGVuIDogZnVuY3Rpb24gKGN1cnJlbnQpIHtcbiAgICAgIHJldHVybiBjdXJyZW50LnBhcmVudCgpLnByb3AoJ3N0eWxlJykubGVuZ3RoID4gMDtcbiAgICB9LFxuXG4gICAga2V5ZG93biA6IGZ1bmN0aW9uIChlKSB7XG4gICAgICB2YXIgY2xlYXJpbmcgPSAkKCcuY2xlYXJpbmctYmxhY2tvdXQgdWxbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXScpLFxuICAgICAgICAgIE5FWFRfS0VZID0gdGhpcy5ydGwgPyAzNyA6IDM5LFxuICAgICAgICAgIFBSRVZfS0VZID0gdGhpcy5ydGwgPyAzOSA6IDM3LFxuICAgICAgICAgIEVTQ19LRVkgPSAyNztcblxuICAgICAgaWYgKGUud2hpY2ggPT09IE5FWFRfS0VZKSB7XG4gICAgICAgIHRoaXMuZ28oY2xlYXJpbmcsICduZXh0Jyk7XG4gICAgICB9XG4gICAgICBpZiAoZS53aGljaCA9PT0gUFJFVl9LRVkpIHtcbiAgICAgICAgdGhpcy5nbyhjbGVhcmluZywgJ3ByZXYnKTtcbiAgICAgIH1cbiAgICAgIGlmIChlLndoaWNoID09PSBFU0NfS0VZKSB7XG4gICAgICAgIHRoaXMuUygnYS5jbGVhcmluZy1jbG9zZScpLnRyaWdnZXIoJ2NsaWNrJykudHJpZ2dlcignY2xpY2suZm5kdG4uY2xlYXJpbmcnKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgbmF2IDogZnVuY3Rpb24gKGUsIGRpcmVjdGlvbikge1xuICAgICAgdmFyIGNsZWFyaW5nID0gJCgndWxbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXScsICcuY2xlYXJpbmctYmxhY2tvdXQnKTtcblxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5nbyhjbGVhcmluZywgZGlyZWN0aW9uKTtcbiAgICB9LFxuXG4gICAgcmVzaXplIDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGltYWdlID0gJCgnaW1nJywgJy5jbGVhcmluZy1ibGFja291dCAudmlzaWJsZS1pbWcnKSxcbiAgICAgICAgICBsYWJlbCA9ICQoJy5jbGVhcmluZy10b3VjaC1sYWJlbCcsICcuY2xlYXJpbmctYmxhY2tvdXQnKTtcblxuICAgICAgaWYgKGltYWdlLmxlbmd0aCkge1xuICAgICAgICB0aGlzLmNlbnRlcl9hbmRfbGFiZWwoaW1hZ2UsIGxhYmVsKTtcbiAgICAgICAgaW1hZ2UudHJpZ2dlcigncmVzaXplZC5mbmR0bi5jbGVhcmluZycpXG4gICAgICB9XG4gICAgfSxcblxuICAgIC8vIHZpc3VhbCBhZGp1c3RtZW50c1xuICAgIGZpeF9oZWlnaHQgOiBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgICB2YXIgbGlzID0gdGFyZ2V0LnBhcmVudCgpLmNoaWxkcmVuKCksXG4gICAgICAgICAgc2VsZiA9IHRoaXM7XG5cbiAgICAgIGxpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGxpID0gc2VsZi5TKHRoaXMpLFxuICAgICAgICAgICAgaW1hZ2UgPSBsaS5maW5kKCdpbWcnKTtcblxuICAgICAgICBpZiAobGkuaGVpZ2h0KCkgPiBpbWFnZS5vdXRlckhlaWdodCgpKSB7XG4gICAgICAgICAgbGkuYWRkQ2xhc3MoJ2ZpeC1oZWlnaHQnKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jbG9zZXN0KCd1bCcpXG4gICAgICAud2lkdGgobGlzLmxlbmd0aCAqIDEwMCArICclJyk7XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICB1cGRhdGVfcGFkZGxlcyA6IGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgIHRhcmdldCA9IHRhcmdldC5jbG9zZXN0KCdsaScpO1xuICAgICAgdmFyIHZpc2libGVfaW1hZ2UgPSB0YXJnZXRcbiAgICAgICAgLmNsb3Nlc3QoJy5jYXJvdXNlbCcpXG4gICAgICAgIC5zaWJsaW5ncygnLnZpc2libGUtaW1nJyk7XG5cbiAgICAgIGlmICh0YXJnZXQubmV4dCgpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGhpcy5TKCcuY2xlYXJpbmctbWFpbi1uZXh0JywgdmlzaWJsZV9pbWFnZSkucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLlMoJy5jbGVhcmluZy1tYWluLW5leHQnLCB2aXNpYmxlX2ltYWdlKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRhcmdldC5wcmV2KCkubGVuZ3RoID4gMCkge1xuICAgICAgICB0aGlzLlMoJy5jbGVhcmluZy1tYWluLXByZXYnLCB2aXNpYmxlX2ltYWdlKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuUygnLmNsZWFyaW5nLW1haW4tcHJldicsIHZpc2libGVfaW1hZ2UpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBjZW50ZXJfYW5kX2xhYmVsIDogZnVuY3Rpb24gKHRhcmdldCwgbGFiZWwpIHtcbiAgICAgIGlmICghdGhpcy5ydGwgJiYgbGFiZWwubGVuZ3RoID4gMCkge1xuICAgICAgICBsYWJlbC5jc3Moe1xuICAgICAgICAgIG1hcmdpbkxlZnQgOiAtKGxhYmVsLm91dGVyV2lkdGgoKSAvIDIpLFxuICAgICAgICAgIG1hcmdpblRvcCA6IC0odGFyZ2V0Lm91dGVySGVpZ2h0KCkgLyAyKS1sYWJlbC5vdXRlckhlaWdodCgpLTEwXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGFiZWwuY3NzKHtcbiAgICAgICAgICBtYXJnaW5SaWdodCA6IC0obGFiZWwub3V0ZXJXaWR0aCgpIC8gMiksXG4gICAgICAgICAgbWFyZ2luVG9wIDogLSh0YXJnZXQub3V0ZXJIZWlnaHQoKSAvIDIpLWxhYmVsLm91dGVySGVpZ2h0KCktMTAsXG4gICAgICAgICAgbGVmdDogJ2F1dG8nLFxuICAgICAgICAgIHJpZ2h0OiAnNTAlJ1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBpbWFnZSBsb2FkaW5nIGFuZCBwcmVsb2FkaW5nXG5cbiAgICBsb2FkIDogZnVuY3Rpb24gKCRpbWFnZSkge1xuICAgICAgdmFyIGhyZWY7XG5cbiAgICAgIGlmICgkaW1hZ2VbMF0ubm9kZU5hbWUgPT09ICdBJykge1xuICAgICAgICBocmVmID0gJGltYWdlLmF0dHIoJ2hyZWYnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGhyZWYgPSAkaW1hZ2UuY2xvc2VzdCgnYScpLmF0dHIoJ2hyZWYnKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5wcmVsb2FkKCRpbWFnZSk7XG5cbiAgICAgIGlmIChocmVmKSB7XG4gICAgICAgIHJldHVybiBocmVmO1xuICAgICAgfVxuICAgICAgcmV0dXJuICRpbWFnZS5hdHRyKCdzcmMnKTtcbiAgICB9LFxuXG4gICAgcHJlbG9hZCA6IGZ1bmN0aW9uICgkaW1hZ2UpIHtcbiAgICAgIHRoaXNcbiAgICAgICAgLmltZygkaW1hZ2UuY2xvc2VzdCgnbGknKS5uZXh0KCkpXG4gICAgICAgIC5pbWcoJGltYWdlLmNsb3Nlc3QoJ2xpJykucHJldigpKTtcbiAgICB9LFxuXG4gICAgaW1nIDogZnVuY3Rpb24gKGltZykge1xuICAgICAgaWYgKGltZy5sZW5ndGgpIHtcbiAgICAgICAgdmFyIG5ld19pbWcgPSBuZXcgSW1hZ2UoKSxcbiAgICAgICAgICAgIG5ld19hID0gdGhpcy5TKCdhJywgaW1nKTtcblxuICAgICAgICBpZiAobmV3X2EubGVuZ3RoKSB7XG4gICAgICAgICAgbmV3X2ltZy5zcmMgPSBuZXdfYS5hdHRyKCdocmVmJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3X2ltZy5zcmMgPSB0aGlzLlMoJ2ltZycsIGltZykuYXR0cignc3JjJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBpbWFnZSBjYXB0aW9uXG5cbiAgICBjYXB0aW9uIDogZnVuY3Rpb24gKGNvbnRhaW5lciwgJGltYWdlKSB7XG4gICAgICB2YXIgY2FwdGlvbiA9ICRpbWFnZS5hdHRyKCdkYXRhLWNhcHRpb24nKTtcblxuICAgICAgaWYgKGNhcHRpb24pIHtcbiAgICAgICAgY29udGFpbmVyXG4gICAgICAgICAgLmh0bWwoY2FwdGlvbilcbiAgICAgICAgICAuc2hvdygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGFpbmVyXG4gICAgICAgICAgLnRleHQoJycpXG4gICAgICAgICAgLmhpZGUoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBkaXJlY3Rpb25hbCBtZXRob2RzXG5cbiAgICBnbyA6IGZ1bmN0aW9uICgkdWwsIGRpcmVjdGlvbikge1xuICAgICAgdmFyIGN1cnJlbnQgPSB0aGlzLlMoJy52aXNpYmxlJywgJHVsKSxcbiAgICAgICAgICB0YXJnZXQgPSBjdXJyZW50W2RpcmVjdGlvbl0oKTtcblxuICAgICAgLy8gQ2hlY2sgZm9yIHNraXAgc2VsZWN0b3IuXG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy5za2lwX3NlbGVjdG9yICYmIHRhcmdldC5maW5kKHRoaXMuc2V0dGluZ3Muc2tpcF9zZWxlY3RvcikubGVuZ3RoICE9IDApIHtcbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0W2RpcmVjdGlvbl0oKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRhcmdldC5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5TKCdpbWcnLCB0YXJnZXQpXG4gICAgICAgICAgLnRyaWdnZXIoJ2NsaWNrJywgW2N1cnJlbnQsIHRhcmdldF0pLnRyaWdnZXIoJ2NsaWNrLmZuZHRuLmNsZWFyaW5nJywgW2N1cnJlbnQsIHRhcmdldF0pXG4gICAgICAgICAgLnRyaWdnZXIoJ2NoYW5nZS5mbmR0bi5jbGVhcmluZycpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBzaGlmdCA6IGZ1bmN0aW9uIChjdXJyZW50LCB0YXJnZXQsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgY2xlYXJpbmcgPSB0YXJnZXQucGFyZW50KCksXG4gICAgICAgICAgb2xkX2luZGV4ID0gdGhpcy5zZXR0aW5ncy5wcmV2X2luZGV4IHx8IHRhcmdldC5pbmRleCgpLFxuICAgICAgICAgIGRpcmVjdGlvbiA9IHRoaXMuZGlyZWN0aW9uKGNsZWFyaW5nLCBjdXJyZW50LCB0YXJnZXQpLFxuICAgICAgICAgIGRpciA9IHRoaXMucnRsID8gJ3JpZ2h0JyA6ICdsZWZ0JyxcbiAgICAgICAgICBsZWZ0ID0gcGFyc2VJbnQoY2xlYXJpbmcuY3NzKCdsZWZ0JyksIDEwKSxcbiAgICAgICAgICB3aWR0aCA9IHRhcmdldC5vdXRlcldpZHRoKCksXG4gICAgICAgICAgc2tpcF9zaGlmdDtcblxuICAgICAgdmFyIGRpcl9vYmogPSB7fTtcblxuICAgICAgLy8gd2UgdXNlIGpRdWVyeSBhbmltYXRlIGluc3RlYWQgb2YgQ1NTIHRyYW5zaXRpb25zIGJlY2F1c2Ugd2VcbiAgICAgIC8vIG5lZWQgYSBjYWxsYmFjayB0byB1bmxvY2sgdGhlIG5leHQgYW5pbWF0aW9uXG4gICAgICAvLyBuZWVkcyBzdXBwb3J0IGZvciBSVEwgKipcbiAgICAgIGlmICh0YXJnZXQuaW5kZXgoKSAhPT0gb2xkX2luZGV4ICYmICEvc2tpcC8udGVzdChkaXJlY3Rpb24pKSB7XG4gICAgICAgIGlmICgvbGVmdC8udGVzdChkaXJlY3Rpb24pKSB7XG4gICAgICAgICAgdGhpcy5sb2NrKCk7XG4gICAgICAgICAgZGlyX29ialtkaXJdID0gbGVmdCArIHdpZHRoO1xuICAgICAgICAgIGNsZWFyaW5nLmFuaW1hdGUoZGlyX29iaiwgMzAwLCB0aGlzLnVubG9jaygpKTtcbiAgICAgICAgfSBlbHNlIGlmICgvcmlnaHQvLnRlc3QoZGlyZWN0aW9uKSkge1xuICAgICAgICAgIHRoaXMubG9jaygpO1xuICAgICAgICAgIGRpcl9vYmpbZGlyXSA9IGxlZnQgLSB3aWR0aDtcbiAgICAgICAgICBjbGVhcmluZy5hbmltYXRlKGRpcl9vYmosIDMwMCwgdGhpcy51bmxvY2soKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoL3NraXAvLnRlc3QoZGlyZWN0aW9uKSkge1xuICAgICAgICAvLyB0aGUgdGFyZ2V0IGltYWdlIGlzIG5vdCBhZGphY2VudCB0byB0aGUgY3VycmVudCBpbWFnZSwgc29cbiAgICAgICAgLy8gZG8gd2Ugc2Nyb2xsIHJpZ2h0IG9yIG5vdFxuICAgICAgICBza2lwX3NoaWZ0ID0gdGFyZ2V0LmluZGV4KCkgLSB0aGlzLnNldHRpbmdzLnVwX2NvdW50O1xuICAgICAgICB0aGlzLmxvY2soKTtcblxuICAgICAgICBpZiAoc2tpcF9zaGlmdCA+IDApIHtcbiAgICAgICAgICBkaXJfb2JqW2Rpcl0gPSAtKHNraXBfc2hpZnQgKiB3aWR0aCk7XG4gICAgICAgICAgY2xlYXJpbmcuYW5pbWF0ZShkaXJfb2JqLCAzMDAsIHRoaXMudW5sb2NrKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRpcl9vYmpbZGlyXSA9IDA7XG4gICAgICAgICAgY2xlYXJpbmcuYW5pbWF0ZShkaXJfb2JqLCAzMDAsIHRoaXMudW5sb2NrKCkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfSxcblxuICAgIGRpcmVjdGlvbiA6IGZ1bmN0aW9uICgkZWwsIGN1cnJlbnQsIHRhcmdldCkge1xuICAgICAgdmFyIGxpcyA9IHRoaXMuUygnbGknLCAkZWwpLFxuICAgICAgICAgIGxpX3dpZHRoID0gbGlzLm91dGVyV2lkdGgoKSArIChsaXMub3V0ZXJXaWR0aCgpIC8gNCksXG4gICAgICAgICAgdXBfY291bnQgPSBNYXRoLmZsb29yKHRoaXMuUygnLmNsZWFyaW5nLWNvbnRhaW5lcicpLm91dGVyV2lkdGgoKSAvIGxpX3dpZHRoKSAtIDEsXG4gICAgICAgICAgdGFyZ2V0X2luZGV4ID0gbGlzLmluZGV4KHRhcmdldCksXG4gICAgICAgICAgcmVzcG9uc2U7XG5cbiAgICAgIHRoaXMuc2V0dGluZ3MudXBfY291bnQgPSB1cF9jb3VudDtcblxuICAgICAgaWYgKHRoaXMuYWRqYWNlbnQodGhpcy5zZXR0aW5ncy5wcmV2X2luZGV4LCB0YXJnZXRfaW5kZXgpKSB7XG4gICAgICAgIGlmICgodGFyZ2V0X2luZGV4ID4gdXBfY291bnQpICYmIHRhcmdldF9pbmRleCA+IHRoaXMuc2V0dGluZ3MucHJldl9pbmRleCkge1xuICAgICAgICAgIHJlc3BvbnNlID0gJ3JpZ2h0JztcbiAgICAgICAgfSBlbHNlIGlmICgodGFyZ2V0X2luZGV4ID4gdXBfY291bnQgLSAxKSAmJiB0YXJnZXRfaW5kZXggPD0gdGhpcy5zZXR0aW5ncy5wcmV2X2luZGV4KSB7XG4gICAgICAgICAgcmVzcG9uc2UgPSAnbGVmdCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzcG9uc2UgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzcG9uc2UgPSAnc2tpcCc7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc2V0dGluZ3MucHJldl9pbmRleCA9IHRhcmdldF9pbmRleDtcblxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0sXG5cbiAgICBhZGphY2VudCA6IGZ1bmN0aW9uIChjdXJyZW50X2luZGV4LCB0YXJnZXRfaW5kZXgpIHtcbiAgICAgIGZvciAodmFyIGkgPSB0YXJnZXRfaW5kZXggKyAxOyBpID49IHRhcmdldF9pbmRleCAtIDE7IGktLSkge1xuICAgICAgICBpZiAoaSA9PT0gY3VycmVudF9pbmRleCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIC8vIGxvY2sgbWFuYWdlbWVudFxuXG4gICAgbG9jayA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuc2V0dGluZ3MubG9ja2VkID0gdHJ1ZTtcbiAgICB9LFxuXG4gICAgdW5sb2NrIDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zZXR0aW5ncy5sb2NrZWQgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgbG9ja2VkIDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMuc2V0dGluZ3MubG9ja2VkO1xuICAgIH0sXG5cbiAgICBvZmYgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLlModGhpcy5zY29wZSkub2ZmKCcuZm5kdG4uY2xlYXJpbmcnKTtcbiAgICAgIHRoaXMuUyh3aW5kb3cpLm9mZignLmZuZHRuLmNsZWFyaW5nJyk7XG4gICAgfSxcblxuICAgIHJlZmxvdyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuaW5pdCgpO1xuICAgIH1cbiAgfTtcblxufShqUXVlcnksIHdpbmRvdywgd2luZG93LmRvY3VtZW50KSk7XG5cbjsoZnVuY3Rpb24gKCQsIHdpbmRvdywgZG9jdW1lbnQsIHVuZGVmaW5lZCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgRm91bmRhdGlvbi5saWJzLmRyb3Bkb3duID0ge1xuICAgIG5hbWUgOiAnZHJvcGRvd24nLFxuXG4gICAgdmVyc2lvbiA6ICc1LjUuMScsXG5cbiAgICBzZXR0aW5ncyA6IHtcbiAgICAgIGFjdGl2ZV9jbGFzcyA6ICdvcGVuJyxcbiAgICAgIGRpc2FibGVkX2NsYXNzIDogJ2Rpc2FibGVkJyxcbiAgICAgIG1lZ2FfY2xhc3MgOiAnbWVnYScsXG4gICAgICBhbGlnbiA6ICdib3R0b20nLFxuICAgICAgaXNfaG92ZXIgOiBmYWxzZSxcbiAgICAgIGhvdmVyX3RpbWVvdXQgOiAxNTAsXG4gICAgICBvcGVuZWQgOiBmdW5jdGlvbiAoKSB7fSxcbiAgICAgIGNsb3NlZCA6IGZ1bmN0aW9uICgpIHt9XG4gICAgfSxcblxuICAgIGluaXQgOiBmdW5jdGlvbiAoc2NvcGUsIG1ldGhvZCwgb3B0aW9ucykge1xuICAgICAgRm91bmRhdGlvbi5pbmhlcml0KHRoaXMsICd0aHJvdHRsZScpO1xuXG4gICAgICAkLmV4dGVuZCh0cnVlLCB0aGlzLnNldHRpbmdzLCBtZXRob2QsIG9wdGlvbnMpO1xuICAgICAgdGhpcy5iaW5kaW5ncyhtZXRob2QsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBldmVudHMgOiBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICBTID0gc2VsZi5TO1xuXG4gICAgICBTKHRoaXMuc2NvcGUpXG4gICAgICAgIC5vZmYoJy5kcm9wZG93bicpXG4gICAgICAgIC5vbignY2xpY2suZm5kdG4uZHJvcGRvd24nLCAnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IFModGhpcykuZGF0YShzZWxmLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpIHx8IHNlbGYuc2V0dGluZ3M7XG4gICAgICAgICAgaWYgKCFzZXR0aW5ncy5pc19ob3ZlciB8fCBNb2Rlcm5penIudG91Y2gpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGlmIChTKHRoaXMpLnBhcmVudCgnW2RhdGEtcmV2ZWFsLWlkXScpKSB7XG4gICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxmLnRvZ2dsZSgkKHRoaXMpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignbW91c2VlbnRlci5mbmR0bi5kcm9wZG93bicsICdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXSwgWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJy1jb250ZW50XScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgdmFyICR0aGlzID0gUyh0aGlzKSxcbiAgICAgICAgICAgICAgZHJvcGRvd24sXG4gICAgICAgICAgICAgIHRhcmdldDtcblxuICAgICAgICAgIGNsZWFyVGltZW91dChzZWxmLnRpbWVvdXQpO1xuXG4gICAgICAgICAgaWYgKCR0aGlzLmRhdGEoc2VsZi5kYXRhX2F0dHIoKSkpIHtcbiAgICAgICAgICAgIGRyb3Bkb3duID0gUygnIycgKyAkdGhpcy5kYXRhKHNlbGYuZGF0YV9hdHRyKCkpKTtcbiAgICAgICAgICAgIHRhcmdldCA9ICR0aGlzO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkcm9wZG93biA9ICR0aGlzO1xuICAgICAgICAgICAgdGFyZ2V0ID0gUygnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJz1cIicgKyBkcm9wZG93bi5hdHRyKCdpZCcpICsgJ1wiXScpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IHRhcmdldC5kYXRhKHNlbGYuYXR0cl9uYW1lKHRydWUpICsgJy1pbml0JykgfHwgc2VsZi5zZXR0aW5ncztcblxuICAgICAgICAgIGlmIChTKGUuY3VycmVudFRhcmdldCkuZGF0YShzZWxmLmRhdGFfYXR0cigpKSAmJiBzZXR0aW5ncy5pc19ob3Zlcikge1xuICAgICAgICAgICAgc2VsZi5jbG9zZWFsbC5jYWxsKHNlbGYpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChzZXR0aW5ncy5pc19ob3Zlcikge1xuICAgICAgICAgICAgc2VsZi5vcGVuLmFwcGx5KHNlbGYsIFtkcm9wZG93biwgdGFyZ2V0XSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ21vdXNlbGVhdmUuZm5kdG4uZHJvcGRvd24nLCAnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10sIFsnICsgdGhpcy5hdHRyX25hbWUoKSArICctY29udGVudF0nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIHZhciAkdGhpcyA9IFModGhpcyk7XG4gICAgICAgICAgdmFyIHNldHRpbmdzO1xuXG4gICAgICAgICAgaWYgKCR0aGlzLmRhdGEoc2VsZi5kYXRhX2F0dHIoKSkpIHtcbiAgICAgICAgICAgICAgc2V0dGluZ3MgPSAkdGhpcy5kYXRhKHNlbGYuZGF0YV9hdHRyKHRydWUpICsgJy1pbml0JykgfHwgc2VsZi5zZXR0aW5ncztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB2YXIgdGFyZ2V0ICAgPSBTKCdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnPVwiJyArIFModGhpcykuYXR0cignaWQnKSArICdcIl0nKSxcbiAgICAgICAgICAgICAgICAgIHNldHRpbmdzID0gdGFyZ2V0LmRhdGEoc2VsZi5hdHRyX25hbWUodHJ1ZSkgKyAnLWluaXQnKSB8fCBzZWxmLnNldHRpbmdzO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHNlbGYudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCR0aGlzLmRhdGEoc2VsZi5kYXRhX2F0dHIoKSkpIHtcbiAgICAgICAgICAgICAgaWYgKHNldHRpbmdzLmlzX2hvdmVyKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5jbG9zZS5jYWxsKHNlbGYsIFMoJyMnICsgJHRoaXMuZGF0YShzZWxmLmRhdGFfYXR0cigpKSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAoc2V0dGluZ3MuaXNfaG92ZXIpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmNsb3NlLmNhbGwoc2VsZiwgJHRoaXMpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfS5iaW5kKHRoaXMpLCBzZXR0aW5ncy5ob3Zlcl90aW1lb3V0KTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdjbGljay5mbmR0bi5kcm9wZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgdmFyIHBhcmVudCA9IFMoZS50YXJnZXQpLmNsb3Nlc3QoJ1snICsgc2VsZi5hdHRyX25hbWUoKSArICctY29udGVudF0nKTtcbiAgICAgICAgICB2YXIgbGlua3MgID0gcGFyZW50LmZpbmQoJ2EnKTtcblxuICAgICAgICAgIGlmIChsaW5rcy5sZW5ndGggPiAwICYmIHBhcmVudC5hdHRyKCdhcmlhLWF1dG9jbG9zZScpICE9PSAnZmFsc2UnKSB7XG4gICAgICAgICAgICAgIHNlbGYuY2xvc2UuY2FsbChzZWxmLCBTKCdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnLWNvbnRlbnRdJykpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChlLnRhcmdldCAhPT0gZG9jdW1lbnQgJiYgISQuY29udGFpbnMoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCBlLnRhcmdldCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoUyhlLnRhcmdldCkuY2xvc2VzdCgnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJ10nKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCEoUyhlLnRhcmdldCkuZGF0YSgncmV2ZWFsSWQnKSkgJiZcbiAgICAgICAgICAgIChwYXJlbnQubGVuZ3RoID4gMCAmJiAoUyhlLnRhcmdldCkuaXMoJ1snICsgc2VsZi5hdHRyX25hbWUoKSArICctY29udGVudF0nKSB8fFxuICAgICAgICAgICAgICAkLmNvbnRhaW5zKHBhcmVudC5maXJzdCgpWzBdLCBlLnRhcmdldCkpKSkge1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZWxmLmNsb3NlLmNhbGwoc2VsZiwgUygnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJy1jb250ZW50XScpKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdvcGVuZWQuZm5kdG4uZHJvcGRvd24nLCAnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJy1jb250ZW50XScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBzZWxmLnNldHRpbmdzLm9wZW5lZC5jYWxsKHRoaXMpO1xuICAgICAgICB9KVxuICAgICAgICAub24oJ2Nsb3NlZC5mbmR0bi5kcm9wZG93bicsICdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnLWNvbnRlbnRdJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHNlbGYuc2V0dGluZ3MuY2xvc2VkLmNhbGwodGhpcyk7XG4gICAgICAgIH0pO1xuXG4gICAgICBTKHdpbmRvdylcbiAgICAgICAgLm9mZignLmRyb3Bkb3duJylcbiAgICAgICAgLm9uKCdyZXNpemUuZm5kdG4uZHJvcGRvd24nLCBzZWxmLnRocm90dGxlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBzZWxmLnJlc2l6ZS5jYWxsKHNlbGYpO1xuICAgICAgICB9LCA1MCkpO1xuXG4gICAgICB0aGlzLnJlc2l6ZSgpO1xuICAgIH0sXG5cbiAgICBjbG9zZSA6IGZ1bmN0aW9uIChkcm9wZG93bikge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgZHJvcGRvd24uZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvcmlnaW5hbF90YXJnZXQgPSAkKCdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnPScgKyBkcm9wZG93blswXS5pZCArICddJykgfHwgJCgnYXJpYS1jb250cm9scz0nICsgZHJvcGRvd25bMF0uaWQgKyAnXScpO1xuICAgICAgICBvcmlnaW5hbF90YXJnZXQuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgICAgICBpZiAoc2VsZi5TKHRoaXMpLmhhc0NsYXNzKHNlbGYuc2V0dGluZ3MuYWN0aXZlX2NsYXNzKSkge1xuICAgICAgICAgIHNlbGYuUyh0aGlzKVxuICAgICAgICAgICAgLmNzcyhGb3VuZGF0aW9uLnJ0bCA/ICdyaWdodCcgOiAnbGVmdCcsICctOTk5OTlweCcpXG4gICAgICAgICAgICAuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3Moc2VsZi5zZXR0aW5ncy5hY3RpdmVfY2xhc3MpXG4gICAgICAgICAgICAucHJldignWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJ10nKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKHNlbGYuc2V0dGluZ3MuYWN0aXZlX2NsYXNzKVxuICAgICAgICAgICAgLnJlbW92ZURhdGEoJ3RhcmdldCcpO1xuXG4gICAgICAgICAgc2VsZi5TKHRoaXMpLnRyaWdnZXIoJ2Nsb3NlZCcpLnRyaWdnZXIoJ2Nsb3NlZC5mbmR0bi5kcm9wZG93bicsIFtkcm9wZG93bl0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGRyb3Bkb3duLnJlbW92ZUNsYXNzKCdmLW9wZW4tJyArIHRoaXMuYXR0cl9uYW1lKHRydWUpKTtcbiAgICB9LFxuXG4gICAgY2xvc2VhbGwgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAkLmVhY2goc2VsZi5TKCcuZi1vcGVuLScgKyB0aGlzLmF0dHJfbmFtZSh0cnVlKSksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5jbG9zZS5jYWxsKHNlbGYsIHNlbGYuUyh0aGlzKSk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgb3BlbiA6IGZ1bmN0aW9uIChkcm9wZG93biwgdGFyZ2V0KSB7XG4gICAgICB0aGlzXG4gICAgICAgIC5jc3MoZHJvcGRvd25cbiAgICAgICAgLmFkZENsYXNzKHRoaXMuc2V0dGluZ3MuYWN0aXZlX2NsYXNzKSwgdGFyZ2V0KTtcbiAgICAgIGRyb3Bkb3duLnByZXYoJ1snICsgdGhpcy5hdHRyX25hbWUoKSArICddJykuYWRkQ2xhc3ModGhpcy5zZXR0aW5ncy5hY3RpdmVfY2xhc3MpO1xuICAgICAgZHJvcGRvd24uZGF0YSgndGFyZ2V0JywgdGFyZ2V0LmdldCgwKSkudHJpZ2dlcignb3BlbmVkJykudHJpZ2dlcignb3BlbmVkLmZuZHRuLmRyb3Bkb3duJywgW2Ryb3Bkb3duLCB0YXJnZXRdKTtcbiAgICAgIGRyb3Bkb3duLmF0dHIoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJyk7XG4gICAgICB0YXJnZXQuYXR0cignYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgICBkcm9wZG93bi5mb2N1cygpO1xuICAgICAgZHJvcGRvd24uYWRkQ2xhc3MoJ2Ytb3Blbi0nICsgdGhpcy5hdHRyX25hbWUodHJ1ZSkpO1xuICAgIH0sXG5cbiAgICBkYXRhX2F0dHIgOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5uYW1lc3BhY2UubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5uYW1lc3BhY2UgKyAnLScgKyB0aGlzLm5hbWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLm5hbWU7XG4gICAgfSxcblxuICAgIHRvZ2dsZSA6IGZ1bmN0aW9uICh0YXJnZXQpIHtcbiAgICAgIGlmICh0YXJnZXQuaGFzQ2xhc3ModGhpcy5zZXR0aW5ncy5kaXNhYmxlZF9jbGFzcykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIGRyb3Bkb3duID0gdGhpcy5TKCcjJyArIHRhcmdldC5kYXRhKHRoaXMuZGF0YV9hdHRyKCkpKTtcbiAgICAgIGlmIChkcm9wZG93bi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgLy8gTm8gZHJvcGRvd24gZm91bmQsIG5vdCBjb250aW51aW5nXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5jbG9zZS5jYWxsKHRoaXMsIHRoaXMuUygnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJy1jb250ZW50XScpLm5vdChkcm9wZG93bikpO1xuXG4gICAgICBpZiAoZHJvcGRvd24uaGFzQ2xhc3ModGhpcy5zZXR0aW5ncy5hY3RpdmVfY2xhc3MpKSB7XG4gICAgICAgIHRoaXMuY2xvc2UuY2FsbCh0aGlzLCBkcm9wZG93bik7XG4gICAgICAgIGlmIChkcm9wZG93bi5kYXRhKCd0YXJnZXQnKSAhPT0gdGFyZ2V0LmdldCgwKSkge1xuICAgICAgICAgIHRoaXMub3Blbi5jYWxsKHRoaXMsIGRyb3Bkb3duLCB0YXJnZXQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm9wZW4uY2FsbCh0aGlzLCBkcm9wZG93biwgdGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVzaXplIDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGRyb3Bkb3duID0gdGhpcy5TKCdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnLWNvbnRlbnRdLm9wZW4nKTtcbiAgICAgIHZhciB0YXJnZXQgPSAkKGRyb3Bkb3duLmRhdGEoXCJ0YXJnZXRcIikpO1xuXG4gICAgICBpZiAoZHJvcGRvd24ubGVuZ3RoICYmIHRhcmdldC5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5jc3MoZHJvcGRvd24sIHRhcmdldCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGNzcyA6IGZ1bmN0aW9uIChkcm9wZG93biwgdGFyZ2V0KSB7XG4gICAgICB2YXIgbGVmdF9vZmZzZXQgPSBNYXRoLm1heCgodGFyZ2V0LndpZHRoKCkgLSBkcm9wZG93bi53aWR0aCgpKSAvIDIsIDgpLFxuICAgICAgICAgIHNldHRpbmdzID0gdGFyZ2V0LmRhdGEodGhpcy5hdHRyX25hbWUodHJ1ZSkgKyAnLWluaXQnKSB8fCB0aGlzLnNldHRpbmdzO1xuXG4gICAgICB0aGlzLmNsZWFyX2lkeCgpO1xuXG4gICAgICBpZiAodGhpcy5zbWFsbCgpKSB7XG4gICAgICAgIHZhciBwID0gdGhpcy5kaXJzLmJvdHRvbS5jYWxsKGRyb3Bkb3duLCB0YXJnZXQsIHNldHRpbmdzKTtcblxuICAgICAgICBkcm9wZG93bi5hdHRyKCdzdHlsZScsICcnKS5yZW1vdmVDbGFzcygnZHJvcC1sZWZ0IGRyb3AtcmlnaHQgZHJvcC10b3AnKS5jc3Moe1xuICAgICAgICAgIHBvc2l0aW9uIDogJ2Fic29sdXRlJyxcbiAgICAgICAgICB3aWR0aCA6ICc5NSUnLFxuICAgICAgICAgICdtYXgtd2lkdGgnIDogJ25vbmUnLFxuICAgICAgICAgIHRvcCA6IHAudG9wXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRyb3Bkb3duLmNzcyhGb3VuZGF0aW9uLnJ0bCA/ICdyaWdodCcgOiAnbGVmdCcsIGxlZnRfb2Zmc2V0KTtcbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgdGhpcy5zdHlsZShkcm9wZG93biwgdGFyZ2V0LCBzZXR0aW5ncyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkcm9wZG93bjtcbiAgICB9LFxuXG4gICAgc3R5bGUgOiBmdW5jdGlvbiAoZHJvcGRvd24sIHRhcmdldCwgc2V0dGluZ3MpIHtcbiAgICAgIHZhciBjc3MgPSAkLmV4dGVuZCh7cG9zaXRpb24gOiAnYWJzb2x1dGUnfSxcbiAgICAgICAgdGhpcy5kaXJzW3NldHRpbmdzLmFsaWduXS5jYWxsKGRyb3Bkb3duLCB0YXJnZXQsIHNldHRpbmdzKSk7XG5cbiAgICAgIGRyb3Bkb3duLmF0dHIoJ3N0eWxlJywgJycpLmNzcyhjc3MpO1xuICAgIH0sXG5cbiAgICAvLyByZXR1cm4gQ1NTIHByb3BlcnR5IG9iamVjdFxuICAgIC8vIGB0aGlzYCBpcyB0aGUgZHJvcGRvd25cbiAgICBkaXJzIDoge1xuICAgICAgLy8gQ2FsY3VsYXRlIHRhcmdldCBvZmZzZXRcbiAgICAgIF9iYXNlIDogZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgdmFyIG9fcCA9IHRoaXMub2Zmc2V0UGFyZW50KCksXG4gICAgICAgICAgICBvID0gb19wLm9mZnNldCgpLFxuICAgICAgICAgICAgcCA9IHQub2Zmc2V0KCk7XG5cbiAgICAgICAgcC50b3AgLT0gby50b3A7XG4gICAgICAgIHAubGVmdCAtPSBvLmxlZnQ7XG5cbiAgICAgICAgLy9zZXQgc29tZSBmbGFncyBvbiB0aGUgcCBvYmplY3QgdG8gcGFzcyBhbG9uZ1xuICAgICAgICBwLm1pc3NSaWdodCA9IGZhbHNlO1xuICAgICAgICBwLm1pc3NUb3AgPSBmYWxzZTtcbiAgICAgICAgcC5taXNzTGVmdCA9IGZhbHNlO1xuICAgICAgICBwLmxlZnRSaWdodEZsYWcgPSBmYWxzZTtcblxuICAgICAgICAvL2xldHMgc2VlIGlmIHRoZSBwYW5lbCB3aWxsIGJlIG9mZiB0aGUgc2NyZWVuXG4gICAgICAgIC8vZ2V0IHRoZSBhY3R1YWwgd2lkdGggb2YgdGhlIHBhZ2UgYW5kIHN0b3JlIGl0XG4gICAgICAgIHZhciBhY3R1YWxCb2R5V2lkdGg7XG4gICAgICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdyb3cnKVswXSkge1xuICAgICAgICAgIGFjdHVhbEJvZHlXaWR0aCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3JvdycpWzBdLmNsaWVudFdpZHRoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFjdHVhbEJvZHlXaWR0aCA9IHdpbmRvdy5vdXRlcldpZHRoO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFjdHVhbE1hcmdpbldpZHRoID0gKHdpbmRvdy5vdXRlcldpZHRoIC0gYWN0dWFsQm9keVdpZHRoKSAvIDI7XG4gICAgICAgIHZhciBhY3R1YWxCb3VuZGFyeSA9IGFjdHVhbEJvZHlXaWR0aDtcblxuICAgICAgICBpZiAoIXRoaXMuaGFzQ2xhc3MoJ21lZ2EnKSkge1xuICAgICAgICAgIC8vbWlzcyB0b3BcbiAgICAgICAgICBpZiAodC5vZmZzZXQoKS50b3AgPD0gdGhpcy5vdXRlckhlaWdodCgpKSB7XG4gICAgICAgICAgICBwLm1pc3NUb3AgPSB0cnVlO1xuICAgICAgICAgICAgYWN0dWFsQm91bmRhcnkgPSB3aW5kb3cub3V0ZXJXaWR0aCAtIGFjdHVhbE1hcmdpbldpZHRoO1xuICAgICAgICAgICAgcC5sZWZ0UmlnaHRGbGFnID0gdHJ1ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvL21pc3MgcmlnaHRcbiAgICAgICAgICBpZiAodC5vZmZzZXQoKS5sZWZ0ICsgdGhpcy5vdXRlcldpZHRoKCkgPiB0Lm9mZnNldCgpLmxlZnQgKyBhY3R1YWxNYXJnaW5XaWR0aCAmJiB0Lm9mZnNldCgpLmxlZnQgLSBhY3R1YWxNYXJnaW5XaWR0aCA+IHRoaXMub3V0ZXJXaWR0aCgpKSB7XG4gICAgICAgICAgICBwLm1pc3NSaWdodCA9IHRydWU7XG4gICAgICAgICAgICBwLm1pc3NMZWZ0ID0gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy9taXNzIGxlZnRcbiAgICAgICAgICBpZiAodC5vZmZzZXQoKS5sZWZ0IC0gdGhpcy5vdXRlcldpZHRoKCkgPD0gMCkge1xuICAgICAgICAgICAgcC5taXNzTGVmdCA9IHRydWU7XG4gICAgICAgICAgICBwLm1pc3NSaWdodCA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwO1xuICAgICAgfSxcblxuICAgICAgdG9wIDogZnVuY3Rpb24gKHQsIHMpIHtcbiAgICAgICAgdmFyIHNlbGYgPSBGb3VuZGF0aW9uLmxpYnMuZHJvcGRvd24sXG4gICAgICAgICAgICBwID0gc2VsZi5kaXJzLl9iYXNlLmNhbGwodGhpcywgdCk7XG5cbiAgICAgICAgdGhpcy5hZGRDbGFzcygnZHJvcC10b3AnKTtcblxuICAgICAgICBpZiAocC5taXNzVG9wID09IHRydWUpIHtcbiAgICAgICAgICBwLnRvcCA9IHAudG9wICsgdC5vdXRlckhlaWdodCgpICsgdGhpcy5vdXRlckhlaWdodCgpO1xuICAgICAgICAgIHRoaXMucmVtb3ZlQ2xhc3MoJ2Ryb3AtdG9wJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocC5taXNzUmlnaHQgPT0gdHJ1ZSkge1xuICAgICAgICAgIHAubGVmdCA9IHAubGVmdCAtIHRoaXMub3V0ZXJXaWR0aCgpICsgdC5vdXRlcldpZHRoKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodC5vdXRlcldpZHRoKCkgPCB0aGlzLm91dGVyV2lkdGgoKSB8fCBzZWxmLnNtYWxsKCkgfHwgdGhpcy5oYXNDbGFzcyhzLm1lZ2FfbWVudSkpIHtcbiAgICAgICAgICBzZWxmLmFkanVzdF9waXAodGhpcywgdCwgcywgcCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoRm91bmRhdGlvbi5ydGwpIHtcbiAgICAgICAgICByZXR1cm4ge2xlZnQgOiBwLmxlZnQgLSB0aGlzLm91dGVyV2lkdGgoKSArIHQub3V0ZXJXaWR0aCgpLFxuICAgICAgICAgICAgdG9wIDogcC50b3AgLSB0aGlzLm91dGVySGVpZ2h0KCl9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtsZWZ0IDogcC5sZWZ0LCB0b3AgOiBwLnRvcCAtIHRoaXMub3V0ZXJIZWlnaHQoKX07XG4gICAgICB9LFxuXG4gICAgICBib3R0b20gOiBmdW5jdGlvbiAodCwgcykge1xuICAgICAgICB2YXIgc2VsZiA9IEZvdW5kYXRpb24ubGlicy5kcm9wZG93bixcbiAgICAgICAgICAgIHAgPSBzZWxmLmRpcnMuX2Jhc2UuY2FsbCh0aGlzLCB0KTtcblxuICAgICAgICBpZiAocC5taXNzUmlnaHQgPT0gdHJ1ZSkge1xuICAgICAgICAgIHAubGVmdCA9IHAubGVmdCAtIHRoaXMub3V0ZXJXaWR0aCgpICsgdC5vdXRlcldpZHRoKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodC5vdXRlcldpZHRoKCkgPCB0aGlzLm91dGVyV2lkdGgoKSB8fCBzZWxmLnNtYWxsKCkgfHwgdGhpcy5oYXNDbGFzcyhzLm1lZ2FfbWVudSkpIHtcbiAgICAgICAgICBzZWxmLmFkanVzdF9waXAodGhpcywgdCwgcywgcCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2VsZi5ydGwpIHtcbiAgICAgICAgICByZXR1cm4ge2xlZnQgOiBwLmxlZnQgLSB0aGlzLm91dGVyV2lkdGgoKSArIHQub3V0ZXJXaWR0aCgpLCB0b3AgOiBwLnRvcCArIHQub3V0ZXJIZWlnaHQoKX07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge2xlZnQgOiBwLmxlZnQsIHRvcCA6IHAudG9wICsgdC5vdXRlckhlaWdodCgpfTtcbiAgICAgIH0sXG5cbiAgICAgIGxlZnQgOiBmdW5jdGlvbiAodCwgcykge1xuICAgICAgICB2YXIgcCA9IEZvdW5kYXRpb24ubGlicy5kcm9wZG93bi5kaXJzLl9iYXNlLmNhbGwodGhpcywgdCk7XG5cbiAgICAgICAgdGhpcy5hZGRDbGFzcygnZHJvcC1sZWZ0Jyk7XG5cbiAgICAgICAgaWYgKHAubWlzc0xlZnQgPT0gdHJ1ZSkge1xuICAgICAgICAgIHAubGVmdCA9ICBwLmxlZnQgKyB0aGlzLm91dGVyV2lkdGgoKTtcbiAgICAgICAgICBwLnRvcCA9IHAudG9wICsgdC5vdXRlckhlaWdodCgpO1xuICAgICAgICAgIHRoaXMucmVtb3ZlQ2xhc3MoJ2Ryb3AtbGVmdCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtsZWZ0IDogcC5sZWZ0IC0gdGhpcy5vdXRlcldpZHRoKCksIHRvcCA6IHAudG9wfTtcbiAgICAgIH0sXG5cbiAgICAgIHJpZ2h0IDogZnVuY3Rpb24gKHQsIHMpIHtcbiAgICAgICAgdmFyIHAgPSBGb3VuZGF0aW9uLmxpYnMuZHJvcGRvd24uZGlycy5fYmFzZS5jYWxsKHRoaXMsIHQpO1xuXG4gICAgICAgIHRoaXMuYWRkQ2xhc3MoJ2Ryb3AtcmlnaHQnKTtcblxuICAgICAgICBpZiAocC5taXNzUmlnaHQgPT0gdHJ1ZSkge1xuICAgICAgICAgIHAubGVmdCA9IHAubGVmdCAtIHRoaXMub3V0ZXJXaWR0aCgpO1xuICAgICAgICAgIHAudG9wID0gcC50b3AgKyB0Lm91dGVySGVpZ2h0KCk7XG4gICAgICAgICAgdGhpcy5yZW1vdmVDbGFzcygnZHJvcC1yaWdodCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHAudHJpZ2dlcmVkUmlnaHQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHNlbGYgPSBGb3VuZGF0aW9uLmxpYnMuZHJvcGRvd247XG5cbiAgICAgICAgaWYgKHQub3V0ZXJXaWR0aCgpIDwgdGhpcy5vdXRlcldpZHRoKCkgfHwgc2VsZi5zbWFsbCgpIHx8IHRoaXMuaGFzQ2xhc3Mocy5tZWdhX21lbnUpKSB7XG4gICAgICAgICAgc2VsZi5hZGp1c3RfcGlwKHRoaXMsIHQsIHMsIHApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtsZWZ0IDogcC5sZWZ0ICsgdC5vdXRlcldpZHRoKCksIHRvcCA6IHAudG9wfTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gSW5zZXJ0IHJ1bGUgdG8gc3R5bGUgcHN1ZWRvIGVsZW1lbnRzXG4gICAgYWRqdXN0X3BpcCA6IGZ1bmN0aW9uIChkcm9wZG93biwgdGFyZ2V0LCBzZXR0aW5ncywgcG9zaXRpb24pIHtcbiAgICAgIHZhciBzaGVldCA9IEZvdW5kYXRpb24uc3R5bGVzaGVldCxcbiAgICAgICAgICBwaXBfb2Zmc2V0X2Jhc2UgPSA4O1xuXG4gICAgICBpZiAoZHJvcGRvd24uaGFzQ2xhc3Moc2V0dGluZ3MubWVnYV9jbGFzcykpIHtcbiAgICAgICAgcGlwX29mZnNldF9iYXNlID0gcG9zaXRpb24ubGVmdCArICh0YXJnZXQub3V0ZXJXaWR0aCgpIC8gMikgLSA4O1xuICAgICAgfSBlbHNlIGlmICh0aGlzLnNtYWxsKCkpIHtcbiAgICAgICAgcGlwX29mZnNldF9iYXNlICs9IHBvc2l0aW9uLmxlZnQgLSA4O1xuICAgICAgfVxuXG4gICAgICB0aGlzLnJ1bGVfaWR4ID0gc2hlZXQuY3NzUnVsZXMubGVuZ3RoO1xuXG4gICAgICAvL2RlZmF1bHRcbiAgICAgIHZhciBzZWxfYmVmb3JlID0gJy5mLWRyb3Bkb3duLm9wZW46YmVmb3JlJyxcbiAgICAgICAgICBzZWxfYWZ0ZXIgID0gJy5mLWRyb3Bkb3duLm9wZW46YWZ0ZXInLFxuICAgICAgICAgIGNzc19iZWZvcmUgPSAnbGVmdDogJyArIHBpcF9vZmZzZXRfYmFzZSArICdweDsnLFxuICAgICAgICAgIGNzc19hZnRlciAgPSAnbGVmdDogJyArIChwaXBfb2Zmc2V0X2Jhc2UgLSAxKSArICdweDsnO1xuXG4gICAgICBpZiAocG9zaXRpb24ubWlzc1JpZ2h0ID09IHRydWUpIHtcbiAgICAgICAgcGlwX29mZnNldF9iYXNlID0gZHJvcGRvd24ub3V0ZXJXaWR0aCgpIC0gMjM7XG4gICAgICAgIHNlbF9iZWZvcmUgPSAnLmYtZHJvcGRvd24ub3BlbjpiZWZvcmUnLFxuICAgICAgICBzZWxfYWZ0ZXIgID0gJy5mLWRyb3Bkb3duLm9wZW46YWZ0ZXInLFxuICAgICAgICBjc3NfYmVmb3JlID0gJ2xlZnQ6ICcgKyBwaXBfb2Zmc2V0X2Jhc2UgKyAncHg7JyxcbiAgICAgICAgY3NzX2FmdGVyICA9ICdsZWZ0OiAnICsgKHBpcF9vZmZzZXRfYmFzZSAtIDEpICsgJ3B4Oyc7XG4gICAgICB9XG5cbiAgICAgIC8vanVzdCBhIGNhc2Ugd2hlcmUgcmlnaHQgaXMgZmlyZWQsIGJ1dCBpdHMgbm90IG1pc3NpbmcgcmlnaHRcbiAgICAgIGlmIChwb3NpdGlvbi50cmlnZ2VyZWRSaWdodCA9PSB0cnVlKSB7XG4gICAgICAgIHNlbF9iZWZvcmUgPSAnLmYtZHJvcGRvd24ub3BlbjpiZWZvcmUnLFxuICAgICAgICBzZWxfYWZ0ZXIgID0gJy5mLWRyb3Bkb3duLm9wZW46YWZ0ZXInLFxuICAgICAgICBjc3NfYmVmb3JlID0gJ2xlZnQ6LTEycHg7JyxcbiAgICAgICAgY3NzX2FmdGVyICA9ICdsZWZ0Oi0xNHB4Oyc7XG4gICAgICB9XG5cbiAgICAgIGlmIChzaGVldC5pbnNlcnRSdWxlKSB7XG4gICAgICAgIHNoZWV0Lmluc2VydFJ1bGUoW3NlbF9iZWZvcmUsICd7JywgY3NzX2JlZm9yZSwgJ30nXS5qb2luKCcgJyksIHRoaXMucnVsZV9pZHgpO1xuICAgICAgICBzaGVldC5pbnNlcnRSdWxlKFtzZWxfYWZ0ZXIsICd7JywgY3NzX2FmdGVyLCAnfSddLmpvaW4oJyAnKSwgdGhpcy5ydWxlX2lkeCArIDEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2hlZXQuYWRkUnVsZShzZWxfYmVmb3JlLCBjc3NfYmVmb3JlLCB0aGlzLnJ1bGVfaWR4KTtcbiAgICAgICAgc2hlZXQuYWRkUnVsZShzZWxfYWZ0ZXIsIGNzc19hZnRlciwgdGhpcy5ydWxlX2lkeCArIDEpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBSZW1vdmUgb2xkIGRyb3Bkb3duIHJ1bGUgaW5kZXhcbiAgICBjbGVhcl9pZHggOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2hlZXQgPSBGb3VuZGF0aW9uLnN0eWxlc2hlZXQ7XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5ydWxlX2lkeCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgc2hlZXQuZGVsZXRlUnVsZSh0aGlzLnJ1bGVfaWR4KTtcbiAgICAgICAgc2hlZXQuZGVsZXRlUnVsZSh0aGlzLnJ1bGVfaWR4KTtcbiAgICAgICAgZGVsZXRlIHRoaXMucnVsZV9pZHg7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHNtYWxsIDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIG1hdGNoTWVkaWEoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzLnNtYWxsKS5tYXRjaGVzICYmXG4gICAgICAgICFtYXRjaE1lZGlhKEZvdW5kYXRpb24ubWVkaWFfcXVlcmllcy5tZWRpdW0pLm1hdGNoZXM7XG4gICAgfSxcblxuICAgIG9mZiA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuUyh0aGlzLnNjb3BlKS5vZmYoJy5mbmR0bi5kcm9wZG93bicpO1xuICAgICAgdGhpcy5TKCdodG1sLCBib2R5Jykub2ZmKCcuZm5kdG4uZHJvcGRvd24nKTtcbiAgICAgIHRoaXMuUyh3aW5kb3cpLm9mZignLmZuZHRuLmRyb3Bkb3duJyk7XG4gICAgICB0aGlzLlMoJ1tkYXRhLWRyb3Bkb3duLWNvbnRlbnRdJykub2ZmKCcuZm5kdG4uZHJvcGRvd24nKTtcbiAgICB9LFxuXG4gICAgcmVmbG93IDogZnVuY3Rpb24gKCkge31cbiAgfTtcbn0oalF1ZXJ5LCB3aW5kb3csIHdpbmRvdy5kb2N1bWVudCkpO1xuXG47KGZ1bmN0aW9uICgkLCB3aW5kb3csIGRvY3VtZW50LCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIEZvdW5kYXRpb24ubGlicy5lcXVhbGl6ZXIgPSB7XG4gICAgbmFtZSA6ICdlcXVhbGl6ZXInLFxuXG4gICAgdmVyc2lvbiA6ICc1LjUuMScsXG5cbiAgICBzZXR0aW5ncyA6IHtcbiAgICAgIHVzZV90YWxsZXN0IDogdHJ1ZSxcbiAgICAgIGJlZm9yZV9oZWlnaHRfY2hhbmdlIDogJC5ub29wLFxuICAgICAgYWZ0ZXJfaGVpZ2h0X2NoYW5nZSA6ICQubm9vcCxcbiAgICAgIGVxdWFsaXplX29uX3N0YWNrIDogZmFsc2VcbiAgICB9LFxuXG4gICAgaW5pdCA6IGZ1bmN0aW9uIChzY29wZSwgbWV0aG9kLCBvcHRpb25zKSB7XG4gICAgICBGb3VuZGF0aW9uLmluaGVyaXQodGhpcywgJ2ltYWdlX2xvYWRlZCcpO1xuICAgICAgdGhpcy5iaW5kaW5ncyhtZXRob2QsIG9wdGlvbnMpO1xuICAgICAgdGhpcy5yZWZsb3coKTtcbiAgICB9LFxuXG4gICAgZXZlbnRzIDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5TKHdpbmRvdykub2ZmKCcuZXF1YWxpemVyJykub24oJ3Jlc2l6ZS5mbmR0bi5lcXVhbGl6ZXInLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICB0aGlzLnJlZmxvdygpO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgZXF1YWxpemUgOiBmdW5jdGlvbiAoZXF1YWxpemVyKSB7XG4gICAgICB2YXIgaXNTdGFja2VkID0gZmFsc2UsXG4gICAgICAgICAgdmFscyA9IGVxdWFsaXplci5maW5kKCdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnLXdhdGNoXTp2aXNpYmxlJyksXG4gICAgICAgICAgc2V0dGluZ3MgPSBlcXVhbGl6ZXIuZGF0YSh0aGlzLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpO1xuXG4gICAgICBpZiAodmFscy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIGZpcnN0VG9wT2Zmc2V0ID0gdmFscy5maXJzdCgpLm9mZnNldCgpLnRvcDtcbiAgICAgIHNldHRpbmdzLmJlZm9yZV9oZWlnaHRfY2hhbmdlKCk7XG4gICAgICBlcXVhbGl6ZXIudHJpZ2dlcignYmVmb3JlLWhlaWdodC1jaGFuZ2UnKS50cmlnZ2VyKCdiZWZvcmUtaGVpZ2h0LWNoYW5nZS5mbmR0aC5lcXVhbGl6ZXInKTtcbiAgICAgIHZhbHMuaGVpZ2h0KCdpbmhlcml0Jyk7XG4gICAgICB2YWxzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZWwgPSAkKHRoaXMpO1xuICAgICAgICBpZiAoZWwub2Zmc2V0KCkudG9wICE9PSBmaXJzdFRvcE9mZnNldCkge1xuICAgICAgICAgIGlzU3RhY2tlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBpZiAoc2V0dGluZ3MuZXF1YWxpemVfb25fc3RhY2sgPT09IGZhbHNlKSB7XG4gICAgICAgIGlmIChpc1N0YWNrZWQpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHZhciBoZWlnaHRzID0gdmFscy5tYXAoZnVuY3Rpb24gKCkgeyByZXR1cm4gJCh0aGlzKS5vdXRlckhlaWdodChmYWxzZSkgfSkuZ2V0KCk7XG5cbiAgICAgIGlmIChzZXR0aW5ncy51c2VfdGFsbGVzdCkge1xuICAgICAgICB2YXIgbWF4ID0gTWF0aC5tYXguYXBwbHkobnVsbCwgaGVpZ2h0cyk7XG4gICAgICAgIHZhbHMuY3NzKCdoZWlnaHQnLCBtYXgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIG1pbiA9IE1hdGgubWluLmFwcGx5KG51bGwsIGhlaWdodHMpO1xuICAgICAgICB2YWxzLmNzcygnaGVpZ2h0JywgbWluKTtcbiAgICAgIH1cbiAgICAgIHNldHRpbmdzLmFmdGVyX2hlaWdodF9jaGFuZ2UoKTtcbiAgICAgIGVxdWFsaXplci50cmlnZ2VyKCdhZnRlci1oZWlnaHQtY2hhbmdlJykudHJpZ2dlcignYWZ0ZXItaGVpZ2h0LWNoYW5nZS5mbmR0bi5lcXVhbGl6ZXInKTtcbiAgICB9LFxuXG4gICAgcmVmbG93IDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICB0aGlzLlMoJ1snICsgdGhpcy5hdHRyX25hbWUoKSArICddJywgdGhpcy5zY29wZSkuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciAkZXFfdGFyZ2V0ID0gJCh0aGlzKTtcbiAgICAgICAgc2VsZi5pbWFnZV9sb2FkZWQoc2VsZi5TKCdpbWcnLCB0aGlzKSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHNlbGYuZXF1YWxpemUoJGVxX3RhcmdldClcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59KShqUXVlcnksIHdpbmRvdywgd2luZG93LmRvY3VtZW50KTtcblxuOyhmdW5jdGlvbiAoJCwgd2luZG93LCBkb2N1bWVudCwgdW5kZWZpbmVkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBGb3VuZGF0aW9uLmxpYnMuaW50ZXJjaGFuZ2UgPSB7XG4gICAgbmFtZSA6ICdpbnRlcmNoYW5nZScsXG5cbiAgICB2ZXJzaW9uIDogJzUuNS4xJyxcblxuICAgIGNhY2hlIDoge30sXG5cbiAgICBpbWFnZXNfbG9hZGVkIDogZmFsc2UsXG4gICAgbm9kZXNfbG9hZGVkIDogZmFsc2UsXG5cbiAgICBzZXR0aW5ncyA6IHtcbiAgICAgIGxvYWRfYXR0ciA6ICdpbnRlcmNoYW5nZScsXG5cbiAgICAgIG5hbWVkX3F1ZXJpZXMgOiB7XG4gICAgICAgICdkZWZhdWx0JyAgICAgOiAnb25seSBzY3JlZW4nLFxuICAgICAgICAnc21hbGwnICAgICAgIDogRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzWydzbWFsbCddLFxuICAgICAgICAnc21hbGwtb25seScgIDogRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzWydzbWFsbC1vbmx5J10sXG4gICAgICAgICdtZWRpdW0nICAgICAgOiBGb3VuZGF0aW9uLm1lZGlhX3F1ZXJpZXNbJ21lZGl1bSddLFxuICAgICAgICAnbWVkaXVtLW9ubHknIDogRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzWydtZWRpdW0tb25seSddLFxuICAgICAgICAnbGFyZ2UnICAgICAgIDogRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzWydsYXJnZSddLFxuICAgICAgICAnbGFyZ2Utb25seScgIDogRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzWydsYXJnZS1vbmx5J10sXG4gICAgICAgICd4bGFyZ2UnICAgICAgOiBGb3VuZGF0aW9uLm1lZGlhX3F1ZXJpZXNbJ3hsYXJnZSddLFxuICAgICAgICAneGxhcmdlLW9ubHknIDogRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzWyd4bGFyZ2Utb25seSddLFxuICAgICAgICAneHhsYXJnZScgICAgIDogRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzWyd4eGxhcmdlJ10sXG4gICAgICAgICdsYW5kc2NhcGUnICAgOiAnb25seSBzY3JlZW4gYW5kIChvcmllbnRhdGlvbjogbGFuZHNjYXBlKScsXG4gICAgICAgICdwb3J0cmFpdCcgICAgOiAnb25seSBzY3JlZW4gYW5kIChvcmllbnRhdGlvbjogcG9ydHJhaXQpJyxcbiAgICAgICAgJ3JldGluYScgICAgICA6ICdvbmx5IHNjcmVlbiBhbmQgKC13ZWJraXQtbWluLWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG4gICAgICAgICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLS1tb3otZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcbiAgICAgICAgICAnb25seSBzY3JlZW4gYW5kICgtby1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyLzEpLCcgK1xuICAgICAgICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuICAgICAgICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi1yZXNvbHV0aW9uOiAxOTJkcGkpLCcgK1xuICAgICAgICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi1yZXNvbHV0aW9uOiAyZHBweCknXG4gICAgICB9LFxuXG4gICAgICBkaXJlY3RpdmVzIDoge1xuICAgICAgICByZXBsYWNlIDogZnVuY3Rpb24gKGVsLCBwYXRoLCB0cmlnZ2VyKSB7XG4gICAgICAgICAgLy8gVGhlIHRyaWdnZXIgYXJndW1lbnQsIGlmIGNhbGxlZCB3aXRoaW4gdGhlIGRpcmVjdGl2ZSwgZmlyZXNcbiAgICAgICAgICAvLyBhbiBldmVudCBuYW1lZCBhZnRlciB0aGUgZGlyZWN0aXZlIG9uIHRoZSBlbGVtZW50LCBwYXNzaW5nXG4gICAgICAgICAgLy8gYW55IHBhcmFtZXRlcnMgYWxvbmcgdG8gdGhlIGV2ZW50IHRoYXQgeW91IHBhc3MgdG8gdHJpZ2dlci5cbiAgICAgICAgICAvL1xuICAgICAgICAgIC8vIGV4LiB0cmlnZ2VyKCksIHRyaWdnZXIoW2EsIGIsIGNdKSwgb3IgdHJpZ2dlcihhLCBiLCBjKVxuICAgICAgICAgIC8vXG4gICAgICAgICAgLy8gVGhpcyBhbGxvd3MgeW91IHRvIGJpbmQgYSBjYWxsYmFjayBsaWtlIHNvOlxuICAgICAgICAgIC8vICQoJyNpbnRlcmNoYW5nZUNvbnRhaW5lcicpLm9uKCdyZXBsYWNlJywgZnVuY3Rpb24gKGUsIGEsIGIsIGMpIHtcbiAgICAgICAgICAvLyAgIGNvbnNvbGUubG9nKCQodGhpcykuaHRtbCgpLCBhLCBiLCBjKTtcbiAgICAgICAgICAvLyB9KTtcblxuICAgICAgICAgIGlmICgvSU1HLy50ZXN0KGVsWzBdLm5vZGVOYW1lKSkge1xuICAgICAgICAgICAgdmFyIG9yaWdfcGF0aCA9IGVsWzBdLnNyYztcblxuICAgICAgICAgICAgaWYgKG5ldyBSZWdFeHAocGF0aCwgJ2knKS50ZXN0KG9yaWdfcGF0aCkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbFswXS5zcmMgPSBwYXRoO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJpZ2dlcihlbFswXS5zcmMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgbGFzdF9wYXRoID0gZWwuZGF0YSh0aGlzLmRhdGFfYXR0ciArICctbGFzdC1wYXRoJyksXG4gICAgICAgICAgICAgIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgaWYgKGxhc3RfcGF0aCA9PSBwYXRoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKC9cXC4oZ2lmfGpwZ3xqcGVnfHRpZmZ8cG5nKShbPyNdLiopPy9pLnRlc3QocGF0aCkpIHtcbiAgICAgICAgICAgICQoZWwpLmNzcygnYmFja2dyb3VuZC1pbWFnZScsICd1cmwoJyArIHBhdGggKyAnKScpO1xuICAgICAgICAgICAgZWwuZGF0YSgnaW50ZXJjaGFuZ2UtbGFzdC1wYXRoJywgcGF0aCk7XG4gICAgICAgICAgICByZXR1cm4gdHJpZ2dlcihwYXRoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gJC5nZXQocGF0aCwgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBlbC5odG1sKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIGVsLmRhdGEoc2VsZi5kYXRhX2F0dHIgKyAnLWxhc3QtcGF0aCcsIHBhdGgpO1xuICAgICAgICAgICAgdHJpZ2dlcigpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5pdCA6IGZ1bmN0aW9uIChzY29wZSwgbWV0aG9kLCBvcHRpb25zKSB7XG4gICAgICBGb3VuZGF0aW9uLmluaGVyaXQodGhpcywgJ3Rocm90dGxlIHJhbmRvbV9zdHInKTtcblxuICAgICAgdGhpcy5kYXRhX2F0dHIgPSB0aGlzLnNldF9kYXRhX2F0dHIoKTtcbiAgICAgICQuZXh0ZW5kKHRydWUsIHRoaXMuc2V0dGluZ3MsIG1ldGhvZCwgb3B0aW9ucyk7XG4gICAgICB0aGlzLmJpbmRpbmdzKG1ldGhvZCwgb3B0aW9ucyk7XG4gICAgICB0aGlzLmxvYWQoJ2ltYWdlcycpO1xuICAgICAgdGhpcy5sb2FkKCdub2RlcycpO1xuICAgIH0sXG5cbiAgICBnZXRfbWVkaWFfaGFzaCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1lZGlhSGFzaCA9ICcnO1xuICAgICAgICBmb3IgKHZhciBxdWVyeU5hbWUgaW4gdGhpcy5zZXR0aW5ncy5uYW1lZF9xdWVyaWVzICkge1xuICAgICAgICAgICAgbWVkaWFIYXNoICs9IG1hdGNoTWVkaWEodGhpcy5zZXR0aW5ncy5uYW1lZF9xdWVyaWVzW3F1ZXJ5TmFtZV0pLm1hdGNoZXMudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWVkaWFIYXNoO1xuICAgIH0sXG5cbiAgICBldmVudHMgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMsIHByZXZNZWRpYUhhc2g7XG5cbiAgICAgICQod2luZG93KVxuICAgICAgICAub2ZmKCcuaW50ZXJjaGFuZ2UnKVxuICAgICAgICAub24oJ3Jlc2l6ZS5mbmR0bi5pbnRlcmNoYW5nZScsIHNlbGYudGhyb3R0bGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGN1cnJNZWRpYUhhc2ggPSBzZWxmLmdldF9tZWRpYV9oYXNoKCk7XG4gICAgICAgICAgICBpZiAoY3Vyck1lZGlhSGFzaCAhPT0gcHJldk1lZGlhSGFzaCkge1xuICAgICAgICAgICAgICAgIHNlbGYucmVzaXplKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcmV2TWVkaWFIYXNoID0gY3Vyck1lZGlhSGFzaDtcbiAgICAgICAgfSwgNTApKTtcblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHJlc2l6ZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBjYWNoZSA9IHRoaXMuY2FjaGU7XG5cbiAgICAgIGlmICghdGhpcy5pbWFnZXNfbG9hZGVkIHx8ICF0aGlzLm5vZGVzX2xvYWRlZCkge1xuICAgICAgICBzZXRUaW1lb3V0KCQucHJveHkodGhpcy5yZXNpemUsIHRoaXMpLCA1MCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgdXVpZCBpbiBjYWNoZSkge1xuICAgICAgICBpZiAoY2FjaGUuaGFzT3duUHJvcGVydHkodXVpZCkpIHtcbiAgICAgICAgICB2YXIgcGFzc2VkID0gdGhpcy5yZXN1bHRzKHV1aWQsIGNhY2hlW3V1aWRdKTtcblxuICAgICAgICAgIGlmIChwYXNzZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuZGlyZWN0aXZlc1twYXNzZWRcbiAgICAgICAgICAgICAgLnNjZW5hcmlvWzFdXS5jYWxsKHRoaXMsIHBhc3NlZC5lbCwgcGFzc2VkLnNjZW5hcmlvWzBdLCAoZnVuY3Rpb24gKHBhc3NlZCkge1xuICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNbMF0gaW5zdGFuY2VvZiBBcnJheSkgeyBcbiAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzWzBdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgcGFzc2VkLmVsLnRyaWdnZXIocGFzc2VkLnNjZW5hcmlvWzFdLCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0ocGFzc2VkKSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgfSxcblxuICAgIHJlc3VsdHMgOiBmdW5jdGlvbiAodXVpZCwgc2NlbmFyaW9zKSB7XG4gICAgICB2YXIgY291bnQgPSBzY2VuYXJpb3MubGVuZ3RoO1xuXG4gICAgICBpZiAoY291bnQgPiAwKSB7XG4gICAgICAgIHZhciBlbCA9IHRoaXMuUygnWycgKyB0aGlzLmFkZF9uYW1lc3BhY2UoJ2RhdGEtdXVpZCcpICsgJz1cIicgKyB1dWlkICsgJ1wiXScpO1xuXG4gICAgICAgIHdoaWxlIChjb3VudC0tKSB7XG4gICAgICAgICAgdmFyIG1xLCBydWxlID0gc2NlbmFyaW9zW2NvdW50XVsyXTtcbiAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5uYW1lZF9xdWVyaWVzLmhhc093blByb3BlcnR5KHJ1bGUpKSB7XG4gICAgICAgICAgICBtcSA9IG1hdGNoTWVkaWEodGhpcy5zZXR0aW5ncy5uYW1lZF9xdWVyaWVzW3J1bGVdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbXEgPSBtYXRjaE1lZGlhKHJ1bGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobXEubWF0Y2hlcykge1xuICAgICAgICAgICAgcmV0dXJuIHtlbCA6IGVsLCBzY2VuYXJpbyA6IHNjZW5hcmlvc1tjb3VudF19O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIGxvYWQgOiBmdW5jdGlvbiAodHlwZSwgZm9yY2VfdXBkYXRlKSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXNbJ2NhY2hlZF8nICsgdHlwZV0gPT09ICd1bmRlZmluZWQnIHx8IGZvcmNlX3VwZGF0ZSkge1xuICAgICAgICB0aGlzWyd1cGRhdGVfJyArIHR5cGVdKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzWydjYWNoZWRfJyArIHR5cGVdO1xuICAgIH0sXG5cbiAgICB1cGRhdGVfaW1hZ2VzIDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGltYWdlcyA9IHRoaXMuUygnaW1nWycgKyB0aGlzLmRhdGFfYXR0ciArICddJyksXG4gICAgICAgICAgY291bnQgPSBpbWFnZXMubGVuZ3RoLFxuICAgICAgICAgIGkgPSBjb3VudCxcbiAgICAgICAgICBsb2FkZWRfY291bnQgPSAwLFxuICAgICAgICAgIGRhdGFfYXR0ciA9IHRoaXMuZGF0YV9hdHRyO1xuXG4gICAgICB0aGlzLmNhY2hlID0ge307XG4gICAgICB0aGlzLmNhY2hlZF9pbWFnZXMgPSBbXTtcbiAgICAgIHRoaXMuaW1hZ2VzX2xvYWRlZCA9IChjb3VudCA9PT0gMCk7XG5cbiAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgbG9hZGVkX2NvdW50Kys7XG4gICAgICAgIGlmIChpbWFnZXNbaV0pIHtcbiAgICAgICAgICB2YXIgc3RyID0gaW1hZ2VzW2ldLmdldEF0dHJpYnV0ZShkYXRhX2F0dHIpIHx8ICcnO1xuXG4gICAgICAgICAgaWYgKHN0ci5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLmNhY2hlZF9pbWFnZXMucHVzaChpbWFnZXNbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsb2FkZWRfY291bnQgPT09IGNvdW50KSB7XG4gICAgICAgICAgdGhpcy5pbWFnZXNfbG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLmVuaGFuY2UoJ2ltYWdlcycpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICB1cGRhdGVfbm9kZXMgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgbm9kZXMgPSB0aGlzLlMoJ1snICsgdGhpcy5kYXRhX2F0dHIgKyAnXScpLm5vdCgnaW1nJyksXG4gICAgICAgICAgY291bnQgPSBub2Rlcy5sZW5ndGgsXG4gICAgICAgICAgaSA9IGNvdW50LFxuICAgICAgICAgIGxvYWRlZF9jb3VudCA9IDAsXG4gICAgICAgICAgZGF0YV9hdHRyID0gdGhpcy5kYXRhX2F0dHI7XG5cbiAgICAgIHRoaXMuY2FjaGVkX25vZGVzID0gW107XG4gICAgICB0aGlzLm5vZGVzX2xvYWRlZCA9IChjb3VudCA9PT0gMCk7XG5cbiAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgbG9hZGVkX2NvdW50Kys7XG4gICAgICAgIHZhciBzdHIgPSBub2Rlc1tpXS5nZXRBdHRyaWJ1dGUoZGF0YV9hdHRyKSB8fCAnJztcblxuICAgICAgICBpZiAoc3RyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB0aGlzLmNhY2hlZF9ub2Rlcy5wdXNoKG5vZGVzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsb2FkZWRfY291bnQgPT09IGNvdW50KSB7XG4gICAgICAgICAgdGhpcy5ub2Rlc19sb2FkZWQgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuZW5oYW5jZSgnbm9kZXMnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgZW5oYW5jZSA6IGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgICB2YXIgaSA9IHRoaXNbJ2NhY2hlZF8nICsgdHlwZV0ubGVuZ3RoO1xuXG4gICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIHRoaXMub2JqZWN0KCQodGhpc1snY2FjaGVkXycgKyB0eXBlXVtpXSkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gJCh3aW5kb3cpLnRyaWdnZXIoJ3Jlc2l6ZScpLnRyaWdnZXIoJ3Jlc2l6ZS5mbmR0bi5pbnRlcmNoYW5nZScpO1xuICAgIH0sXG5cbiAgICBjb252ZXJ0X2RpcmVjdGl2ZSA6IGZ1bmN0aW9uIChkaXJlY3RpdmUpIHtcblxuICAgICAgdmFyIHRyaW1tZWQgPSB0aGlzLnRyaW0oZGlyZWN0aXZlKTtcblxuICAgICAgaWYgKHRyaW1tZWQubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gdHJpbW1lZDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICdyZXBsYWNlJztcbiAgICB9LFxuXG4gICAgcGFyc2Vfc2NlbmFyaW8gOiBmdW5jdGlvbiAoc2NlbmFyaW8pIHtcbiAgICAgIC8vIFRoaXMgbG9naWMgaGFkIHRvIGJlIG1hZGUgbW9yZSBjb21wbGV4IHNpbmNlIHNvbWUgdXNlcnMgd2VyZSB1c2luZyBjb21tYXMgaW4gdGhlIHVybCBwYXRoXG4gICAgICAvLyBTbyB3ZSBjYW5ub3Qgc2ltcGx5IGp1c3Qgc3BsaXQgb24gYSBjb21tYVxuICAgICAgdmFyIGRpcmVjdGl2ZV9tYXRjaCA9IHNjZW5hcmlvWzBdLm1hdGNoKC8oLispLFxccyooXFx3KylcXHMqJC8pLFxuICAgICAgbWVkaWFfcXVlcnkgICAgICAgICA9IHNjZW5hcmlvWzFdO1xuXG4gICAgICBpZiAoZGlyZWN0aXZlX21hdGNoKSB7XG4gICAgICAgIHZhciBwYXRoICA9IGRpcmVjdGl2ZV9tYXRjaFsxXSxcbiAgICAgICAgZGlyZWN0aXZlID0gZGlyZWN0aXZlX21hdGNoWzJdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGNhY2hlZF9zcGxpdCA9IHNjZW5hcmlvWzBdLnNwbGl0KC8sXFxzKiQvKSxcbiAgICAgICAgcGF0aCAgICAgICAgICAgICA9IGNhY2hlZF9zcGxpdFswXSxcbiAgICAgICAgZGlyZWN0aXZlICAgICAgICA9ICcnO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gW3RoaXMudHJpbShwYXRoKSwgdGhpcy5jb252ZXJ0X2RpcmVjdGl2ZShkaXJlY3RpdmUpLCB0aGlzLnRyaW0obWVkaWFfcXVlcnkpXTtcbiAgICB9LFxuXG4gICAgb2JqZWN0IDogZnVuY3Rpb24gKGVsKSB7XG4gICAgICB2YXIgcmF3X2FyciA9IHRoaXMucGFyc2VfZGF0YV9hdHRyKGVsKSxcbiAgICAgICAgICBzY2VuYXJpb3MgPSBbXSxcbiAgICAgICAgICBpID0gcmF3X2Fyci5sZW5ndGg7XG5cbiAgICAgIGlmIChpID4gMCkge1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgdmFyIHNwbGl0ID0gcmF3X2FycltpXS5zcGxpdCgvXFwoKFteXFwpXSo/KShcXCkpJC8pO1xuXG4gICAgICAgICAgaWYgKHNwbGl0Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSB0aGlzLnBhcnNlX3NjZW5hcmlvKHNwbGl0KTtcbiAgICAgICAgICAgIHNjZW5hcmlvcy5wdXNoKHBhcmFtcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLnN0b3JlKGVsLCBzY2VuYXJpb3MpO1xuICAgIH0sXG5cbiAgICBzdG9yZSA6IGZ1bmN0aW9uIChlbCwgc2NlbmFyaW9zKSB7XG4gICAgICB2YXIgdXVpZCA9IHRoaXMucmFuZG9tX3N0cigpLFxuICAgICAgICAgIGN1cnJlbnRfdXVpZCA9IGVsLmRhdGEodGhpcy5hZGRfbmFtZXNwYWNlKCd1dWlkJywgdHJ1ZSkpO1xuXG4gICAgICBpZiAodGhpcy5jYWNoZVtjdXJyZW50X3V1aWRdKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlW2N1cnJlbnRfdXVpZF07XG4gICAgICB9XG5cbiAgICAgIGVsLmF0dHIodGhpcy5hZGRfbmFtZXNwYWNlKCdkYXRhLXV1aWQnKSwgdXVpZCk7XG5cbiAgICAgIHJldHVybiB0aGlzLmNhY2hlW3V1aWRdID0gc2NlbmFyaW9zO1xuICAgIH0sXG5cbiAgICB0cmltIDogZnVuY3Rpb24gKHN0cikge1xuXG4gICAgICBpZiAodHlwZW9mIHN0ciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuICQudHJpbShzdHIpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc3RyO1xuICAgIH0sXG5cbiAgICBzZXRfZGF0YV9hdHRyIDogZnVuY3Rpb24gKGluaXQpIHtcbiAgICAgIGlmIChpbml0KSB7XG4gICAgICAgIGlmICh0aGlzLm5hbWVzcGFjZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubmFtZXNwYWNlICsgJy0nICsgdGhpcy5zZXR0aW5ncy5sb2FkX2F0dHI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5zZXR0aW5ncy5sb2FkX2F0dHI7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm5hbWVzcGFjZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiAnZGF0YS0nICsgdGhpcy5uYW1lc3BhY2UgKyAnLScgKyB0aGlzLnNldHRpbmdzLmxvYWRfYXR0cjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICdkYXRhLScgKyB0aGlzLnNldHRpbmdzLmxvYWRfYXR0cjtcbiAgICB9LFxuXG4gICAgcGFyc2VfZGF0YV9hdHRyIDogZnVuY3Rpb24gKGVsKSB7XG4gICAgICB2YXIgcmF3ID0gZWwuYXR0cih0aGlzLmF0dHJfbmFtZSgpKS5zcGxpdCgvXFxbKC4qPylcXF0vKSxcbiAgICAgICAgICBpID0gcmF3Lmxlbmd0aCxcbiAgICAgICAgICBvdXRwdXQgPSBbXTtcblxuICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICBpZiAocmF3W2ldLnJlcGxhY2UoL1tcXFdcXGRdKy8sICcnKS5sZW5ndGggPiA0KSB7XG4gICAgICAgICAgb3V0cHV0LnB1c2gocmF3W2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH0sXG5cbiAgICByZWZsb3cgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmxvYWQoJ2ltYWdlcycsIHRydWUpO1xuICAgICAgdGhpcy5sb2FkKCdub2RlcycsIHRydWUpO1xuICAgIH1cblxuICB9O1xuXG59KGpRdWVyeSwgd2luZG93LCB3aW5kb3cuZG9jdW1lbnQpKTtcblxuOyhmdW5jdGlvbiAoJCwgd2luZG93LCBkb2N1bWVudCwgdW5kZWZpbmVkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgTW9kZXJuaXpyID0gTW9kZXJuaXpyIHx8IGZhbHNlO1xuXG4gIEZvdW5kYXRpb24ubGlicy5qb3lyaWRlID0ge1xuICAgIG5hbWUgOiAnam95cmlkZScsXG5cbiAgICB2ZXJzaW9uIDogJzUuNS4xJyxcblxuICAgIGRlZmF1bHRzIDoge1xuICAgICAgZXhwb3NlICAgICAgICAgICAgICAgICAgIDogZmFsc2UsICAgICAvLyB0dXJuIG9uIG9yIG9mZiB0aGUgZXhwb3NlIGZlYXR1cmVcbiAgICAgIG1vZGFsICAgICAgICAgICAgICAgICAgICA6IHRydWUsICAgICAgLy8gV2hldGhlciB0byBjb3ZlciBwYWdlIHdpdGggbW9kYWwgZHVyaW5nIHRoZSB0b3VyXG4gICAgICBrZXlib2FyZCAgICAgICAgICAgICAgICAgOiB0cnVlLCAgICAgIC8vIGVuYWJsZSBsZWZ0LCByaWdodCBhbmQgZXNjIGtleXN0cm9rZXNcbiAgICAgIHRpcF9sb2NhdGlvbiAgICAgICAgICAgICA6ICdib3R0b20nLCAgLy8gJ3RvcCcgb3IgJ2JvdHRvbScgaW4gcmVsYXRpb24gdG8gcGFyZW50XG4gICAgICBudWJfcG9zaXRpb24gICAgICAgICAgICAgOiAnYXV0bycsICAgIC8vIG92ZXJyaWRlIG9uIGEgcGVyIHRvb2x0aXAgYmFzZXNcbiAgICAgIHNjcm9sbF9zcGVlZCAgICAgICAgICAgICA6IDE1MDAsICAgICAgLy8gUGFnZSBzY3JvbGxpbmcgc3BlZWQgaW4gbWlsbGlzZWNvbmRzLCAwID0gbm8gc2Nyb2xsIGFuaW1hdGlvblxuICAgICAgc2Nyb2xsX2FuaW1hdGlvbiAgICAgICAgIDogJ2xpbmVhcicsICAvLyBzdXBwb3J0cyAnc3dpbmcnIGFuZCAnbGluZWFyJywgZXh0ZW5kIHdpdGggalF1ZXJ5IFVJLlxuICAgICAgdGltZXIgICAgICAgICAgICAgICAgICAgIDogMCwgICAgICAgICAvLyAwID0gbm8gdGltZXIgLCBhbGwgb3RoZXIgbnVtYmVycyA9IHRpbWVyIGluIG1pbGxpc2Vjb25kc1xuICAgICAgc3RhcnRfdGltZXJfb25fY2xpY2sgICAgIDogdHJ1ZSwgICAgICAvLyB0cnVlIG9yIGZhbHNlIC0gdHJ1ZSByZXF1aXJlcyBjbGlja2luZyB0aGUgZmlyc3QgYnV0dG9uIHN0YXJ0IHRoZSB0aW1lclxuICAgICAgc3RhcnRfb2Zmc2V0ICAgICAgICAgICAgIDogMCwgICAgICAgICAvLyB0aGUgaW5kZXggb2YgdGhlIHRvb2x0aXAgeW91IHdhbnQgdG8gc3RhcnQgb24gKGluZGV4IG9mIHRoZSBsaSlcbiAgICAgIG5leHRfYnV0dG9uICAgICAgICAgICAgICA6IHRydWUsICAgICAgLy8gdHJ1ZSBvciBmYWxzZSB0byBjb250cm9sIHdoZXRoZXIgYSBuZXh0IGJ1dHRvbiBpcyB1c2VkXG4gICAgICBwcmV2X2J1dHRvbiAgICAgICAgICAgICAgOiB0cnVlLCAgICAgIC8vIHRydWUgb3IgZmFsc2UgdG8gY29udHJvbCB3aGV0aGVyIGEgcHJldiBidXR0b24gaXMgdXNlZFxuICAgICAgdGlwX2FuaW1hdGlvbiAgICAgICAgICAgIDogJ2ZhZGUnLCAgICAvLyAncG9wJyBvciAnZmFkZScgaW4gZWFjaCB0aXBcbiAgICAgIHBhdXNlX2FmdGVyICAgICAgICAgICAgICA6IFtdLCAgICAgICAgLy8gYXJyYXkgb2YgaW5kZXhlcyB3aGVyZSB0byBwYXVzZSB0aGUgdG91ciBhZnRlclxuICAgICAgZXhwb3NlZCAgICAgICAgICAgICAgICAgIDogW10sICAgICAgICAvLyBhcnJheSBvZiBleHBvc2UgZWxlbWVudHNcbiAgICAgIHRpcF9hbmltYXRpb25fZmFkZV9zcGVlZCA6IDMwMCwgICAgICAgLy8gd2hlbiB0aXBBbmltYXRpb24gPSAnZmFkZScgdGhpcyBpcyBzcGVlZCBpbiBtaWxsaXNlY29uZHMgZm9yIHRoZSB0cmFuc2l0aW9uXG4gICAgICBjb29raWVfbW9uc3RlciAgICAgICAgICAgOiBmYWxzZSwgICAgIC8vIHRydWUgb3IgZmFsc2UgdG8gY29udHJvbCB3aGV0aGVyIGNvb2tpZXMgYXJlIHVzZWRcbiAgICAgIGNvb2tpZV9uYW1lICAgICAgICAgICAgICA6ICdqb3lyaWRlJywgLy8gTmFtZSB0aGUgY29va2llIHlvdSdsbCB1c2VcbiAgICAgIGNvb2tpZV9kb21haW4gICAgICAgICAgICA6IGZhbHNlLCAgICAgLy8gV2lsbCB0aGlzIGNvb2tpZSBiZSBhdHRhY2hlZCB0byBhIGRvbWFpbiwgaWUuICcubm90YWJsZWFwcC5jb20nXG4gICAgICBjb29raWVfZXhwaXJlcyAgICAgICAgICAgOiAzNjUsICAgICAgIC8vIHNldCB3aGVuIHlvdSB3b3VsZCBsaWtlIHRoZSBjb29raWUgdG8gZXhwaXJlLlxuICAgICAgdGlwX2NvbnRhaW5lciAgICAgICAgICAgIDogJ2JvZHknLCAgICAvLyBXaGVyZSB3aWxsIHRoZSB0aXAgYmUgYXR0YWNoZWRcbiAgICAgIGFib3J0X29uX2Nsb3NlICAgICAgICAgICA6IHRydWUsICAgICAgLy8gV2hlbiB0cnVlLCB0aGUgY2xvc2UgZXZlbnQgd2lsbCBub3QgZmlyZSBhbnkgY2FsbGJhY2tcbiAgICAgIHRpcF9sb2NhdGlvbl9wYXR0ZXJucyAgICA6IHtcbiAgICAgICAgdG9wIDogWydib3R0b20nXSxcbiAgICAgICAgYm90dG9tIDogW10sIC8vIGJvdHRvbSBzaG91bGQgbm90IG5lZWQgdG8gYmUgcmVwb3NpdGlvbmVkXG4gICAgICAgIGxlZnQgOiBbJ3JpZ2h0JywgJ3RvcCcsICdib3R0b20nXSxcbiAgICAgICAgcmlnaHQgOiBbJ2xlZnQnLCAndG9wJywgJ2JvdHRvbSddXG4gICAgICB9LFxuICAgICAgcG9zdF9yaWRlX2NhbGxiYWNrICAgICA6IGZ1bmN0aW9uICgpIHt9LCAgICAvLyBBIG1ldGhvZCB0byBjYWxsIG9uY2UgdGhlIHRvdXIgY2xvc2VzIChjYW5jZWxlZCBvciBjb21wbGV0ZSlcbiAgICAgIHBvc3Rfc3RlcF9jYWxsYmFjayAgICAgOiBmdW5jdGlvbiAoKSB7fSwgICAgLy8gQSBtZXRob2QgdG8gY2FsbCBhZnRlciBlYWNoIHN0ZXBcbiAgICAgIHByZV9zdGVwX2NhbGxiYWNrICAgICAgOiBmdW5jdGlvbiAoKSB7fSwgICAgLy8gQSBtZXRob2QgdG8gY2FsbCBiZWZvcmUgZWFjaCBzdGVwXG4gICAgICBwcmVfcmlkZV9jYWxsYmFjayAgICAgIDogZnVuY3Rpb24gKCkge30sICAgIC8vIEEgbWV0aG9kIHRvIGNhbGwgYmVmb3JlIHRoZSB0b3VyIHN0YXJ0cyAocGFzc2VkIGluZGV4LCB0aXAsIGFuZCBjbG9uZWQgZXhwb3NlZCBlbGVtZW50KVxuICAgICAgcG9zdF9leHBvc2VfY2FsbGJhY2sgICA6IGZ1bmN0aW9uICgpIHt9LCAgICAvLyBBIG1ldGhvZCB0byBjYWxsIGFmdGVyIGFuIGVsZW1lbnQgaGFzIGJlZW4gZXhwb3NlZFxuICAgICAgdGVtcGxhdGUgOiB7IC8vIEhUTUwgc2VnbWVudHMgZm9yIHRpcCBsYXlvdXRcbiAgICAgICAgbGluayAgICAgICAgICA6ICc8YSBocmVmPVwiI2Nsb3NlXCIgY2xhc3M9XCJqb3lyaWRlLWNsb3NlLXRpcFwiPiZ0aW1lczs8L2E+JyxcbiAgICAgICAgdGltZXIgICAgICAgICA6ICc8ZGl2IGNsYXNzPVwiam95cmlkZS10aW1lci1pbmRpY2F0b3Itd3JhcFwiPjxzcGFuIGNsYXNzPVwiam95cmlkZS10aW1lci1pbmRpY2F0b3JcIj48L3NwYW4+PC9kaXY+JyxcbiAgICAgICAgdGlwICAgICAgICAgICA6ICc8ZGl2IGNsYXNzPVwiam95cmlkZS10aXAtZ3VpZGVcIj48c3BhbiBjbGFzcz1cImpveXJpZGUtbnViXCI+PC9zcGFuPjwvZGl2PicsXG4gICAgICAgIHdyYXBwZXIgICAgICAgOiAnPGRpdiBjbGFzcz1cImpveXJpZGUtY29udGVudC13cmFwcGVyXCI+PC9kaXY+JyxcbiAgICAgICAgYnV0dG9uICAgICAgICA6ICc8YSBocmVmPVwiI1wiIGNsYXNzPVwic21hbGwgYnV0dG9uIGpveXJpZGUtbmV4dC10aXBcIj48L2E+JyxcbiAgICAgICAgcHJldl9idXR0b24gICA6ICc8YSBocmVmPVwiI1wiIGNsYXNzPVwic21hbGwgYnV0dG9uIGpveXJpZGUtcHJldi10aXBcIj48L2E+JyxcbiAgICAgICAgbW9kYWwgICAgICAgICA6ICc8ZGl2IGNsYXNzPVwiam95cmlkZS1tb2RhbC1iZ1wiPjwvZGl2PicsXG4gICAgICAgIGV4cG9zZSAgICAgICAgOiAnPGRpdiBjbGFzcz1cImpveXJpZGUtZXhwb3NlLXdyYXBwZXJcIj48L2Rpdj4nLFxuICAgICAgICBleHBvc2VfY292ZXIgIDogJzxkaXYgY2xhc3M9XCJqb3lyaWRlLWV4cG9zZS1jb3ZlclwiPjwvZGl2PidcbiAgICAgIH0sXG4gICAgICBleHBvc2VfYWRkX2NsYXNzIDogJycgLy8gT25lIG9yIG1vcmUgc3BhY2Utc2VwYXJhdGVkIGNsYXNzIG5hbWVzIHRvIGJlIGFkZGVkIHRvIGV4cG9zZWQgZWxlbWVudFxuICAgIH0sXG5cbiAgICBpbml0IDogZnVuY3Rpb24gKHNjb3BlLCBtZXRob2QsIG9wdGlvbnMpIHtcbiAgICAgIEZvdW5kYXRpb24uaW5oZXJpdCh0aGlzLCAndGhyb3R0bGUgcmFuZG9tX3N0cicpO1xuXG4gICAgICB0aGlzLnNldHRpbmdzID0gdGhpcy5zZXR0aW5ncyB8fCAkLmV4dGVuZCh7fSwgdGhpcy5kZWZhdWx0cywgKG9wdGlvbnMgfHwgbWV0aG9kKSk7XG5cbiAgICAgIHRoaXMuYmluZGluZ3MobWV0aG9kLCBvcHRpb25zKVxuICAgIH0sXG5cbiAgICBnb19uZXh0IDogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuJGxpLm5leHQoKS5sZW5ndGggPCAxKSB7XG4gICAgICAgIHRoaXMuZW5kKCk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuc2V0dGluZ3MudGltZXIgPiAwKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnNldHRpbmdzLmF1dG9tYXRlKTtcbiAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICAgIHRoaXMuc2hvdygpO1xuICAgICAgICB0aGlzLnN0YXJ0VGltZXIoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgICB0aGlzLnNob3coKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZ29fcHJldiA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0aGlzLnNldHRpbmdzLiRsaS5wcmV2KCkubGVuZ3RoIDwgMSkge1xuICAgICAgICAvLyBEbyBub3RoaW5nIGlmIHRoZXJlIGFyZSBubyBwcmV2IGVsZW1lbnRcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5zZXR0aW5ncy50aW1lciA+IDApIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuc2V0dGluZ3MuYXV0b21hdGUpO1xuICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgdGhpcy5zaG93KG51bGwsIHRydWUpO1xuICAgICAgICB0aGlzLnN0YXJ0VGltZXIoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgICB0aGlzLnNob3cobnVsbCwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGV2ZW50cyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgJCh0aGlzLnNjb3BlKVxuICAgICAgICAub2ZmKCcuam95cmlkZScpXG4gICAgICAgIC5vbignY2xpY2suZm5kdG4uam95cmlkZScsICcuam95cmlkZS1uZXh0LXRpcCwgLmpveXJpZGUtbW9kYWwtYmcnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB0aGlzLmdvX25leHQoKVxuICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgIC5vbignY2xpY2suZm5kdG4uam95cmlkZScsICcuam95cmlkZS1wcmV2LXRpcCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHRoaXMuZ29fcHJldigpO1xuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLm9uKCdjbGljay5mbmR0bi5qb3lyaWRlJywgJy5qb3lyaWRlLWNsb3NlLXRpcCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHRoaXMuZW5kKHRoaXMuc2V0dGluZ3MuYWJvcnRfb25fY2xvc2UpO1xuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLm9uKCdrZXl1cC5mbmR0bi5qb3lyaWRlJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBrZXlzdHJva2VzIGFyZSBkaXNhYmxlZFxuICAgICAgICAgIC8vIG9yIGlmIHRoZSBqb3lyaWRlIGlzIG5vdCBiZWluZyBzaG93blxuICAgICAgICAgIGlmICghdGhpcy5zZXR0aW5ncy5rZXlib2FyZCB8fCAhdGhpcy5zZXR0aW5ncy5yaWRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzd2l0Y2ggKGUud2hpY2gpIHtcbiAgICAgICAgICAgIGNhc2UgMzk6IC8vIHJpZ2h0IGFycm93XG4gICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgdGhpcy5nb19uZXh0KCk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzNzogLy8gbGVmdCBhcnJvd1xuICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgIHRoaXMuZ29fcHJldigpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMjc6IC8vIGVzY2FwZVxuICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgIHRoaXMuZW5kKHRoaXMuc2V0dGluZ3MuYWJvcnRfb25fY2xvc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgJCh3aW5kb3cpXG4gICAgICAgIC5vZmYoJy5qb3lyaWRlJylcbiAgICAgICAgLm9uKCdyZXNpemUuZm5kdG4uam95cmlkZScsIHNlbGYudGhyb3R0bGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGlmICgkKCdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnXScpLmxlbmd0aCA+IDAgJiYgc2VsZi5zZXR0aW5ncy4kbmV4dF90aXAgJiYgc2VsZi5zZXR0aW5ncy5yaWRpbmcpIHtcbiAgICAgICAgICAgIGlmIChzZWxmLnNldHRpbmdzLmV4cG9zZWQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICB2YXIgJGVscyA9ICQoc2VsZi5zZXR0aW5ncy5leHBvc2VkKTtcblxuICAgICAgICAgICAgICAkZWxzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgICAgICAgICAgICAgc2VsZi51bl9leHBvc2UoJHRoaXMpO1xuICAgICAgICAgICAgICAgIHNlbGYuZXhwb3NlKCR0aGlzKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZWxmLmlzX3Bob25lKCkpIHtcbiAgICAgICAgICAgICAgc2VsZi5wb3NfcGhvbmUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNlbGYucG9zX2RlZmF1bHQoZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgMTAwKSk7XG4gICAgfSxcblxuICAgIHN0YXJ0IDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICR0aGlzID0gJCgnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10nLCB0aGlzLnNjb3BlKSxcbiAgICAgICAgICBpbnRlZ2VyX3NldHRpbmdzID0gWyd0aW1lcicsICdzY3JvbGxTcGVlZCcsICdzdGFydE9mZnNldCcsICd0aXBBbmltYXRpb25GYWRlU3BlZWQnLCAnY29va2llRXhwaXJlcyddLFxuICAgICAgICAgIGludF9zZXR0aW5nc19jb3VudCA9IGludGVnZXJfc2V0dGluZ3MubGVuZ3RoO1xuXG4gICAgICBpZiAoISR0aGlzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMuc2V0dGluZ3MuaW5pdCkge1xuICAgICAgICB0aGlzLmV2ZW50cygpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnNldHRpbmdzID0gJHRoaXMuZGF0YSh0aGlzLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpO1xuXG4gICAgICAvLyBub24gY29uZmlndXJlYWJsZSBzZXR0aW5nc1xuICAgICAgdGhpcy5zZXR0aW5ncy4kY29udGVudF9lbCA9ICR0aGlzO1xuICAgICAgdGhpcy5zZXR0aW5ncy4kYm9keSA9ICQodGhpcy5zZXR0aW5ncy50aXBfY29udGFpbmVyKTtcbiAgICAgIHRoaXMuc2V0dGluZ3MuYm9keV9vZmZzZXQgPSAkKHRoaXMuc2V0dGluZ3MudGlwX2NvbnRhaW5lcikucG9zaXRpb24oKTtcbiAgICAgIHRoaXMuc2V0dGluZ3MuJHRpcF9jb250ZW50ID0gdGhpcy5zZXR0aW5ncy4kY29udGVudF9lbC5maW5kKCc+IGxpJyk7XG4gICAgICB0aGlzLnNldHRpbmdzLnBhdXNlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5zZXR0aW5ncy5hdHRlbXB0cyA9IDA7XG4gICAgICB0aGlzLnNldHRpbmdzLnJpZGluZyA9IHRydWU7XG5cbiAgICAgIC8vIGNhbiB3ZSBjcmVhdGUgY29va2llcz9cbiAgICAgIGlmICh0eXBlb2YgJC5jb29raWUgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5jb29raWVfbW9uc3RlciA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyBnZW5lcmF0ZSB0aGUgdGlwcyBhbmQgaW5zZXJ0IGludG8gZG9tLlxuICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLmNvb2tpZV9tb25zdGVyIHx8IHRoaXMuc2V0dGluZ3MuY29va2llX21vbnN0ZXIgJiYgISQuY29va2llKHRoaXMuc2V0dGluZ3MuY29va2llX25hbWUpKSB7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MuJHRpcF9jb250ZW50LmVhY2goZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcbiAgICAgICAgICB0aGlzLnNldHRpbmdzID0gJC5leHRlbmQoe30sIHNlbGYuZGVmYXVsdHMsIHNlbGYuZGF0YV9vcHRpb25zKCR0aGlzKSk7XG5cbiAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhhdCBzZXR0aW5ncyBwYXJzZWQgZnJvbSBkYXRhX29wdGlvbnMgYXJlIGludGVnZXJzIHdoZXJlIG5lY2Vzc2FyeVxuICAgICAgICAgIHZhciBpID0gaW50X3NldHRpbmdzX2NvdW50O1xuICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIHNlbGYuc2V0dGluZ3NbaW50ZWdlcl9zZXR0aW5nc1tpXV0gPSBwYXJzZUludChzZWxmLnNldHRpbmdzW2ludGVnZXJfc2V0dGluZ3NbaV1dLCAxMCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNlbGYuY3JlYXRlKHskbGkgOiAkdGhpcywgaW5kZXggOiBpbmRleH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBzaG93IGZpcnN0IHRpcFxuICAgICAgICBpZiAoIXRoaXMuc2V0dGluZ3Muc3RhcnRfdGltZXJfb25fY2xpY2sgJiYgdGhpcy5zZXR0aW5ncy50aW1lciA+IDApIHtcbiAgICAgICAgICB0aGlzLnNob3coJ2luaXQnKTtcbiAgICAgICAgICB0aGlzLnN0YXJ0VGltZXIoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnNob3coJ2luaXQnKTtcbiAgICAgICAgfVxuXG4gICAgICB9XG4gICAgfSxcblxuICAgIHJlc3VtZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuc2V0X2xpKCk7XG4gICAgICB0aGlzLnNob3coKTtcbiAgICB9LFxuXG4gICAgdGlwX3RlbXBsYXRlIDogZnVuY3Rpb24gKG9wdHMpIHtcbiAgICAgIHZhciAkYmxhbmssIGNvbnRlbnQ7XG5cbiAgICAgIG9wdHMudGlwX2NsYXNzID0gb3B0cy50aXBfY2xhc3MgfHwgJyc7XG5cbiAgICAgICRibGFuayA9ICQodGhpcy5zZXR0aW5ncy50ZW1wbGF0ZS50aXApLmFkZENsYXNzKG9wdHMudGlwX2NsYXNzKTtcbiAgICAgIGNvbnRlbnQgPSAkLnRyaW0oJChvcHRzLmxpKS5odG1sKCkpICtcbiAgICAgICAgdGhpcy5wcmV2X2J1dHRvbl90ZXh0KG9wdHMucHJldl9idXR0b25fdGV4dCwgb3B0cy5pbmRleCkgK1xuICAgICAgICB0aGlzLmJ1dHRvbl90ZXh0KG9wdHMuYnV0dG9uX3RleHQpICtcbiAgICAgICAgdGhpcy5zZXR0aW5ncy50ZW1wbGF0ZS5saW5rICtcbiAgICAgICAgdGhpcy50aW1lcl9pbnN0YW5jZShvcHRzLmluZGV4KTtcblxuICAgICAgJGJsYW5rLmFwcGVuZCgkKHRoaXMuc2V0dGluZ3MudGVtcGxhdGUud3JhcHBlcikpO1xuICAgICAgJGJsYW5rLmZpcnN0KCkuYXR0cih0aGlzLmFkZF9uYW1lc3BhY2UoJ2RhdGEtaW5kZXgnKSwgb3B0cy5pbmRleCk7XG4gICAgICAkKCcuam95cmlkZS1jb250ZW50LXdyYXBwZXInLCAkYmxhbmspLmFwcGVuZChjb250ZW50KTtcblxuICAgICAgcmV0dXJuICRibGFua1swXTtcbiAgICB9LFxuXG4gICAgdGltZXJfaW5zdGFuY2UgOiBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgIHZhciB0eHQ7XG5cbiAgICAgIGlmICgoaW5kZXggPT09IDAgJiYgdGhpcy5zZXR0aW5ncy5zdGFydF90aW1lcl9vbl9jbGljayAmJiB0aGlzLnNldHRpbmdzLnRpbWVyID4gMCkgfHwgdGhpcy5zZXR0aW5ncy50aW1lciA9PT0gMCkge1xuICAgICAgICB0eHQgPSAnJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHR4dCA9ICQodGhpcy5zZXR0aW5ncy50ZW1wbGF0ZS50aW1lcilbMF0ub3V0ZXJIVE1MO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHR4dDtcbiAgICB9LFxuXG4gICAgYnV0dG9uX3RleHQgOiBmdW5jdGlvbiAodHh0KSB7XG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy50aXBfc2V0dGluZ3MubmV4dF9idXR0b24pIHtcbiAgICAgICAgdHh0ID0gJC50cmltKHR4dCkgfHwgJ05leHQnO1xuICAgICAgICB0eHQgPSAkKHRoaXMuc2V0dGluZ3MudGVtcGxhdGUuYnV0dG9uKS5hcHBlbmQodHh0KVswXS5vdXRlckhUTUw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0eHQgPSAnJztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0eHQ7XG4gICAgfSxcblxuICAgIHByZXZfYnV0dG9uX3RleHQgOiBmdW5jdGlvbiAodHh0LCBpZHgpIHtcbiAgICAgIGlmICh0aGlzLnNldHRpbmdzLnRpcF9zZXR0aW5ncy5wcmV2X2J1dHRvbikge1xuICAgICAgICB0eHQgPSAkLnRyaW0odHh0KSB8fCAnUHJldmlvdXMnO1xuXG4gICAgICAgIC8vIEFkZCB0aGUgZGlzYWJsZWQgY2xhc3MgdG8gdGhlIGJ1dHRvbiBpZiBpdCdzIHRoZSBmaXJzdCBlbGVtZW50XG4gICAgICAgIGlmIChpZHggPT0gMCkge1xuICAgICAgICAgIHR4dCA9ICQodGhpcy5zZXR0aW5ncy50ZW1wbGF0ZS5wcmV2X2J1dHRvbikuYXBwZW5kKHR4dCkuYWRkQ2xhc3MoJ2Rpc2FibGVkJylbMF0ub3V0ZXJIVE1MO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHR4dCA9ICQodGhpcy5zZXR0aW5ncy50ZW1wbGF0ZS5wcmV2X2J1dHRvbikuYXBwZW5kKHR4dClbMF0ub3V0ZXJIVE1MO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0eHQgPSAnJztcbiAgICAgIH1cbiAgICAgIHJldHVybiB0eHQ7XG4gICAgfSxcblxuICAgIGNyZWF0ZSA6IGZ1bmN0aW9uIChvcHRzKSB7XG4gICAgICB0aGlzLnNldHRpbmdzLnRpcF9zZXR0aW5ncyA9ICQuZXh0ZW5kKHt9LCB0aGlzLnNldHRpbmdzLCB0aGlzLmRhdGFfb3B0aW9ucyhvcHRzLiRsaSkpO1xuICAgICAgdmFyIGJ1dHRvblRleHQgPSBvcHRzLiRsaS5hdHRyKHRoaXMuYWRkX25hbWVzcGFjZSgnZGF0YS1idXR0b24nKSkgfHwgb3B0cy4kbGkuYXR0cih0aGlzLmFkZF9uYW1lc3BhY2UoJ2RhdGEtdGV4dCcpKSxcbiAgICAgICAgICBwcmV2QnV0dG9uVGV4dCA9IG9wdHMuJGxpLmF0dHIodGhpcy5hZGRfbmFtZXNwYWNlKCdkYXRhLWJ1dHRvbi1wcmV2JykpIHx8IG9wdHMuJGxpLmF0dHIodGhpcy5hZGRfbmFtZXNwYWNlKCdkYXRhLXByZXYtdGV4dCcpKSxcbiAgICAgICAgdGlwQ2xhc3MgPSBvcHRzLiRsaS5hdHRyKCdjbGFzcycpLFxuICAgICAgICAkdGlwX2NvbnRlbnQgPSAkKHRoaXMudGlwX3RlbXBsYXRlKHtcbiAgICAgICAgICB0aXBfY2xhc3MgOiB0aXBDbGFzcyxcbiAgICAgICAgICBpbmRleCA6IG9wdHMuaW5kZXgsXG4gICAgICAgICAgYnV0dG9uX3RleHQgOiBidXR0b25UZXh0LFxuICAgICAgICAgIHByZXZfYnV0dG9uX3RleHQgOiBwcmV2QnV0dG9uVGV4dCxcbiAgICAgICAgICBsaSA6IG9wdHMuJGxpXG4gICAgICAgIH0pKTtcblxuICAgICAgJCh0aGlzLnNldHRpbmdzLnRpcF9jb250YWluZXIpLmFwcGVuZCgkdGlwX2NvbnRlbnQpO1xuICAgIH0sXG5cbiAgICBzaG93IDogZnVuY3Rpb24gKGluaXQsIGlzX3ByZXYpIHtcbiAgICAgIHZhciAkdGltZXIgPSBudWxsO1xuXG4gICAgICAvLyBhcmUgd2UgcGF1c2VkP1xuICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuJGxpID09PSB1bmRlZmluZWQgfHwgKCQuaW5BcnJheSh0aGlzLnNldHRpbmdzLiRsaS5pbmRleCgpLCB0aGlzLnNldHRpbmdzLnBhdXNlX2FmdGVyKSA9PT0gLTEpKSB7XG5cbiAgICAgICAgLy8gZG9uJ3QgZ28gdG8gdGhlIG5leHQgbGkgaWYgdGhlIHRvdXIgd2FzIHBhdXNlZFxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5wYXVzZWQpIHtcbiAgICAgICAgICB0aGlzLnNldHRpbmdzLnBhdXNlZCA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuc2V0X2xpKGluaXQsIGlzX3ByZXYpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXR0aW5ncy5hdHRlbXB0cyA9IDA7XG5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuJGxpLmxlbmd0aCAmJiB0aGlzLnNldHRpbmdzLiR0YXJnZXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGlmIChpbml0KSB7IC8vcnVuIHdoZW4gd2UgZmlyc3Qgc3RhcnRcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MucHJlX3JpZGVfY2FsbGJhY2sodGhpcy5zZXR0aW5ncy4kbGkuaW5kZXgoKSwgdGhpcy5zZXR0aW5ncy4kbmV4dF90aXApO1xuICAgICAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MubW9kYWwpIHtcbiAgICAgICAgICAgICAgdGhpcy5zaG93X21vZGFsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5zZXR0aW5ncy5wcmVfc3RlcF9jYWxsYmFjayh0aGlzLnNldHRpbmdzLiRsaS5pbmRleCgpLCB0aGlzLnNldHRpbmdzLiRuZXh0X3RpcCk7XG5cbiAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5tb2RhbCAmJiB0aGlzLnNldHRpbmdzLmV4cG9zZSkge1xuICAgICAgICAgICAgdGhpcy5leHBvc2UoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLnNldHRpbmdzLnRpcF9zZXR0aW5ncyA9ICQuZXh0ZW5kKHt9LCB0aGlzLnNldHRpbmdzLCB0aGlzLmRhdGFfb3B0aW9ucyh0aGlzLnNldHRpbmdzLiRsaSkpO1xuXG4gICAgICAgICAgdGhpcy5zZXR0aW5ncy50aW1lciA9IHBhcnNlSW50KHRoaXMuc2V0dGluZ3MudGltZXIsIDEwKTtcblxuICAgICAgICAgIHRoaXMuc2V0dGluZ3MudGlwX3NldHRpbmdzLnRpcF9sb2NhdGlvbl9wYXR0ZXJuID0gdGhpcy5zZXR0aW5ncy50aXBfbG9jYXRpb25fcGF0dGVybnNbdGhpcy5zZXR0aW5ncy50aXBfc2V0dGluZ3MudGlwX2xvY2F0aW9uXTtcblxuICAgICAgICAgIC8vIHNjcm9sbCBhbmQgaGlkZSBiZyBpZiBub3QgbW9kYWxcbiAgICAgICAgICBpZiAoIS9ib2R5L2kudGVzdCh0aGlzLnNldHRpbmdzLiR0YXJnZXQuc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICB2YXIgam95cmlkZW1vZGFsYmcgPSAkKCcuam95cmlkZS1tb2RhbC1iZycpO1xuICAgICAgICAgICAgaWYgKC9wb3AvaS50ZXN0KHRoaXMuc2V0dGluZ3MudGlwQW5pbWF0aW9uKSkge1xuICAgICAgICAgICAgICAgIGpveXJpZGVtb2RhbGJnLmhpZGUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgam95cmlkZW1vZGFsYmcuZmFkZU91dCh0aGlzLnNldHRpbmdzLnRpcEFuaW1hdGlvbkZhZGVTcGVlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNjcm9sbF90bygpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0aGlzLmlzX3Bob25lKCkpIHtcbiAgICAgICAgICAgIHRoaXMucG9zX3Bob25lKHRydWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnBvc19kZWZhdWx0KHRydWUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgICR0aW1lciA9IHRoaXMuc2V0dGluZ3MuJG5leHRfdGlwLmZpbmQoJy5qb3lyaWRlLXRpbWVyLWluZGljYXRvcicpO1xuXG4gICAgICAgICAgaWYgKC9wb3AvaS50ZXN0KHRoaXMuc2V0dGluZ3MudGlwX2FuaW1hdGlvbikpIHtcblxuICAgICAgICAgICAgJHRpbWVyLndpZHRoKDApO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy50aW1lciA+IDApIHtcblxuICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLiRuZXh0X3RpcC5zaG93KCk7XG5cbiAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJHRpbWVyLmFuaW1hdGUoe1xuICAgICAgICAgICAgICAgICAgd2lkdGggOiAkdGltZXIucGFyZW50KCkud2lkdGgoKVxuICAgICAgICAgICAgICAgIH0sIHRoaXMuc2V0dGluZ3MudGltZXIsICdsaW5lYXInKTtcbiAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpLCB0aGlzLnNldHRpbmdzLnRpcF9hbmltYXRpb25fZmFkZV9zcGVlZCk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuJG5leHRfdGlwLnNob3coKTtcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgfSBlbHNlIGlmICgvZmFkZS9pLnRlc3QodGhpcy5zZXR0aW5ncy50aXBfYW5pbWF0aW9uKSkge1xuXG4gICAgICAgICAgICAkdGltZXIud2lkdGgoMCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnRpbWVyID4gMCkge1xuXG4gICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuJG5leHRfdGlwXG4gICAgICAgICAgICAgICAgLmZhZGVJbih0aGlzLnNldHRpbmdzLnRpcF9hbmltYXRpb25fZmFkZV9zcGVlZClcbiAgICAgICAgICAgICAgICAuc2hvdygpO1xuXG4gICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICR0aW1lci5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICAgIHdpZHRoIDogJHRpbWVyLnBhcmVudCgpLndpZHRoKClcbiAgICAgICAgICAgICAgICB9LCB0aGlzLnNldHRpbmdzLnRpbWVyLCAnbGluZWFyJyk7XG4gICAgICAgICAgICAgIH0uYmluZCh0aGlzKSwgdGhpcy5zZXR0aW5ncy50aXBfYW5pbWF0aW9uX2ZhZGVfc3BlZWQpO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLiRuZXh0X3RpcC5mYWRlSW4odGhpcy5zZXR0aW5ncy50aXBfYW5pbWF0aW9uX2ZhZGVfc3BlZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuc2V0dGluZ3MuJGN1cnJlbnRfdGlwID0gdGhpcy5zZXR0aW5ncy4kbmV4dF90aXA7XG5cbiAgICAgICAgLy8gc2tpcCBub24tZXhpc3RhbnQgdGFyZ2V0c1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc2V0dGluZ3MuJGxpICYmIHRoaXMuc2V0dGluZ3MuJHRhcmdldC5sZW5ndGggPCAxKSB7XG5cbiAgICAgICAgICB0aGlzLnNob3coaW5pdCwgaXNfcHJldik7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgIHRoaXMuZW5kKCk7XG5cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICB0aGlzLnNldHRpbmdzLnBhdXNlZCA9IHRydWU7XG5cbiAgICAgIH1cblxuICAgIH0sXG5cbiAgICBpc19waG9uZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBtYXRjaE1lZGlhKEZvdW5kYXRpb24ubWVkaWFfcXVlcmllcy5zbWFsbCkubWF0Y2hlcyAmJlxuICAgICAgICAhbWF0Y2hNZWRpYShGb3VuZGF0aW9uLm1lZGlhX3F1ZXJpZXMubWVkaXVtKS5tYXRjaGVzO1xuICAgIH0sXG5cbiAgICBoaWRlIDogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHRoaXMuc2V0dGluZ3MubW9kYWwgJiYgdGhpcy5zZXR0aW5ncy5leHBvc2UpIHtcbiAgICAgICAgdGhpcy51bl9leHBvc2UoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLm1vZGFsKSB7XG4gICAgICAgICQoJy5qb3lyaWRlLW1vZGFsLWJnJykuaGlkZSgpO1xuICAgICAgfVxuXG4gICAgICAvLyBQcmV2ZW50IHNjcm9sbCBib3VuY2luZy4uLndhaXQgdG8gcmVtb3ZlIGZyb20gbGF5b3V0XG4gICAgICB0aGlzLnNldHRpbmdzLiRjdXJyZW50X3RpcC5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XG4gICAgICBzZXRUaW1lb3V0KCQucHJveHkoZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgdGhpcy5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xuICAgICAgfSwgdGhpcy5zZXR0aW5ncy4kY3VycmVudF90aXApLCAwKTtcbiAgICAgIHRoaXMuc2V0dGluZ3MucG9zdF9zdGVwX2NhbGxiYWNrKHRoaXMuc2V0dGluZ3MuJGxpLmluZGV4KCksXG4gICAgICAgIHRoaXMuc2V0dGluZ3MuJGN1cnJlbnRfdGlwKTtcbiAgICB9LFxuXG4gICAgc2V0X2xpIDogZnVuY3Rpb24gKGluaXQsIGlzX3ByZXYpIHtcbiAgICAgIGlmIChpbml0KSB7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MuJGxpID0gdGhpcy5zZXR0aW5ncy4kdGlwX2NvbnRlbnQuZXEodGhpcy5zZXR0aW5ncy5zdGFydF9vZmZzZXQpO1xuICAgICAgICB0aGlzLnNldF9uZXh0X3RpcCgpO1xuICAgICAgICB0aGlzLnNldHRpbmdzLiRjdXJyZW50X3RpcCA9IHRoaXMuc2V0dGluZ3MuJG5leHRfdGlwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGlzX3ByZXYpIHtcbiAgICAgICAgICB0aGlzLnNldHRpbmdzLiRsaSA9IHRoaXMuc2V0dGluZ3MuJGxpLnByZXYoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnNldHRpbmdzLiRsaSA9IHRoaXMuc2V0dGluZ3MuJGxpLm5leHQoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldF9uZXh0X3RpcCgpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnNldF90YXJnZXQoKTtcbiAgICB9LFxuXG4gICAgc2V0X25leHRfdGlwIDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5zZXR0aW5ncy4kbmV4dF90aXAgPSAkKCcuam95cmlkZS10aXAtZ3VpZGUnKS5lcSh0aGlzLnNldHRpbmdzLiRsaS5pbmRleCgpKTtcbiAgICAgIHRoaXMuc2V0dGluZ3MuJG5leHRfdGlwLmRhdGEoJ2Nsb3NlZCcsICcnKTtcbiAgICB9LFxuXG4gICAgc2V0X3RhcmdldCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBjbCA9IHRoaXMuc2V0dGluZ3MuJGxpLmF0dHIodGhpcy5hZGRfbmFtZXNwYWNlKCdkYXRhLWNsYXNzJykpLFxuICAgICAgICAgIGlkID0gdGhpcy5zZXR0aW5ncy4kbGkuYXR0cih0aGlzLmFkZF9uYW1lc3BhY2UoJ2RhdGEtaWQnKSksXG4gICAgICAgICAgJHNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChpZCkge1xuICAgICAgICAgICAgICByZXR1cm4gJChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjbCkge1xuICAgICAgICAgICAgICByZXR1cm4gJCgnLicgKyBjbCkuZmlyc3QoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiAkKCdib2R5Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgdGhpcy5zZXR0aW5ncy4kdGFyZ2V0ID0gJHNlbCgpO1xuICAgIH0sXG5cbiAgICBzY3JvbGxfdG8gOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgd2luZG93X2hhbGYsIHRpcE9mZnNldDtcblxuICAgICAgd2luZG93X2hhbGYgPSAkKHdpbmRvdykuaGVpZ2h0KCkgLyAyO1xuICAgICAgdGlwT2Zmc2V0ID0gTWF0aC5jZWlsKHRoaXMuc2V0dGluZ3MuJHRhcmdldC5vZmZzZXQoKS50b3AgLSB3aW5kb3dfaGFsZiArIHRoaXMuc2V0dGluZ3MuJG5leHRfdGlwLm91dGVySGVpZ2h0KCkpO1xuXG4gICAgICBpZiAodGlwT2Zmc2V0ICE9IDApIHtcbiAgICAgICAgJCgnaHRtbCwgYm9keScpLnN0b3AoKS5hbmltYXRlKHtcbiAgICAgICAgICBzY3JvbGxUb3AgOiB0aXBPZmZzZXRcbiAgICAgICAgfSwgdGhpcy5zZXR0aW5ncy5zY3JvbGxfc3BlZWQsICdzd2luZycpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBwYXVzZWQgOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gKCQuaW5BcnJheSgodGhpcy5zZXR0aW5ncy4kbGkuaW5kZXgoKSArIDEpLCB0aGlzLnNldHRpbmdzLnBhdXNlX2FmdGVyKSA9PT0gLTEpO1xuICAgIH0sXG5cbiAgICByZXN0YXJ0IDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICB0aGlzLnNldHRpbmdzLiRsaSA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuc2hvdygnaW5pdCcpO1xuICAgIH0sXG5cbiAgICBwb3NfZGVmYXVsdCA6IGZ1bmN0aW9uIChpbml0KSB7XG4gICAgICB2YXIgJG51YiA9IHRoaXMuc2V0dGluZ3MuJG5leHRfdGlwLmZpbmQoJy5qb3lyaWRlLW51YicpLFxuICAgICAgICAgIG51Yl93aWR0aCA9IE1hdGguY2VpbCgkbnViLm91dGVyV2lkdGgoKSAvIDIpLFxuICAgICAgICAgIG51Yl9oZWlnaHQgPSBNYXRoLmNlaWwoJG51Yi5vdXRlckhlaWdodCgpIC8gMiksXG4gICAgICAgICAgdG9nZ2xlID0gaW5pdCB8fCBmYWxzZTtcblxuICAgICAgLy8gdGlwIG11c3Qgbm90IGJlIFwiZGlzcGxheTogbm9uZVwiIHRvIGNhbGN1bGF0ZSBwb3NpdGlvblxuICAgICAgaWYgKHRvZ2dsZSkge1xuICAgICAgICB0aGlzLnNldHRpbmdzLiRuZXh0X3RpcC5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MuJG5leHRfdGlwLnNob3coKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCEvYm9keS9pLnRlc3QodGhpcy5zZXR0aW5ncy4kdGFyZ2V0LnNlbGVjdG9yKSkge1xuICAgICAgICAgIHZhciB0b3BBZGp1c3RtZW50ID0gdGhpcy5zZXR0aW5ncy50aXBfc2V0dGluZ3MudGlwQWRqdXN0bWVudFkgPyBwYXJzZUludCh0aGlzLnNldHRpbmdzLnRpcF9zZXR0aW5ncy50aXBBZGp1c3RtZW50WSkgOiAwLFxuICAgICAgICAgICAgICBsZWZ0QWRqdXN0bWVudCA9IHRoaXMuc2V0dGluZ3MudGlwX3NldHRpbmdzLnRpcEFkanVzdG1lbnRYID8gcGFyc2VJbnQodGhpcy5zZXR0aW5ncy50aXBfc2V0dGluZ3MudGlwQWRqdXN0bWVudFgpIDogMDtcblxuICAgICAgICAgIGlmICh0aGlzLmJvdHRvbSgpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5ydGwpIHtcbiAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy4kbmV4dF90aXAuY3NzKHtcbiAgICAgICAgICAgICAgICB0b3AgOiAodGhpcy5zZXR0aW5ncy4kdGFyZ2V0Lm9mZnNldCgpLnRvcCArIG51Yl9oZWlnaHQgKyB0aGlzLnNldHRpbmdzLiR0YXJnZXQub3V0ZXJIZWlnaHQoKSArIHRvcEFkanVzdG1lbnQpLFxuICAgICAgICAgICAgICAgIGxlZnQgOiB0aGlzLnNldHRpbmdzLiR0YXJnZXQub2Zmc2V0KCkubGVmdCArIHRoaXMuc2V0dGluZ3MuJHRhcmdldC5vdXRlcldpZHRoKCkgLSB0aGlzLnNldHRpbmdzLiRuZXh0X3RpcC5vdXRlcldpZHRoKCkgKyBsZWZ0QWRqdXN0bWVudH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy4kbmV4dF90aXAuY3NzKHtcbiAgICAgICAgICAgICAgICB0b3AgOiAodGhpcy5zZXR0aW5ncy4kdGFyZ2V0Lm9mZnNldCgpLnRvcCArIG51Yl9oZWlnaHQgKyB0aGlzLnNldHRpbmdzLiR0YXJnZXQub3V0ZXJIZWlnaHQoKSArIHRvcEFkanVzdG1lbnQpLFxuICAgICAgICAgICAgICAgIGxlZnQgOiB0aGlzLnNldHRpbmdzLiR0YXJnZXQub2Zmc2V0KCkubGVmdCArIGxlZnRBZGp1c3RtZW50fSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMubnViX3Bvc2l0aW9uKCRudWIsIHRoaXMuc2V0dGluZ3MudGlwX3NldHRpbmdzLm51Yl9wb3NpdGlvbiwgJ3RvcCcpO1xuXG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnRvcCgpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5ydGwpIHtcbiAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy4kbmV4dF90aXAuY3NzKHtcbiAgICAgICAgICAgICAgICB0b3AgOiAodGhpcy5zZXR0aW5ncy4kdGFyZ2V0Lm9mZnNldCgpLnRvcCAtIHRoaXMuc2V0dGluZ3MuJG5leHRfdGlwLm91dGVySGVpZ2h0KCkgLSBudWJfaGVpZ2h0ICsgdG9wQWRqdXN0bWVudCksXG4gICAgICAgICAgICAgICAgbGVmdCA6IHRoaXMuc2V0dGluZ3MuJHRhcmdldC5vZmZzZXQoKS5sZWZ0ICsgdGhpcy5zZXR0aW5ncy4kdGFyZ2V0Lm91dGVyV2lkdGgoKSAtIHRoaXMuc2V0dGluZ3MuJG5leHRfdGlwLm91dGVyV2lkdGgoKX0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy4kbmV4dF90aXAuY3NzKHtcbiAgICAgICAgICAgICAgICB0b3AgOiAodGhpcy5zZXR0aW5ncy4kdGFyZ2V0Lm9mZnNldCgpLnRvcCAtIHRoaXMuc2V0dGluZ3MuJG5leHRfdGlwLm91dGVySGVpZ2h0KCkgLSBudWJfaGVpZ2h0ICsgdG9wQWRqdXN0bWVudCksXG4gICAgICAgICAgICAgICAgbGVmdCA6IHRoaXMuc2V0dGluZ3MuJHRhcmdldC5vZmZzZXQoKS5sZWZ0ICsgbGVmdEFkanVzdG1lbnR9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5udWJfcG9zaXRpb24oJG51YiwgdGhpcy5zZXR0aW5ncy50aXBfc2V0dGluZ3MubnViX3Bvc2l0aW9uLCAnYm90dG9tJyk7XG5cbiAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMucmlnaHQoKSkge1xuXG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLiRuZXh0X3RpcC5jc3Moe1xuICAgICAgICAgICAgICB0b3AgOiB0aGlzLnNldHRpbmdzLiR0YXJnZXQub2Zmc2V0KCkudG9wICsgdG9wQWRqdXN0bWVudCxcbiAgICAgICAgICAgICAgbGVmdCA6ICh0aGlzLnNldHRpbmdzLiR0YXJnZXQub3V0ZXJXaWR0aCgpICsgdGhpcy5zZXR0aW5ncy4kdGFyZ2V0Lm9mZnNldCgpLmxlZnQgKyBudWJfd2lkdGggKyBsZWZ0QWRqdXN0bWVudCl9KTtcblxuICAgICAgICAgICAgdGhpcy5udWJfcG9zaXRpb24oJG51YiwgdGhpcy5zZXR0aW5ncy50aXBfc2V0dGluZ3MubnViX3Bvc2l0aW9uLCAnbGVmdCcpO1xuXG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmxlZnQoKSkge1xuXG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLiRuZXh0X3RpcC5jc3Moe1xuICAgICAgICAgICAgICB0b3AgOiB0aGlzLnNldHRpbmdzLiR0YXJnZXQub2Zmc2V0KCkudG9wICsgdG9wQWRqdXN0bWVudCxcbiAgICAgICAgICAgICAgbGVmdCA6ICh0aGlzLnNldHRpbmdzLiR0YXJnZXQub2Zmc2V0KCkubGVmdCAtIHRoaXMuc2V0dGluZ3MuJG5leHRfdGlwLm91dGVyV2lkdGgoKSAtIG51Yl93aWR0aCArIGxlZnRBZGp1c3RtZW50KX0pO1xuXG4gICAgICAgICAgICB0aGlzLm51Yl9wb3NpdGlvbigkbnViLCB0aGlzLnNldHRpbmdzLnRpcF9zZXR0aW5ncy5udWJfcG9zaXRpb24sICdyaWdodCcpO1xuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCF0aGlzLnZpc2libGUodGhpcy5jb3JuZXJzKHRoaXMuc2V0dGluZ3MuJG5leHRfdGlwKSkgJiYgdGhpcy5zZXR0aW5ncy5hdHRlbXB0cyA8IHRoaXMuc2V0dGluZ3MudGlwX3NldHRpbmdzLnRpcF9sb2NhdGlvbl9wYXR0ZXJuLmxlbmd0aCkge1xuXG4gICAgICAgICAgICAkbnViLnJlbW92ZUNsYXNzKCdib3R0b20nKVxuICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3RvcCcpXG4gICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygncmlnaHQnKVxuICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2xlZnQnKTtcblxuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy50aXBfc2V0dGluZ3MudGlwX2xvY2F0aW9uID0gdGhpcy5zZXR0aW5ncy50aXBfc2V0dGluZ3MudGlwX2xvY2F0aW9uX3BhdHRlcm5bdGhpcy5zZXR0aW5ncy5hdHRlbXB0c107XG5cbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuYXR0ZW1wdHMrKztcblxuICAgICAgICAgICAgdGhpcy5wb3NfZGVmYXVsdCgpO1xuXG4gICAgICAgICAgfVxuXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuc2V0dGluZ3MuJGxpLmxlbmd0aCkge1xuXG4gICAgICAgIHRoaXMucG9zX21vZGFsKCRudWIpO1xuXG4gICAgICB9XG5cbiAgICAgIGlmICh0b2dnbGUpIHtcbiAgICAgICAgdGhpcy5zZXR0aW5ncy4kbmV4dF90aXAuaGlkZSgpO1xuICAgICAgICB0aGlzLnNldHRpbmdzLiRuZXh0X3RpcC5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xuICAgICAgfVxuXG4gICAgfSxcblxuICAgIHBvc19waG9uZSA6IGZ1bmN0aW9uIChpbml0KSB7XG4gICAgICB2YXIgdGlwX2hlaWdodCA9IHRoaXMuc2V0dGluZ3MuJG5leHRfdGlwLm91dGVySGVpZ2h0KCksXG4gICAgICAgICAgdGlwX29mZnNldCA9IHRoaXMuc2V0dGluZ3MuJG5leHRfdGlwLm9mZnNldCgpLFxuICAgICAgICAgIHRhcmdldF9oZWlnaHQgPSB0aGlzLnNldHRpbmdzLiR0YXJnZXQub3V0ZXJIZWlnaHQoKSxcbiAgICAgICAgICAkbnViID0gJCgnLmpveXJpZGUtbnViJywgdGhpcy5zZXR0aW5ncy4kbmV4dF90aXApLFxuICAgICAgICAgIG51Yl9oZWlnaHQgPSBNYXRoLmNlaWwoJG51Yi5vdXRlckhlaWdodCgpIC8gMiksXG4gICAgICAgICAgdG9nZ2xlID0gaW5pdCB8fCBmYWxzZTtcblxuICAgICAgJG51Yi5yZW1vdmVDbGFzcygnYm90dG9tJylcbiAgICAgICAgLnJlbW92ZUNsYXNzKCd0b3AnKVxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ3JpZ2h0JylcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdsZWZ0Jyk7XG5cbiAgICAgIGlmICh0b2dnbGUpIHtcbiAgICAgICAgdGhpcy5zZXR0aW5ncy4kbmV4dF90aXAuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xuICAgICAgICB0aGlzLnNldHRpbmdzLiRuZXh0X3RpcC5zaG93KCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghL2JvZHkvaS50ZXN0KHRoaXMuc2V0dGluZ3MuJHRhcmdldC5zZWxlY3RvcikpIHtcblxuICAgICAgICBpZiAodGhpcy50b3AoKSkge1xuXG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLiRuZXh0X3RpcC5vZmZzZXQoe3RvcCA6IHRoaXMuc2V0dGluZ3MuJHRhcmdldC5vZmZzZXQoKS50b3AgLSB0aXBfaGVpZ2h0IC0gbnViX2hlaWdodH0pO1xuICAgICAgICAgICAgJG51Yi5hZGRDbGFzcygnYm90dG9tJyk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgIHRoaXMuc2V0dGluZ3MuJG5leHRfdGlwLm9mZnNldCh7dG9wIDogdGhpcy5zZXR0aW5ncy4kdGFyZ2V0Lm9mZnNldCgpLnRvcCArIHRhcmdldF9oZWlnaHQgKyBudWJfaGVpZ2h0fSk7XG4gICAgICAgICAgJG51Yi5hZGRDbGFzcygndG9wJyk7XG5cbiAgICAgICAgfVxuXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuc2V0dGluZ3MuJGxpLmxlbmd0aCkge1xuICAgICAgICB0aGlzLnBvc19tb2RhbCgkbnViKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRvZ2dsZSkge1xuICAgICAgICB0aGlzLnNldHRpbmdzLiRuZXh0X3RpcC5oaWRlKCk7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MuJG5leHRfdGlwLmNzcygndmlzaWJpbGl0eScsICd2aXNpYmxlJyk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHBvc19tb2RhbCA6IGZ1bmN0aW9uICgkbnViKSB7XG4gICAgICB0aGlzLmNlbnRlcigpO1xuICAgICAgJG51Yi5oaWRlKCk7XG5cbiAgICAgIHRoaXMuc2hvd19tb2RhbCgpO1xuICAgIH0sXG5cbiAgICBzaG93X21vZGFsIDogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLiRuZXh0X3RpcC5kYXRhKCdjbG9zZWQnKSkge1xuICAgICAgICB2YXIgam95cmlkZW1vZGFsYmcgPSAgJCgnLmpveXJpZGUtbW9kYWwtYmcnKTtcbiAgICAgICAgaWYgKGpveXJpZGVtb2RhbGJnLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICB2YXIgam95cmlkZW1vZGFsYmcgPSAkKHRoaXMuc2V0dGluZ3MudGVtcGxhdGUubW9kYWwpO1xuICAgICAgICAgIGpveXJpZGVtb2RhbGJnLmFwcGVuZFRvKCdib2R5Jyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoL3BvcC9pLnRlc3QodGhpcy5zZXR0aW5ncy50aXBfYW5pbWF0aW9uKSkge1xuICAgICAgICAgICAgam95cmlkZW1vZGFsYmcuc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgam95cmlkZW1vZGFsYmcuZmFkZUluKHRoaXMuc2V0dGluZ3MudGlwX2FuaW1hdGlvbl9mYWRlX3NwZWVkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBleHBvc2UgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgZXhwb3NlLFxuICAgICAgICAgIGV4cG9zZUNvdmVyLFxuICAgICAgICAgIGVsLFxuICAgICAgICAgIG9yaWdDU1MsXG4gICAgICAgICAgb3JpZ0NsYXNzZXMsXG4gICAgICAgICAgcmFuZElkID0gJ2V4cG9zZS0nICsgdGhpcy5yYW5kb21fc3RyKDYpO1xuXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdIGluc3RhbmNlb2YgJCkge1xuICAgICAgICBlbCA9IGFyZ3VtZW50c1swXTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5zZXR0aW5ncy4kdGFyZ2V0ICYmICEvYm9keS9pLnRlc3QodGhpcy5zZXR0aW5ncy4kdGFyZ2V0LnNlbGVjdG9yKSkge1xuICAgICAgICBlbCA9IHRoaXMuc2V0dGluZ3MuJHRhcmdldDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGVsLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgaWYgKHdpbmRvdy5jb25zb2xlKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignZWxlbWVudCBub3QgdmFsaWQnLCBlbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBleHBvc2UgPSAkKHRoaXMuc2V0dGluZ3MudGVtcGxhdGUuZXhwb3NlKTtcbiAgICAgIHRoaXMuc2V0dGluZ3MuJGJvZHkuYXBwZW5kKGV4cG9zZSk7XG4gICAgICBleHBvc2UuY3NzKHtcbiAgICAgICAgdG9wIDogZWwub2Zmc2V0KCkudG9wLFxuICAgICAgICBsZWZ0IDogZWwub2Zmc2V0KCkubGVmdCxcbiAgICAgICAgd2lkdGggOiBlbC5vdXRlcldpZHRoKHRydWUpLFxuICAgICAgICBoZWlnaHQgOiBlbC5vdXRlckhlaWdodCh0cnVlKVxuICAgICAgfSk7XG5cbiAgICAgIGV4cG9zZUNvdmVyID0gJCh0aGlzLnNldHRpbmdzLnRlbXBsYXRlLmV4cG9zZV9jb3Zlcik7XG5cbiAgICAgIG9yaWdDU1MgPSB7XG4gICAgICAgIHpJbmRleCA6IGVsLmNzcygnei1pbmRleCcpLFxuICAgICAgICBwb3NpdGlvbiA6IGVsLmNzcygncG9zaXRpb24nKVxuICAgICAgfTtcblxuICAgICAgb3JpZ0NsYXNzZXMgPSBlbC5hdHRyKCdjbGFzcycpID09IG51bGwgPyAnJyA6IGVsLmF0dHIoJ2NsYXNzJyk7XG5cbiAgICAgIGVsLmNzcygnei1pbmRleCcsIHBhcnNlSW50KGV4cG9zZS5jc3MoJ3otaW5kZXgnKSkgKyAxKTtcblxuICAgICAgaWYgKG9yaWdDU1MucG9zaXRpb24gPT0gJ3N0YXRpYycpIHtcbiAgICAgICAgZWwuY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpO1xuICAgICAgfVxuXG4gICAgICBlbC5kYXRhKCdleHBvc2UtY3NzJywgb3JpZ0NTUyk7XG4gICAgICBlbC5kYXRhKCdvcmlnLWNsYXNzJywgb3JpZ0NsYXNzZXMpO1xuICAgICAgZWwuYXR0cignY2xhc3MnLCBvcmlnQ2xhc3NlcyArICcgJyArIHRoaXMuc2V0dGluZ3MuZXhwb3NlX2FkZF9jbGFzcyk7XG5cbiAgICAgIGV4cG9zZUNvdmVyLmNzcyh7XG4gICAgICAgIHRvcCA6IGVsLm9mZnNldCgpLnRvcCxcbiAgICAgICAgbGVmdCA6IGVsLm9mZnNldCgpLmxlZnQsXG4gICAgICAgIHdpZHRoIDogZWwub3V0ZXJXaWR0aCh0cnVlKSxcbiAgICAgICAgaGVpZ2h0IDogZWwub3V0ZXJIZWlnaHQodHJ1ZSlcbiAgICAgIH0pO1xuXG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy5tb2RhbCkge1xuICAgICAgICB0aGlzLnNob3dfbW9kYWwoKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zZXR0aW5ncy4kYm9keS5hcHBlbmQoZXhwb3NlQ292ZXIpO1xuICAgICAgZXhwb3NlLmFkZENsYXNzKHJhbmRJZCk7XG4gICAgICBleHBvc2VDb3Zlci5hZGRDbGFzcyhyYW5kSWQpO1xuICAgICAgZWwuZGF0YSgnZXhwb3NlJywgcmFuZElkKTtcbiAgICAgIHRoaXMuc2V0dGluZ3MucG9zdF9leHBvc2VfY2FsbGJhY2sodGhpcy5zZXR0aW5ncy4kbGkuaW5kZXgoKSwgdGhpcy5zZXR0aW5ncy4kbmV4dF90aXAsIGVsKTtcbiAgICAgIHRoaXMuYWRkX2V4cG9zZWQoZWwpO1xuICAgIH0sXG5cbiAgICB1bl9leHBvc2UgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgZXhwb3NlSWQsXG4gICAgICAgICAgZWwsXG4gICAgICAgICAgZXhwb3NlLFxuICAgICAgICAgIG9yaWdDU1MsXG4gICAgICAgICAgb3JpZ0NsYXNzZXMsXG4gICAgICAgICAgY2xlYXJBbGwgPSBmYWxzZTtcblxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSBpbnN0YW5jZW9mICQpIHtcbiAgICAgICAgZWwgPSBhcmd1bWVudHNbMF07XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuc2V0dGluZ3MuJHRhcmdldCAmJiAhL2JvZHkvaS50ZXN0KHRoaXMuc2V0dGluZ3MuJHRhcmdldC5zZWxlY3RvcikpIHtcbiAgICAgICAgZWwgPSB0aGlzLnNldHRpbmdzLiR0YXJnZXQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChlbC5sZW5ndGggPCAxKSB7XG4gICAgICAgIGlmICh3aW5kb3cuY29uc29sZSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2VsZW1lbnQgbm90IHZhbGlkJywgZWwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgZXhwb3NlSWQgPSBlbC5kYXRhKCdleHBvc2UnKTtcbiAgICAgIGV4cG9zZSA9ICQoJy4nICsgZXhwb3NlSWQpO1xuXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgY2xlYXJBbGwgPSBhcmd1bWVudHNbMV07XG4gICAgICB9XG5cbiAgICAgIGlmIChjbGVhckFsbCA9PT0gdHJ1ZSkge1xuICAgICAgICAkKCcuam95cmlkZS1leHBvc2Utd3JhcHBlciwuam95cmlkZS1leHBvc2UtY292ZXInKS5yZW1vdmUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGV4cG9zZS5yZW1vdmUoKTtcbiAgICAgIH1cblxuICAgICAgb3JpZ0NTUyA9IGVsLmRhdGEoJ2V4cG9zZS1jc3MnKTtcblxuICAgICAgaWYgKG9yaWdDU1MuekluZGV4ID09ICdhdXRvJykge1xuICAgICAgICBlbC5jc3MoJ3otaW5kZXgnLCAnJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbC5jc3MoJ3otaW5kZXgnLCBvcmlnQ1NTLnpJbmRleCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcmlnQ1NTLnBvc2l0aW9uICE9IGVsLmNzcygncG9zaXRpb24nKSkge1xuICAgICAgICBpZiAob3JpZ0NTUy5wb3NpdGlvbiA9PSAnc3RhdGljJykgey8vIHRoaXMgaXMgZGVmYXVsdCwgbm8gbmVlZCB0byBzZXQgaXQuXG4gICAgICAgICAgZWwuY3NzKCdwb3NpdGlvbicsICcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbC5jc3MoJ3Bvc2l0aW9uJywgb3JpZ0NTUy5wb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgb3JpZ0NsYXNzZXMgPSBlbC5kYXRhKCdvcmlnLWNsYXNzJyk7XG4gICAgICBlbC5hdHRyKCdjbGFzcycsIG9yaWdDbGFzc2VzKTtcbiAgICAgIGVsLnJlbW92ZURhdGEoJ29yaWctY2xhc3NlcycpO1xuXG4gICAgICBlbC5yZW1vdmVEYXRhKCdleHBvc2UnKTtcbiAgICAgIGVsLnJlbW92ZURhdGEoJ2V4cG9zZS16LWluZGV4Jyk7XG4gICAgICB0aGlzLnJlbW92ZV9leHBvc2VkKGVsKTtcbiAgICB9LFxuXG4gICAgYWRkX2V4cG9zZWQgOiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgIHRoaXMuc2V0dGluZ3MuZXhwb3NlZCA9IHRoaXMuc2V0dGluZ3MuZXhwb3NlZCB8fCBbXTtcbiAgICAgIGlmIChlbCBpbnN0YW5jZW9mICQgfHwgdHlwZW9mIGVsID09PSAnb2JqZWN0Jykge1xuICAgICAgICB0aGlzLnNldHRpbmdzLmV4cG9zZWQucHVzaChlbFswXSk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbCA9PSAnc3RyaW5nJykge1xuICAgICAgICB0aGlzLnNldHRpbmdzLmV4cG9zZWQucHVzaChlbCk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHJlbW92ZV9leHBvc2VkIDogZnVuY3Rpb24gKGVsKSB7XG4gICAgICB2YXIgc2VhcmNoLCBpO1xuICAgICAgaWYgKGVsIGluc3RhbmNlb2YgJCkge1xuICAgICAgICBzZWFyY2ggPSBlbFswXVxuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZWwgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgc2VhcmNoID0gZWw7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc2V0dGluZ3MuZXhwb3NlZCA9IHRoaXMuc2V0dGluZ3MuZXhwb3NlZCB8fCBbXTtcbiAgICAgIGkgPSB0aGlzLnNldHRpbmdzLmV4cG9zZWQubGVuZ3RoO1xuXG4gICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmV4cG9zZWRbaV0gPT0gc2VhcmNoKSB7XG4gICAgICAgICAgdGhpcy5zZXR0aW5ncy5leHBvc2VkLnNwbGljZShpLCAxKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgY2VudGVyIDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyICR3ID0gJCh3aW5kb3cpO1xuXG4gICAgICB0aGlzLnNldHRpbmdzLiRuZXh0X3RpcC5jc3Moe1xuICAgICAgICB0b3AgOiAoKCgkdy5oZWlnaHQoKSAtIHRoaXMuc2V0dGluZ3MuJG5leHRfdGlwLm91dGVySGVpZ2h0KCkpIC8gMikgKyAkdy5zY3JvbGxUb3AoKSksXG4gICAgICAgIGxlZnQgOiAoKCgkdy53aWR0aCgpIC0gdGhpcy5zZXR0aW5ncy4kbmV4dF90aXAub3V0ZXJXaWR0aCgpKSAvIDIpICsgJHcuc2Nyb2xsTGVmdCgpKVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG5cbiAgICBib3R0b20gOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gL2JvdHRvbS9pLnRlc3QodGhpcy5zZXR0aW5ncy50aXBfc2V0dGluZ3MudGlwX2xvY2F0aW9uKTtcbiAgICB9LFxuXG4gICAgdG9wIDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIC90b3AvaS50ZXN0KHRoaXMuc2V0dGluZ3MudGlwX3NldHRpbmdzLnRpcF9sb2NhdGlvbik7XG4gICAgfSxcblxuICAgIHJpZ2h0IDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIC9yaWdodC9pLnRlc3QodGhpcy5zZXR0aW5ncy50aXBfc2V0dGluZ3MudGlwX2xvY2F0aW9uKTtcbiAgICB9LFxuXG4gICAgbGVmdCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiAvbGVmdC9pLnRlc3QodGhpcy5zZXR0aW5ncy50aXBfc2V0dGluZ3MudGlwX2xvY2F0aW9uKTtcbiAgICB9LFxuXG4gICAgY29ybmVycyA6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgdmFyIHcgPSAkKHdpbmRvdyksXG4gICAgICAgICAgd2luZG93X2hhbGYgPSB3LmhlaWdodCgpIC8gMixcbiAgICAgICAgICAvL3VzaW5nIHRoaXMgdG8gY2FsY3VsYXRlIHNpbmNlIHNjcm9sbCBtYXkgbm90IGhhdmUgZmluaXNoZWQgeWV0LlxuICAgICAgICAgIHRpcE9mZnNldCA9IE1hdGguY2VpbCh0aGlzLnNldHRpbmdzLiR0YXJnZXQub2Zmc2V0KCkudG9wIC0gd2luZG93X2hhbGYgKyB0aGlzLnNldHRpbmdzLiRuZXh0X3RpcC5vdXRlckhlaWdodCgpKSxcbiAgICAgICAgICByaWdodCA9IHcud2lkdGgoKSArIHcuc2Nyb2xsTGVmdCgpLFxuICAgICAgICAgIG9mZnNldEJvdHRvbSA9ICB3LmhlaWdodCgpICsgdGlwT2Zmc2V0LFxuICAgICAgICAgIGJvdHRvbSA9IHcuaGVpZ2h0KCkgKyB3LnNjcm9sbFRvcCgpLFxuICAgICAgICAgIHRvcCA9IHcuc2Nyb2xsVG9wKCk7XG5cbiAgICAgIGlmICh0aXBPZmZzZXQgPCB0b3ApIHtcbiAgICAgICAgaWYgKHRpcE9mZnNldCA8IDApIHtcbiAgICAgICAgICB0b3AgPSAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRvcCA9IHRpcE9mZnNldDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAob2Zmc2V0Qm90dG9tID4gYm90dG9tKSB7XG4gICAgICAgIGJvdHRvbSA9IG9mZnNldEJvdHRvbTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFtcbiAgICAgICAgZWwub2Zmc2V0KCkudG9wIDwgdG9wLFxuICAgICAgICByaWdodCA8IGVsLm9mZnNldCgpLmxlZnQgKyBlbC5vdXRlcldpZHRoKCksXG4gICAgICAgIGJvdHRvbSA8IGVsLm9mZnNldCgpLnRvcCArIGVsLm91dGVySGVpZ2h0KCksXG4gICAgICAgIHcuc2Nyb2xsTGVmdCgpID4gZWwub2Zmc2V0KCkubGVmdFxuICAgICAgXTtcbiAgICB9LFxuXG4gICAgdmlzaWJsZSA6IGZ1bmN0aW9uIChoaWRkZW5fY29ybmVycykge1xuICAgICAgdmFyIGkgPSBoaWRkZW5fY29ybmVycy5sZW5ndGg7XG5cbiAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgaWYgKGhpZGRlbl9jb3JuZXJzW2ldKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG5cbiAgICBudWJfcG9zaXRpb24gOiBmdW5jdGlvbiAobnViLCBwb3MsIGRlZikge1xuICAgICAgaWYgKHBvcyA9PT0gJ2F1dG8nKSB7XG4gICAgICAgIG51Yi5hZGRDbGFzcyhkZWYpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbnViLmFkZENsYXNzKHBvcyk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHN0YXJ0VGltZXIgOiBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy4kbGkubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MuYXV0b21hdGUgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgICB0aGlzLnNob3coKTtcbiAgICAgICAgICB0aGlzLnN0YXJ0VGltZXIoKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpLCB0aGlzLnNldHRpbmdzLnRpbWVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnNldHRpbmdzLmF1dG9tYXRlKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZW5kIDogZnVuY3Rpb24gKGFib3J0KSB7XG4gICAgICBpZiAodGhpcy5zZXR0aW5ncy5jb29raWVfbW9uc3Rlcikge1xuICAgICAgICAkLmNvb2tpZSh0aGlzLnNldHRpbmdzLmNvb2tpZV9uYW1lLCAncmlkZGVuJywge2V4cGlyZXMgOiB0aGlzLnNldHRpbmdzLmNvb2tpZV9leHBpcmVzLCBkb21haW4gOiB0aGlzLnNldHRpbmdzLmNvb2tpZV9kb21haW59KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuc2V0dGluZ3MudGltZXIgPiAwKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnNldHRpbmdzLmF1dG9tYXRlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuc2V0dGluZ3MubW9kYWwgJiYgdGhpcy5zZXR0aW5ncy5leHBvc2UpIHtcbiAgICAgICAgdGhpcy51bl9leHBvc2UoKTtcbiAgICAgIH1cblxuICAgICAgLy8gVW5wbHVnIGtleXN0cm9rZXMgbGlzdGVuZXJcbiAgICAgICQodGhpcy5zY29wZSkub2ZmKCdrZXl1cC5qb3lyaWRlJylcblxuICAgICAgdGhpcy5zZXR0aW5ncy4kbmV4dF90aXAuZGF0YSgnY2xvc2VkJywgdHJ1ZSk7XG4gICAgICB0aGlzLnNldHRpbmdzLnJpZGluZyA9IGZhbHNlO1xuXG4gICAgICAkKCcuam95cmlkZS1tb2RhbC1iZycpLmhpZGUoKTtcbiAgICAgIHRoaXMuc2V0dGluZ3MuJGN1cnJlbnRfdGlwLmhpZGUoKTtcblxuICAgICAgaWYgKHR5cGVvZiBhYm9ydCA9PT0gJ3VuZGVmaW5lZCcgfHwgYWJvcnQgPT09IGZhbHNlKSB7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MucG9zdF9zdGVwX2NhbGxiYWNrKHRoaXMuc2V0dGluZ3MuJGxpLmluZGV4KCksIHRoaXMuc2V0dGluZ3MuJGN1cnJlbnRfdGlwKTtcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5wb3N0X3JpZGVfY2FsbGJhY2sodGhpcy5zZXR0aW5ncy4kbGkuaW5kZXgoKSwgdGhpcy5zZXR0aW5ncy4kY3VycmVudF90aXApO1xuICAgICAgfVxuXG4gICAgICAkKCcuam95cmlkZS10aXAtZ3VpZGUnKS5yZW1vdmUoKTtcbiAgICB9LFxuXG4gICAgb2ZmIDogZnVuY3Rpb24gKCkge1xuICAgICAgJCh0aGlzLnNjb3BlKS5vZmYoJy5qb3lyaWRlJyk7XG4gICAgICAkKHdpbmRvdykub2ZmKCcuam95cmlkZScpO1xuICAgICAgJCgnLmpveXJpZGUtY2xvc2UtdGlwLCAuam95cmlkZS1uZXh0LXRpcCwgLmpveXJpZGUtbW9kYWwtYmcnKS5vZmYoJy5qb3lyaWRlJyk7XG4gICAgICAkKCcuam95cmlkZS10aXAtZ3VpZGUsIC5qb3lyaWRlLW1vZGFsLWJnJykucmVtb3ZlKCk7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5zZXR0aW5ncy5hdXRvbWF0ZSk7XG4gICAgICB0aGlzLnNldHRpbmdzID0ge307XG4gICAgfSxcblxuICAgIHJlZmxvdyA6IGZ1bmN0aW9uICgpIHt9XG4gIH07XG59KGpRdWVyeSwgd2luZG93LCB3aW5kb3cuZG9jdW1lbnQpKTtcblxuOyhmdW5jdGlvbiAoJCwgd2luZG93LCBkb2N1bWVudCwgdW5kZWZpbmVkKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBGb3VuZGF0aW9uLmxpYnNbJ21hZ2VsbGFuLWV4cGVkaXRpb24nXSA9IHtcbiAgICBuYW1lIDogJ21hZ2VsbGFuLWV4cGVkaXRpb24nLFxuXG4gICAgdmVyc2lvbiA6ICc1LjUuMScsXG5cbiAgICBzZXR0aW5ncyA6IHtcbiAgICAgIGFjdGl2ZV9jbGFzcyA6ICdhY3RpdmUnLFxuICAgICAgdGhyZXNob2xkIDogMCwgLy8gcGl4ZWxzIGZyb20gdGhlIHRvcCBvZiB0aGUgZXhwZWRpdGlvbiBmb3IgaXQgdG8gYmVjb21lIGZpeGVzXG4gICAgICBkZXN0aW5hdGlvbl90aHJlc2hvbGQgOiAyMCwgLy8gcGl4ZWxzIGZyb20gdGhlIHRvcCBvZiBkZXN0aW5hdGlvbiBmb3IgaXQgdG8gYmUgY29uc2lkZXJlZCBhY3RpdmVcbiAgICAgIHRocm90dGxlX2RlbGF5IDogMzAsIC8vIGNhbGN1bGF0aW9uIHRocm90dGxpbmcgdG8gaW5jcmVhc2UgZnJhbWVyYXRlXG4gICAgICBmaXhlZF90b3AgOiAwLCAvLyB0b3AgZGlzdGFuY2UgaW4gcGl4ZWxzIGFzc2lnZW5kIHRvIHRoZSBmaXhlZCBlbGVtZW50IG9uIHNjcm9sbFxuICAgICAgb2Zmc2V0X2J5X2hlaWdodCA6IHRydWUsICAvLyB3aGV0aGVyIHRvIG9mZnNldCB0aGUgZGVzdGluYXRpb24gYnkgdGhlIGV4cGVkaXRpb24gaGVpZ2h0LiBVc3VhbGx5IHlvdSB3YW50IHRoaXMgdG8gYmUgdHJ1ZSwgdW5sZXNzIHlvdXIgZXhwZWRpdGlvbiBpcyBvbiB0aGUgc2lkZS5cbiAgICAgIGR1cmF0aW9uIDogNzAwLCAvLyBhbmltYXRpb24gZHVyYXRpb24gdGltZVxuICAgICAgZWFzaW5nIDogJ3N3aW5nJyAvLyBhbmltYXRpb24gZWFzaW5nXG4gICAgfSxcblxuICAgIGluaXQgOiBmdW5jdGlvbiAoc2NvcGUsIG1ldGhvZCwgb3B0aW9ucykge1xuICAgICAgRm91bmRhdGlvbi5pbmhlcml0KHRoaXMsICd0aHJvdHRsZScpO1xuICAgICAgdGhpcy5iaW5kaW5ncyhtZXRob2QsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBldmVudHMgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgUyA9IHNlbGYuUyxcbiAgICAgICAgICBzZXR0aW5ncyA9IHNlbGYuc2V0dGluZ3M7XG5cbiAgICAgIC8vIGluaXRpYWxpemUgZXhwZWRpdGlvbiBvZmZzZXRcbiAgICAgIHNlbGYuc2V0X2V4cGVkaXRpb25fcG9zaXRpb24oKTtcblxuICAgICAgUyhzZWxmLnNjb3BlKVxuICAgICAgICAub2ZmKCcubWFnZWxsYW4nKVxuICAgICAgICAub24oJ2NsaWNrLmZuZHRuLm1hZ2VsbGFuJywgJ1snICsgc2VsZi5hZGRfbmFtZXNwYWNlKCdkYXRhLW1hZ2VsbGFuLWFycml2YWwnKSArICddIGFbaHJlZl49XCIjXCJdJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgdmFyIGV4cGVkaXRpb24gPSAkKHRoaXMpLmNsb3Nlc3QoJ1snICsgc2VsZi5hdHRyX25hbWUoKSArICddJyksXG4gICAgICAgICAgICAgIHNldHRpbmdzID0gZXhwZWRpdGlvbi5kYXRhKCdtYWdlbGxhbi1leHBlZGl0aW9uLWluaXQnKSxcbiAgICAgICAgICAgICAgaGFzaCA9IHRoaXMuaGFzaC5zcGxpdCgnIycpLmpvaW4oJycpLFxuICAgICAgICAgICAgICB0YXJnZXQgPSAkKCdhW25hbWU9XCInICsgaGFzaCArICdcIl0nKTtcblxuICAgICAgICAgIGlmICh0YXJnZXQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSAkKCcjJyArIGhhc2gpO1xuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQWNjb3VudCBmb3IgZXhwZWRpdGlvbiBoZWlnaHQgaWYgZml4ZWQgcG9zaXRpb25cbiAgICAgICAgICB2YXIgc2Nyb2xsX3RvcCA9IHRhcmdldC5vZmZzZXQoKS50b3AgLSBzZXR0aW5ncy5kZXN0aW5hdGlvbl90aHJlc2hvbGQgKyAxO1xuICAgICAgICAgIGlmIChzZXR0aW5ncy5vZmZzZXRfYnlfaGVpZ2h0KSB7XG4gICAgICAgICAgICBzY3JvbGxfdG9wID0gc2Nyb2xsX3RvcCAtIGV4cGVkaXRpb24ub3V0ZXJIZWlnaHQoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAkKCdodG1sLCBib2R5Jykuc3RvcCgpLmFuaW1hdGUoe1xuICAgICAgICAgICAgJ3Njcm9sbFRvcCcgOiBzY3JvbGxfdG9wXG4gICAgICAgICAgfSwgc2V0dGluZ3MuZHVyYXRpb24sIHNldHRpbmdzLmVhc2luZywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGhpc3RvcnkucHVzaFN0YXRlKSB7XG4gICAgICAgICAgICAgIGhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsICcjJyArIGhhc2gpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbG9jYXRpb24uaGFzaCA9ICcjJyArIGhhc2g7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignc2Nyb2xsLmZuZHRuLm1hZ2VsbGFuJywgc2VsZi50aHJvdHRsZSh0aGlzLmNoZWNrX2Zvcl9hcnJpdmFscy5iaW5kKHRoaXMpLCBzZXR0aW5ncy50aHJvdHRsZV9kZWxheSkpO1xuXG4gICAgICAkKHdpbmRvdylcbiAgICAgICAgLm9uKCdyZXNpemUuZm5kdG4ubWFnZWxsYW4nLCBzZWxmLnRocm90dGxlKHRoaXMuc2V0X2V4cGVkaXRpb25fcG9zaXRpb24uYmluZCh0aGlzKSwgc2V0dGluZ3MudGhyb3R0bGVfZGVsYXkpKTtcbiAgICB9LFxuXG4gICAgY2hlY2tfZm9yX2Fycml2YWxzIDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgc2VsZi51cGRhdGVfYXJyaXZhbHMoKTtcbiAgICAgIHNlbGYudXBkYXRlX2V4cGVkaXRpb25fcG9zaXRpb25zKCk7XG4gICAgfSxcblxuICAgIHNldF9leHBlZGl0aW9uX3Bvc2l0aW9uIDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgJCgnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJz1maXhlZF0nLCBzZWxmLnNjb3BlKS5lYWNoKGZ1bmN0aW9uIChpZHgsIGVsKSB7XG4gICAgICAgIHZhciBleHBlZGl0aW9uID0gJCh0aGlzKSxcbiAgICAgICAgICAgIHNldHRpbmdzID0gZXhwZWRpdGlvbi5kYXRhKCdtYWdlbGxhbi1leHBlZGl0aW9uLWluaXQnKSxcbiAgICAgICAgICAgIHN0eWxlcyA9IGV4cGVkaXRpb24uYXR0cignc3R5bGVzJyksIC8vIHNhdmUgc3R5bGVzXG4gICAgICAgICAgICB0b3Bfb2Zmc2V0LCBmaXhlZF90b3A7XG5cbiAgICAgICAgZXhwZWRpdGlvbi5hdHRyKCdzdHlsZScsICcnKTtcbiAgICAgICAgdG9wX29mZnNldCA9IGV4cGVkaXRpb24ub2Zmc2V0KCkudG9wICsgc2V0dGluZ3MudGhyZXNob2xkO1xuXG4gICAgICAgIC8vc2V0IGZpeGVkLXRvcCBieSBhdHRyaWJ1dGVcbiAgICAgICAgZml4ZWRfdG9wID0gcGFyc2VJbnQoZXhwZWRpdGlvbi5kYXRhKCdtYWdlbGxhbi1maXhlZC10b3AnKSk7XG4gICAgICAgIGlmICghaXNOYU4oZml4ZWRfdG9wKSkge1xuICAgICAgICAgIHNlbGYuc2V0dGluZ3MuZml4ZWRfdG9wID0gZml4ZWRfdG9wO1xuICAgICAgICB9XG5cbiAgICAgICAgZXhwZWRpdGlvbi5kYXRhKHNlbGYuZGF0YV9hdHRyKCdtYWdlbGxhbi10b3Atb2Zmc2V0JyksIHRvcF9vZmZzZXQpO1xuICAgICAgICBleHBlZGl0aW9uLmF0dHIoJ3N0eWxlJywgc3R5bGVzKTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICB1cGRhdGVfZXhwZWRpdGlvbl9wb3NpdGlvbnMgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgd2luZG93X3RvcF9vZmZzZXQgPSAkKHdpbmRvdykuc2Nyb2xsVG9wKCk7XG5cbiAgICAgICQoJ1snICsgdGhpcy5hdHRyX25hbWUoKSArICc9Zml4ZWRdJywgc2VsZi5zY29wZSkuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBleHBlZGl0aW9uID0gJCh0aGlzKSxcbiAgICAgICAgICAgIHNldHRpbmdzID0gZXhwZWRpdGlvbi5kYXRhKCdtYWdlbGxhbi1leHBlZGl0aW9uLWluaXQnKSxcbiAgICAgICAgICAgIHN0eWxlcyA9IGV4cGVkaXRpb24uYXR0cignc3R5bGUnKSwgLy8gc2F2ZSBzdHlsZXNcbiAgICAgICAgICAgIHRvcF9vZmZzZXQgPSBleHBlZGl0aW9uLmRhdGEoJ21hZ2VsbGFuLXRvcC1vZmZzZXQnKTtcblxuICAgICAgICAvL3Njcm9sbCB0byB0aGUgdG9wIGRpc3RhbmNlXG4gICAgICAgIGlmICh3aW5kb3dfdG9wX29mZnNldCArIHNlbGYuc2V0dGluZ3MuZml4ZWRfdG9wID49IHRvcF9vZmZzZXQpIHtcbiAgICAgICAgICAvLyBQbGFjZWhvbGRlciBhbGxvd3MgaGVpZ2h0IGNhbGN1bGF0aW9ucyB0byBiZSBjb25zaXN0ZW50IGV2ZW4gd2hlblxuICAgICAgICAgIC8vIGFwcGVhcmluZyB0byBzd2l0Y2ggYmV0d2VlbiBmaXhlZC9ub24tZml4ZWQgcGxhY2VtZW50XG4gICAgICAgICAgdmFyIHBsYWNlaG9sZGVyID0gZXhwZWRpdGlvbi5wcmV2KCdbJyArIHNlbGYuYWRkX25hbWVzcGFjZSgnZGF0YS1tYWdlbGxhbi1leHBlZGl0aW9uLWNsb25lJykgKyAnXScpO1xuICAgICAgICAgIGlmIChwbGFjZWhvbGRlci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gZXhwZWRpdGlvbi5jbG9uZSgpO1xuICAgICAgICAgICAgcGxhY2Vob2xkZXIucmVtb3ZlQXR0cihzZWxmLmF0dHJfbmFtZSgpKTtcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyLmF0dHIoc2VsZi5hZGRfbmFtZXNwYWNlKCdkYXRhLW1hZ2VsbGFuLWV4cGVkaXRpb24tY2xvbmUnKSwgJycpO1xuICAgICAgICAgICAgZXhwZWRpdGlvbi5iZWZvcmUocGxhY2Vob2xkZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBleHBlZGl0aW9uLmNzcyh7cG9zaXRpb24gOidmaXhlZCcsIHRvcCA6IHNldHRpbmdzLmZpeGVkX3RvcH0pLmFkZENsYXNzKCdmaXhlZCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGV4cGVkaXRpb24ucHJldignWycgKyBzZWxmLmFkZF9uYW1lc3BhY2UoJ2RhdGEtbWFnZWxsYW4tZXhwZWRpdGlvbi1jbG9uZScpICsgJ10nKS5yZW1vdmUoKTtcbiAgICAgICAgICBleHBlZGl0aW9uLmF0dHIoJ3N0eWxlJywgc3R5bGVzKS5jc3MoJ3Bvc2l0aW9uJywgJycpLmNzcygndG9wJywgJycpLnJlbW92ZUNsYXNzKCdmaXhlZCcpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgdXBkYXRlX2Fycml2YWxzIDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgIHdpbmRvd190b3Bfb2Zmc2V0ID0gJCh3aW5kb3cpLnNjcm9sbFRvcCgpO1xuXG4gICAgICAkKCdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXScsIHNlbGYuc2NvcGUpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZXhwZWRpdGlvbiA9ICQodGhpcyksXG4gICAgICAgICAgICBzZXR0aW5ncyA9IGV4cGVkaXRpb24uZGF0YShzZWxmLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpLFxuICAgICAgICAgICAgb2Zmc2V0cyA9IHNlbGYub2Zmc2V0cyhleHBlZGl0aW9uLCB3aW5kb3dfdG9wX29mZnNldCksXG4gICAgICAgICAgICBhcnJpdmFscyA9IGV4cGVkaXRpb24uZmluZCgnWycgKyBzZWxmLmFkZF9uYW1lc3BhY2UoJ2RhdGEtbWFnZWxsYW4tYXJyaXZhbCcpICsgJ10nKSxcbiAgICAgICAgICAgIGFjdGl2ZV9pdGVtID0gZmFsc2U7XG4gICAgICAgIG9mZnNldHMuZWFjaChmdW5jdGlvbiAoaWR4LCBpdGVtKSB7XG4gICAgICAgICAgaWYgKGl0ZW0udmlld3BvcnRfb2Zmc2V0ID49IGl0ZW0udG9wX29mZnNldCkge1xuICAgICAgICAgICAgdmFyIGFycml2YWxzID0gZXhwZWRpdGlvbi5maW5kKCdbJyArIHNlbGYuYWRkX25hbWVzcGFjZSgnZGF0YS1tYWdlbGxhbi1hcnJpdmFsJykgKyAnXScpO1xuICAgICAgICAgICAgYXJyaXZhbHMubm90KGl0ZW0uYXJyaXZhbCkucmVtb3ZlQ2xhc3Moc2V0dGluZ3MuYWN0aXZlX2NsYXNzKTtcbiAgICAgICAgICAgIGl0ZW0uYXJyaXZhbC5hZGRDbGFzcyhzZXR0aW5ncy5hY3RpdmVfY2xhc3MpO1xuICAgICAgICAgICAgYWN0aXZlX2l0ZW0gPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIWFjdGl2ZV9pdGVtKSB7XG4gICAgICAgICAgYXJyaXZhbHMucmVtb3ZlQ2xhc3Moc2V0dGluZ3MuYWN0aXZlX2NsYXNzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9mZnNldHMgOiBmdW5jdGlvbiAoZXhwZWRpdGlvbiwgd2luZG93X29mZnNldCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgIHNldHRpbmdzID0gZXhwZWRpdGlvbi5kYXRhKHNlbGYuYXR0cl9uYW1lKHRydWUpICsgJy1pbml0JyksXG4gICAgICAgICAgdmlld3BvcnRfb2Zmc2V0ID0gd2luZG93X29mZnNldDtcblxuICAgICAgcmV0dXJuIGV4cGVkaXRpb24uZmluZCgnWycgKyBzZWxmLmFkZF9uYW1lc3BhY2UoJ2RhdGEtbWFnZWxsYW4tYXJyaXZhbCcpICsgJ10nKS5tYXAoZnVuY3Rpb24gKGlkeCwgZWwpIHtcbiAgICAgICAgdmFyIG5hbWUgPSAkKHRoaXMpLmRhdGEoc2VsZi5kYXRhX2F0dHIoJ21hZ2VsbGFuLWFycml2YWwnKSksXG4gICAgICAgICAgICBkZXN0ID0gJCgnWycgKyBzZWxmLmFkZF9uYW1lc3BhY2UoJ2RhdGEtbWFnZWxsYW4tZGVzdGluYXRpb24nKSArICc9JyArIG5hbWUgKyAnXScpO1xuICAgICAgICBpZiAoZGVzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdmFyIHRvcF9vZmZzZXQgPSBkZXN0Lm9mZnNldCgpLnRvcCAtIHNldHRpbmdzLmRlc3RpbmF0aW9uX3RocmVzaG9sZDtcbiAgICAgICAgICBpZiAoc2V0dGluZ3Mub2Zmc2V0X2J5X2hlaWdodCkge1xuICAgICAgICAgICAgdG9wX29mZnNldCA9IHRvcF9vZmZzZXQgLSBleHBlZGl0aW9uLm91dGVySGVpZ2h0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRvcF9vZmZzZXQgPSBNYXRoLmZsb29yKHRvcF9vZmZzZXQpO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkZXN0aW5hdGlvbiA6IGRlc3QsXG4gICAgICAgICAgICBhcnJpdmFsIDogJCh0aGlzKSxcbiAgICAgICAgICAgIHRvcF9vZmZzZXQgOiB0b3Bfb2Zmc2V0LFxuICAgICAgICAgICAgdmlld3BvcnRfb2Zmc2V0IDogdmlld3BvcnRfb2Zmc2V0XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIGlmIChhLnRvcF9vZmZzZXQgPCBiLnRvcF9vZmZzZXQpIHtcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGEudG9wX29mZnNldCA+IGIudG9wX29mZnNldCkge1xuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAwO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIGRhdGFfYXR0ciA6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgIGlmICh0aGlzLm5hbWVzcGFjZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5hbWVzcGFjZSArICctJyArIHN0cjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9LFxuXG4gICAgb2ZmIDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5TKHRoaXMuc2NvcGUpLm9mZignLm1hZ2VsbGFuJyk7XG4gICAgICB0aGlzLlMod2luZG93KS5vZmYoJy5tYWdlbGxhbicpO1xuICAgIH0sXG5cbiAgICByZWZsb3cgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAvLyByZW1vdmUgcGxhY2Vob2xkZXIgZXhwZWRpdGlvbnMgdXNlZCBmb3IgaGVpZ2h0IGNhbGN1bGF0aW9uIHB1cnBvc2VzXG4gICAgICAkKCdbJyArIHNlbGYuYWRkX25hbWVzcGFjZSgnZGF0YS1tYWdlbGxhbi1leHBlZGl0aW9uLWNsb25lJykgKyAnXScsIHNlbGYuc2NvcGUpLnJlbW92ZSgpO1xuICAgIH1cbiAgfTtcbn0oalF1ZXJ5LCB3aW5kb3csIHdpbmRvdy5kb2N1bWVudCkpO1xuXG47KGZ1bmN0aW9uICgkLCB3aW5kb3csIGRvY3VtZW50LCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIEZvdW5kYXRpb24ubGlicy5vZmZjYW52YXMgPSB7XG4gICAgbmFtZSA6ICdvZmZjYW52YXMnLFxuXG4gICAgdmVyc2lvbiA6ICc1LjUuMScsXG5cbiAgICBzZXR0aW5ncyA6IHtcbiAgICAgIG9wZW5fbWV0aG9kIDogJ21vdmUnLFxuICAgICAgY2xvc2Vfb25fY2xpY2sgOiBmYWxzZVxuICAgIH0sXG5cbiAgICBpbml0IDogZnVuY3Rpb24gKHNjb3BlLCBtZXRob2QsIG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuYmluZGluZ3MobWV0aG9kLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgZXZlbnRzIDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgIFMgPSBzZWxmLlMsXG4gICAgICAgICAgbW92ZV9jbGFzcyA9ICcnLFxuICAgICAgICAgIHJpZ2h0X3Bvc3RmaXggPSAnJyxcbiAgICAgICAgICBsZWZ0X3Bvc3RmaXggPSAnJztcblxuICAgICAgaWYgKHRoaXMuc2V0dGluZ3Mub3Blbl9tZXRob2QgPT09ICdtb3ZlJykge1xuICAgICAgICBtb3ZlX2NsYXNzID0gJ21vdmUtJztcbiAgICAgICAgcmlnaHRfcG9zdGZpeCA9ICdyaWdodCc7XG4gICAgICAgIGxlZnRfcG9zdGZpeCA9ICdsZWZ0JztcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5zZXR0aW5ncy5vcGVuX21ldGhvZCA9PT0gJ292ZXJsYXBfc2luZ2xlJykge1xuICAgICAgICBtb3ZlX2NsYXNzID0gJ29mZmNhbnZhcy1vdmVybGFwLSc7XG4gICAgICAgIHJpZ2h0X3Bvc3RmaXggPSAncmlnaHQnO1xuICAgICAgICBsZWZ0X3Bvc3RmaXggPSAnbGVmdCc7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuc2V0dGluZ3Mub3Blbl9tZXRob2QgPT09ICdvdmVybGFwJykge1xuICAgICAgICBtb3ZlX2NsYXNzID0gJ29mZmNhbnZhcy1vdmVybGFwJztcbiAgICAgIH1cblxuICAgICAgUyh0aGlzLnNjb3BlKS5vZmYoJy5vZmZjYW52YXMnKVxuICAgICAgICAub24oJ2NsaWNrLmZuZHRuLm9mZmNhbnZhcycsICcubGVmdC1vZmYtY2FudmFzLXRvZ2dsZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgc2VsZi5jbGlja190b2dnbGVfY2xhc3MoZSwgbW92ZV9jbGFzcyArIHJpZ2h0X3Bvc3RmaXgpO1xuICAgICAgICAgIGlmIChzZWxmLnNldHRpbmdzLm9wZW5fbWV0aG9kICE9PSAnb3ZlcmxhcCcpIHtcbiAgICAgICAgICAgIFMoJy5sZWZ0LXN1Ym1lbnUnKS5yZW1vdmVDbGFzcyhtb3ZlX2NsYXNzICsgcmlnaHRfcG9zdGZpeCk7XG4gICAgICAgICAgfVxuICAgICAgICAgICQoJy5sZWZ0LW9mZi1jYW52YXMtdG9nZ2xlJykuYXR0cignYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignY2xpY2suZm5kdG4ub2ZmY2FudmFzJywgJy5sZWZ0LW9mZi1jYW52YXMtbWVudSBhJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSBzZWxmLmdldF9zZXR0aW5ncyhlKTtcbiAgICAgICAgICB2YXIgcGFyZW50ID0gUyh0aGlzKS5wYXJlbnQoKTtcblxuICAgICAgICAgIGlmIChzZXR0aW5ncy5jbG9zZV9vbl9jbGljayAmJiAhcGFyZW50Lmhhc0NsYXNzKCdoYXMtc3VibWVudScpICYmICFwYXJlbnQuaGFzQ2xhc3MoJ2JhY2snKSkge1xuICAgICAgICAgICAgc2VsZi5oaWRlLmNhbGwoc2VsZiwgbW92ZV9jbGFzcyArIHJpZ2h0X3Bvc3RmaXgsIHNlbGYuZ2V0X3dyYXBwZXIoZSkpO1xuICAgICAgICAgICAgcGFyZW50LnBhcmVudCgpLnJlbW92ZUNsYXNzKG1vdmVfY2xhc3MgKyByaWdodF9wb3N0Zml4KTtcbiAgICAgICAgICB9IGVsc2UgaWYgKFModGhpcykucGFyZW50KCkuaGFzQ2xhc3MoJ2hhcy1zdWJtZW51JykpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIFModGhpcykuc2libGluZ3MoJy5sZWZ0LXN1Ym1lbnUnKS50b2dnbGVDbGFzcyhtb3ZlX2NsYXNzICsgcmlnaHRfcG9zdGZpeCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChwYXJlbnQuaGFzQ2xhc3MoJ2JhY2snKSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgcGFyZW50LnBhcmVudCgpLnJlbW92ZUNsYXNzKG1vdmVfY2xhc3MgKyByaWdodF9wb3N0Zml4KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgJCgnLmxlZnQtb2ZmLWNhbnZhcy10b2dnbGUnKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ3RydWUnKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdjbGljay5mbmR0bi5vZmZjYW52YXMnLCAnLnJpZ2h0LW9mZi1jYW52YXMtdG9nZ2xlJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICBzZWxmLmNsaWNrX3RvZ2dsZV9jbGFzcyhlLCBtb3ZlX2NsYXNzICsgbGVmdF9wb3N0Zml4KTtcbiAgICAgICAgICBpZiAoc2VsZi5zZXR0aW5ncy5vcGVuX21ldGhvZCAhPT0gJ292ZXJsYXAnKSB7XG4gICAgICAgICAgICBTKCcucmlnaHQtc3VibWVudScpLnJlbW92ZUNsYXNzKG1vdmVfY2xhc3MgKyBsZWZ0X3Bvc3RmaXgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAkKCcucmlnaHQtb2ZmLWNhbnZhcy10b2dnbGUnKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ3RydWUnKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdjbGljay5mbmR0bi5vZmZjYW52YXMnLCAnLnJpZ2h0LW9mZi1jYW52YXMtbWVudSBhJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICB2YXIgc2V0dGluZ3MgPSBzZWxmLmdldF9zZXR0aW5ncyhlKTtcbiAgICAgICAgICB2YXIgcGFyZW50ID0gUyh0aGlzKS5wYXJlbnQoKTtcblxuICAgICAgICAgIGlmIChzZXR0aW5ncy5jbG9zZV9vbl9jbGljayAmJiAhcGFyZW50Lmhhc0NsYXNzKCdoYXMtc3VibWVudScpICYmICFwYXJlbnQuaGFzQ2xhc3MoJ2JhY2snKSkge1xuICAgICAgICAgICAgc2VsZi5oaWRlLmNhbGwoc2VsZiwgbW92ZV9jbGFzcyArIGxlZnRfcG9zdGZpeCwgc2VsZi5nZXRfd3JhcHBlcihlKSk7XG4gICAgICAgICAgICBwYXJlbnQucGFyZW50KCkucmVtb3ZlQ2xhc3MobW92ZV9jbGFzcyArIGxlZnRfcG9zdGZpeCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChTKHRoaXMpLnBhcmVudCgpLmhhc0NsYXNzKCdoYXMtc3VibWVudScpKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBTKHRoaXMpLnNpYmxpbmdzKCcucmlnaHQtc3VibWVudScpLnRvZ2dsZUNsYXNzKG1vdmVfY2xhc3MgKyBsZWZ0X3Bvc3RmaXgpO1xuICAgICAgICAgIH0gZWxzZSBpZiAocGFyZW50Lmhhc0NsYXNzKCdiYWNrJykpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHBhcmVudC5wYXJlbnQoKS5yZW1vdmVDbGFzcyhtb3ZlX2NsYXNzICsgbGVmdF9wb3N0Zml4KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgJCgnLnJpZ2h0LW9mZi1jYW52YXMtdG9nZ2xlJykuYXR0cignYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignY2xpY2suZm5kdG4ub2ZmY2FudmFzJywgJy5leGl0LW9mZi1jYW52YXMnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIHNlbGYuY2xpY2tfcmVtb3ZlX2NsYXNzKGUsIG1vdmVfY2xhc3MgKyBsZWZ0X3Bvc3RmaXgpO1xuICAgICAgICAgIFMoJy5yaWdodC1zdWJtZW51JykucmVtb3ZlQ2xhc3MobW92ZV9jbGFzcyArIGxlZnRfcG9zdGZpeCk7XG4gICAgICAgICAgaWYgKHJpZ2h0X3Bvc3RmaXgpIHtcbiAgICAgICAgICAgIHNlbGYuY2xpY2tfcmVtb3ZlX2NsYXNzKGUsIG1vdmVfY2xhc3MgKyByaWdodF9wb3N0Zml4KTtcbiAgICAgICAgICAgIFMoJy5sZWZ0LXN1Ym1lbnUnKS5yZW1vdmVDbGFzcyhtb3ZlX2NsYXNzICsgbGVmdF9wb3N0Zml4KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgJCgnLnJpZ2h0LW9mZi1jYW52YXMtdG9nZ2xlJykuYXR0cignYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignY2xpY2suZm5kdG4ub2ZmY2FudmFzJywgJy5leGl0LW9mZi1jYW52YXMnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIHNlbGYuY2xpY2tfcmVtb3ZlX2NsYXNzKGUsIG1vdmVfY2xhc3MgKyBsZWZ0X3Bvc3RmaXgpO1xuICAgICAgICAgICQoJy5sZWZ0LW9mZi1jYW52YXMtdG9nZ2xlJykuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgICAgICAgIGlmIChyaWdodF9wb3N0Zml4KSB7XG4gICAgICAgICAgICBzZWxmLmNsaWNrX3JlbW92ZV9jbGFzcyhlLCBtb3ZlX2NsYXNzICsgcmlnaHRfcG9zdGZpeCk7XG4gICAgICAgICAgICAkKCcucmlnaHQtb2ZmLWNhbnZhcy10b2dnbGUnKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgdG9nZ2xlIDogZnVuY3Rpb24gKGNsYXNzX25hbWUsICRvZmZfY2FudmFzKSB7XG4gICAgICAkb2ZmX2NhbnZhcyA9ICRvZmZfY2FudmFzIHx8IHRoaXMuZ2V0X3dyYXBwZXIoKTtcbiAgICAgIGlmICgkb2ZmX2NhbnZhcy5pcygnLicgKyBjbGFzc19uYW1lKSkge1xuICAgICAgICB0aGlzLmhpZGUoY2xhc3NfbmFtZSwgJG9mZl9jYW52YXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zaG93KGNsYXNzX25hbWUsICRvZmZfY2FudmFzKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgc2hvdyA6IGZ1bmN0aW9uIChjbGFzc19uYW1lLCAkb2ZmX2NhbnZhcykge1xuICAgICAgJG9mZl9jYW52YXMgPSAkb2ZmX2NhbnZhcyB8fCB0aGlzLmdldF93cmFwcGVyKCk7XG4gICAgICAkb2ZmX2NhbnZhcy50cmlnZ2VyKCdvcGVuJykudHJpZ2dlcignb3Blbi5mbmR0bi5vZmZjYW52YXMnKTtcbiAgICAgICRvZmZfY2FudmFzLmFkZENsYXNzKGNsYXNzX25hbWUpO1xuICAgIH0sXG5cbiAgICBoaWRlIDogZnVuY3Rpb24gKGNsYXNzX25hbWUsICRvZmZfY2FudmFzKSB7XG4gICAgICAkb2ZmX2NhbnZhcyA9ICRvZmZfY2FudmFzIHx8IHRoaXMuZ2V0X3dyYXBwZXIoKTtcbiAgICAgICRvZmZfY2FudmFzLnRyaWdnZXIoJ2Nsb3NlJykudHJpZ2dlcignY2xvc2UuZm5kdG4ub2ZmY2FudmFzJyk7XG4gICAgICAkb2ZmX2NhbnZhcy5yZW1vdmVDbGFzcyhjbGFzc19uYW1lKTtcbiAgICB9LFxuXG4gICAgY2xpY2tfdG9nZ2xlX2NsYXNzIDogZnVuY3Rpb24gKGUsIGNsYXNzX25hbWUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZhciAkb2ZmX2NhbnZhcyA9IHRoaXMuZ2V0X3dyYXBwZXIoZSk7XG4gICAgICB0aGlzLnRvZ2dsZShjbGFzc19uYW1lLCAkb2ZmX2NhbnZhcyk7XG4gICAgfSxcblxuICAgIGNsaWNrX3JlbW92ZV9jbGFzcyA6IGZ1bmN0aW9uIChlLCBjbGFzc19uYW1lKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB2YXIgJG9mZl9jYW52YXMgPSB0aGlzLmdldF93cmFwcGVyKGUpO1xuICAgICAgdGhpcy5oaWRlKGNsYXNzX25hbWUsICRvZmZfY2FudmFzKTtcbiAgICB9LFxuXG4gICAgZ2V0X3NldHRpbmdzIDogZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciBvZmZjYW52YXMgID0gdGhpcy5TKGUudGFyZ2V0KS5jbG9zZXN0KCdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXScpO1xuICAgICAgcmV0dXJuIG9mZmNhbnZhcy5kYXRhKHRoaXMuYXR0cl9uYW1lKHRydWUpICsgJy1pbml0JykgfHwgdGhpcy5zZXR0aW5ncztcbiAgICB9LFxuXG4gICAgZ2V0X3dyYXBwZXIgOiBmdW5jdGlvbiAoZSkge1xuICAgICAgdmFyICRvZmZfY2FudmFzID0gdGhpcy5TKGUgPyBlLnRhcmdldCA6IHRoaXMuc2NvcGUpLmNsb3Nlc3QoJy5vZmYtY2FudmFzLXdyYXAnKTtcblxuICAgICAgaWYgKCRvZmZfY2FudmFzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAkb2ZmX2NhbnZhcyA9IHRoaXMuUygnLm9mZi1jYW52YXMtd3JhcCcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuICRvZmZfY2FudmFzO1xuICAgIH0sXG5cbiAgICByZWZsb3cgOiBmdW5jdGlvbiAoKSB7fVxuICB9O1xufShqUXVlcnksIHdpbmRvdywgd2luZG93LmRvY3VtZW50KSk7XG5cbjsoZnVuY3Rpb24gKCQsIHdpbmRvdywgZG9jdW1lbnQsIHVuZGVmaW5lZCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIG5vb3AgPSBmdW5jdGlvbiAoKSB7fTtcblxuICB2YXIgT3JiaXQgPSBmdW5jdGlvbiAoZWwsIHNldHRpbmdzKSB7XG4gICAgLy8gRG9uJ3QgcmVpbml0aWFsaXplIHBsdWdpblxuICAgIGlmIChlbC5oYXNDbGFzcyhzZXR0aW5ncy5zbGlkZXNfY29udGFpbmVyX2NsYXNzKSkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICBjb250YWluZXIsXG4gICAgICAgIHNsaWRlc19jb250YWluZXIgPSBlbCxcbiAgICAgICAgbnVtYmVyX2NvbnRhaW5lcixcbiAgICAgICAgYnVsbGV0c19jb250YWluZXIsXG4gICAgICAgIHRpbWVyX2NvbnRhaW5lcixcbiAgICAgICAgaWR4ID0gMCxcbiAgICAgICAgYW5pbWF0ZSxcbiAgICAgICAgdGltZXIsXG4gICAgICAgIGxvY2tlZCA9IGZhbHNlLFxuICAgICAgICBhZGp1c3RfaGVpZ2h0X2FmdGVyID0gZmFsc2U7XG5cbiAgICBzZWxmLnNsaWRlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBzbGlkZXNfY29udGFpbmVyLmNoaWxkcmVuKHNldHRpbmdzLnNsaWRlX3NlbGVjdG9yKTtcbiAgICB9O1xuXG4gICAgc2VsZi5zbGlkZXMoKS5maXJzdCgpLmFkZENsYXNzKHNldHRpbmdzLmFjdGl2ZV9zbGlkZV9jbGFzcyk7XG5cbiAgICBzZWxmLnVwZGF0ZV9zbGlkZV9udW1iZXIgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgIGlmIChzZXR0aW5ncy5zbGlkZV9udW1iZXIpIHtcbiAgICAgICAgbnVtYmVyX2NvbnRhaW5lci5maW5kKCdzcGFuOmZpcnN0JykudGV4dChwYXJzZUludChpbmRleCkgKyAxKTtcbiAgICAgICAgbnVtYmVyX2NvbnRhaW5lci5maW5kKCdzcGFuOmxhc3QnKS50ZXh0KHNlbGYuc2xpZGVzKCkubGVuZ3RoKTtcbiAgICAgIH1cbiAgICAgIGlmIChzZXR0aW5ncy5idWxsZXRzKSB7XG4gICAgICAgIGJ1bGxldHNfY29udGFpbmVyLmNoaWxkcmVuKCkucmVtb3ZlQ2xhc3Moc2V0dGluZ3MuYnVsbGV0c19hY3RpdmVfY2xhc3MpO1xuICAgICAgICAkKGJ1bGxldHNfY29udGFpbmVyLmNoaWxkcmVuKCkuZ2V0KGluZGV4KSkuYWRkQ2xhc3Moc2V0dGluZ3MuYnVsbGV0c19hY3RpdmVfY2xhc3MpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLnVwZGF0ZV9hY3RpdmVfbGluayA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgdmFyIGxpbmsgPSAkKCdbZGF0YS1vcmJpdC1saW5rPVwiJyArIHNlbGYuc2xpZGVzKCkuZXEoaW5kZXgpLmF0dHIoJ2RhdGEtb3JiaXQtc2xpZGUnKSArICdcIl0nKTtcbiAgICAgIGxpbmsuc2libGluZ3MoKS5yZW1vdmVDbGFzcyhzZXR0aW5ncy5idWxsZXRzX2FjdGl2ZV9jbGFzcyk7XG4gICAgICBsaW5rLmFkZENsYXNzKHNldHRpbmdzLmJ1bGxldHNfYWN0aXZlX2NsYXNzKTtcbiAgICB9O1xuXG4gICAgc2VsZi5idWlsZF9tYXJrdXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBzbGlkZXNfY29udGFpbmVyLndyYXAoJzxkaXYgY2xhc3M9XCInICsgc2V0dGluZ3MuY29udGFpbmVyX2NsYXNzICsgJ1wiPjwvZGl2PicpO1xuICAgICAgY29udGFpbmVyID0gc2xpZGVzX2NvbnRhaW5lci5wYXJlbnQoKTtcbiAgICAgIHNsaWRlc19jb250YWluZXIuYWRkQ2xhc3Moc2V0dGluZ3Muc2xpZGVzX2NvbnRhaW5lcl9jbGFzcyk7XG5cbiAgICAgIGlmIChzZXR0aW5ncy5zdGFja19vbl9zbWFsbCkge1xuICAgICAgICBjb250YWluZXIuYWRkQ2xhc3Moc2V0dGluZ3Muc3RhY2tfb25fc21hbGxfY2xhc3MpO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2V0dGluZ3MubmF2aWdhdGlvbl9hcnJvd3MpIHtcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZCgkKCc8YSBocmVmPVwiI1wiPjxzcGFuPjwvc3Bhbj48L2E+JykuYWRkQ2xhc3Moc2V0dGluZ3MucHJldl9jbGFzcykpO1xuICAgICAgICBjb250YWluZXIuYXBwZW5kKCQoJzxhIGhyZWY9XCIjXCI+PHNwYW4+PC9zcGFuPjwvYT4nKS5hZGRDbGFzcyhzZXR0aW5ncy5uZXh0X2NsYXNzKSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChzZXR0aW5ncy50aW1lcikge1xuICAgICAgICB0aW1lcl9jb250YWluZXIgPSAkKCc8ZGl2PicpLmFkZENsYXNzKHNldHRpbmdzLnRpbWVyX2NvbnRhaW5lcl9jbGFzcyk7XG4gICAgICAgIHRpbWVyX2NvbnRhaW5lci5hcHBlbmQoJzxzcGFuPicpO1xuICAgICAgICB0aW1lcl9jb250YWluZXIuYXBwZW5kKCQoJzxkaXY+JykuYWRkQ2xhc3Moc2V0dGluZ3MudGltZXJfcHJvZ3Jlc3NfY2xhc3MpKTtcbiAgICAgICAgdGltZXJfY29udGFpbmVyLmFkZENsYXNzKHNldHRpbmdzLnRpbWVyX3BhdXNlZF9jbGFzcyk7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmQodGltZXJfY29udGFpbmVyKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNldHRpbmdzLnNsaWRlX251bWJlcikge1xuICAgICAgICBudW1iZXJfY29udGFpbmVyID0gJCgnPGRpdj4nKS5hZGRDbGFzcyhzZXR0aW5ncy5zbGlkZV9udW1iZXJfY2xhc3MpO1xuICAgICAgICBudW1iZXJfY29udGFpbmVyLmFwcGVuZCgnPHNwYW4+PC9zcGFuPiAnICsgc2V0dGluZ3Muc2xpZGVfbnVtYmVyX3RleHQgKyAnIDxzcGFuPjwvc3Bhbj4nKTtcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZChudW1iZXJfY29udGFpbmVyKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNldHRpbmdzLmJ1bGxldHMpIHtcbiAgICAgICAgYnVsbGV0c19jb250YWluZXIgPSAkKCc8b2w+JykuYWRkQ2xhc3Moc2V0dGluZ3MuYnVsbGV0c19jb250YWluZXJfY2xhc3MpO1xuICAgICAgICBjb250YWluZXIuYXBwZW5kKGJ1bGxldHNfY29udGFpbmVyKTtcbiAgICAgICAgYnVsbGV0c19jb250YWluZXIud3JhcCgnPGRpdiBjbGFzcz1cIm9yYml0LWJ1bGxldHMtY29udGFpbmVyXCI+PC9kaXY+Jyk7XG4gICAgICAgIHNlbGYuc2xpZGVzKCkuZWFjaChmdW5jdGlvbiAoaWR4LCBlbCkge1xuICAgICAgICAgIHZhciBidWxsZXQgPSAkKCc8bGk+JykuYXR0cignZGF0YS1vcmJpdC1zbGlkZScsIGlkeCkub24oJ2NsaWNrJywgc2VsZi5saW5rX2J1bGxldCk7O1xuICAgICAgICAgIGJ1bGxldHNfY29udGFpbmVyLmFwcGVuZChidWxsZXQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgIH07XG5cbiAgICBzZWxmLl9nb3RvID0gZnVuY3Rpb24gKG5leHRfaWR4LCBzdGFydF90aW1lcikge1xuICAgICAgLy8gaWYgKGxvY2tlZCkge3JldHVybiBmYWxzZTt9XG4gICAgICBpZiAobmV4dF9pZHggPT09IGlkeCkge3JldHVybiBmYWxzZTt9XG4gICAgICBpZiAodHlwZW9mIHRpbWVyID09PSAnb2JqZWN0Jykge3RpbWVyLnJlc3RhcnQoKTt9XG4gICAgICB2YXIgc2xpZGVzID0gc2VsZi5zbGlkZXMoKTtcblxuICAgICAgdmFyIGRpciA9ICduZXh0JztcbiAgICAgIGxvY2tlZCA9IHRydWU7XG4gICAgICBpZiAobmV4dF9pZHggPCBpZHgpIHtkaXIgPSAncHJldic7fVxuICAgICAgaWYgKG5leHRfaWR4ID49IHNsaWRlcy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKCFzZXR0aW5ncy5jaXJjdWxhcikge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBuZXh0X2lkeCA9IDA7XG4gICAgICB9IGVsc2UgaWYgKG5leHRfaWR4IDwgMCkge1xuICAgICAgICBpZiAoIXNldHRpbmdzLmNpcmN1bGFyKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIG5leHRfaWR4ID0gc2xpZGVzLmxlbmd0aCAtIDE7XG4gICAgICB9XG5cbiAgICAgIHZhciBjdXJyZW50ID0gJChzbGlkZXMuZ2V0KGlkeCkpO1xuICAgICAgdmFyIG5leHQgPSAkKHNsaWRlcy5nZXQobmV4dF9pZHgpKTtcblxuICAgICAgY3VycmVudC5jc3MoJ3pJbmRleCcsIDIpO1xuICAgICAgY3VycmVudC5yZW1vdmVDbGFzcyhzZXR0aW5ncy5hY3RpdmVfc2xpZGVfY2xhc3MpO1xuICAgICAgbmV4dC5jc3MoJ3pJbmRleCcsIDQpLmFkZENsYXNzKHNldHRpbmdzLmFjdGl2ZV9zbGlkZV9jbGFzcyk7XG5cbiAgICAgIHNsaWRlc19jb250YWluZXIudHJpZ2dlcignYmVmb3JlLXNsaWRlLWNoYW5nZS5mbmR0bi5vcmJpdCcpO1xuICAgICAgc2V0dGluZ3MuYmVmb3JlX3NsaWRlX2NoYW5nZSgpO1xuICAgICAgc2VsZi51cGRhdGVfYWN0aXZlX2xpbmsobmV4dF9pZHgpO1xuXG4gICAgICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1bmxvY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgaWR4ID0gbmV4dF9pZHg7XG4gICAgICAgICAgbG9ja2VkID0gZmFsc2U7XG4gICAgICAgICAgaWYgKHN0YXJ0X3RpbWVyID09PSB0cnVlKSB7dGltZXIgPSBzZWxmLmNyZWF0ZV90aW1lcigpOyB0aW1lci5zdGFydCgpO31cbiAgICAgICAgICBzZWxmLnVwZGF0ZV9zbGlkZV9udW1iZXIoaWR4KTtcbiAgICAgICAgICBzbGlkZXNfY29udGFpbmVyLnRyaWdnZXIoJ2FmdGVyLXNsaWRlLWNoYW5nZS5mbmR0bi5vcmJpdCcsIFt7c2xpZGVfbnVtYmVyIDogaWR4LCB0b3RhbF9zbGlkZXMgOiBzbGlkZXMubGVuZ3RofV0pO1xuICAgICAgICAgIHNldHRpbmdzLmFmdGVyX3NsaWRlX2NoYW5nZShpZHgsIHNsaWRlcy5sZW5ndGgpO1xuICAgICAgICB9O1xuICAgICAgICBpZiAoc2xpZGVzX2NvbnRhaW5lci5vdXRlckhlaWdodCgpICE9IG5leHQub3V0ZXJIZWlnaHQoKSAmJiBzZXR0aW5ncy52YXJpYWJsZV9oZWlnaHQpIHtcbiAgICAgICAgICBzbGlkZXNfY29udGFpbmVyLmFuaW1hdGUoeydoZWlnaHQnOiBuZXh0Lm91dGVySGVpZ2h0KCl9LCAyNTAsICdsaW5lYXInLCB1bmxvY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVubG9jaygpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBpZiAoc2xpZGVzLmxlbmd0aCA9PT0gMSkge2NhbGxiYWNrKCk7IHJldHVybiBmYWxzZTt9XG5cbiAgICAgIHZhciBzdGFydF9hbmltYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChkaXIgPT09ICduZXh0Jykge2FuaW1hdGUubmV4dChjdXJyZW50LCBuZXh0LCBjYWxsYmFjayk7fVxuICAgICAgICBpZiAoZGlyID09PSAncHJldicpIHthbmltYXRlLnByZXYoY3VycmVudCwgbmV4dCwgY2FsbGJhY2spO31cbiAgICAgIH07XG5cbiAgICAgIGlmIChuZXh0Lm91dGVySGVpZ2h0KCkgPiBzbGlkZXNfY29udGFpbmVyLm91dGVySGVpZ2h0KCkgJiYgc2V0dGluZ3MudmFyaWFibGVfaGVpZ2h0KSB7XG4gICAgICAgIHNsaWRlc19jb250YWluZXIuYW5pbWF0ZSh7J2hlaWdodCc6IG5leHQub3V0ZXJIZWlnaHQoKX0sIDI1MCwgJ2xpbmVhcicsIHN0YXJ0X2FuaW1hdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGFydF9hbmltYXRpb24oKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5uZXh0ID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBzZWxmLl9nb3RvKGlkeCArIDEpO1xuICAgIH07XG5cbiAgICBzZWxmLnByZXYgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHNlbGYuX2dvdG8oaWR4IC0gMSk7XG4gICAgfTtcblxuICAgIHNlbGYubGlua19jdXN0b20gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdmFyIGxpbmsgPSAkKHRoaXMpLmF0dHIoJ2RhdGEtb3JiaXQtbGluaycpO1xuICAgICAgaWYgKCh0eXBlb2YgbGluayA9PT0gJ3N0cmluZycpICYmIChsaW5rID0gJC50cmltKGxpbmspKSAhPSAnJykge1xuICAgICAgICB2YXIgc2xpZGUgPSBjb250YWluZXIuZmluZCgnW2RhdGEtb3JiaXQtc2xpZGU9JyArIGxpbmsgKyAnXScpO1xuICAgICAgICBpZiAoc2xpZGUuaW5kZXgoKSAhPSAtMSkge3NlbGYuX2dvdG8oc2xpZGUuaW5kZXgoKSk7fVxuICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLmxpbmtfYnVsbGV0ID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciBpbmRleCA9ICQodGhpcykuYXR0cignZGF0YS1vcmJpdC1zbGlkZScpO1xuICAgICAgaWYgKCh0eXBlb2YgaW5kZXggPT09ICdzdHJpbmcnKSAmJiAoaW5kZXggPSAkLnRyaW0oaW5kZXgpKSAhPSAnJykge1xuICAgICAgICBpZiAoaXNOYU4ocGFyc2VJbnQoaW5kZXgpKSkge1xuICAgICAgICAgIHZhciBzbGlkZSA9IGNvbnRhaW5lci5maW5kKCdbZGF0YS1vcmJpdC1zbGlkZT0nICsgaW5kZXggKyAnXScpO1xuICAgICAgICAgIGlmIChzbGlkZS5pbmRleCgpICE9IC0xKSB7c2VsZi5fZ290byhzbGlkZS5pbmRleCgpICsgMSk7fVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYuX2dvdG8ocGFyc2VJbnQoaW5kZXgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgfVxuXG4gICAgc2VsZi50aW1lcl9jYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuX2dvdG8oaWR4ICsgMSwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgc2VsZi5jb21wdXRlX2RpbWVuc2lvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY3VycmVudCA9ICQoc2VsZi5zbGlkZXMoKS5nZXQoaWR4KSk7XG4gICAgICB2YXIgaCA9IGN1cnJlbnQub3V0ZXJIZWlnaHQoKTtcbiAgICAgIGlmICghc2V0dGluZ3MudmFyaWFibGVfaGVpZ2h0KSB7XG4gICAgICAgIHNlbGYuc2xpZGVzKCkuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgIGlmICgkKHRoaXMpLm91dGVySGVpZ2h0KCkgPiBoKSB7IGggPSAkKHRoaXMpLm91dGVySGVpZ2h0KCk7IH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBzbGlkZXNfY29udGFpbmVyLmhlaWdodChoKTtcbiAgICB9O1xuXG4gICAgc2VsZi5jcmVhdGVfdGltZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgdCA9IG5ldyBUaW1lcihcbiAgICAgICAgY29udGFpbmVyLmZpbmQoJy4nICsgc2V0dGluZ3MudGltZXJfY29udGFpbmVyX2NsYXNzKSxcbiAgICAgICAgc2V0dGluZ3MsXG4gICAgICAgIHNlbGYudGltZXJfY2FsbGJhY2tcbiAgICAgICk7XG4gICAgICByZXR1cm4gdDtcbiAgICB9O1xuXG4gICAgc2VsZi5zdG9wX3RpbWVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHR5cGVvZiB0aW1lciA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgdGltZXIuc3RvcCgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLnRvZ2dsZV90aW1lciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciB0ID0gY29udGFpbmVyLmZpbmQoJy4nICsgc2V0dGluZ3MudGltZXJfY29udGFpbmVyX2NsYXNzKTtcbiAgICAgIGlmICh0Lmhhc0NsYXNzKHNldHRpbmdzLnRpbWVyX3BhdXNlZF9jbGFzcykpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0aW1lciA9PT0gJ3VuZGVmaW5lZCcpIHt0aW1lciA9IHNlbGYuY3JlYXRlX3RpbWVyKCk7fVxuICAgICAgICB0aW1lci5zdGFydCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0aW1lciA9PT0gJ29iamVjdCcpIHt0aW1lci5zdG9wKCk7fVxuICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLmJ1aWxkX21hcmt1cCgpO1xuICAgICAgaWYgKHNldHRpbmdzLnRpbWVyKSB7XG4gICAgICAgIHRpbWVyID0gc2VsZi5jcmVhdGVfdGltZXIoKTtcbiAgICAgICAgRm91bmRhdGlvbi51dGlscy5pbWFnZV9sb2FkZWQodGhpcy5zbGlkZXMoKS5jaGlsZHJlbignaW1nJyksIHRpbWVyLnN0YXJ0KTtcbiAgICAgIH1cbiAgICAgIGFuaW1hdGUgPSBuZXcgRmFkZUFuaW1hdGlvbihzZXR0aW5ncywgc2xpZGVzX2NvbnRhaW5lcik7XG4gICAgICBpZiAoc2V0dGluZ3MuYW5pbWF0aW9uID09PSAnc2xpZGUnKSB7XG4gICAgICAgIGFuaW1hdGUgPSBuZXcgU2xpZGVBbmltYXRpb24oc2V0dGluZ3MsIHNsaWRlc19jb250YWluZXIpO1xuICAgICAgfVxuXG4gICAgICBjb250YWluZXIub24oJ2NsaWNrJywgJy4nICsgc2V0dGluZ3MubmV4dF9jbGFzcywgc2VsZi5uZXh0KTtcbiAgICAgIGNvbnRhaW5lci5vbignY2xpY2snLCAnLicgKyBzZXR0aW5ncy5wcmV2X2NsYXNzLCBzZWxmLnByZXYpO1xuXG4gICAgICBpZiAoc2V0dGluZ3MubmV4dF9vbl9jbGljaykge1xuICAgICAgICBjb250YWluZXIub24oJ2NsaWNrJywgJy4nICsgc2V0dGluZ3Muc2xpZGVzX2NvbnRhaW5lcl9jbGFzcyArICcgW2RhdGEtb3JiaXQtc2xpZGVdJywgc2VsZi5saW5rX2J1bGxldCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnRhaW5lci5vbignY2xpY2snLCBzZWxmLnRvZ2dsZV90aW1lcik7XG4gICAgICBpZiAoc2V0dGluZ3Muc3dpcGUpIHtcbiAgICAgICAgY29udGFpbmVyLm9uKCd0b3VjaHN0YXJ0LmZuZHRuLm9yYml0JywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICBpZiAoIWUudG91Y2hlcykge2UgPSBlLm9yaWdpbmFsRXZlbnQ7fVxuICAgICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgc3RhcnRfcGFnZV94IDogZS50b3VjaGVzWzBdLnBhZ2VYLFxuICAgICAgICAgICAgc3RhcnRfcGFnZV95IDogZS50b3VjaGVzWzBdLnBhZ2VZLFxuICAgICAgICAgICAgc3RhcnRfdGltZSA6IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCksXG4gICAgICAgICAgICBkZWx0YV94IDogMCxcbiAgICAgICAgICAgIGlzX3Njcm9sbGluZyA6IHVuZGVmaW5lZFxuICAgICAgICAgIH07XG4gICAgICAgICAgY29udGFpbmVyLmRhdGEoJ3N3aXBlLXRyYW5zaXRpb24nLCBkYXRhKTtcbiAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9KVxuICAgICAgICAub24oJ3RvdWNobW92ZS5mbmR0bi5vcmJpdCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgaWYgKCFlLnRvdWNoZXMpIHtcbiAgICAgICAgICAgIGUgPSBlLm9yaWdpbmFsRXZlbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIElnbm9yZSBwaW5jaC96b29tIGV2ZW50c1xuICAgICAgICAgIGlmIChlLnRvdWNoZXMubGVuZ3RoID4gMSB8fCBlLnNjYWxlICYmIGUuc2NhbGUgIT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgZGF0YSA9IGNvbnRhaW5lci5kYXRhKCdzd2lwZS10cmFuc2l0aW9uJyk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAndW5kZWZpbmVkJykge2RhdGEgPSB7fTt9XG5cbiAgICAgICAgICBkYXRhLmRlbHRhX3ggPSBlLnRvdWNoZXNbMF0ucGFnZVggLSBkYXRhLnN0YXJ0X3BhZ2VfeDtcblxuICAgICAgICAgIGlmICggdHlwZW9mIGRhdGEuaXNfc2Nyb2xsaW5nID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgZGF0YS5pc19zY3JvbGxpbmcgPSAhISggZGF0YS5pc19zY3JvbGxpbmcgfHwgTWF0aC5hYnMoZGF0YS5kZWx0YV94KSA8IE1hdGguYWJzKGUudG91Y2hlc1swXS5wYWdlWSAtIGRhdGEuc3RhcnRfcGFnZV95KSApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghZGF0YS5pc19zY3JvbGxpbmcgJiYgIWRhdGEuYWN0aXZlKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB2YXIgZGlyZWN0aW9uID0gKGRhdGEuZGVsdGFfeCA8IDApID8gKGlkeCArIDEpIDogKGlkeCAtIDEpO1xuICAgICAgICAgICAgZGF0YS5hY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgc2VsZi5fZ290byhkaXJlY3Rpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCd0b3VjaGVuZC5mbmR0bi5vcmJpdCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgY29udGFpbmVyLmRhdGEoJ3N3aXBlLXRyYW5zaXRpb24nLCB7fSk7XG4gICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGNvbnRhaW5lci5vbignbW91c2VlbnRlci5mbmR0bi5vcmJpdCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmIChzZXR0aW5ncy50aW1lciAmJiBzZXR0aW5ncy5wYXVzZV9vbl9ob3Zlcikge1xuICAgICAgICAgIHNlbGYuc3RvcF90aW1lcigpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLm9uKCdtb3VzZWxlYXZlLmZuZHRuLm9yYml0JywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKHNldHRpbmdzLnRpbWVyICYmIHNldHRpbmdzLnJlc3VtZV9vbl9tb3VzZW91dCkge1xuICAgICAgICAgIHRpbWVyLnN0YXJ0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnW2RhdGEtb3JiaXQtbGlua10nLCBzZWxmLmxpbmtfY3VzdG9tKTtcbiAgICAgICQod2luZG93KS5vbignbG9hZCByZXNpemUnLCBzZWxmLmNvbXB1dGVfZGltZW5zaW9ucyk7XG4gICAgICBGb3VuZGF0aW9uLnV0aWxzLmltYWdlX2xvYWRlZCh0aGlzLnNsaWRlcygpLmNoaWxkcmVuKCdpbWcnKSwgc2VsZi5jb21wdXRlX2RpbWVuc2lvbnMpO1xuICAgICAgRm91bmRhdGlvbi51dGlscy5pbWFnZV9sb2FkZWQodGhpcy5zbGlkZXMoKS5jaGlsZHJlbignaW1nJyksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29udGFpbmVyLnByZXYoJy4nICsgc2V0dGluZ3MucHJlbG9hZGVyX2NsYXNzKS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgICAgICBzZWxmLnVwZGF0ZV9zbGlkZV9udW1iZXIoMCk7XG4gICAgICAgIHNlbGYudXBkYXRlX2FjdGl2ZV9saW5rKDApO1xuICAgICAgICBzbGlkZXNfY29udGFpbmVyLnRyaWdnZXIoJ3JlYWR5LmZuZHRuLm9yYml0Jyk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5pbml0KCk7XG4gIH07XG5cbiAgdmFyIFRpbWVyID0gZnVuY3Rpb24gKGVsLCBzZXR0aW5ncywgY2FsbGJhY2spIHtcbiAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgIGR1cmF0aW9uID0gc2V0dGluZ3MudGltZXJfc3BlZWQsXG4gICAgICAgIHByb2dyZXNzID0gZWwuZmluZCgnLicgKyBzZXR0aW5ncy50aW1lcl9wcm9ncmVzc19jbGFzcyksXG4gICAgICAgIHN0YXJ0LFxuICAgICAgICB0aW1lb3V0LFxuICAgICAgICBsZWZ0ID0gLTE7XG5cbiAgICB0aGlzLnVwZGF0ZV9wcm9ncmVzcyA9IGZ1bmN0aW9uICh3KSB7XG4gICAgICB2YXIgbmV3X3Byb2dyZXNzID0gcHJvZ3Jlc3MuY2xvbmUoKTtcbiAgICAgIG5ld19wcm9ncmVzcy5hdHRyKCdzdHlsZScsICcnKTtcbiAgICAgIG5ld19wcm9ncmVzcy5jc3MoJ3dpZHRoJywgdyArICclJyk7XG4gICAgICBwcm9ncmVzcy5yZXBsYWNlV2l0aChuZXdfcHJvZ3Jlc3MpO1xuICAgICAgcHJvZ3Jlc3MgPSBuZXdfcHJvZ3Jlc3M7XG4gICAgfTtcblxuICAgIHRoaXMucmVzdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgIGVsLmFkZENsYXNzKHNldHRpbmdzLnRpbWVyX3BhdXNlZF9jbGFzcyk7XG4gICAgICBsZWZ0ID0gLTE7XG4gICAgICBzZWxmLnVwZGF0ZV9wcm9ncmVzcygwKTtcbiAgICB9O1xuXG4gICAgdGhpcy5zdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghZWwuaGFzQ2xhc3Moc2V0dGluZ3MudGltZXJfcGF1c2VkX2NsYXNzKSkge3JldHVybiB0cnVlO31cbiAgICAgIGxlZnQgPSAobGVmdCA9PT0gLTEpID8gZHVyYXRpb24gOiBsZWZ0O1xuICAgICAgZWwucmVtb3ZlQ2xhc3Moc2V0dGluZ3MudGltZXJfcGF1c2VkX2NsYXNzKTtcbiAgICAgIHN0YXJ0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICBwcm9ncmVzcy5hbmltYXRlKHsnd2lkdGgnIDogJzEwMCUnfSwgbGVmdCwgJ2xpbmVhcicpO1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnJlc3RhcnQoKTtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH0sIGxlZnQpO1xuICAgICAgZWwudHJpZ2dlcigndGltZXItc3RhcnRlZC5mbmR0bi5vcmJpdCcpXG4gICAgfTtcblxuICAgIHRoaXMuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChlbC5oYXNDbGFzcyhzZXR0aW5ncy50aW1lcl9wYXVzZWRfY2xhc3MpKSB7cmV0dXJuIHRydWU7fVxuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgZWwuYWRkQ2xhc3Moc2V0dGluZ3MudGltZXJfcGF1c2VkX2NsYXNzKTtcbiAgICAgIHZhciBlbmQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgIGxlZnQgPSBsZWZ0IC0gKGVuZCAtIHN0YXJ0KTtcbiAgICAgIHZhciB3ID0gMTAwIC0gKChsZWZ0IC8gZHVyYXRpb24pICogMTAwKTtcbiAgICAgIHNlbGYudXBkYXRlX3Byb2dyZXNzKHcpO1xuICAgICAgZWwudHJpZ2dlcigndGltZXItc3RvcHBlZC5mbmR0bi5vcmJpdCcpO1xuICAgIH07XG4gIH07XG5cbiAgdmFyIFNsaWRlQW5pbWF0aW9uID0gZnVuY3Rpb24gKHNldHRpbmdzLCBjb250YWluZXIpIHtcbiAgICB2YXIgZHVyYXRpb24gPSBzZXR0aW5ncy5hbmltYXRpb25fc3BlZWQ7XG4gICAgdmFyIGlzX3J0bCA9ICgkKCdodG1sW2Rpcj1ydGxdJykubGVuZ3RoID09PSAxKTtcbiAgICB2YXIgbWFyZ2luID0gaXNfcnRsID8gJ21hcmdpblJpZ2h0JyA6ICdtYXJnaW5MZWZ0JztcbiAgICB2YXIgYW5pbU1hcmdpbiA9IHt9O1xuICAgIGFuaW1NYXJnaW5bbWFyZ2luXSA9ICcwJSc7XG5cbiAgICB0aGlzLm5leHQgPSBmdW5jdGlvbiAoY3VycmVudCwgbmV4dCwgY2FsbGJhY2spIHtcbiAgICAgIGN1cnJlbnQuYW5pbWF0ZSh7bWFyZ2luTGVmdCA6ICctMTAwJSd9LCBkdXJhdGlvbik7XG4gICAgICBuZXh0LmFuaW1hdGUoYW5pbU1hcmdpbiwgZHVyYXRpb24sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY3VycmVudC5jc3MobWFyZ2luLCAnMTAwJScpO1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHRoaXMucHJldiA9IGZ1bmN0aW9uIChjdXJyZW50LCBwcmV2LCBjYWxsYmFjaykge1xuICAgICAgY3VycmVudC5hbmltYXRlKHttYXJnaW5MZWZ0IDogJzEwMCUnfSwgZHVyYXRpb24pO1xuICAgICAgcHJldi5jc3MobWFyZ2luLCAnLTEwMCUnKTtcbiAgICAgIHByZXYuYW5pbWF0ZShhbmltTWFyZ2luLCBkdXJhdGlvbiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBjdXJyZW50LmNzcyhtYXJnaW4sICcxMDAlJyk7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9KTtcbiAgICB9O1xuICB9O1xuXG4gIHZhciBGYWRlQW5pbWF0aW9uID0gZnVuY3Rpb24gKHNldHRpbmdzLCBjb250YWluZXIpIHtcbiAgICB2YXIgZHVyYXRpb24gPSBzZXR0aW5ncy5hbmltYXRpb25fc3BlZWQ7XG4gICAgdmFyIGlzX3J0bCA9ICgkKCdodG1sW2Rpcj1ydGxdJykubGVuZ3RoID09PSAxKTtcbiAgICB2YXIgbWFyZ2luID0gaXNfcnRsID8gJ21hcmdpblJpZ2h0JyA6ICdtYXJnaW5MZWZ0JztcblxuICAgIHRoaXMubmV4dCA9IGZ1bmN0aW9uIChjdXJyZW50LCBuZXh0LCBjYWxsYmFjaykge1xuICAgICAgbmV4dC5jc3MoeydtYXJnaW4nIDogJzAlJywgJ29wYWNpdHknIDogJzAuMDEnfSk7XG4gICAgICBuZXh0LmFuaW1hdGUoeydvcGFjaXR5JyA6JzEnfSwgZHVyYXRpb24sICdsaW5lYXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGN1cnJlbnQuY3NzKCdtYXJnaW4nLCAnMTAwJScpO1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHRoaXMucHJldiA9IGZ1bmN0aW9uIChjdXJyZW50LCBwcmV2LCBjYWxsYmFjaykge1xuICAgICAgcHJldi5jc3MoeydtYXJnaW4nIDogJzAlJywgJ29wYWNpdHknIDogJzAuMDEnfSk7XG4gICAgICBwcmV2LmFuaW1hdGUoeydvcGFjaXR5JyA6ICcxJ30sIGR1cmF0aW9uLCAnbGluZWFyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBjdXJyZW50LmNzcygnbWFyZ2luJywgJzEwMCUnKTtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH07XG5cbiAgRm91bmRhdGlvbi5saWJzID0gRm91bmRhdGlvbi5saWJzIHx8IHt9O1xuXG4gIEZvdW5kYXRpb24ubGlicy5vcmJpdCA9IHtcbiAgICBuYW1lIDogJ29yYml0JyxcblxuICAgIHZlcnNpb24gOiAnNS41LjEnLFxuXG4gICAgc2V0dGluZ3MgOiB7XG4gICAgICBhbmltYXRpb24gOiAnc2xpZGUnLFxuICAgICAgdGltZXJfc3BlZWQgOiAxMDAwMCxcbiAgICAgIHBhdXNlX29uX2hvdmVyIDogdHJ1ZSxcbiAgICAgIHJlc3VtZV9vbl9tb3VzZW91dCA6IGZhbHNlLFxuICAgICAgbmV4dF9vbl9jbGljayA6IHRydWUsXG4gICAgICBhbmltYXRpb25fc3BlZWQgOiA1MDAsXG4gICAgICBzdGFja19vbl9zbWFsbCA6IGZhbHNlLFxuICAgICAgbmF2aWdhdGlvbl9hcnJvd3MgOiB0cnVlLFxuICAgICAgc2xpZGVfbnVtYmVyIDogdHJ1ZSxcbiAgICAgIHNsaWRlX251bWJlcl90ZXh0IDogJ29mJyxcbiAgICAgIGNvbnRhaW5lcl9jbGFzcyA6ICdvcmJpdC1jb250YWluZXInLFxuICAgICAgc3RhY2tfb25fc21hbGxfY2xhc3MgOiAnb3JiaXQtc3RhY2stb24tc21hbGwnLFxuICAgICAgbmV4dF9jbGFzcyA6ICdvcmJpdC1uZXh0JyxcbiAgICAgIHByZXZfY2xhc3MgOiAnb3JiaXQtcHJldicsXG4gICAgICB0aW1lcl9jb250YWluZXJfY2xhc3MgOiAnb3JiaXQtdGltZXInLFxuICAgICAgdGltZXJfcGF1c2VkX2NsYXNzIDogJ3BhdXNlZCcsXG4gICAgICB0aW1lcl9wcm9ncmVzc19jbGFzcyA6ICdvcmJpdC1wcm9ncmVzcycsXG4gICAgICBzbGlkZXNfY29udGFpbmVyX2NsYXNzIDogJ29yYml0LXNsaWRlcy1jb250YWluZXInLFxuICAgICAgcHJlbG9hZGVyX2NsYXNzIDogJ3ByZWxvYWRlcicsXG4gICAgICBzbGlkZV9zZWxlY3RvciA6ICcqJyxcbiAgICAgIGJ1bGxldHNfY29udGFpbmVyX2NsYXNzIDogJ29yYml0LWJ1bGxldHMnLFxuICAgICAgYnVsbGV0c19hY3RpdmVfY2xhc3MgOiAnYWN0aXZlJyxcbiAgICAgIHNsaWRlX251bWJlcl9jbGFzcyA6ICdvcmJpdC1zbGlkZS1udW1iZXInLFxuICAgICAgY2FwdGlvbl9jbGFzcyA6ICdvcmJpdC1jYXB0aW9uJyxcbiAgICAgIGFjdGl2ZV9zbGlkZV9jbGFzcyA6ICdhY3RpdmUnLFxuICAgICAgb3JiaXRfdHJhbnNpdGlvbl9jbGFzcyA6ICdvcmJpdC10cmFuc2l0aW9uaW5nJyxcbiAgICAgIGJ1bGxldHMgOiB0cnVlLFxuICAgICAgY2lyY3VsYXIgOiB0cnVlLFxuICAgICAgdGltZXIgOiB0cnVlLFxuICAgICAgdmFyaWFibGVfaGVpZ2h0IDogZmFsc2UsXG4gICAgICBzd2lwZSA6IHRydWUsXG4gICAgICBiZWZvcmVfc2xpZGVfY2hhbmdlIDogbm9vcCxcbiAgICAgIGFmdGVyX3NsaWRlX2NoYW5nZSA6IG5vb3BcbiAgICB9LFxuXG4gICAgaW5pdCA6IGZ1bmN0aW9uIChzY29wZSwgbWV0aG9kLCBvcHRpb25zKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB0aGlzLmJpbmRpbmdzKG1ldGhvZCwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIGV2ZW50cyA6IGZ1bmN0aW9uIChpbnN0YW5jZSkge1xuICAgICAgdmFyIG9yYml0X2luc3RhbmNlID0gbmV3IE9yYml0KHRoaXMuUyhpbnN0YW5jZSksIHRoaXMuUyhpbnN0YW5jZSkuZGF0YSgnb3JiaXQtaW5pdCcpKTtcbiAgICAgIHRoaXMuUyhpbnN0YW5jZSkuZGF0YSh0aGlzLm5hbWUgKyAnLWluc3RhbmNlJywgb3JiaXRfaW5zdGFuY2UpO1xuICAgIH0sXG5cbiAgICByZWZsb3cgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIGlmIChzZWxmLlMoc2VsZi5zY29wZSkuaXMoJ1tkYXRhLW9yYml0XScpKSB7XG4gICAgICAgIHZhciAkZWwgPSBzZWxmLlMoc2VsZi5zY29wZSk7XG4gICAgICAgIHZhciBpbnN0YW5jZSA9ICRlbC5kYXRhKHNlbGYubmFtZSArICctaW5zdGFuY2UnKTtcbiAgICAgICAgaW5zdGFuY2UuY29tcHV0ZV9kaW1lbnNpb25zKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLlMoJ1tkYXRhLW9yYml0XScsIHNlbGYuc2NvcGUpLmVhY2goZnVuY3Rpb24gKGlkeCwgZWwpIHtcbiAgICAgICAgICB2YXIgJGVsID0gc2VsZi5TKGVsKTtcbiAgICAgICAgICB2YXIgb3B0cyA9IHNlbGYuZGF0YV9vcHRpb25zKCRlbCk7XG4gICAgICAgICAgdmFyIGluc3RhbmNlID0gJGVsLmRhdGEoc2VsZi5uYW1lICsgJy1pbnN0YW5jZScpO1xuICAgICAgICAgIGluc3RhbmNlLmNvbXB1dGVfZGltZW5zaW9ucygpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbn0oalF1ZXJ5LCB3aW5kb3csIHdpbmRvdy5kb2N1bWVudCkpO1xuXG47KGZ1bmN0aW9uICgkLCB3aW5kb3csIGRvY3VtZW50LCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIEZvdW5kYXRpb24ubGlicy5yZXZlYWwgPSB7XG4gICAgbmFtZSA6ICdyZXZlYWwnLFxuXG4gICAgdmVyc2lvbiA6ICc1LjUuMScsXG5cbiAgICBsb2NrZWQgOiBmYWxzZSxcblxuICAgIHNldHRpbmdzIDoge1xuICAgICAgYW5pbWF0aW9uIDogJ2ZhZGVBbmRQb3AnLFxuICAgICAgYW5pbWF0aW9uX3NwZWVkIDogMjUwLFxuICAgICAgY2xvc2Vfb25fYmFja2dyb3VuZF9jbGljayA6IHRydWUsXG4gICAgICBjbG9zZV9vbl9lc2MgOiB0cnVlLFxuICAgICAgZGlzbWlzc19tb2RhbF9jbGFzcyA6ICdjbG9zZS1yZXZlYWwtbW9kYWwnLFxuICAgICAgbXVsdGlwbGVfb3BlbmVkIDogZmFsc2UsXG4gICAgICBiZ19jbGFzcyA6ICdyZXZlYWwtbW9kYWwtYmcnLFxuICAgICAgcm9vdF9lbGVtZW50IDogJ2JvZHknLFxuICAgICAgb3BlbiA6IGZ1bmN0aW9uKCl7fSxcbiAgICAgIG9wZW5lZCA6IGZ1bmN0aW9uKCl7fSxcbiAgICAgIGNsb3NlIDogZnVuY3Rpb24oKXt9LFxuICAgICAgY2xvc2VkIDogZnVuY3Rpb24oKXt9LFxuICAgICAgYmcgOiAkKCcucmV2ZWFsLW1vZGFsLWJnJyksXG4gICAgICBjc3MgOiB7XG4gICAgICAgIG9wZW4gOiB7XG4gICAgICAgICAgJ29wYWNpdHknIDogMCxcbiAgICAgICAgICAndmlzaWJpbGl0eScgOiAndmlzaWJsZScsXG4gICAgICAgICAgJ2Rpc3BsYXknIDogJ2Jsb2NrJ1xuICAgICAgICB9LFxuICAgICAgICBjbG9zZSA6IHtcbiAgICAgICAgICAnb3BhY2l0eScgOiAxLFxuICAgICAgICAgICd2aXNpYmlsaXR5JyA6ICdoaWRkZW4nLFxuICAgICAgICAgICdkaXNwbGF5JyA6ICdub25lJ1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIGluaXQgOiBmdW5jdGlvbiAoc2NvcGUsIG1ldGhvZCwgb3B0aW9ucykge1xuICAgICAgJC5leHRlbmQodHJ1ZSwgdGhpcy5zZXR0aW5ncywgbWV0aG9kLCBvcHRpb25zKTtcbiAgICAgIHRoaXMuYmluZGluZ3MobWV0aG9kLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgZXZlbnRzIDogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgUyA9IHNlbGYuUztcblxuICAgICAgUyh0aGlzLnNjb3BlKVxuICAgICAgICAub2ZmKCcucmV2ZWFsJylcbiAgICAgICAgLm9uKCdjbGljay5mbmR0bi5yZXZlYWwnLCAnWycgKyB0aGlzLmFkZF9uYW1lc3BhY2UoJ2RhdGEtcmV2ZWFsLWlkJykgKyAnXTpub3QoW2Rpc2FibGVkXSknLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgIGlmICghc2VsZi5sb2NrZWQpIHtcbiAgICAgICAgICAgIHZhciBlbGVtZW50ID0gUyh0aGlzKSxcbiAgICAgICAgICAgICAgICBhamF4ID0gZWxlbWVudC5kYXRhKHNlbGYuZGF0YV9hdHRyKCdyZXZlYWwtYWpheCcpKTtcblxuICAgICAgICAgICAgc2VsZi5sb2NrZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGFqYXggPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIHNlbGYub3Blbi5jYWxsKHNlbGYsIGVsZW1lbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdmFyIHVybCA9IGFqYXggPT09IHRydWUgPyBlbGVtZW50LmF0dHIoJ2hyZWYnKSA6IGFqYXg7XG5cbiAgICAgICAgICAgICAgc2VsZi5vcGVuLmNhbGwoc2VsZiwgZWxlbWVudCwge3VybCA6IHVybH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgIFMoZG9jdW1lbnQpXG4gICAgICAgIC5vbignY2xpY2suZm5kdG4ucmV2ZWFsJywgdGhpcy5jbG9zZV90YXJnZXRzKCksIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGlmICghc2VsZi5sb2NrZWQpIHtcbiAgICAgICAgICAgIHZhciBzZXR0aW5ncyA9IFMoJ1snICsgc2VsZi5hdHRyX25hbWUoKSArICddLm9wZW4nKS5kYXRhKHNlbGYuYXR0cl9uYW1lKHRydWUpICsgJy1pbml0JykgfHwgc2VsZi5zZXR0aW5ncyxcbiAgICAgICAgICAgICAgICBiZ19jbGlja2VkID0gUyhlLnRhcmdldClbMF0gPT09IFMoJy4nICsgc2V0dGluZ3MuYmdfY2xhc3MpWzBdO1xuXG4gICAgICAgICAgICBpZiAoYmdfY2xpY2tlZCkge1xuICAgICAgICAgICAgICBpZiAoc2V0dGluZ3MuY2xvc2Vfb25fYmFja2dyb3VuZF9jbGljaykge1xuICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGYubG9ja2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIHNlbGYuY2xvc2UuY2FsbChzZWxmLCBiZ19jbGlja2VkID8gUygnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJ10ub3BlbicpIDogUyh0aGlzKS5jbG9zZXN0KCdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnXScpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICBpZiAoUygnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJ10nLCB0aGlzLnNjb3BlKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIFModGhpcy5zY29wZSlcbiAgICAgICAgICAvLyAub2ZmKCcucmV2ZWFsJylcbiAgICAgICAgICAub24oJ29wZW4uZm5kdG4ucmV2ZWFsJywgdGhpcy5zZXR0aW5ncy5vcGVuKVxuICAgICAgICAgIC5vbignb3BlbmVkLmZuZHRuLnJldmVhbCcsIHRoaXMuc2V0dGluZ3Mub3BlbmVkKVxuICAgICAgICAgIC5vbignb3BlbmVkLmZuZHRuLnJldmVhbCcsIHRoaXMub3Blbl92aWRlbylcbiAgICAgICAgICAub24oJ2Nsb3NlLmZuZHRuLnJldmVhbCcsIHRoaXMuc2V0dGluZ3MuY2xvc2UpXG4gICAgICAgICAgLm9uKCdjbG9zZWQuZm5kdG4ucmV2ZWFsJywgdGhpcy5zZXR0aW5ncy5jbG9zZWQpXG4gICAgICAgICAgLm9uKCdjbG9zZWQuZm5kdG4ucmV2ZWFsJywgdGhpcy5jbG9zZV92aWRlbyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBTKHRoaXMuc2NvcGUpXG4gICAgICAgICAgLy8gLm9mZignLnJldmVhbCcpXG4gICAgICAgICAgLm9uKCdvcGVuLmZuZHRuLnJldmVhbCcsICdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnXScsIHRoaXMuc2V0dGluZ3Mub3BlbilcbiAgICAgICAgICAub24oJ29wZW5lZC5mbmR0bi5yZXZlYWwnLCAnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJ10nLCB0aGlzLnNldHRpbmdzLm9wZW5lZClcbiAgICAgICAgICAub24oJ29wZW5lZC5mbmR0bi5yZXZlYWwnLCAnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJ10nLCB0aGlzLm9wZW5fdmlkZW8pXG4gICAgICAgICAgLm9uKCdjbG9zZS5mbmR0bi5yZXZlYWwnLCAnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJ10nLCB0aGlzLnNldHRpbmdzLmNsb3NlKVxuICAgICAgICAgIC5vbignY2xvc2VkLmZuZHRuLnJldmVhbCcsICdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnXScsIHRoaXMuc2V0dGluZ3MuY2xvc2VkKVxuICAgICAgICAgIC5vbignY2xvc2VkLmZuZHRuLnJldmVhbCcsICdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnXScsIHRoaXMuY2xvc2VfdmlkZW8pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuXG4gICAgLy8gUEFUQ0ggIzM6IHR1cm5pbmcgb24ga2V5IHVwIGNhcHR1cmUgb25seSB3aGVuIGEgcmV2ZWFsIHdpbmRvdyBpcyBvcGVuXG4gICAga2V5X3VwX29uIDogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIC8vIFBBVENIICMxOiBmaXhpbmcgbXVsdGlwbGUga2V5dXAgZXZlbnQgdHJpZ2dlciBmcm9tIHNpbmdsZSBrZXkgcHJlc3NcbiAgICAgIHNlbGYuUygnYm9keScpLm9mZigna2V5dXAuZm5kdG4ucmV2ZWFsJykub24oJ2tleXVwLmZuZHRuLnJldmVhbCcsIGZ1bmN0aW9uICggZXZlbnQgKSB7XG4gICAgICAgIHZhciBvcGVuX21vZGFsID0gc2VsZi5TKCdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnXS5vcGVuJyksXG4gICAgICAgICAgICBzZXR0aW5ncyA9IG9wZW5fbW9kYWwuZGF0YShzZWxmLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpIHx8IHNlbGYuc2V0dGluZ3MgO1xuICAgICAgICAvLyBQQVRDSCAjMjogbWFraW5nIHN1cmUgdGhhdCB0aGUgY2xvc2UgZXZlbnQgY2FuIGJlIGNhbGxlZCBvbmx5IHdoaWxlIHVubG9ja2VkLFxuICAgICAgICAvLyAgICAgICAgICAgc28gdGhhdCBtdWx0aXBsZSBrZXl1cC5mbmR0bi5yZXZlYWwgZXZlbnRzIGRvbid0IHByZXZlbnQgY2xlYW4gY2xvc2luZyBvZiB0aGUgcmV2ZWFsIHdpbmRvdy5cbiAgICAgICAgaWYgKCBzZXR0aW5ncyAmJiBldmVudC53aGljaCA9PT0gMjcgICYmIHNldHRpbmdzLmNsb3NlX29uX2VzYyAmJiAhc2VsZi5sb2NrZWQpIHsgLy8gMjcgaXMgdGhlIGtleWNvZGUgZm9yIHRoZSBFc2NhcGUga2V5XG4gICAgICAgICAgc2VsZi5jbG9zZS5jYWxsKHNlbGYsIG9wZW5fbW9kYWwpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIC8vIFBBVENIICMzOiB0dXJuaW5nIG9uIGtleSB1cCBjYXB0dXJlIG9ubHkgd2hlbiBhIHJldmVhbCB3aW5kb3cgaXMgb3BlblxuICAgIGtleV91cF9vZmYgOiBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgIHRoaXMuUygnYm9keScpLm9mZigna2V5dXAuZm5kdG4ucmV2ZWFsJyk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuXG4gICAgb3BlbiA6IGZ1bmN0aW9uICh0YXJnZXQsIGFqYXhfc2V0dGluZ3MpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICBtb2RhbDtcblxuICAgICAgaWYgKHRhcmdldCkge1xuICAgICAgICBpZiAodHlwZW9mIHRhcmdldC5zZWxlY3RvciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAvLyBGaW5kIHRoZSBuYW1lZCBub2RlOyBvbmx5IHVzZSB0aGUgZmlyc3Qgb25lIGZvdW5kLCBzaW5jZSB0aGUgcmVzdCBvZiB0aGUgY29kZSBhc3N1bWVzIHRoZXJlJ3Mgb25seSBvbmUgbm9kZVxuICAgICAgICAgIG1vZGFsID0gc2VsZi5TKCcjJyArIHRhcmdldC5kYXRhKHNlbGYuZGF0YV9hdHRyKCdyZXZlYWwtaWQnKSkpLmZpcnN0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbW9kYWwgPSBzZWxmLlModGhpcy5zY29wZSk7XG5cbiAgICAgICAgICBhamF4X3NldHRpbmdzID0gdGFyZ2V0O1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtb2RhbCA9IHNlbGYuUyh0aGlzLnNjb3BlKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHNldHRpbmdzID0gbW9kYWwuZGF0YShzZWxmLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpO1xuICAgICAgc2V0dGluZ3MgPSBzZXR0aW5ncyB8fCB0aGlzLnNldHRpbmdzO1xuXG4gICAgICBpZiAobW9kYWwuaGFzQ2xhc3MoJ29wZW4nKSAmJiB0YXJnZXQuYXR0cignZGF0YS1yZXZlYWwtaWQnKSA9PSBtb2RhbC5hdHRyKCdpZCcpKSB7XG4gICAgICAgIHJldHVybiBzZWxmLmNsb3NlKG1vZGFsKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFtb2RhbC5oYXNDbGFzcygnb3BlbicpKSB7XG4gICAgICAgIHZhciBvcGVuX21vZGFsID0gc2VsZi5TKCdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnXS5vcGVuJyk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBtb2RhbC5kYXRhKCdjc3MtdG9wJykgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgbW9kYWwuZGF0YSgnY3NzLXRvcCcsIHBhcnNlSW50KG1vZGFsLmNzcygndG9wJyksIDEwKSlcbiAgICAgICAgICAgIC5kYXRhKCdvZmZzZXQnLCB0aGlzLmNhY2hlX29mZnNldChtb2RhbCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5rZXlfdXBfb24obW9kYWwpOyAgICAvLyBQQVRDSCAjMzogdHVybmluZyBvbiBrZXkgdXAgY2FwdHVyZSBvbmx5IHdoZW4gYSByZXZlYWwgd2luZG93IGlzIG9wZW5cblxuICAgICAgICBtb2RhbC5vbignb3Blbi5mbmR0bi5yZXZlYWwnKS50cmlnZ2VyKCdvcGVuLmZuZHRuLnJldmVhbCcpO1xuXG4gICAgICAgIGlmIChvcGVuX21vZGFsLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICB0aGlzLnRvZ2dsZV9iZyhtb2RhbCwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGFqYXhfc2V0dGluZ3MgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgYWpheF9zZXR0aW5ncyA9IHtcbiAgICAgICAgICAgIHVybCA6IGFqYXhfc2V0dGluZ3NcbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBhamF4X3NldHRpbmdzID09PSAndW5kZWZpbmVkJyB8fCAhYWpheF9zZXR0aW5ncy51cmwpIHtcbiAgICAgICAgICBpZiAob3Blbl9tb2RhbC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBpZiAoc2V0dGluZ3MubXVsdGlwbGVfb3BlbmVkKSB7XG4gICAgICAgICAgICAgIHRoaXMudG9fYmFjayhvcGVuX21vZGFsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuaGlkZShvcGVuX21vZGFsLCBzZXR0aW5ncy5jc3MuY2xvc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuc2hvdyhtb2RhbCwgc2V0dGluZ3MuY3NzLm9wZW4pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBvbGRfc3VjY2VzcyA9IHR5cGVvZiBhamF4X3NldHRpbmdzLnN1Y2Nlc3MgIT09ICd1bmRlZmluZWQnID8gYWpheF9zZXR0aW5ncy5zdWNjZXNzIDogbnVsbDtcblxuICAgICAgICAgICQuZXh0ZW5kKGFqYXhfc2V0dGluZ3MsIHtcbiAgICAgICAgICAgIHN1Y2Nlc3MgOiBmdW5jdGlvbiAoZGF0YSwgdGV4dFN0YXR1cywganFYSFIpIHtcbiAgICAgICAgICAgICAgaWYgKCAkLmlzRnVuY3Rpb24ob2xkX3N1Y2Nlc3MpICkge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBvbGRfc3VjY2VzcyhkYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUik7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgIGRhdGEgPSByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgbW9kYWwuaHRtbChkYXRhKTtcbiAgICAgICAgICAgICAgc2VsZi5TKG1vZGFsKS5mb3VuZGF0aW9uKCdzZWN0aW9uJywgJ3JlZmxvdycpO1xuICAgICAgICAgICAgICBzZWxmLlMobW9kYWwpLmNoaWxkcmVuKCkuZm91bmRhdGlvbigpO1xuXG4gICAgICAgICAgICAgIGlmIChvcGVuX21vZGFsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3MubXVsdGlwbGVfb3BlbmVkKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnRvX2JhY2sob3Blbl9tb2RhbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuaGlkZShvcGVuX21vZGFsLCBzZXR0aW5ncy5jc3MuY2xvc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzZWxmLnNob3cobW9kYWwsIHNldHRpbmdzLmNzcy5vcGVuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgICQuYWpheChhamF4X3NldHRpbmdzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc2VsZi5TKHdpbmRvdykudHJpZ2dlcigncmVzaXplJyk7XG4gICAgfSxcblxuICAgIGNsb3NlIDogZnVuY3Rpb24gKG1vZGFsKSB7XG4gICAgICB2YXIgbW9kYWwgPSBtb2RhbCAmJiBtb2RhbC5sZW5ndGggPyBtb2RhbCA6IHRoaXMuUyh0aGlzLnNjb3BlKSxcbiAgICAgICAgICBvcGVuX21vZGFscyA9IHRoaXMuUygnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10ub3BlbicpLFxuICAgICAgICAgIHNldHRpbmdzID0gbW9kYWwuZGF0YSh0aGlzLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpIHx8IHRoaXMuc2V0dGluZ3M7XG5cbiAgICAgIGlmIChvcGVuX21vZGFscy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRoaXMubG9ja2VkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5rZXlfdXBfb2ZmKG1vZGFsKTsgICAvLyBQQVRDSCAjMzogdHVybmluZyBvbiBrZXkgdXAgY2FwdHVyZSBvbmx5IHdoZW4gYSByZXZlYWwgd2luZG93IGlzIG9wZW5cbiAgICAgICAgbW9kYWwudHJpZ2dlcignY2xvc2UnKS50cmlnZ2VyKCdjbG9zZS5mbmR0bi5yZXZlYWwnKTtcbiAgICAgICAgXG4gICAgICAgIGlmICgoc2V0dGluZ3MubXVsdGlwbGVfb3BlbmVkICYmIG9wZW5fbW9kYWxzLmxlbmd0aCA9PT0gMSkgfHwgIXNldHRpbmdzLm11bHRpcGxlX29wZW5lZCB8fCBtb2RhbC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgdGhpcy50b2dnbGVfYmcobW9kYWwsIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLnRvX2Zyb250KG1vZGFsKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHNldHRpbmdzLm11bHRpcGxlX29wZW5lZCkge1xuICAgICAgICAgIHRoaXMuaGlkZShtb2RhbCwgc2V0dGluZ3MuY3NzLmNsb3NlLCBzZXR0aW5ncyk7XG4gICAgICAgICAgdGhpcy50b19mcm9udCgkKCQubWFrZUFycmF5KG9wZW5fbW9kYWxzKS5yZXZlcnNlKClbMV0pKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmhpZGUob3Blbl9tb2RhbHMsIHNldHRpbmdzLmNzcy5jbG9zZSwgc2V0dGluZ3MpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIGNsb3NlX3RhcmdldHMgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgYmFzZSA9ICcuJyArIHRoaXMuc2V0dGluZ3MuZGlzbWlzc19tb2RhbF9jbGFzcztcblxuICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuY2xvc2Vfb25fYmFja2dyb3VuZF9jbGljaykge1xuICAgICAgICByZXR1cm4gYmFzZSArICcsIC4nICsgdGhpcy5zZXR0aW5ncy5iZ19jbGFzcztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGJhc2U7XG4gICAgfSxcblxuICAgIHRvZ2dsZV9iZyA6IGZ1bmN0aW9uIChtb2RhbCwgc3RhdGUpIHtcbiAgICAgIGlmICh0aGlzLlMoJy4nICsgdGhpcy5zZXR0aW5ncy5iZ19jbGFzcykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MuYmcgPSAkKCc8ZGl2IC8+JywgeydjbGFzcyc6IHRoaXMuc2V0dGluZ3MuYmdfY2xhc3N9KVxuICAgICAgICAgIC5hcHBlbmRUbygnYm9keScpLmhpZGUoKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHZpc2libGUgPSB0aGlzLnNldHRpbmdzLmJnLmZpbHRlcignOnZpc2libGUnKS5sZW5ndGggPiAwO1xuICAgICAgaWYgKCBzdGF0ZSAhPSB2aXNpYmxlICkge1xuICAgICAgICBpZiAoIHN0YXRlID09IHVuZGVmaW5lZCA/IHZpc2libGUgOiAhc3RhdGUgKSB7XG4gICAgICAgICAgdGhpcy5oaWRlKHRoaXMuc2V0dGluZ3MuYmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuc2hvdyh0aGlzLnNldHRpbmdzLmJnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBzaG93IDogZnVuY3Rpb24gKGVsLCBjc3MpIHtcbiAgICAgIC8vIGlzIG1vZGFsXG4gICAgICBpZiAoY3NzKSB7XG4gICAgICAgIHZhciBzZXR0aW5ncyA9IGVsLmRhdGEodGhpcy5hdHRyX25hbWUodHJ1ZSkgKyAnLWluaXQnKSB8fCB0aGlzLnNldHRpbmdzLFxuICAgICAgICAgICAgcm9vdF9lbGVtZW50ID0gc2V0dGluZ3Mucm9vdF9lbGVtZW50O1xuXG4gICAgICAgIGlmIChlbC5wYXJlbnQocm9vdF9lbGVtZW50KS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICB2YXIgcGxhY2Vob2xkZXIgPSBlbC53cmFwKCc8ZGl2IHN0eWxlPVwiZGlzcGxheTogbm9uZTtcIiAvPicpLnBhcmVudCgpO1xuXG4gICAgICAgICAgZWwub24oJ2Nsb3NlZC5mbmR0bi5yZXZlYWwud3JhcHBlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGVsLmRldGFjaCgpLmFwcGVuZFRvKHBsYWNlaG9sZGVyKTtcbiAgICAgICAgICAgIGVsLnVud3JhcCgpLnVuYmluZCgnY2xvc2VkLmZuZHRuLnJldmVhbC53cmFwcGVkJyk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBlbC5kZXRhY2goKS5hcHBlbmRUbyhyb290X2VsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFuaW1EYXRhID0gZ2V0QW5pbWF0aW9uRGF0YShzZXR0aW5ncy5hbmltYXRpb24pO1xuICAgICAgICBpZiAoIWFuaW1EYXRhLmFuaW1hdGUpIHtcbiAgICAgICAgICB0aGlzLmxvY2tlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhbmltRGF0YS5wb3ApIHtcbiAgICAgICAgICBjc3MudG9wID0gJCh3aW5kb3cpLnNjcm9sbFRvcCgpIC0gZWwuZGF0YSgnb2Zmc2V0JykgKyAncHgnO1xuICAgICAgICAgIHZhciBlbmRfY3NzID0ge1xuICAgICAgICAgICAgdG9wOiAkKHdpbmRvdykuc2Nyb2xsVG9wKCkgKyBlbC5kYXRhKCdjc3MtdG9wJykgKyAncHgnLFxuICAgICAgICAgICAgb3BhY2l0eTogMVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZWxcbiAgICAgICAgICAgICAgLmNzcyhjc3MpXG4gICAgICAgICAgICAgIC5hbmltYXRlKGVuZF9jc3MsIHNldHRpbmdzLmFuaW1hdGlvbl9zcGVlZCwgJ2xpbmVhcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGVsLnRyaWdnZXIoJ29wZW5lZCcpLnRyaWdnZXIoJ29wZW5lZC5mbmR0bi5yZXZlYWwnKTtcbiAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ29wZW4nKTtcbiAgICAgICAgICB9LmJpbmQodGhpcyksIHNldHRpbmdzLmFuaW1hdGlvbl9zcGVlZCAvIDIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFuaW1EYXRhLmZhZGUpIHtcbiAgICAgICAgICBjc3MudG9wID0gJCh3aW5kb3cpLnNjcm9sbFRvcCgpICsgZWwuZGF0YSgnY3NzLXRvcCcpICsgJ3B4JztcbiAgICAgICAgICB2YXIgZW5kX2NzcyA9IHtvcGFjaXR5OiAxfTtcblxuICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBlbFxuICAgICAgICAgICAgICAuY3NzKGNzcylcbiAgICAgICAgICAgICAgLmFuaW1hdGUoZW5kX2Nzcywgc2V0dGluZ3MuYW5pbWF0aW9uX3NwZWVkLCAnbGluZWFyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMubG9ja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZWwudHJpZ2dlcignb3BlbmVkJykudHJpZ2dlcignb3BlbmVkLmZuZHRuLnJldmVhbCcpO1xuICAgICAgICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgICAgICAgIC5hZGRDbGFzcygnb3BlbicpO1xuICAgICAgICAgIH0uYmluZCh0aGlzKSwgc2V0dGluZ3MuYW5pbWF0aW9uX3NwZWVkIC8gMik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWwuY3NzKGNzcykuc2hvdygpLmNzcyh7b3BhY2l0eSA6IDF9KS5hZGRDbGFzcygnb3BlbicpLnRyaWdnZXIoJ29wZW5lZCcpLnRyaWdnZXIoJ29wZW5lZC5mbmR0bi5yZXZlYWwnKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncztcblxuICAgICAgLy8gc2hvdWxkIHdlIGFuaW1hdGUgdGhlIGJhY2tncm91bmQ/XG4gICAgICBpZiAoZ2V0QW5pbWF0aW9uRGF0YShzZXR0aW5ncy5hbmltYXRpb24pLmZhZGUpIHtcbiAgICAgICAgcmV0dXJuIGVsLmZhZGVJbihzZXR0aW5ncy5hbmltYXRpb25fc3BlZWQgLyAyKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5sb2NrZWQgPSBmYWxzZTtcblxuICAgICAgcmV0dXJuIGVsLnNob3coKTtcbiAgICB9LFxuICAgIFxuICAgIHRvX2JhY2sgOiBmdW5jdGlvbihlbCkge1xuICAgICAgZWwuYWRkQ2xhc3MoJ3RvYmFjaycpO1xuICAgIH0sXG4gICAgXG4gICAgdG9fZnJvbnQgOiBmdW5jdGlvbihlbCkge1xuICAgICAgZWwucmVtb3ZlQ2xhc3MoJ3RvYmFjaycpO1xuICAgIH0sXG5cbiAgICBoaWRlIDogZnVuY3Rpb24gKGVsLCBjc3MpIHtcbiAgICAgIC8vIGlzIG1vZGFsXG4gICAgICBpZiAoY3NzKSB7XG4gICAgICAgIHZhciBzZXR0aW5ncyA9IGVsLmRhdGEodGhpcy5hdHRyX25hbWUodHJ1ZSkgKyAnLWluaXQnKTtcbiAgICAgICAgc2V0dGluZ3MgPSBzZXR0aW5ncyB8fCB0aGlzLnNldHRpbmdzO1xuXG4gICAgICAgIHZhciBhbmltRGF0YSA9IGdldEFuaW1hdGlvbkRhdGEoc2V0dGluZ3MuYW5pbWF0aW9uKTtcbiAgICAgICAgaWYgKCFhbmltRGF0YS5hbmltYXRlKSB7XG4gICAgICAgICAgdGhpcy5sb2NrZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYW5pbURhdGEucG9wKSB7XG4gICAgICAgICAgdmFyIGVuZF9jc3MgPSB7XG4gICAgICAgICAgICB0b3A6IC0gJCh3aW5kb3cpLnNjcm9sbFRvcCgpIC0gZWwuZGF0YSgnb2Zmc2V0JykgKyAncHgnLFxuICAgICAgICAgICAgb3BhY2l0eTogMFxuICAgICAgICAgIH07XG5cbiAgICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZWxcbiAgICAgICAgICAgICAgLmFuaW1hdGUoZW5kX2Nzcywgc2V0dGluZ3MuYW5pbWF0aW9uX3NwZWVkLCAnbGluZWFyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMubG9ja2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZWwuY3NzKGNzcykudHJpZ2dlcignY2xvc2VkJykudHJpZ2dlcignY2xvc2VkLmZuZHRuLnJldmVhbCcpO1xuICAgICAgICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnb3BlbicpO1xuICAgICAgICAgIH0uYmluZCh0aGlzKSwgc2V0dGluZ3MuYW5pbWF0aW9uX3NwZWVkIC8gMik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYW5pbURhdGEuZmFkZSkge1xuICAgICAgICAgIHZhciBlbmRfY3NzID0ge29wYWNpdHkgOiAwfTtcblxuICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBlbFxuICAgICAgICAgICAgICAuYW5pbWF0ZShlbmRfY3NzLCBzZXR0aW5ncy5hbmltYXRpb25fc3BlZWQsICdsaW5lYXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2NrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBlbC5jc3MoY3NzKS50cmlnZ2VyKCdjbG9zZWQnKS50cmlnZ2VyKCdjbG9zZWQuZm5kdG4ucmV2ZWFsJyk7XG4gICAgICAgICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdvcGVuJyk7XG4gICAgICAgICAgfS5iaW5kKHRoaXMpLCBzZXR0aW5ncy5hbmltYXRpb25fc3BlZWQgLyAyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbC5oaWRlKCkuY3NzKGNzcykucmVtb3ZlQ2xhc3MoJ29wZW4nKS50cmlnZ2VyKCdjbG9zZWQnKS50cmlnZ2VyKCdjbG9zZWQuZm5kdG4ucmV2ZWFsJyk7XG4gICAgICB9XG5cbiAgICAgIHZhciBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3M7XG5cbiAgICAgIC8vIHNob3VsZCB3ZSBhbmltYXRlIHRoZSBiYWNrZ3JvdW5kP1xuICAgICAgaWYgKGdldEFuaW1hdGlvbkRhdGEoc2V0dGluZ3MuYW5pbWF0aW9uKS5mYWRlKSB7XG4gICAgICAgIHJldHVybiBlbC5mYWRlT3V0KHNldHRpbmdzLmFuaW1hdGlvbl9zcGVlZCAvIDIpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZWwuaGlkZSgpO1xuICAgIH0sXG5cbiAgICBjbG9zZV92aWRlbyA6IGZ1bmN0aW9uIChlKSB7XG4gICAgICB2YXIgdmlkZW8gPSAkKCcuZmxleC12aWRlbycsIGUudGFyZ2V0KSxcbiAgICAgICAgICBpZnJhbWUgPSAkKCdpZnJhbWUnLCB2aWRlbyk7XG5cbiAgICAgIGlmIChpZnJhbWUubGVuZ3RoID4gMCkge1xuICAgICAgICBpZnJhbWUuYXR0cignZGF0YS1zcmMnLCBpZnJhbWVbMF0uc3JjKTtcbiAgICAgICAgaWZyYW1lLmF0dHIoJ3NyYycsIGlmcmFtZS5hdHRyKCdzcmMnKSk7XG4gICAgICAgIHZpZGVvLmhpZGUoKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgb3Blbl92aWRlbyA6IGZ1bmN0aW9uIChlKSB7XG4gICAgICB2YXIgdmlkZW8gPSAkKCcuZmxleC12aWRlbycsIGUudGFyZ2V0KSxcbiAgICAgICAgICBpZnJhbWUgPSB2aWRlby5maW5kKCdpZnJhbWUnKTtcblxuICAgICAgaWYgKGlmcmFtZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBkYXRhX3NyYyA9IGlmcmFtZS5hdHRyKCdkYXRhLXNyYycpO1xuICAgICAgICBpZiAodHlwZW9mIGRhdGFfc3JjID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGlmcmFtZVswXS5zcmMgPSBpZnJhbWUuYXR0cignZGF0YS1zcmMnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgc3JjID0gaWZyYW1lWzBdLnNyYztcbiAgICAgICAgICBpZnJhbWVbMF0uc3JjID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmcmFtZVswXS5zcmMgPSBzcmM7XG4gICAgICAgIH1cbiAgICAgICAgdmlkZW8uc2hvdygpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBkYXRhX2F0dHIgOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICBpZiAodGhpcy5uYW1lc3BhY2UubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5uYW1lc3BhY2UgKyAnLScgKyBzdHI7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzdHI7XG4gICAgfSxcblxuICAgIGNhY2hlX29mZnNldCA6IGZ1bmN0aW9uIChtb2RhbCkge1xuICAgICAgdmFyIG9mZnNldCA9IG1vZGFsLnNob3coKS5oZWlnaHQoKSArIHBhcnNlSW50KG1vZGFsLmNzcygndG9wJyksIDEwKTtcblxuICAgICAgbW9kYWwuaGlkZSgpO1xuXG4gICAgICByZXR1cm4gb2Zmc2V0O1xuICAgIH0sXG5cbiAgICBvZmYgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAkKHRoaXMuc2NvcGUpLm9mZignLmZuZHRuLnJldmVhbCcpO1xuICAgIH0sXG5cbiAgICByZWZsb3cgOiBmdW5jdGlvbiAoKSB7fVxuICB9O1xuXG4gIC8qXG4gICAqIGdldEFuaW1hdGlvbkRhdGEoJ3BvcEFuZEZhZGUnKSAvLyB7YW5pbWF0ZTogdHJ1ZSwgIHBvcDogdHJ1ZSwgIGZhZGU6IHRydWV9XG4gICAqIGdldEFuaW1hdGlvbkRhdGEoJ2ZhZGUnKSAgICAgICAvLyB7YW5pbWF0ZTogdHJ1ZSwgIHBvcDogZmFsc2UsIGZhZGU6IHRydWV9XG4gICAqIGdldEFuaW1hdGlvbkRhdGEoJ3BvcCcpICAgICAgICAvLyB7YW5pbWF0ZTogdHJ1ZSwgIHBvcDogdHJ1ZSwgIGZhZGU6IGZhbHNlfVxuICAgKiBnZXRBbmltYXRpb25EYXRhKCdmb28nKSAgICAgICAgLy8ge2FuaW1hdGU6IGZhbHNlLCBwb3A6IGZhbHNlLCBmYWRlOiBmYWxzZX1cbiAgICogZ2V0QW5pbWF0aW9uRGF0YShudWxsKSAgICAgICAgIC8vIHthbmltYXRlOiBmYWxzZSwgcG9wOiBmYWxzZSwgZmFkZTogZmFsc2V9XG4gICAqL1xuICBmdW5jdGlvbiBnZXRBbmltYXRpb25EYXRhKHN0cikge1xuICAgIHZhciBmYWRlID0gL2ZhZGUvaS50ZXN0KHN0cik7XG4gICAgdmFyIHBvcCA9IC9wb3AvaS50ZXN0KHN0cik7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFuaW1hdGUgOiBmYWRlIHx8IHBvcCxcbiAgICAgIHBvcCA6IHBvcCxcbiAgICAgIGZhZGUgOiBmYWRlXG4gICAgfTtcbiAgfVxufShqUXVlcnksIHdpbmRvdywgd2luZG93LmRvY3VtZW50KSk7XG5cbjsoZnVuY3Rpb24gKCQsIHdpbmRvdywgZG9jdW1lbnQsIHVuZGVmaW5lZCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgRm91bmRhdGlvbi5saWJzLnNsaWRlciA9IHtcbiAgICBuYW1lIDogJ3NsaWRlcicsXG5cbiAgICB2ZXJzaW9uIDogJzUuNS4xJyxcblxuICAgIHNldHRpbmdzIDoge1xuICAgICAgc3RhcnQgOiAwLFxuICAgICAgZW5kIDogMTAwLFxuICAgICAgc3RlcCA6IDEsXG4gICAgICBwcmVjaXNpb24gOiBudWxsLFxuICAgICAgaW5pdGlhbCA6IG51bGwsXG4gICAgICBkaXNwbGF5X3NlbGVjdG9yIDogJycsXG4gICAgICB2ZXJ0aWNhbCA6IGZhbHNlLFxuICAgICAgdHJpZ2dlcl9pbnB1dF9jaGFuZ2UgOiBmYWxzZSxcbiAgICAgIG9uX2NoYW5nZSA6IGZ1bmN0aW9uICgpIHt9XG4gICAgfSxcblxuICAgIGNhY2hlIDoge30sXG5cbiAgICBpbml0IDogZnVuY3Rpb24gKHNjb3BlLCBtZXRob2QsIG9wdGlvbnMpIHtcbiAgICAgIEZvdW5kYXRpb24uaW5oZXJpdCh0aGlzLCAndGhyb3R0bGUnKTtcbiAgICAgIHRoaXMuYmluZGluZ3MobWV0aG9kLCBvcHRpb25zKTtcbiAgICAgIHRoaXMucmVmbG93KCk7XG4gICAgfSxcblxuICAgIGV2ZW50cyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgJCh0aGlzLnNjb3BlKVxuICAgICAgICAub2ZmKCcuc2xpZGVyJylcbiAgICAgICAgLm9uKCdtb3VzZWRvd24uZm5kdG4uc2xpZGVyIHRvdWNoc3RhcnQuZm5kdG4uc2xpZGVyIHBvaW50ZXJkb3duLmZuZHRuLnNsaWRlcicsXG4gICAgICAgICdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnXTpub3QoLmRpc2FibGVkLCBbZGlzYWJsZWRdKSAucmFuZ2Utc2xpZGVyLWhhbmRsZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgaWYgKCFzZWxmLmNhY2hlLmFjdGl2ZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgc2VsZi5zZXRfYWN0aXZlX3NsaWRlcigkKGUudGFyZ2V0KSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ21vdXNlbW92ZS5mbmR0bi5zbGlkZXIgdG91Y2htb3ZlLmZuZHRuLnNsaWRlciBwb2ludGVybW92ZS5mbmR0bi5zbGlkZXInLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIGlmICghIXNlbGYuY2FjaGUuYWN0aXZlKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBpZiAoJC5kYXRhKHNlbGYuY2FjaGUuYWN0aXZlWzBdLCAnc2V0dGluZ3MnKS52ZXJ0aWNhbCkge1xuICAgICAgICAgICAgICB2YXIgc2Nyb2xsX29mZnNldCA9IDA7XG4gICAgICAgICAgICAgIGlmICghZS5wYWdlWSkge1xuICAgICAgICAgICAgICAgIHNjcm9sbF9vZmZzZXQgPSB3aW5kb3cuc2Nyb2xsWTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzZWxmLmNhbGN1bGF0ZV9wb3NpdGlvbihzZWxmLmNhY2hlLmFjdGl2ZSwgc2VsZi5nZXRfY3Vyc29yX3Bvc2l0aW9uKGUsICd5JykgKyBzY3JvbGxfb2Zmc2V0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNlbGYuY2FsY3VsYXRlX3Bvc2l0aW9uKHNlbGYuY2FjaGUuYWN0aXZlLCBzZWxmLmdldF9jdXJzb3JfcG9zaXRpb24oZSwgJ3gnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ21vdXNldXAuZm5kdG4uc2xpZGVyIHRvdWNoZW5kLmZuZHRuLnNsaWRlciBwb2ludGVydXAuZm5kdG4uc2xpZGVyJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICBzZWxmLnJlbW92ZV9hY3RpdmVfc2xpZGVyKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignY2hhbmdlLmZuZHRuLnNsaWRlcicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgc2VsZi5zZXR0aW5ncy5vbl9jaGFuZ2UoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIHNlbGYuUyh3aW5kb3cpXG4gICAgICAgIC5vbigncmVzaXplLmZuZHRuLnNsaWRlcicsIHNlbGYudGhyb3R0bGUoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICBzZWxmLnJlZmxvdygpO1xuICAgICAgICB9LCAzMDApKTtcbiAgICB9LFxuXG4gICAgZ2V0X2N1cnNvcl9wb3NpdGlvbiA6IGZ1bmN0aW9uIChlLCB4eSkge1xuICAgICAgdmFyIHBhZ2VYWSA9ICdwYWdlJyArIHh5LnRvVXBwZXJDYXNlKCksXG4gICAgICAgICAgY2xpZW50WFkgPSAnY2xpZW50JyArIHh5LnRvVXBwZXJDYXNlKCksXG4gICAgICAgICAgcG9zaXRpb247XG5cbiAgICAgIGlmICh0eXBlb2YgZVtwYWdlWFldICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBwb3NpdGlvbiA9IGVbcGFnZVhZXTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGUub3JpZ2luYWxFdmVudFtjbGllbnRYWV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHBvc2l0aW9uID0gZS5vcmlnaW5hbEV2ZW50W2NsaWVudFhZXTtcbiAgICAgIH0gZWxzZSBpZiAoZS5vcmlnaW5hbEV2ZW50LnRvdWNoZXMgJiYgZS5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbMF0gJiYgdHlwZW9mIGUub3JpZ2luYWxFdmVudC50b3VjaGVzWzBdW2NsaWVudFhZXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcG9zaXRpb24gPSBlLm9yaWdpbmFsRXZlbnQudG91Y2hlc1swXVtjbGllbnRYWV07XG4gICAgICB9IGVsc2UgaWYgKGUuY3VycmVudFBvaW50ICYmIHR5cGVvZiBlLmN1cnJlbnRQb2ludFt4eV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHBvc2l0aW9uID0gZS5jdXJyZW50UG9pbnRbeHldO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcG9zaXRpb247XG4gICAgfSxcblxuICAgIHNldF9hY3RpdmVfc2xpZGVyIDogZnVuY3Rpb24gKCRoYW5kbGUpIHtcbiAgICAgIHRoaXMuY2FjaGUuYWN0aXZlID0gJGhhbmRsZTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlX2FjdGl2ZV9zbGlkZXIgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLmNhY2hlLmFjdGl2ZSA9IG51bGw7XG4gICAgfSxcblxuICAgIGNhbGN1bGF0ZV9wb3NpdGlvbiA6IGZ1bmN0aW9uICgkaGFuZGxlLCBjdXJzb3JfeCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgIHNldHRpbmdzID0gJC5kYXRhKCRoYW5kbGVbMF0sICdzZXR0aW5ncycpLFxuICAgICAgICAgIGhhbmRsZV9sID0gJC5kYXRhKCRoYW5kbGVbMF0sICdoYW5kbGVfbCcpLFxuICAgICAgICAgIGhhbmRsZV9vID0gJC5kYXRhKCRoYW5kbGVbMF0sICdoYW5kbGVfbycpLFxuICAgICAgICAgIGJhcl9sID0gJC5kYXRhKCRoYW5kbGVbMF0sICdiYXJfbCcpLFxuICAgICAgICAgIGJhcl9vID0gJC5kYXRhKCRoYW5kbGVbMF0sICdiYXJfbycpO1xuXG4gICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcGN0O1xuXG4gICAgICAgIGlmIChGb3VuZGF0aW9uLnJ0bCAmJiAhc2V0dGluZ3MudmVydGljYWwpIHtcbiAgICAgICAgICBwY3QgPSBzZWxmLmxpbWl0X3RvKCgoYmFyX28gKyBiYXJfbCAtIGN1cnNvcl94KSAvIGJhcl9sKSwgMCwgMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGN0ID0gc2VsZi5saW1pdF90bygoKGN1cnNvcl94IC0gYmFyX28pIC8gYmFyX2wpLCAwLCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHBjdCA9IHNldHRpbmdzLnZlcnRpY2FsID8gMSAtIHBjdCA6IHBjdDtcblxuICAgICAgICB2YXIgbm9ybSA9IHNlbGYubm9ybWFsaXplZF92YWx1ZShwY3QsIHNldHRpbmdzLnN0YXJ0LCBzZXR0aW5ncy5lbmQsIHNldHRpbmdzLnN0ZXAsIHNldHRpbmdzLnByZWNpc2lvbik7XG5cbiAgICAgICAgc2VsZi5zZXRfdWkoJGhhbmRsZSwgbm9ybSk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgc2V0X3VpIDogZnVuY3Rpb24gKCRoYW5kbGUsIHZhbHVlKSB7XG4gICAgICB2YXIgc2V0dGluZ3MgPSAkLmRhdGEoJGhhbmRsZVswXSwgJ3NldHRpbmdzJyksXG4gICAgICAgICAgaGFuZGxlX2wgPSAkLmRhdGEoJGhhbmRsZVswXSwgJ2hhbmRsZV9sJyksXG4gICAgICAgICAgYmFyX2wgPSAkLmRhdGEoJGhhbmRsZVswXSwgJ2Jhcl9sJyksXG4gICAgICAgICAgbm9ybV9wY3QgPSB0aGlzLm5vcm1hbGl6ZWRfcGVyY2VudGFnZSh2YWx1ZSwgc2V0dGluZ3Muc3RhcnQsIHNldHRpbmdzLmVuZCksXG4gICAgICAgICAgaGFuZGxlX29mZnNldCA9IG5vcm1fcGN0ICogKGJhcl9sIC0gaGFuZGxlX2wpIC0gMSxcbiAgICAgICAgICBwcm9ncmVzc19iYXJfbGVuZ3RoID0gbm9ybV9wY3QgKiAxMDAsXG4gICAgICAgICAgJGhhbmRsZV9wYXJlbnQgPSAkaGFuZGxlLnBhcmVudCgpLFxuICAgICAgICAgICRoaWRkZW5faW5wdXRzID0gJGhhbmRsZS5wYXJlbnQoKS5jaGlsZHJlbignaW5wdXRbdHlwZT1oaWRkZW5dJyk7XG5cbiAgICAgIGlmIChGb3VuZGF0aW9uLnJ0bCAmJiAhc2V0dGluZ3MudmVydGljYWwpIHtcbiAgICAgICAgaGFuZGxlX29mZnNldCA9IC1oYW5kbGVfb2Zmc2V0O1xuICAgICAgfVxuXG4gICAgICBoYW5kbGVfb2Zmc2V0ID0gc2V0dGluZ3MudmVydGljYWwgPyAtaGFuZGxlX29mZnNldCArIGJhcl9sIC0gaGFuZGxlX2wgKyAxIDogaGFuZGxlX29mZnNldDtcbiAgICAgIHRoaXMuc2V0X3RyYW5zbGF0ZSgkaGFuZGxlLCBoYW5kbGVfb2Zmc2V0LCBzZXR0aW5ncy52ZXJ0aWNhbCk7XG5cbiAgICAgIGlmIChzZXR0aW5ncy52ZXJ0aWNhbCkge1xuICAgICAgICAkaGFuZGxlLnNpYmxpbmdzKCcucmFuZ2Utc2xpZGVyLWFjdGl2ZS1zZWdtZW50JykuY3NzKCdoZWlnaHQnLCBwcm9ncmVzc19iYXJfbGVuZ3RoICsgJyUnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRoYW5kbGUuc2libGluZ3MoJy5yYW5nZS1zbGlkZXItYWN0aXZlLXNlZ21lbnQnKS5jc3MoJ3dpZHRoJywgcHJvZ3Jlc3NfYmFyX2xlbmd0aCArICclJyk7XG4gICAgICB9XG5cbiAgICAgICRoYW5kbGVfcGFyZW50LmF0dHIodGhpcy5hdHRyX25hbWUoKSwgdmFsdWUpLnRyaWdnZXIoJ2NoYW5nZScpLnRyaWdnZXIoJ2NoYW5nZS5mbmR0bi5zbGlkZXInKTtcblxuICAgICAgJGhpZGRlbl9pbnB1dHMudmFsKHZhbHVlKTtcbiAgICAgIGlmIChzZXR0aW5ncy50cmlnZ2VyX2lucHV0X2NoYW5nZSkge1xuICAgICAgICAgICRoaWRkZW5faW5wdXRzLnRyaWdnZXIoJ2NoYW5nZScpO1xuICAgICAgfVxuXG4gICAgICBpZiAoISRoYW5kbGVbMF0uaGFzQXR0cmlidXRlKCdhcmlhLXZhbHVlbWluJykpIHtcbiAgICAgICAgJGhhbmRsZS5hdHRyKHtcbiAgICAgICAgICAnYXJpYS12YWx1ZW1pbicgOiBzZXR0aW5ncy5zdGFydCxcbiAgICAgICAgICAnYXJpYS12YWx1ZW1heCcgOiBzZXR0aW5ncy5lbmRcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAkaGFuZGxlLmF0dHIoJ2FyaWEtdmFsdWVub3cnLCB2YWx1ZSk7XG5cbiAgICAgIGlmIChzZXR0aW5ncy5kaXNwbGF5X3NlbGVjdG9yICE9ICcnKSB7XG4gICAgICAgICQoc2V0dGluZ3MuZGlzcGxheV9zZWxlY3RvcikuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgaWYgKHRoaXMuaGFzT3duUHJvcGVydHkoJ3ZhbHVlJykpIHtcbiAgICAgICAgICAgICQodGhpcykudmFsKHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCh0aGlzKS50ZXh0KHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgfSxcblxuICAgIG5vcm1hbGl6ZWRfcGVyY2VudGFnZSA6IGZ1bmN0aW9uICh2YWwsIHN0YXJ0LCBlbmQpIHtcbiAgICAgIHJldHVybiBNYXRoLm1pbigxLCAodmFsIC0gc3RhcnQpIC8gKGVuZCAtIHN0YXJ0KSk7XG4gICAgfSxcblxuICAgIG5vcm1hbGl6ZWRfdmFsdWUgOiBmdW5jdGlvbiAodmFsLCBzdGFydCwgZW5kLCBzdGVwLCBwcmVjaXNpb24pIHtcbiAgICAgIHZhciByYW5nZSA9IGVuZCAtIHN0YXJ0LFxuICAgICAgICAgIHBvaW50ID0gdmFsICogcmFuZ2UsXG4gICAgICAgICAgbW9kID0gKHBvaW50IC0gKHBvaW50ICUgc3RlcCkpIC8gc3RlcCxcbiAgICAgICAgICByZW0gPSBwb2ludCAlIHN0ZXAsXG4gICAgICAgICAgcm91bmQgPSAoIHJlbSA+PSBzdGVwICogMC41ID8gc3RlcCA6IDApO1xuICAgICAgcmV0dXJuICgobW9kICogc3RlcCArIHJvdW5kKSArIHN0YXJ0KS50b0ZpeGVkKHByZWNpc2lvbik7XG4gICAgfSxcblxuICAgIHNldF90cmFuc2xhdGUgOiBmdW5jdGlvbiAoZWxlLCBvZmZzZXQsIHZlcnRpY2FsKSB7XG4gICAgICBpZiAodmVydGljYWwpIHtcbiAgICAgICAgJChlbGUpXG4gICAgICAgICAgLmNzcygnLXdlYmtpdC10cmFuc2Zvcm0nLCAndHJhbnNsYXRlWSgnICsgb2Zmc2V0ICsgJ3B4KScpXG4gICAgICAgICAgLmNzcygnLW1vei10cmFuc2Zvcm0nLCAndHJhbnNsYXRlWSgnICsgb2Zmc2V0ICsgJ3B4KScpXG4gICAgICAgICAgLmNzcygnLW1zLXRyYW5zZm9ybScsICd0cmFuc2xhdGVZKCcgKyBvZmZzZXQgKyAncHgpJylcbiAgICAgICAgICAuY3NzKCctby10cmFuc2Zvcm0nLCAndHJhbnNsYXRlWSgnICsgb2Zmc2V0ICsgJ3B4KScpXG4gICAgICAgICAgLmNzcygndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZVkoJyArIG9mZnNldCArICdweCknKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICQoZWxlKVxuICAgICAgICAgIC5jc3MoJy13ZWJraXQtdHJhbnNmb3JtJywgJ3RyYW5zbGF0ZVgoJyArIG9mZnNldCArICdweCknKVxuICAgICAgICAgIC5jc3MoJy1tb3otdHJhbnNmb3JtJywgJ3RyYW5zbGF0ZVgoJyArIG9mZnNldCArICdweCknKVxuICAgICAgICAgIC5jc3MoJy1tcy10cmFuc2Zvcm0nLCAndHJhbnNsYXRlWCgnICsgb2Zmc2V0ICsgJ3B4KScpXG4gICAgICAgICAgLmNzcygnLW8tdHJhbnNmb3JtJywgJ3RyYW5zbGF0ZVgoJyArIG9mZnNldCArICdweCknKVxuICAgICAgICAgIC5jc3MoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGVYKCcgKyBvZmZzZXQgKyAncHgpJyk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGxpbWl0X3RvIDogZnVuY3Rpb24gKHZhbCwgbWluLCBtYXgpIHtcbiAgICAgIHJldHVybiBNYXRoLm1pbihNYXRoLm1heCh2YWwsIG1pbiksIG1heCk7XG4gICAgfSxcblxuICAgIGluaXRpYWxpemVfc2V0dGluZ3MgOiBmdW5jdGlvbiAoaGFuZGxlKSB7XG4gICAgICB2YXIgc2V0dGluZ3MgPSAkLmV4dGVuZCh7fSwgdGhpcy5zZXR0aW5ncywgdGhpcy5kYXRhX29wdGlvbnMoJChoYW5kbGUpLnBhcmVudCgpKSksXG4gICAgICAgICAgZGVjaW1hbF9wbGFjZXNfbWF0Y2hfcmVzdWx0O1xuXG4gICAgICBpZiAoc2V0dGluZ3MucHJlY2lzaW9uID09PSBudWxsKSB7XG4gICAgICAgIGRlY2ltYWxfcGxhY2VzX21hdGNoX3Jlc3VsdCA9ICgnJyArIHNldHRpbmdzLnN0ZXApLm1hdGNoKC9cXC4oW1xcZF0qKS8pO1xuICAgICAgICBzZXR0aW5ncy5wcmVjaXNpb24gPSBkZWNpbWFsX3BsYWNlc19tYXRjaF9yZXN1bHQgJiYgZGVjaW1hbF9wbGFjZXNfbWF0Y2hfcmVzdWx0WzFdID8gZGVjaW1hbF9wbGFjZXNfbWF0Y2hfcmVzdWx0WzFdLmxlbmd0aCA6IDA7XG4gICAgICB9XG5cbiAgICAgIGlmIChzZXR0aW5ncy52ZXJ0aWNhbCkge1xuICAgICAgICAkLmRhdGEoaGFuZGxlLCAnYmFyX28nLCAkKGhhbmRsZSkucGFyZW50KCkub2Zmc2V0KCkudG9wKTtcbiAgICAgICAgJC5kYXRhKGhhbmRsZSwgJ2Jhcl9sJywgJChoYW5kbGUpLnBhcmVudCgpLm91dGVySGVpZ2h0KCkpO1xuICAgICAgICAkLmRhdGEoaGFuZGxlLCAnaGFuZGxlX28nLCAkKGhhbmRsZSkub2Zmc2V0KCkudG9wKTtcbiAgICAgICAgJC5kYXRhKGhhbmRsZSwgJ2hhbmRsZV9sJywgJChoYW5kbGUpLm91dGVySGVpZ2h0KCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJC5kYXRhKGhhbmRsZSwgJ2Jhcl9vJywgJChoYW5kbGUpLnBhcmVudCgpLm9mZnNldCgpLmxlZnQpO1xuICAgICAgICAkLmRhdGEoaGFuZGxlLCAnYmFyX2wnLCAkKGhhbmRsZSkucGFyZW50KCkub3V0ZXJXaWR0aCgpKTtcbiAgICAgICAgJC5kYXRhKGhhbmRsZSwgJ2hhbmRsZV9vJywgJChoYW5kbGUpLm9mZnNldCgpLmxlZnQpO1xuICAgICAgICAkLmRhdGEoaGFuZGxlLCAnaGFuZGxlX2wnLCAkKGhhbmRsZSkub3V0ZXJXaWR0aCgpKTtcbiAgICAgIH1cblxuICAgICAgJC5kYXRhKGhhbmRsZSwgJ2JhcicsICQoaGFuZGxlKS5wYXJlbnQoKSk7XG4gICAgICAkLmRhdGEoaGFuZGxlLCAnc2V0dGluZ3MnLCBzZXR0aW5ncyk7XG4gICAgfSxcblxuICAgIHNldF9pbml0aWFsX3Bvc2l0aW9uIDogZnVuY3Rpb24gKCRlbGUpIHtcbiAgICAgIHZhciBzZXR0aW5ncyA9ICQuZGF0YSgkZWxlLmNoaWxkcmVuKCcucmFuZ2Utc2xpZGVyLWhhbmRsZScpWzBdLCAnc2V0dGluZ3MnKSxcbiAgICAgICAgICBpbml0aWFsID0gKCh0eXBlb2Ygc2V0dGluZ3MuaW5pdGlhbCA9PSAnbnVtYmVyJyAmJiAhaXNOYU4oc2V0dGluZ3MuaW5pdGlhbCkpID8gc2V0dGluZ3MuaW5pdGlhbCA6IE1hdGguZmxvb3IoKHNldHRpbmdzLmVuZCAtIHNldHRpbmdzLnN0YXJ0KSAqIDAuNSAvIHNldHRpbmdzLnN0ZXApICogc2V0dGluZ3Muc3RlcCArIHNldHRpbmdzLnN0YXJ0KSxcbiAgICAgICAgICAkaGFuZGxlID0gJGVsZS5jaGlsZHJlbignLnJhbmdlLXNsaWRlci1oYW5kbGUnKTtcbiAgICAgIHRoaXMuc2V0X3VpKCRoYW5kbGUsIGluaXRpYWwpO1xuICAgIH0sXG5cbiAgICBzZXRfdmFsdWUgOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICQoJ1snICsgc2VsZi5hdHRyX25hbWUoKSArICddJywgdGhpcy5zY29wZSkuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICQodGhpcykuYXR0cihzZWxmLmF0dHJfbmFtZSgpLCB2YWx1ZSk7XG4gICAgICB9KTtcbiAgICAgIGlmICghISQodGhpcy5zY29wZSkuYXR0cihzZWxmLmF0dHJfbmFtZSgpKSkge1xuICAgICAgICAkKHRoaXMuc2NvcGUpLmF0dHIoc2VsZi5hdHRyX25hbWUoKSwgdmFsdWUpO1xuICAgICAgfVxuICAgICAgc2VsZi5yZWZsb3coKTtcbiAgICB9LFxuXG4gICAgcmVmbG93IDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgc2VsZi5TKCdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaGFuZGxlID0gJCh0aGlzKS5jaGlsZHJlbignLnJhbmdlLXNsaWRlci1oYW5kbGUnKVswXSxcbiAgICAgICAgICAgIHZhbCA9ICQodGhpcykuYXR0cihzZWxmLmF0dHJfbmFtZSgpKTtcbiAgICAgICAgc2VsZi5pbml0aWFsaXplX3NldHRpbmdzKGhhbmRsZSk7XG5cbiAgICAgICAgaWYgKHZhbCkge1xuICAgICAgICAgIHNlbGYuc2V0X3VpKCQoaGFuZGxlKSwgcGFyc2VGbG9hdCh2YWwpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWxmLnNldF9pbml0aWFsX3Bvc2l0aW9uKCQodGhpcykpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbn0oalF1ZXJ5LCB3aW5kb3csIHdpbmRvdy5kb2N1bWVudCkpO1xuXG47KGZ1bmN0aW9uICgkLCB3aW5kb3csIGRvY3VtZW50LCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIEZvdW5kYXRpb24ubGlicy50YWIgPSB7XG4gICAgbmFtZSA6ICd0YWInLFxuXG4gICAgdmVyc2lvbiA6ICc1LjUuMScsXG5cbiAgICBzZXR0aW5ncyA6IHtcbiAgICAgIGFjdGl2ZV9jbGFzcyA6ICdhY3RpdmUnLFxuICAgICAgY2FsbGJhY2sgOiBmdW5jdGlvbiAoKSB7fSxcbiAgICAgIGRlZXBfbGlua2luZyA6IGZhbHNlLFxuICAgICAgc2Nyb2xsX3RvX2NvbnRlbnQgOiB0cnVlLFxuICAgICAgaXNfaG92ZXIgOiBmYWxzZVxuICAgIH0sXG5cbiAgICBkZWZhdWx0X3RhYl9oYXNoZXMgOiBbXSxcblxuICAgIGluaXQgOiBmdW5jdGlvbiAoc2NvcGUsIG1ldGhvZCwgb3B0aW9ucykge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgIFMgPSB0aGlzLlM7XG5cbiAgICAgIHRoaXMuYmluZGluZ3MobWV0aG9kLCBvcHRpb25zKTtcblxuICAgICAgLy8gc3RvcmUgdGhlIGluaXRpYWwgaHJlZiwgd2hpY2ggaXMgdXNlZCB0byBhbGxvdyBjb3JyZWN0IGJlaGF2aW91ciBvZiB0aGVcbiAgICAgIC8vIGJyb3dzZXIgYmFjayBidXR0b24gd2hlbiBkZWVwIGxpbmtpbmcgaXMgdHVybmVkIG9uLlxuICAgICAgc2VsZi5lbnRyeV9sb2NhdGlvbiA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuXG4gICAgICB0aGlzLmhhbmRsZV9sb2NhdGlvbl9oYXNoX2NoYW5nZSgpO1xuXG4gICAgICAvLyBTdG9yZSB0aGUgZGVmYXVsdCBhY3RpdmUgdGFicyB3aGljaCB3aWxsIGJlIHJlZmVyZW5jZWQgd2hlbiB0aGVcbiAgICAgIC8vIGxvY2F0aW9uIGhhc2ggaXMgYWJzZW50LCBhcyBpbiB0aGUgY2FzZSBvZiBuYXZpZ2F0aW5nIHRoZSB0YWJzIGFuZFxuICAgICAgLy8gcmV0dXJuaW5nIHRvIHRoZSBmaXJzdCB2aWV3aW5nIHZpYSB0aGUgYnJvd3NlciBCYWNrIGJ1dHRvbi5cbiAgICAgIFMoJ1snICsgdGhpcy5hdHRyX25hbWUoKSArICddID4gLmFjdGl2ZSA+IGEnLCB0aGlzLnNjb3BlKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5kZWZhdWx0X3RhYl9oYXNoZXMucHVzaCh0aGlzLmhhc2gpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIGV2ZW50cyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICBTID0gdGhpcy5TO1xuXG4gICAgICB2YXIgdXN1YWxfdGFiX2JlaGF2aW9yID0gIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgdmFyIHNldHRpbmdzID0gUyh0aGlzKS5jbG9zZXN0KCdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnXScpLmRhdGEoc2VsZi5hdHRyX25hbWUodHJ1ZSkgKyAnLWluaXQnKTtcbiAgICAgICAgICBpZiAoIXNldHRpbmdzLmlzX2hvdmVyIHx8IE1vZGVybml6ci50b3VjaCkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIHNlbGYudG9nZ2xlX2FjdGl2ZV90YWIoUyh0aGlzKS5wYXJlbnQoKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICBTKHRoaXMuc2NvcGUpXG4gICAgICAgIC5vZmYoJy50YWInKVxuICAgICAgICAvLyBDbGljayBldmVudDogdGFiIHRpdGxlXG4gICAgICAgIC5vbignZm9jdXMuZm5kdG4udGFiJywgJ1snICsgdGhpcy5hdHRyX25hbWUoKSArICddID4gKiA+IGEnLCB1c3VhbF90YWJfYmVoYXZpb3IgKVxuICAgICAgICAub24oJ2NsaWNrLmZuZHRuLnRhYicsICdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXSA+ICogPiBhJywgdXN1YWxfdGFiX2JlaGF2aW9yIClcbiAgICAgICAgLy8gSG92ZXIgZXZlbnQ6IHRhYiB0aXRsZVxuICAgICAgICAub24oJ21vdXNlZW50ZXIuZm5kdG4udGFiJywgJ1snICsgdGhpcy5hdHRyX25hbWUoKSArICddID4gKiA+IGEnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIHZhciBzZXR0aW5ncyA9IFModGhpcykuY2xvc2VzdCgnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJ10nKS5kYXRhKHNlbGYuYXR0cl9uYW1lKHRydWUpICsgJy1pbml0Jyk7XG4gICAgICAgICAgaWYgKHNldHRpbmdzLmlzX2hvdmVyKSB7XG4gICAgICAgICAgICBzZWxmLnRvZ2dsZV9hY3RpdmVfdGFiKFModGhpcykucGFyZW50KCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgIC8vIExvY2F0aW9uIGhhc2ggY2hhbmdlIGV2ZW50XG4gICAgICBTKHdpbmRvdykub24oJ2hhc2hjaGFuZ2UuZm5kdG4udGFiJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBzZWxmLmhhbmRsZV9sb2NhdGlvbl9oYXNoX2NoYW5nZSgpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIGhhbmRsZV9sb2NhdGlvbl9oYXNoX2NoYW5nZSA6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgIFMgPSB0aGlzLlM7XG5cbiAgICAgIFMoJ1snICsgdGhpcy5hdHRyX25hbWUoKSArICddJywgdGhpcy5zY29wZSkuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzZXR0aW5ncyA9IFModGhpcykuZGF0YShzZWxmLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpO1xuICAgICAgICBpZiAoc2V0dGluZ3MuZGVlcF9saW5raW5nKSB7XG4gICAgICAgICAgLy8gTWF0Y2ggdGhlIGxvY2F0aW9uIGhhc2ggdG8gYSBsYWJlbFxuICAgICAgICAgIHZhciBoYXNoO1xuICAgICAgICAgIGlmIChzZXR0aW5ncy5zY3JvbGxfdG9fY29udGVudCkge1xuICAgICAgICAgICAgaGFzaCA9IHNlbGYuc2NvcGUubG9jYXRpb24uaGFzaDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gcHJlZml4IHRoZSBoYXNoIHRvIHByZXZlbnQgYW5jaG9yIHNjcm9sbGluZ1xuICAgICAgICAgICAgaGFzaCA9IHNlbGYuc2NvcGUubG9jYXRpb24uaGFzaC5yZXBsYWNlKCdmbmR0bi0nLCAnJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChoYXNoICE9ICcnKSB7XG4gICAgICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZSBsb2NhdGlvbiBoYXNoIHJlZmVyZW5jZXMgYSB0YWIgY29udGVudCBkaXYgb3JcbiAgICAgICAgICAgIC8vIGFub3RoZXIgZWxlbWVudCBvbiB0aGUgcGFnZSAoaW5zaWRlIG9yIG91dHNpZGUgdGhlIHRhYiBjb250ZW50IGRpdilcbiAgICAgICAgICAgIHZhciBoYXNoX2VsZW1lbnQgPSBTKGhhc2gpO1xuICAgICAgICAgICAgaWYgKGhhc2hfZWxlbWVudC5oYXNDbGFzcygnY29udGVudCcpICYmIGhhc2hfZWxlbWVudC5wYXJlbnQoKS5oYXNDbGFzcygndGFicy1jb250ZW50JykpIHtcbiAgICAgICAgICAgICAgLy8gVGFiIGNvbnRlbnQgZGl2XG4gICAgICAgICAgICAgIHNlbGYudG9nZ2xlX2FjdGl2ZV90YWIoJCgnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJ10gPiAqID4gYVtocmVmPScgKyBoYXNoICsgJ10nKS5wYXJlbnQoKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBOb3QgdGhlIHRhYiBjb250ZW50IGRpdi4gSWYgaW5zaWRlIHRoZSB0YWIgY29udGVudCwgZmluZCB0aGVcbiAgICAgICAgICAgICAgLy8gY29udGFpbmluZyB0YWIgYW5kIHRvZ2dsZSBpdCBhcyBhY3RpdmUuXG4gICAgICAgICAgICAgIHZhciBoYXNoX3RhYl9jb250YWluZXJfaWQgPSBoYXNoX2VsZW1lbnQuY2xvc2VzdCgnLmNvbnRlbnQnKS5hdHRyKCdpZCcpO1xuICAgICAgICAgICAgICBpZiAoaGFzaF90YWJfY29udGFpbmVyX2lkICE9IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHNlbGYudG9nZ2xlX2FjdGl2ZV90YWIoJCgnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJ10gPiAqID4gYVtocmVmPSMnICsgaGFzaF90YWJfY29udGFpbmVyX2lkICsgJ10nKS5wYXJlbnQoKSwgaGFzaCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gUmVmZXJlbmNlIHRoZSBkZWZhdWx0IHRhYiBoYXNoZXMgd2hpY2ggd2VyZSBpbml0aWFsaXplZCBpbiB0aGUgaW5pdCBmdW5jdGlvblxuICAgICAgICAgICAgZm9yICh2YXIgaW5kID0gMDsgaW5kIDwgc2VsZi5kZWZhdWx0X3RhYl9oYXNoZXMubGVuZ3RoOyBpbmQrKykge1xuICAgICAgICAgICAgICBzZWxmLnRvZ2dsZV9hY3RpdmVfdGFiKCQoJ1snICsgc2VsZi5hdHRyX25hbWUoKSArICddID4gKiA+IGFbaHJlZj0nICsgc2VsZi5kZWZhdWx0X3RhYl9oYXNoZXNbaW5kXSArICddJykucGFyZW50KCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgIH0pO1xuICAgICB9LFxuXG4gICAgdG9nZ2xlX2FjdGl2ZV90YWIgOiBmdW5jdGlvbiAodGFiLCBsb2NhdGlvbl9oYXNoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgUyA9IHNlbGYuUyxcbiAgICAgICAgICB0YWJzID0gdGFiLmNsb3Nlc3QoJ1snICsgdGhpcy5hdHRyX25hbWUoKSArICddJyksXG4gICAgICAgICAgdGFiX2xpbmsgPSB0YWIuZmluZCgnYScpLFxuICAgICAgICAgIGFuY2hvciA9IHRhYi5jaGlsZHJlbignYScpLmZpcnN0KCksXG4gICAgICAgICAgdGFyZ2V0X2hhc2ggPSAnIycgKyBhbmNob3IuYXR0cignaHJlZicpLnNwbGl0KCcjJylbMV0sXG4gICAgICAgICAgdGFyZ2V0ID0gUyh0YXJnZXRfaGFzaCksXG4gICAgICAgICAgc2libGluZ3MgPSB0YWIuc2libGluZ3MoKSxcbiAgICAgICAgICBzZXR0aW5ncyA9IHRhYnMuZGF0YSh0aGlzLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpLFxuICAgICAgICAgIGludGVycHJldF9rZXl1cF9hY3Rpb24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgLy8gTGlnaHQgbW9kaWZpY2F0aW9uIG9mIEhleWRvbiBQaWNrZXJpbmcncyBQcmFjdGljYWwgQVJJQSBFeGFtcGxlczogaHR0cDovL2hleWRvbndvcmtzLmNvbS9wcmFjdGljYWxfYXJpYV9leGFtcGxlcy9qcy9hMTF5LmpzXG5cbiAgICAgICAgICAgIC8vIGRlZmluZSBjdXJyZW50LCBwcmV2aW91cyBhbmQgbmV4dCAocG9zc2libGUpIHRhYnNcblxuICAgICAgICAgICAgdmFyICRvcmlnaW5hbCA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgJHByZXYgPSAkKHRoaXMpLnBhcmVudHMoJ2xpJykucHJldigpLmNoaWxkcmVuKCdbcm9sZT1cInRhYlwiXScpO1xuICAgICAgICAgICAgdmFyICRuZXh0ID0gJCh0aGlzKS5wYXJlbnRzKCdsaScpLm5leHQoKS5jaGlsZHJlbignW3JvbGU9XCJ0YWJcIl0nKTtcbiAgICAgICAgICAgIHZhciAkdGFyZ2V0O1xuXG4gICAgICAgICAgICAvLyBmaW5kIHRoZSBkaXJlY3Rpb24gKHByZXYgb3IgbmV4dClcblxuICAgICAgICAgICAgc3dpdGNoIChlLmtleUNvZGUpIHtcbiAgICAgICAgICAgICAgY2FzZSAzNzpcbiAgICAgICAgICAgICAgICAkdGFyZ2V0ID0gJHByZXY7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgMzk6XG4gICAgICAgICAgICAgICAgJHRhcmdldCA9ICRuZXh0O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICR0YXJnZXQgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgkdGFyZ2V0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAkb3JpZ2luYWwuYXR0cih7XG4gICAgICAgICAgICAgICAgJ3RhYmluZGV4JyA6ICctMScsXG4gICAgICAgICAgICAgICAgJ2FyaWEtc2VsZWN0ZWQnIDogbnVsbFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgJHRhcmdldC5hdHRyKHtcbiAgICAgICAgICAgICAgICAndGFiaW5kZXgnIDogJzAnLFxuICAgICAgICAgICAgICAgICdhcmlhLXNlbGVjdGVkJyA6IHRydWVcbiAgICAgICAgICAgICAgfSkuZm9jdXMoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSGlkZSBwYW5lbHNcblxuICAgICAgICAgICAgJCgnW3JvbGU9XCJ0YWJwYW5lbFwiXScpXG4gICAgICAgICAgICAgIC5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG5cbiAgICAgICAgICAgIC8vIFNob3cgcGFuZWwgd2hpY2ggY29ycmVzcG9uZHMgdG8gdGFyZ2V0XG5cbiAgICAgICAgICAgICQoJyMnICsgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5hdHRyKCdocmVmJykuc3Vic3RyaW5nKDEpKVxuICAgICAgICAgICAgICAuYXR0cignYXJpYS1oaWRkZW4nLCBudWxsKTtcblxuICAgICAgICAgIH0sXG4gICAgICAgICAgZ29fdG9faGFzaCA9IGZ1bmN0aW9uKGhhc2gpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgZnVuY3Rpb24gYWxsb3dzIGNvcnJlY3QgYmVoYXZpb3VyIG9mIHRoZSBicm93c2VyJ3MgYmFjayBidXR0b24gd2hlbiBkZWVwIGxpbmtpbmcgaXMgZW5hYmxlZC4gV2l0aG91dCBpdFxuICAgICAgICAgICAgLy8gdGhlIHVzZXIgd291bGQgZ2V0IGNvbnRpbnVhbGx5IHJlZGlyZWN0ZWQgdG8gdGhlIGRlZmF1bHQgaGFzaC5cbiAgICAgICAgICAgIHZhciBpc19lbnRyeV9sb2NhdGlvbiA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmID09PSBzZWxmLmVudHJ5X2xvY2F0aW9uLFxuICAgICAgICAgICAgICAgIGRlZmF1bHRfaGFzaCA9IHNldHRpbmdzLnNjcm9sbF90b19jb250ZW50ID8gc2VsZi5kZWZhdWx0X3RhYl9oYXNoZXNbMF0gOiBpc19lbnRyeV9sb2NhdGlvbiA/IHdpbmRvdy5sb2NhdGlvbi5oYXNoIDonZm5kdG4tJyArIHNlbGYuZGVmYXVsdF90YWJfaGFzaGVzWzBdLnJlcGxhY2UoJyMnLCAnJylcblxuICAgICAgICAgICAgaWYgKCEoaXNfZW50cnlfbG9jYXRpb24gJiYgaGFzaCA9PT0gZGVmYXVsdF9oYXNoKSkge1xuICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9IGhhc2g7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgLy8gYWxsb3cgdXNhZ2Ugb2YgZGF0YS10YWItY29udGVudCBhdHRyaWJ1dGUgaW5zdGVhZCBvZiBocmVmXG4gICAgICBpZiAoUyh0aGlzKS5kYXRhKHRoaXMuZGF0YV9hdHRyKCd0YWItY29udGVudCcpKSkge1xuICAgICAgICB0YXJnZXRfaGFzaCA9ICcjJyArIFModGhpcykuZGF0YSh0aGlzLmRhdGFfYXR0cigndGFiLWNvbnRlbnQnKSkuc3BsaXQoJyMnKVsxXTtcbiAgICAgICAgdGFyZ2V0ID0gUyh0YXJnZXRfaGFzaCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChzZXR0aW5ncy5kZWVwX2xpbmtpbmcpIHtcblxuICAgICAgICBpZiAoc2V0dGluZ3Muc2Nyb2xsX3RvX2NvbnRlbnQpIHtcblxuICAgICAgICAgIC8vIHJldGFpbiBjdXJyZW50IGhhc2ggdG8gc2Nyb2xsIHRvIGNvbnRlbnRcbiAgICAgICAgICBnb190b19oYXNoKGxvY2F0aW9uX2hhc2ggfHwgdGFyZ2V0X2hhc2gpO1xuXG4gICAgICAgICAgaWYgKGxvY2F0aW9uX2hhc2ggPT0gdW5kZWZpbmVkIHx8IGxvY2F0aW9uX2hhc2ggPT0gdGFyZ2V0X2hhc2gpIHtcbiAgICAgICAgICAgIHRhYi5wYXJlbnQoKVswXS5zY3JvbGxJbnRvVmlldygpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBTKHRhcmdldF9oYXNoKVswXS5zY3JvbGxJbnRvVmlldygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBwcmVmaXggdGhlIGhhc2hlcyBzbyB0aGF0IHRoZSBicm93c2VyIGRvZXNuJ3Qgc2Nyb2xsIGRvd25cbiAgICAgICAgICBpZiAobG9jYXRpb25faGFzaCAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGdvX3RvX2hhc2goJ2ZuZHRuLScgKyBsb2NhdGlvbl9oYXNoLnJlcGxhY2UoJyMnLCAnJykpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnb190b19oYXNoKCdmbmR0bi0nICsgdGFyZ2V0X2hhc2gucmVwbGFjZSgnIycsICcnKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFdBUk5JTkc6IFRoZSBhY3RpdmF0aW9uIGFuZCBkZWFjdGl2YXRpb24gb2YgdGhlIHRhYiBjb250ZW50IG11c3RcbiAgICAgIC8vIG9jY3VyIGFmdGVyIHRoZSBkZWVwIGxpbmtpbmcgaW4gb3JkZXIgdG8gcHJvcGVybHkgcmVmcmVzaCB0aGUgYnJvd3NlclxuICAgICAgLy8gd2luZG93IChub3RhYmx5IGluIENocm9tZSkuXG4gICAgICAvLyBDbGVhbiB1cCBtdWx0aXBsZSBhdHRyIGluc3RhbmNlcyB0byBkb25lIG9uY2VcbiAgICAgIHRhYi5hZGRDbGFzcyhzZXR0aW5ncy5hY3RpdmVfY2xhc3MpLnRyaWdnZXJIYW5kbGVyKCdvcGVuZWQnKTtcbiAgICAgIHRhYl9saW5rLmF0dHIoeydhcmlhLXNlbGVjdGVkJyA6ICd0cnVlJywgIHRhYmluZGV4IDogMH0pO1xuICAgICAgc2libGluZ3MucmVtb3ZlQ2xhc3Moc2V0dGluZ3MuYWN0aXZlX2NsYXNzKVxuICAgICAgc2libGluZ3MuZmluZCgnYScpLmF0dHIoeydhcmlhLXNlbGVjdGVkJyA6ICdmYWxzZScsICB0YWJpbmRleCA6IC0xfSk7XG4gICAgICB0YXJnZXQuc2libGluZ3MoKS5yZW1vdmVDbGFzcyhzZXR0aW5ncy5hY3RpdmVfY2xhc3MpLmF0dHIoeydhcmlhLWhpZGRlbicgOiAndHJ1ZScsICB0YWJpbmRleCA6IC0xfSk7XG4gICAgICB0YXJnZXQuYWRkQ2xhc3Moc2V0dGluZ3MuYWN0aXZlX2NsYXNzKS5hdHRyKCdhcmlhLWhpZGRlbicsICdmYWxzZScpLnJlbW92ZUF0dHIoJ3RhYmluZGV4Jyk7XG4gICAgICBzZXR0aW5ncy5jYWxsYmFjayh0YWIpO1xuICAgICAgdGFyZ2V0LnRyaWdnZXJIYW5kbGVyKCd0b2dnbGVkJywgW3RhYl0pO1xuICAgICAgdGFicy50cmlnZ2VySGFuZGxlcigndG9nZ2xlZCcsIFt0YXJnZXRdKTtcblxuICAgICAgdGFiX2xpbmsub2ZmKCdrZXlkb3duJykub24oJ2tleWRvd24nLCBpbnRlcnByZXRfa2V5dXBfYWN0aW9uICk7XG4gICAgfSxcblxuICAgIGRhdGFfYXR0ciA6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgIGlmICh0aGlzLm5hbWVzcGFjZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5hbWVzcGFjZSArICctJyArIHN0cjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9LFxuXG4gICAgb2ZmIDogZnVuY3Rpb24gKCkge30sXG5cbiAgICByZWZsb3cgOiBmdW5jdGlvbiAoKSB7fVxuICB9O1xufShqUXVlcnksIHdpbmRvdywgd2luZG93LmRvY3VtZW50KSk7XG5cbjsoZnVuY3Rpb24gKCQsIHdpbmRvdywgZG9jdW1lbnQsIHVuZGVmaW5lZCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgRm91bmRhdGlvbi5saWJzLnRvb2x0aXAgPSB7XG4gICAgbmFtZSA6ICd0b29sdGlwJyxcblxuICAgIHZlcnNpb24gOiAnNS41LjEnLFxuXG4gICAgc2V0dGluZ3MgOiB7XG4gICAgICBhZGRpdGlvbmFsX2luaGVyaXRhYmxlX2NsYXNzZXMgOiBbXSxcbiAgICAgIHRvb2x0aXBfY2xhc3MgOiAnLnRvb2x0aXAnLFxuICAgICAgYXBwZW5kX3RvIDogJ2JvZHknLFxuICAgICAgdG91Y2hfY2xvc2VfdGV4dCA6ICdUYXAgVG8gQ2xvc2UnLFxuICAgICAgZGlzYWJsZV9mb3JfdG91Y2ggOiBmYWxzZSxcbiAgICAgIGhvdmVyX2RlbGF5IDogMjAwLFxuICAgICAgc2hvd19vbiA6ICdhbGwnLFxuICAgICAgdGlwX3RlbXBsYXRlIDogZnVuY3Rpb24gKHNlbGVjdG9yLCBjb250ZW50KSB7XG4gICAgICAgIHJldHVybiAnPHNwYW4gZGF0YS1zZWxlY3Rvcj1cIicgKyBzZWxlY3RvciArICdcIiBpZD1cIicgKyBzZWxlY3RvciArICdcIiBjbGFzcz1cIidcbiAgICAgICAgICArIEZvdW5kYXRpb24ubGlicy50b29sdGlwLnNldHRpbmdzLnRvb2x0aXBfY2xhc3Muc3Vic3RyaW5nKDEpXG4gICAgICAgICAgKyAnXCIgcm9sZT1cInRvb2x0aXBcIj4nICsgY29udGVudCArICc8c3BhbiBjbGFzcz1cIm51YlwiPjwvc3Bhbj48L3NwYW4+JztcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgY2FjaGUgOiB7fSxcblxuICAgIGluaXQgOiBmdW5jdGlvbiAoc2NvcGUsIG1ldGhvZCwgb3B0aW9ucykge1xuICAgICAgRm91bmRhdGlvbi5pbmhlcml0KHRoaXMsICdyYW5kb21fc3RyJyk7XG4gICAgICB0aGlzLmJpbmRpbmdzKG1ldGhvZCwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIHNob3VsZF9zaG93IDogZnVuY3Rpb24gKHRhcmdldCwgdGlwKSB7XG4gICAgICB2YXIgc2V0dGluZ3MgPSAkLmV4dGVuZCh7fSwgdGhpcy5zZXR0aW5ncywgdGhpcy5kYXRhX29wdGlvbnModGFyZ2V0KSk7XG5cbiAgICAgIGlmIChzZXR0aW5ncy5zaG93X29uID09PSAnYWxsJykge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5zbWFsbCgpICYmIHNldHRpbmdzLnNob3dfb24gPT09ICdzbWFsbCcpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubWVkaXVtKCkgJiYgc2V0dGluZ3Muc2hvd19vbiA9PT0gJ21lZGl1bScpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubGFyZ2UoKSAmJiBzZXR0aW5ncy5zaG93X29uID09PSAnbGFyZ2UnKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICBtZWRpdW0gOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gbWF0Y2hNZWRpYShGb3VuZGF0aW9uLm1lZGlhX3F1ZXJpZXNbJ21lZGl1bSddKS5tYXRjaGVzO1xuICAgIH0sXG5cbiAgICBsYXJnZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBtYXRjaE1lZGlhKEZvdW5kYXRpb24ubWVkaWFfcXVlcmllc1snbGFyZ2UnXSkubWF0Y2hlcztcbiAgICB9LFxuXG4gICAgZXZlbnRzIDogZnVuY3Rpb24gKGluc3RhbmNlKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgUyA9IHNlbGYuUztcblxuICAgICAgc2VsZi5jcmVhdGUodGhpcy5TKGluc3RhbmNlKSk7XG5cbiAgICAgICQodGhpcy5zY29wZSlcbiAgICAgICAgLm9mZignLnRvb2x0aXAnKVxuICAgICAgICAub24oJ21vdXNlZW50ZXIuZm5kdG4udG9vbHRpcCBtb3VzZWxlYXZlLmZuZHRuLnRvb2x0aXAgdG91Y2hzdGFydC5mbmR0bi50b29sdGlwIE1TUG9pbnRlckRvd24uZm5kdG4udG9vbHRpcCcsXG4gICAgICAgICAgJ1snICsgdGhpcy5hdHRyX25hbWUoKSArICddJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICB2YXIgJHRoaXMgPSBTKHRoaXMpLFxuICAgICAgICAgICAgICBzZXR0aW5ncyA9ICQuZXh0ZW5kKHt9LCBzZWxmLnNldHRpbmdzLCBzZWxmLmRhdGFfb3B0aW9ucygkdGhpcykpLFxuICAgICAgICAgICAgICBpc190b3VjaCA9IGZhbHNlO1xuXG4gICAgICAgICAgaWYgKE1vZGVybml6ci50b3VjaCAmJiAvdG91Y2hzdGFydHxNU1BvaW50ZXJEb3duL2kudGVzdChlLnR5cGUpICYmIFMoZS50YXJnZXQpLmlzKCdhJykpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoL21vdXNlL2kudGVzdChlLnR5cGUpICYmIHNlbGYuaWVfdG91Y2goZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoJHRoaXMuaGFzQ2xhc3MoJ29wZW4nKSkge1xuICAgICAgICAgICAgaWYgKE1vZGVybml6ci50b3VjaCAmJiAvdG91Y2hzdGFydHxNU1BvaW50ZXJEb3duL2kudGVzdChlLnR5cGUpKSB7XG4gICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYuaGlkZSgkdGhpcyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChzZXR0aW5ncy5kaXNhYmxlX2Zvcl90b3VjaCAmJiBNb2Rlcm5penIudG91Y2ggJiYgL3RvdWNoc3RhcnR8TVNQb2ludGVyRG93bi9pLnRlc3QoZS50eXBlKSkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFzZXR0aW5ncy5kaXNhYmxlX2Zvcl90b3VjaCAmJiBNb2Rlcm5penIudG91Y2ggJiYgL3RvdWNoc3RhcnR8TVNQb2ludGVyRG93bi9pLnRlc3QoZS50eXBlKSkge1xuICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgIFMoc2V0dGluZ3MudG9vbHRpcF9jbGFzcyArICcub3BlbicpLmhpZGUoKTtcbiAgICAgICAgICAgICAgaXNfdG91Y2ggPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoL2VudGVyfG92ZXIvaS50ZXN0KGUudHlwZSkpIHtcbiAgICAgICAgICAgICAgdGhpcy50aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB0aXAgPSBzZWxmLnNob3dUaXAoJHRoaXMpO1xuICAgICAgICAgICAgICB9LmJpbmQodGhpcyksIHNlbGYuc2V0dGluZ3MuaG92ZXJfZGVsYXkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlLnR5cGUgPT09ICdtb3VzZW91dCcgfHwgZS50eXBlID09PSAnbW91c2VsZWF2ZScpIHtcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZXIpO1xuICAgICAgICAgICAgICBzZWxmLmhpZGUoJHRoaXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2VsZi5zaG93VGlwKCR0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignbW91c2VsZWF2ZS5mbmR0bi50b29sdGlwIHRvdWNoc3RhcnQuZm5kdG4udG9vbHRpcCBNU1BvaW50ZXJEb3duLmZuZHRuLnRvb2x0aXAnLCAnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10ub3BlbicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgaWYgKC9tb3VzZS9pLnRlc3QoZS50eXBlKSAmJiBzZWxmLmllX3RvdWNoKGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCQodGhpcykuZGF0YSgndG9vbHRpcC1vcGVuLWV2ZW50LXR5cGUnKSA9PSAndG91Y2gnICYmIGUudHlwZSA9PSAnbW91c2VsZWF2ZScpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9IGVsc2UgaWYgKCQodGhpcykuZGF0YSgndG9vbHRpcC1vcGVuLWV2ZW50LXR5cGUnKSA9PSAnbW91c2UnICYmIC9NU1BvaW50ZXJEb3dufHRvdWNoc3RhcnQvaS50ZXN0KGUudHlwZSkpIHtcbiAgICAgICAgICAgIHNlbGYuY29udmVydF90b190b3VjaCgkKHRoaXMpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5oaWRlKCQodGhpcykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdET01Ob2RlUmVtb3ZlZCBET01BdHRyTW9kaWZpZWQnLCAnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ106bm90KGEpJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICBzZWxmLmhpZGUoUyh0aGlzKSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBpZV90b3VjaCA6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAvLyBIb3cgZG8gSSBkaXN0aW5ndWlzaCBiZXR3ZWVuIElFMTEgYW5kIFdpbmRvd3MgUGhvbmUgOD8/Pz8/XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIHNob3dUaXAgOiBmdW5jdGlvbiAoJHRhcmdldCkge1xuICAgICAgdmFyICR0aXAgPSB0aGlzLmdldFRpcCgkdGFyZ2V0KTtcbiAgICAgIGlmICh0aGlzLnNob3VsZF9zaG93KCR0YXJnZXQsICR0aXApKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNob3coJHRhcmdldCk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfSxcblxuICAgIGdldFRpcCA6IGZ1bmN0aW9uICgkdGFyZ2V0KSB7XG4gICAgICB2YXIgc2VsZWN0b3IgPSB0aGlzLnNlbGVjdG9yKCR0YXJnZXQpLFxuICAgICAgICAgIHNldHRpbmdzID0gJC5leHRlbmQoe30sIHRoaXMuc2V0dGluZ3MsIHRoaXMuZGF0YV9vcHRpb25zKCR0YXJnZXQpKSxcbiAgICAgICAgICB0aXAgPSBudWxsO1xuXG4gICAgICBpZiAoc2VsZWN0b3IpIHtcbiAgICAgICAgdGlwID0gdGhpcy5TKCdzcGFuW2RhdGEtc2VsZWN0b3I9XCInICsgc2VsZWN0b3IgKyAnXCJdJyArIHNldHRpbmdzLnRvb2x0aXBfY2xhc3MpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gKHR5cGVvZiB0aXAgPT09ICdvYmplY3QnKSA/IHRpcCA6IGZhbHNlO1xuICAgIH0sXG5cbiAgICBzZWxlY3RvciA6IGZ1bmN0aW9uICgkdGFyZ2V0KSB7XG4gICAgICB2YXIgaWQgPSAkdGFyZ2V0LmF0dHIoJ2lkJyksXG4gICAgICAgICAgZGF0YVNlbGVjdG9yID0gJHRhcmdldC5hdHRyKHRoaXMuYXR0cl9uYW1lKCkpIHx8ICR0YXJnZXQuYXR0cignZGF0YS1zZWxlY3RvcicpO1xuXG4gICAgICBpZiAoKGlkICYmIGlkLmxlbmd0aCA8IDEgfHwgIWlkKSAmJiB0eXBlb2YgZGF0YVNlbGVjdG9yICE9ICdzdHJpbmcnKSB7XG4gICAgICAgIGRhdGFTZWxlY3RvciA9IHRoaXMucmFuZG9tX3N0cig2KTtcbiAgICAgICAgJHRhcmdldFxuICAgICAgICAgIC5hdHRyKCdkYXRhLXNlbGVjdG9yJywgZGF0YVNlbGVjdG9yKVxuICAgICAgICAgIC5hdHRyKCdhcmlhLWRlc2NyaWJlZGJ5JywgZGF0YVNlbGVjdG9yKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIChpZCAmJiBpZC5sZW5ndGggPiAwKSA/IGlkIDogZGF0YVNlbGVjdG9yO1xuICAgIH0sXG5cbiAgICBjcmVhdGUgOiBmdW5jdGlvbiAoJHRhcmdldCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgIHNldHRpbmdzID0gJC5leHRlbmQoe30sIHRoaXMuc2V0dGluZ3MsIHRoaXMuZGF0YV9vcHRpb25zKCR0YXJnZXQpKSxcbiAgICAgICAgICB0aXBfdGVtcGxhdGUgPSB0aGlzLnNldHRpbmdzLnRpcF90ZW1wbGF0ZTtcblxuICAgICAgaWYgKHR5cGVvZiBzZXR0aW5ncy50aXBfdGVtcGxhdGUgPT09ICdzdHJpbmcnICYmIHdpbmRvdy5oYXNPd25Qcm9wZXJ0eShzZXR0aW5ncy50aXBfdGVtcGxhdGUpKSB7XG4gICAgICAgIHRpcF90ZW1wbGF0ZSA9IHdpbmRvd1tzZXR0aW5ncy50aXBfdGVtcGxhdGVdO1xuICAgICAgfVxuXG4gICAgICB2YXIgJHRpcCA9ICQodGlwX3RlbXBsYXRlKHRoaXMuc2VsZWN0b3IoJHRhcmdldCksICQoJzxkaXY+PC9kaXY+JykuaHRtbCgkdGFyZ2V0LmF0dHIoJ3RpdGxlJykpLmh0bWwoKSkpLFxuICAgICAgICAgIGNsYXNzZXMgPSB0aGlzLmluaGVyaXRhYmxlX2NsYXNzZXMoJHRhcmdldCk7XG5cbiAgICAgICR0aXAuYWRkQ2xhc3MoY2xhc3NlcykuYXBwZW5kVG8oc2V0dGluZ3MuYXBwZW5kX3RvKTtcblxuICAgICAgaWYgKE1vZGVybml6ci50b3VjaCkge1xuICAgICAgICAkdGlwLmFwcGVuZCgnPHNwYW4gY2xhc3M9XCJ0YXAtdG8tY2xvc2VcIj4nICsgc2V0dGluZ3MudG91Y2hfY2xvc2VfdGV4dCArICc8L3NwYW4+Jyk7XG4gICAgICAgICR0aXAub24oJ3RvdWNoc3RhcnQuZm5kdG4udG9vbHRpcCBNU1BvaW50ZXJEb3duLmZuZHRuLnRvb2x0aXAnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIHNlbGYuaGlkZSgkdGFyZ2V0KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgICR0YXJnZXQucmVtb3ZlQXR0cigndGl0bGUnKS5hdHRyKCd0aXRsZScsICcnKTtcbiAgICB9LFxuXG4gICAgcmVwb3NpdGlvbiA6IGZ1bmN0aW9uICh0YXJnZXQsIHRpcCwgY2xhc3Nlcykge1xuICAgICAgdmFyIHdpZHRoLCBudWIsIG51YkhlaWdodCwgbnViV2lkdGgsIGNvbHVtbiwgb2JqUG9zO1xuXG4gICAgICB0aXAuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpLnNob3coKTtcblxuICAgICAgd2lkdGggPSB0YXJnZXQuZGF0YSgnd2lkdGgnKTtcbiAgICAgIG51YiA9IHRpcC5jaGlsZHJlbignLm51YicpO1xuICAgICAgbnViSGVpZ2h0ID0gbnViLm91dGVySGVpZ2h0KCk7XG4gICAgICBudWJXaWR0aCA9IG51Yi5vdXRlckhlaWdodCgpO1xuXG4gICAgICBpZiAodGhpcy5zbWFsbCgpKSB7XG4gICAgICAgIHRpcC5jc3Moeyd3aWR0aCcgOiAnMTAwJSd9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRpcC5jc3Moeyd3aWR0aCcgOiAod2lkdGgpID8gd2lkdGggOiAnYXV0byd9KTtcbiAgICAgIH1cblxuICAgICAgb2JqUG9zID0gZnVuY3Rpb24gKG9iaiwgdG9wLCByaWdodCwgYm90dG9tLCBsZWZ0LCB3aWR0aCkge1xuICAgICAgICByZXR1cm4gb2JqLmNzcyh7XG4gICAgICAgICAgJ3RvcCcgOiAodG9wKSA/IHRvcCA6ICdhdXRvJyxcbiAgICAgICAgICAnYm90dG9tJyA6IChib3R0b20pID8gYm90dG9tIDogJ2F1dG8nLFxuICAgICAgICAgICdsZWZ0JyA6IChsZWZ0KSA/IGxlZnQgOiAnYXV0bycsXG4gICAgICAgICAgJ3JpZ2h0JyA6IChyaWdodCkgPyByaWdodCA6ICdhdXRvJ1xuICAgICAgICB9KS5lbmQoKTtcbiAgICAgIH07XG5cbiAgICAgIG9ialBvcyh0aXAsICh0YXJnZXQub2Zmc2V0KCkudG9wICsgdGFyZ2V0Lm91dGVySGVpZ2h0KCkgKyAxMCksICdhdXRvJywgJ2F1dG8nLCB0YXJnZXQub2Zmc2V0KCkubGVmdCk7XG5cbiAgICAgIGlmICh0aGlzLnNtYWxsKCkpIHtcbiAgICAgICAgb2JqUG9zKHRpcCwgKHRhcmdldC5vZmZzZXQoKS50b3AgKyB0YXJnZXQub3V0ZXJIZWlnaHQoKSArIDEwKSwgJ2F1dG8nLCAnYXV0bycsIDEyLjUsICQodGhpcy5zY29wZSkud2lkdGgoKSk7XG4gICAgICAgIHRpcC5hZGRDbGFzcygndGlwLW92ZXJyaWRlJyk7XG4gICAgICAgIG9ialBvcyhudWIsIC1udWJIZWlnaHQsICdhdXRvJywgJ2F1dG8nLCB0YXJnZXQub2Zmc2V0KCkubGVmdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgbGVmdCA9IHRhcmdldC5vZmZzZXQoKS5sZWZ0O1xuICAgICAgICBpZiAoRm91bmRhdGlvbi5ydGwpIHtcbiAgICAgICAgICBudWIuYWRkQ2xhc3MoJ3J0bCcpO1xuICAgICAgICAgIGxlZnQgPSB0YXJnZXQub2Zmc2V0KCkubGVmdCArIHRhcmdldC5vdXRlcldpZHRoKCkgLSB0aXAub3V0ZXJXaWR0aCgpO1xuICAgICAgICB9XG4gICAgICAgIG9ialBvcyh0aXAsICh0YXJnZXQub2Zmc2V0KCkudG9wICsgdGFyZ2V0Lm91dGVySGVpZ2h0KCkgKyAxMCksICdhdXRvJywgJ2F1dG8nLCBsZWZ0KTtcbiAgICAgICAgdGlwLnJlbW92ZUNsYXNzKCd0aXAtb3ZlcnJpZGUnKTtcbiAgICAgICAgaWYgKGNsYXNzZXMgJiYgY2xhc3Nlcy5pbmRleE9mKCd0aXAtdG9wJykgPiAtMSkge1xuICAgICAgICAgIGlmIChGb3VuZGF0aW9uLnJ0bCkge1xuICAgICAgICAgICAgbnViLmFkZENsYXNzKCdydGwnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgb2JqUG9zKHRpcCwgKHRhcmdldC5vZmZzZXQoKS50b3AgLSB0aXAub3V0ZXJIZWlnaHQoKSksICdhdXRvJywgJ2F1dG8nLCBsZWZ0KVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCd0aXAtb3ZlcnJpZGUnKTtcbiAgICAgICAgfSBlbHNlIGlmIChjbGFzc2VzICYmIGNsYXNzZXMuaW5kZXhPZigndGlwLWxlZnQnKSA+IC0xKSB7XG4gICAgICAgICAgb2JqUG9zKHRpcCwgKHRhcmdldC5vZmZzZXQoKS50b3AgKyAodGFyZ2V0Lm91dGVySGVpZ2h0KCkgLyAyKSAtICh0aXAub3V0ZXJIZWlnaHQoKSAvIDIpKSwgJ2F1dG8nLCAnYXV0bycsICh0YXJnZXQub2Zmc2V0KCkubGVmdCAtIHRpcC5vdXRlcldpZHRoKCkgLSBudWJIZWlnaHQpKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCd0aXAtb3ZlcnJpZGUnKTtcbiAgICAgICAgICBudWIucmVtb3ZlQ2xhc3MoJ3J0bCcpO1xuICAgICAgICB9IGVsc2UgaWYgKGNsYXNzZXMgJiYgY2xhc3Nlcy5pbmRleE9mKCd0aXAtcmlnaHQnKSA+IC0xKSB7XG4gICAgICAgICAgb2JqUG9zKHRpcCwgKHRhcmdldC5vZmZzZXQoKS50b3AgKyAodGFyZ2V0Lm91dGVySGVpZ2h0KCkgLyAyKSAtICh0aXAub3V0ZXJIZWlnaHQoKSAvIDIpKSwgJ2F1dG8nLCAnYXV0bycsICh0YXJnZXQub2Zmc2V0KCkubGVmdCArIHRhcmdldC5vdXRlcldpZHRoKCkgKyBudWJIZWlnaHQpKVxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCd0aXAtb3ZlcnJpZGUnKTtcbiAgICAgICAgICBudWIucmVtb3ZlQ2xhc3MoJ3J0bCcpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRpcC5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpLmhpZGUoKTtcbiAgICB9LFxuXG4gICAgc21hbGwgOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gbWF0Y2hNZWRpYShGb3VuZGF0aW9uLm1lZGlhX3F1ZXJpZXMuc21hbGwpLm1hdGNoZXMgJiZcbiAgICAgICAgIW1hdGNoTWVkaWEoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzLm1lZGl1bSkubWF0Y2hlcztcbiAgICB9LFxuXG4gICAgaW5oZXJpdGFibGVfY2xhc3NlcyA6IGZ1bmN0aW9uICgkdGFyZ2V0KSB7XG4gICAgICB2YXIgc2V0dGluZ3MgPSAkLmV4dGVuZCh7fSwgdGhpcy5zZXR0aW5ncywgdGhpcy5kYXRhX29wdGlvbnMoJHRhcmdldCkpLFxuICAgICAgICAgIGluaGVyaXRhYmxlcyA9IFsndGlwLXRvcCcsICd0aXAtbGVmdCcsICd0aXAtYm90dG9tJywgJ3RpcC1yaWdodCcsICdyYWRpdXMnLCAncm91bmQnXS5jb25jYXQoc2V0dGluZ3MuYWRkaXRpb25hbF9pbmhlcml0YWJsZV9jbGFzc2VzKSxcbiAgICAgICAgICBjbGFzc2VzID0gJHRhcmdldC5hdHRyKCdjbGFzcycpLFxuICAgICAgICAgIGZpbHRlcmVkID0gY2xhc3NlcyA/ICQubWFwKGNsYXNzZXMuc3BsaXQoJyAnKSwgZnVuY3Rpb24gKGVsLCBpKSB7XG4gICAgICAgICAgICBpZiAoJC5pbkFycmF5KGVsLCBpbmhlcml0YWJsZXMpICE9PSAtMSkge1xuICAgICAgICAgICAgICByZXR1cm4gZWw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSkuam9pbignICcpIDogJyc7XG5cbiAgICAgIHJldHVybiAkLnRyaW0oZmlsdGVyZWQpO1xuICAgIH0sXG5cbiAgICBjb252ZXJ0X3RvX3RvdWNoIDogZnVuY3Rpb24gKCR0YXJnZXQpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICAkdGlwID0gc2VsZi5nZXRUaXAoJHRhcmdldCksXG4gICAgICAgICAgc2V0dGluZ3MgPSAkLmV4dGVuZCh7fSwgc2VsZi5zZXR0aW5ncywgc2VsZi5kYXRhX29wdGlvbnMoJHRhcmdldCkpO1xuXG4gICAgICBpZiAoJHRpcC5maW5kKCcudGFwLXRvLWNsb3NlJykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICR0aXAuYXBwZW5kKCc8c3BhbiBjbGFzcz1cInRhcC10by1jbG9zZVwiPicgKyBzZXR0aW5ncy50b3VjaF9jbG9zZV90ZXh0ICsgJzwvc3Bhbj4nKTtcbiAgICAgICAgJHRpcC5vbignY2xpY2suZm5kdG4udG9vbHRpcC50YXBjbG9zZSB0b3VjaHN0YXJ0LmZuZHRuLnRvb2x0aXAudGFwY2xvc2UgTVNQb2ludGVyRG93bi5mbmR0bi50b29sdGlwLnRhcGNsb3NlJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICBzZWxmLmhpZGUoJHRhcmdldCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAkdGFyZ2V0LmRhdGEoJ3Rvb2x0aXAtb3Blbi1ldmVudC10eXBlJywgJ3RvdWNoJyk7XG4gICAgfSxcblxuICAgIHNob3cgOiBmdW5jdGlvbiAoJHRhcmdldCkge1xuICAgICAgdmFyICR0aXAgPSB0aGlzLmdldFRpcCgkdGFyZ2V0KTtcblxuICAgICAgaWYgKCR0YXJnZXQuZGF0YSgndG9vbHRpcC1vcGVuLWV2ZW50LXR5cGUnKSA9PSAndG91Y2gnKSB7XG4gICAgICAgIHRoaXMuY29udmVydF90b190b3VjaCgkdGFyZ2V0KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5yZXBvc2l0aW9uKCR0YXJnZXQsICR0aXAsICR0YXJnZXQuYXR0cignY2xhc3MnKSk7XG4gICAgICAkdGFyZ2V0LmFkZENsYXNzKCdvcGVuJyk7XG4gICAgICAkdGlwLmZhZGVJbigxNTApO1xuICAgIH0sXG5cbiAgICBoaWRlIDogZnVuY3Rpb24gKCR0YXJnZXQpIHtcbiAgICAgIHZhciAkdGlwID0gdGhpcy5nZXRUaXAoJHRhcmdldCk7XG5cbiAgICAgICR0aXAuZmFkZU91dCgxNTAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHRpcC5maW5kKCcudGFwLXRvLWNsb3NlJykucmVtb3ZlKCk7XG4gICAgICAgICR0aXAub2ZmKCdjbGljay5mbmR0bi50b29sdGlwLnRhcGNsb3NlIE1TUG9pbnRlckRvd24uZm5kdG4udGFwY2xvc2UnKTtcbiAgICAgICAgJHRhcmdldC5yZW1vdmVDbGFzcygnb3BlbicpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9mZiA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHRoaXMuUyh0aGlzLnNjb3BlKS5vZmYoJy5mbmR0bi50b29sdGlwJyk7XG4gICAgICB0aGlzLlModGhpcy5zZXR0aW5ncy50b29sdGlwX2NsYXNzKS5lYWNoKGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICQoJ1snICsgc2VsZi5hdHRyX25hbWUoKSArICddJykuZXEoaSkuYXR0cigndGl0bGUnLCAkKHRoaXMpLnRleHQoKSk7XG4gICAgICB9KS5yZW1vdmUoKTtcbiAgICB9LFxuXG4gICAgcmVmbG93IDogZnVuY3Rpb24gKCkge31cbiAgfTtcbn0oalF1ZXJ5LCB3aW5kb3csIHdpbmRvdy5kb2N1bWVudCkpO1xuXG47KGZ1bmN0aW9uICgkLCB3aW5kb3csIGRvY3VtZW50LCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIEZvdW5kYXRpb24ubGlicy50b3BiYXIgPSB7XG4gICAgbmFtZSA6ICd0b3BiYXInLFxuXG4gICAgdmVyc2lvbiA6ICc1LjUuMScsXG5cbiAgICBzZXR0aW5ncyA6IHtcbiAgICAgIGluZGV4IDogMCxcbiAgICAgIHN0aWNreV9jbGFzcyA6ICdzdGlja3knLFxuICAgICAgY3VzdG9tX2JhY2tfdGV4dCA6IHRydWUsXG4gICAgICBiYWNrX3RleHQgOiAnQmFjaycsXG4gICAgICBtb2JpbGVfc2hvd19wYXJlbnRfbGluayA6IHRydWUsXG4gICAgICBpc19ob3ZlciA6IHRydWUsXG4gICAgICBzY3JvbGx0b3AgOiB0cnVlLCAvLyBqdW1wIHRvIHRvcCB3aGVuIHN0aWNreSBuYXYgbWVudSB0b2dnbGUgaXMgY2xpY2tlZFxuICAgICAgc3RpY2t5X29uIDogJ2FsbCdcbiAgICB9LFxuXG4gICAgaW5pdCA6IGZ1bmN0aW9uIChzZWN0aW9uLCBtZXRob2QsIG9wdGlvbnMpIHtcbiAgICAgIEZvdW5kYXRpb24uaW5oZXJpdCh0aGlzLCAnYWRkX2N1c3RvbV9ydWxlIHJlZ2lzdGVyX21lZGlhIHRocm90dGxlJyk7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIHNlbGYucmVnaXN0ZXJfbWVkaWEoJ3RvcGJhcicsICdmb3VuZGF0aW9uLW1xLXRvcGJhcicpO1xuXG4gICAgICB0aGlzLmJpbmRpbmdzKG1ldGhvZCwgb3B0aW9ucyk7XG5cbiAgICAgIHNlbGYuUygnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10nLCB0aGlzLnNjb3BlKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRvcGJhciA9ICQodGhpcyksXG4gICAgICAgICAgICBzZXR0aW5ncyA9IHRvcGJhci5kYXRhKHNlbGYuYXR0cl9uYW1lKHRydWUpICsgJy1pbml0JyksXG4gICAgICAgICAgICBzZWN0aW9uID0gc2VsZi5TKCdzZWN0aW9uLCAudG9wLWJhci1zZWN0aW9uJywgdGhpcyk7XG4gICAgICAgIHRvcGJhci5kYXRhKCdpbmRleCcsIDApO1xuICAgICAgICB2YXIgdG9wYmFyQ29udGFpbmVyID0gdG9wYmFyLnBhcmVudCgpO1xuICAgICAgICBpZiAodG9wYmFyQ29udGFpbmVyLmhhc0NsYXNzKCdmaXhlZCcpIHx8IHNlbGYuaXNfc3RpY2t5KHRvcGJhciwgdG9wYmFyQ29udGFpbmVyLCBzZXR0aW5ncykgKSB7XG4gICAgICAgICAgc2VsZi5zZXR0aW5ncy5zdGlja3lfY2xhc3MgPSBzZXR0aW5ncy5zdGlja3lfY2xhc3M7XG4gICAgICAgICAgc2VsZi5zZXR0aW5ncy5zdGlja3lfdG9wYmFyID0gdG9wYmFyO1xuICAgICAgICAgIHRvcGJhci5kYXRhKCdoZWlnaHQnLCB0b3BiYXJDb250YWluZXIub3V0ZXJIZWlnaHQoKSk7XG4gICAgICAgICAgdG9wYmFyLmRhdGEoJ3N0aWNreW9mZnNldCcsIHRvcGJhckNvbnRhaW5lci5vZmZzZXQoKS50b3ApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRvcGJhci5kYXRhKCdoZWlnaHQnLCB0b3BiYXIub3V0ZXJIZWlnaHQoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXNldHRpbmdzLmFzc2VtYmxlZCkge1xuICAgICAgICAgIHNlbGYuYXNzZW1ibGUodG9wYmFyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZXR0aW5ncy5pc19ob3Zlcikge1xuICAgICAgICAgIHNlbGYuUygnLmhhcy1kcm9wZG93bicsIHRvcGJhcikuYWRkQ2xhc3MoJ25vdC1jbGljaycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYuUygnLmhhcy1kcm9wZG93bicsIHRvcGJhcikucmVtb3ZlQ2xhc3MoJ25vdC1jbGljaycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGFkIGJvZHkgd2hlbiBzdGlja3kgKHNjcm9sbGVkKSBvciBmaXhlZC5cbiAgICAgICAgc2VsZi5hZGRfY3VzdG9tX3J1bGUoJy5mLXRvcGJhci1maXhlZCB7IHBhZGRpbmctdG9wOiAnICsgdG9wYmFyLmRhdGEoJ2hlaWdodCcpICsgJ3B4IH0nKTtcblxuICAgICAgICBpZiAodG9wYmFyQ29udGFpbmVyLmhhc0NsYXNzKCdmaXhlZCcpKSB7XG4gICAgICAgICAgc2VsZi5TKCdib2R5JykuYWRkQ2xhc3MoJ2YtdG9wYmFyLWZpeGVkJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgfSxcblxuICAgIGlzX3N0aWNreSA6IGZ1bmN0aW9uICh0b3BiYXIsIHRvcGJhckNvbnRhaW5lciwgc2V0dGluZ3MpIHtcbiAgICAgIHZhciBzdGlja3kgICAgID0gdG9wYmFyQ29udGFpbmVyLmhhc0NsYXNzKHNldHRpbmdzLnN0aWNreV9jbGFzcyk7XG4gICAgICB2YXIgc21hbGxNYXRjaCA9IG1hdGNoTWVkaWEoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzLnNtYWxsKS5tYXRjaGVzO1xuICAgICAgdmFyIG1lZE1hdGNoICAgPSBtYXRjaE1lZGlhKEZvdW5kYXRpb24ubWVkaWFfcXVlcmllcy5tZWRpdW0pLm1hdGNoZXM7XG4gICAgICB2YXIgbHJnTWF0Y2ggICA9IG1hdGNoTWVkaWEoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzLmxhcmdlKS5tYXRjaGVzO1xuICAgICAgXG4gICAgICAgaWYgKHN0aWNreSAmJiBzZXR0aW5ncy5zdGlja3lfb24gPT09ICdhbGwnKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgfVxuICAgICAgIGlmIChzdGlja3kgJiYgdGhpcy5zbWFsbCgpICYmIHNldHRpbmdzLnN0aWNreV9vbi5pbmRleE9mKCdzbWFsbCcpICE9PSAtMSkge1xuICAgICAgICAgICBpZiAoc21hbGxNYXRjaCAmJiAhbWVkTWF0Y2ggJiYgIWxyZ01hdGNoKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgfVxuICAgICAgIGlmIChzdGlja3kgJiYgdGhpcy5tZWRpdW0oKSAmJiBzZXR0aW5ncy5zdGlja3lfb24uaW5kZXhPZignbWVkaXVtJykgIT09IC0xKSB7XG4gICAgICAgICAgIGlmIChzbWFsbE1hdGNoICYmIG1lZE1hdGNoICYmICFscmdNYXRjaCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgIH1cbiAgICAgICBpZiAoc3RpY2t5ICYmIHRoaXMubGFyZ2UoKSAmJiBzZXR0aW5ncy5zdGlja3lfb24uaW5kZXhPZignbGFyZ2UnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgaWYgKHNtYWxsTWF0Y2ggJiYgbWVkTWF0Y2ggJiYgbHJnTWF0Y2gpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICB9XG5cbiAgICAgICAvLyBmaXggZm9yIGlPUyBicm93c2Vyc1xuICAgICAgIGlmIChzdGlja3kgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvKGlQYWR8aVBob25lfGlQb2QpL2cpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgIH1cbiAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIHRvZ2dsZSA6IGZ1bmN0aW9uICh0b2dnbGVFbCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgIHRvcGJhcjtcblxuICAgICAgaWYgKHRvZ2dsZUVsKSB7XG4gICAgICAgIHRvcGJhciA9IHNlbGYuUyh0b2dnbGVFbCkuY2xvc2VzdCgnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRvcGJhciA9IHNlbGYuUygnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10nKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHNldHRpbmdzID0gdG9wYmFyLmRhdGEodGhpcy5hdHRyX25hbWUodHJ1ZSkgKyAnLWluaXQnKTtcblxuICAgICAgdmFyIHNlY3Rpb24gPSBzZWxmLlMoJ3NlY3Rpb24sIC50b3AtYmFyLXNlY3Rpb24nLCB0b3BiYXIpO1xuXG4gICAgICBpZiAoc2VsZi5icmVha3BvaW50KCkpIHtcbiAgICAgICAgaWYgKCFzZWxmLnJ0bCkge1xuICAgICAgICAgIHNlY3Rpb24uY3NzKHtsZWZ0IDogJzAlJ30pO1xuICAgICAgICAgICQoJz4ubmFtZScsIHNlY3Rpb24pLmNzcyh7bGVmdCA6ICcxMDAlJ30pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlY3Rpb24uY3NzKHtyaWdodCA6ICcwJSd9KTtcbiAgICAgICAgICAkKCc+Lm5hbWUnLCBzZWN0aW9uKS5jc3Moe3JpZ2h0IDogJzEwMCUnfSk7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLlMoJ2xpLm1vdmVkJywgc2VjdGlvbikucmVtb3ZlQ2xhc3MoJ21vdmVkJyk7XG4gICAgICAgIHRvcGJhci5kYXRhKCdpbmRleCcsIDApO1xuXG4gICAgICAgIHRvcGJhclxuICAgICAgICAgIC50b2dnbGVDbGFzcygnZXhwYW5kZWQnKVxuICAgICAgICAgIC5jc3MoJ2hlaWdodCcsICcnKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNldHRpbmdzLnNjcm9sbHRvcCkge1xuICAgICAgICBpZiAoIXRvcGJhci5oYXNDbGFzcygnZXhwYW5kZWQnKSkge1xuICAgICAgICAgIGlmICh0b3BiYXIuaGFzQ2xhc3MoJ2ZpeGVkJykpIHtcbiAgICAgICAgICAgIHRvcGJhci5wYXJlbnQoKS5hZGRDbGFzcygnZml4ZWQnKTtcbiAgICAgICAgICAgIHRvcGJhci5yZW1vdmVDbGFzcygnZml4ZWQnKTtcbiAgICAgICAgICAgIHNlbGYuUygnYm9keScpLmFkZENsYXNzKCdmLXRvcGJhci1maXhlZCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0b3BiYXIucGFyZW50KCkuaGFzQ2xhc3MoJ2ZpeGVkJykpIHtcbiAgICAgICAgICBpZiAoc2V0dGluZ3Muc2Nyb2xsdG9wKSB7XG4gICAgICAgICAgICB0b3BiYXIucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ2ZpeGVkJyk7XG4gICAgICAgICAgICB0b3BiYXIuYWRkQ2xhc3MoJ2ZpeGVkJyk7XG4gICAgICAgICAgICBzZWxmLlMoJ2JvZHknKS5yZW1vdmVDbGFzcygnZi10b3BiYXItZml4ZWQnKTtcblxuICAgICAgICAgICAgd2luZG93LnNjcm9sbFRvKDAsIDApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0b3BiYXIucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ2V4cGFuZGVkJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoc2VsZi5pc19zdGlja3kodG9wYmFyLCB0b3BiYXIucGFyZW50KCksIHNldHRpbmdzKSkge1xuICAgICAgICAgIHRvcGJhci5wYXJlbnQoKS5hZGRDbGFzcygnZml4ZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b3BiYXIucGFyZW50KCkuaGFzQ2xhc3MoJ2ZpeGVkJykpIHtcbiAgICAgICAgICBpZiAoIXRvcGJhci5oYXNDbGFzcygnZXhwYW5kZWQnKSkge1xuICAgICAgICAgICAgdG9wYmFyLnJlbW92ZUNsYXNzKCdmaXhlZCcpO1xuICAgICAgICAgICAgdG9wYmFyLnBhcmVudCgpLnJlbW92ZUNsYXNzKCdleHBhbmRlZCcpO1xuICAgICAgICAgICAgc2VsZi51cGRhdGVfc3RpY2t5X3Bvc2l0aW9uaW5nKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRvcGJhci5hZGRDbGFzcygnZml4ZWQnKTtcbiAgICAgICAgICAgIHRvcGJhci5wYXJlbnQoKS5hZGRDbGFzcygnZXhwYW5kZWQnKTtcbiAgICAgICAgICAgIHNlbGYuUygnYm9keScpLmFkZENsYXNzKCdmLXRvcGJhci1maXhlZCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICB0aW1lciA6IG51bGwsXG5cbiAgICBldmVudHMgOiBmdW5jdGlvbiAoYmFyKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgUyA9IHRoaXMuUztcblxuICAgICAgUyh0aGlzLnNjb3BlKVxuICAgICAgICAub2ZmKCcudG9wYmFyJylcbiAgICAgICAgLm9uKCdjbGljay5mbmR0bi50b3BiYXInLCAnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10gLnRvZ2dsZS10b3BiYXInLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBzZWxmLnRvZ2dsZSh0aGlzKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdjbGljay5mbmR0bi50b3BiYXInLCAnLnRvcC1iYXIgLnRvcC1iYXItc2VjdGlvbiBsaSBhW2hyZWZePVwiI1wiXSxbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXSAudG9wLWJhci1zZWN0aW9uIGxpIGFbaHJlZl49XCIjXCJdJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHZhciBsaSA9ICQodGhpcykuY2xvc2VzdCgnbGknKTtcbiAgICAgICAgICAgIGlmIChzZWxmLmJyZWFrcG9pbnQoKSAmJiAhbGkuaGFzQ2xhc3MoJ2JhY2snKSAmJiAhbGkuaGFzQ2xhc3MoJ2hhcy1kcm9wZG93bicpKSB7XG4gICAgICAgICAgICAgIHNlbGYudG9nZ2xlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignY2xpY2suZm5kdG4udG9wYmFyJywgJ1snICsgdGhpcy5hdHRyX25hbWUoKSArICddIGxpLmhhcy1kcm9wZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgdmFyIGxpID0gUyh0aGlzKSxcbiAgICAgICAgICAgICAgdGFyZ2V0ID0gUyhlLnRhcmdldCksXG4gICAgICAgICAgICAgIHRvcGJhciA9IGxpLmNsb3Nlc3QoJ1snICsgc2VsZi5hdHRyX25hbWUoKSArICddJyksXG4gICAgICAgICAgICAgIHNldHRpbmdzID0gdG9wYmFyLmRhdGEoc2VsZi5hdHRyX25hbWUodHJ1ZSkgKyAnLWluaXQnKTtcblxuICAgICAgICAgIGlmICh0YXJnZXQuZGF0YSgncmV2ZWFsSWQnKSkge1xuICAgICAgICAgICAgc2VsZi50b2dnbGUoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoc2VsZi5icmVha3BvaW50KCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoc2V0dGluZ3MuaXNfaG92ZXIgJiYgIU1vZGVybml6ci50b3VjaCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgICBpZiAobGkuaGFzQ2xhc3MoJ2hvdmVyJykpIHtcbiAgICAgICAgICAgIGxpXG4gICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnaG92ZXInKVxuICAgICAgICAgICAgICAuZmluZCgnbGknKVxuICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2hvdmVyJyk7XG5cbiAgICAgICAgICAgIGxpLnBhcmVudHMoJ2xpLmhvdmVyJylcbiAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdob3ZlcicpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsaS5hZGRDbGFzcygnaG92ZXInKTtcblxuICAgICAgICAgICAgJChsaSkuc2libGluZ3MoKS5yZW1vdmVDbGFzcygnaG92ZXInKTtcblxuICAgICAgICAgICAgaWYgKHRhcmdldFswXS5ub2RlTmFtZSA9PT0gJ0EnICYmIHRhcmdldC5wYXJlbnQoKS5oYXNDbGFzcygnaGFzLWRyb3Bkb3duJykpIHtcbiAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdjbGljay5mbmR0bi50b3BiYXInLCAnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10gLmhhcy1kcm9wZG93bj5hJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICBpZiAoc2VsZi5icmVha3BvaW50KCkpIHtcblxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSBTKHRoaXMpLFxuICAgICAgICAgICAgICAgIHRvcGJhciA9ICR0aGlzLmNsb3Nlc3QoJ1snICsgc2VsZi5hdHRyX25hbWUoKSArICddJyksXG4gICAgICAgICAgICAgICAgc2VjdGlvbiA9IHRvcGJhci5maW5kKCdzZWN0aW9uLCAudG9wLWJhci1zZWN0aW9uJyksXG4gICAgICAgICAgICAgICAgZHJvcGRvd25IZWlnaHQgPSAkdGhpcy5uZXh0KCcuZHJvcGRvd24nKS5vdXRlckhlaWdodCgpLFxuICAgICAgICAgICAgICAgICRzZWxlY3RlZExpID0gJHRoaXMuY2xvc2VzdCgnbGknKTtcblxuICAgICAgICAgICAgdG9wYmFyLmRhdGEoJ2luZGV4JywgdG9wYmFyLmRhdGEoJ2luZGV4JykgKyAxKTtcbiAgICAgICAgICAgICRzZWxlY3RlZExpLmFkZENsYXNzKCdtb3ZlZCcpO1xuXG4gICAgICAgICAgICBpZiAoIXNlbGYucnRsKSB7XG4gICAgICAgICAgICAgIHNlY3Rpb24uY3NzKHtsZWZ0IDogLSgxMDAgKiB0b3BiYXIuZGF0YSgnaW5kZXgnKSkgKyAnJSd9KTtcbiAgICAgICAgICAgICAgc2VjdGlvbi5maW5kKCc+Lm5hbWUnKS5jc3Moe2xlZnQgOiAxMDAgKiB0b3BiYXIuZGF0YSgnaW5kZXgnKSArICclJ30pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2VjdGlvbi5jc3Moe3JpZ2h0IDogLSgxMDAgKiB0b3BiYXIuZGF0YSgnaW5kZXgnKSkgKyAnJSd9KTtcbiAgICAgICAgICAgICAgc2VjdGlvbi5maW5kKCc+Lm5hbWUnKS5jc3Moe3JpZ2h0IDogMTAwICogdG9wYmFyLmRhdGEoJ2luZGV4JykgKyAnJSd9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdG9wYmFyLmNzcygnaGVpZ2h0JywgJHRoaXMuc2libGluZ3MoJ3VsJykub3V0ZXJIZWlnaHQodHJ1ZSkgKyB0b3BiYXIuZGF0YSgnaGVpZ2h0JykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgIFMod2luZG93KS5vZmYoJy50b3BiYXInKS5vbigncmVzaXplLmZuZHRuLnRvcGJhcicsIHNlbGYudGhyb3R0bGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHNlbGYucmVzaXplLmNhbGwoc2VsZik7XG4gICAgICB9LCA1MCkpLnRyaWdnZXIoJ3Jlc2l6ZScpLnRyaWdnZXIoJ3Jlc2l6ZS5mbmR0bi50b3BiYXInKS5sb2FkKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAvLyBFbnN1cmUgdGhhdCB0aGUgb2Zmc2V0IGlzIGNhbGN1bGF0ZWQgYWZ0ZXIgYWxsIG9mIHRoZSBwYWdlcyByZXNvdXJjZXMgaGF2ZSBsb2FkZWRcbiAgICAgICAgICBTKHRoaXMpLnRyaWdnZXIoJ3Jlc2l6ZS5mbmR0bi50b3BiYXInKTtcbiAgICAgIH0pO1xuXG4gICAgICBTKCdib2R5Jykub2ZmKCcudG9wYmFyJykub24oJ2NsaWNrLmZuZHRuLnRvcGJhcicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBwYXJlbnQgPSBTKGUudGFyZ2V0KS5jbG9zZXN0KCdsaScpLmNsb3Nlc3QoJ2xpLmhvdmVyJyk7XG5cbiAgICAgICAgaWYgKHBhcmVudC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgUygnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJ10gbGkuaG92ZXInKS5yZW1vdmVDbGFzcygnaG92ZXInKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBHbyB1cCBhIGxldmVsIG9uIENsaWNrXG4gICAgICBTKHRoaXMuc2NvcGUpLm9uKCdjbGljay5mbmR0bi50b3BiYXInLCAnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10gLmhhcy1kcm9wZG93biAuYmFjaycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB2YXIgJHRoaXMgPSBTKHRoaXMpLFxuICAgICAgICAgICAgdG9wYmFyID0gJHRoaXMuY2xvc2VzdCgnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJ10nKSxcbiAgICAgICAgICAgIHNlY3Rpb24gPSB0b3BiYXIuZmluZCgnc2VjdGlvbiwgLnRvcC1iYXItc2VjdGlvbicpLFxuICAgICAgICAgICAgc2V0dGluZ3MgPSB0b3BiYXIuZGF0YShzZWxmLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpLFxuICAgICAgICAgICAgJG1vdmVkTGkgPSAkdGhpcy5jbG9zZXN0KCdsaS5tb3ZlZCcpLFxuICAgICAgICAgICAgJHByZXZpb3VzTGV2ZWxVbCA9ICRtb3ZlZExpLnBhcmVudCgpO1xuXG4gICAgICAgIHRvcGJhci5kYXRhKCdpbmRleCcsIHRvcGJhci5kYXRhKCdpbmRleCcpIC0gMSk7XG5cbiAgICAgICAgaWYgKCFzZWxmLnJ0bCkge1xuICAgICAgICAgIHNlY3Rpb24uY3NzKHtsZWZ0IDogLSgxMDAgKiB0b3BiYXIuZGF0YSgnaW5kZXgnKSkgKyAnJSd9KTtcbiAgICAgICAgICBzZWN0aW9uLmZpbmQoJz4ubmFtZScpLmNzcyh7bGVmdCA6IDEwMCAqIHRvcGJhci5kYXRhKCdpbmRleCcpICsgJyUnfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VjdGlvbi5jc3Moe3JpZ2h0IDogLSgxMDAgKiB0b3BiYXIuZGF0YSgnaW5kZXgnKSkgKyAnJSd9KTtcbiAgICAgICAgICBzZWN0aW9uLmZpbmQoJz4ubmFtZScpLmNzcyh7cmlnaHQgOiAxMDAgKiB0b3BiYXIuZGF0YSgnaW5kZXgnKSArICclJ30pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRvcGJhci5kYXRhKCdpbmRleCcpID09PSAwKSB7XG4gICAgICAgICAgdG9wYmFyLmNzcygnaGVpZ2h0JywgJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRvcGJhci5jc3MoJ2hlaWdodCcsICRwcmV2aW91c0xldmVsVWwub3V0ZXJIZWlnaHQodHJ1ZSkgKyB0b3BiYXIuZGF0YSgnaGVpZ2h0JykpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgJG1vdmVkTGkucmVtb3ZlQ2xhc3MoJ21vdmVkJyk7XG4gICAgICAgIH0sIDMwMCk7XG4gICAgICB9KTtcblxuICAgICAgLy8gU2hvdyBkcm9wZG93biBtZW51cyB3aGVuIHRoZWlyIGl0ZW1zIGFyZSBmb2N1c2VkXG4gICAgICBTKHRoaXMuc2NvcGUpLmZpbmQoJy5kcm9wZG93biBhJylcbiAgICAgICAgLmZvY3VzKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAkKHRoaXMpLnBhcmVudHMoJy5oYXMtZHJvcGRvd24nKS5hZGRDbGFzcygnaG92ZXInKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmJsdXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICQodGhpcykucGFyZW50cygnLmhhcy1kcm9wZG93bicpLnJlbW92ZUNsYXNzKCdob3ZlcicpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgcmVzaXplIDogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgc2VsZi5TKCdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdG9wYmFyID0gc2VsZi5TKHRoaXMpLFxuICAgICAgICAgICAgc2V0dGluZ3MgPSB0b3BiYXIuZGF0YShzZWxmLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpO1xuXG4gICAgICAgIHZhciBzdGlja3lDb250YWluZXIgPSB0b3BiYXIucGFyZW50KCcuJyArIHNlbGYuc2V0dGluZ3Muc3RpY2t5X2NsYXNzKTtcbiAgICAgICAgdmFyIHN0aWNreU9mZnNldDtcblxuICAgICAgICBpZiAoIXNlbGYuYnJlYWtwb2ludCgpKSB7XG4gICAgICAgICAgdmFyIGRvVG9nZ2xlID0gdG9wYmFyLmhhc0NsYXNzKCdleHBhbmRlZCcpO1xuICAgICAgICAgIHRvcGJhclxuICAgICAgICAgICAgLmNzcygnaGVpZ2h0JywgJycpXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2V4cGFuZGVkJylcbiAgICAgICAgICAgIC5maW5kKCdsaScpXG4gICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2hvdmVyJyk7XG5cbiAgICAgICAgICAgIGlmIChkb1RvZ2dsZSkge1xuICAgICAgICAgICAgICBzZWxmLnRvZ2dsZSh0b3BiYXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNlbGYuaXNfc3RpY2t5KHRvcGJhciwgc3RpY2t5Q29udGFpbmVyLCBzZXR0aW5ncykpIHtcbiAgICAgICAgICBpZiAoc3RpY2t5Q29udGFpbmVyLmhhc0NsYXNzKCdmaXhlZCcpKSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgdGhlIGZpeGVkIHRvIGFsbG93IGZvciBjb3JyZWN0IGNhbGN1bGF0aW9uIG9mIHRoZSBvZmZzZXQuXG4gICAgICAgICAgICBzdGlja3lDb250YWluZXIucmVtb3ZlQ2xhc3MoJ2ZpeGVkJyk7XG5cbiAgICAgICAgICAgIHN0aWNreU9mZnNldCA9IHN0aWNreUNvbnRhaW5lci5vZmZzZXQoKS50b3A7XG4gICAgICAgICAgICBpZiAoc2VsZi5TKGRvY3VtZW50LmJvZHkpLmhhc0NsYXNzKCdmLXRvcGJhci1maXhlZCcpKSB7XG4gICAgICAgICAgICAgIHN0aWNreU9mZnNldCAtPSB0b3BiYXIuZGF0YSgnaGVpZ2h0Jyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRvcGJhci5kYXRhKCdzdGlja3lvZmZzZXQnLCBzdGlja3lPZmZzZXQpO1xuICAgICAgICAgICAgc3RpY2t5Q29udGFpbmVyLmFkZENsYXNzKCdmaXhlZCcpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdGlja3lPZmZzZXQgPSBzdGlja3lDb250YWluZXIub2Zmc2V0KCkudG9wO1xuICAgICAgICAgICAgdG9wYmFyLmRhdGEoJ3N0aWNreW9mZnNldCcsIHN0aWNreU9mZnNldCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBicmVha3BvaW50IDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuICFtYXRjaE1lZGlhKEZvdW5kYXRpb24ubWVkaWFfcXVlcmllc1sndG9wYmFyJ10pLm1hdGNoZXM7XG4gICAgfSxcblxuICAgIHNtYWxsIDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIG1hdGNoTWVkaWEoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzWydzbWFsbCddKS5tYXRjaGVzO1xuICAgIH0sXG5cbiAgICBtZWRpdW0gOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gbWF0Y2hNZWRpYShGb3VuZGF0aW9uLm1lZGlhX3F1ZXJpZXNbJ21lZGl1bSddKS5tYXRjaGVzO1xuICAgIH0sXG5cbiAgICBsYXJnZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBtYXRjaE1lZGlhKEZvdW5kYXRpb24ubWVkaWFfcXVlcmllc1snbGFyZ2UnXSkubWF0Y2hlcztcbiAgICB9LFxuXG4gICAgYXNzZW1ibGUgOiBmdW5jdGlvbiAodG9wYmFyKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgc2V0dGluZ3MgPSB0b3BiYXIuZGF0YSh0aGlzLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpLFxuICAgICAgICAgIHNlY3Rpb24gPSBzZWxmLlMoJ3NlY3Rpb24sIC50b3AtYmFyLXNlY3Rpb24nLCB0b3BiYXIpO1xuXG4gICAgICAvLyBQdWxsIGVsZW1lbnQgb3V0IG9mIHRoZSBET00gZm9yIG1hbmlwdWxhdGlvblxuICAgICAgc2VjdGlvbi5kZXRhY2goKTtcblxuICAgICAgc2VsZi5TKCcuaGFzLWRyb3Bkb3duPmEnLCBzZWN0aW9uKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyICRsaW5rID0gc2VsZi5TKHRoaXMpLFxuICAgICAgICAgICAgJGRyb3Bkb3duID0gJGxpbmsuc2libGluZ3MoJy5kcm9wZG93bicpLFxuICAgICAgICAgICAgdXJsID0gJGxpbmsuYXR0cignaHJlZicpLFxuICAgICAgICAgICAgJHRpdGxlTGk7XG5cbiAgICAgICAgaWYgKCEkZHJvcGRvd24uZmluZCgnLnRpdGxlLmJhY2snKS5sZW5ndGgpIHtcblxuICAgICAgICAgIGlmIChzZXR0aW5ncy5tb2JpbGVfc2hvd19wYXJlbnRfbGluayA9PSB0cnVlICYmIHVybCkge1xuICAgICAgICAgICAgJHRpdGxlTGkgPSAkKCc8bGkgY2xhc3M9XCJ0aXRsZSBiYWNrIGpzLWdlbmVyYXRlZFwiPjxoNT48YSBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApXCI+PC9hPjwvaDU+PC9saT48bGkgY2xhc3M9XCJwYXJlbnQtbGluayBoaWRlLWZvci1sYXJnZS11cFwiPjxhIGNsYXNzPVwicGFyZW50LWxpbmsganMtZ2VuZXJhdGVkXCIgaHJlZj1cIicgKyB1cmwgKyAnXCI+JyArICRsaW5rLmh0bWwoKSArJzwvYT48L2xpPicpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkdGl0bGVMaSA9ICQoJzxsaSBjbGFzcz1cInRpdGxlIGJhY2sganMtZ2VuZXJhdGVkXCI+PGg1PjxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMClcIj48L2E+PC9oNT4nKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBDb3B5IGxpbmsgdG8gc3VibmF2XG4gICAgICAgICAgaWYgKHNldHRpbmdzLmN1c3RvbV9iYWNrX3RleHQgPT0gdHJ1ZSkge1xuICAgICAgICAgICAgJCgnaDU+YScsICR0aXRsZUxpKS5odG1sKHNldHRpbmdzLmJhY2tfdGV4dCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoJ2g1PmEnLCAkdGl0bGVMaSkuaHRtbCgnJmxhcXVvOyAnICsgJGxpbmsuaHRtbCgpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgJGRyb3Bkb3duLnByZXBlbmQoJHRpdGxlTGkpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gUHV0IGVsZW1lbnQgYmFjayBpbiB0aGUgRE9NXG4gICAgICBzZWN0aW9uLmFwcGVuZFRvKHRvcGJhcik7XG5cbiAgICAgIC8vIGNoZWNrIGZvciBzdGlja3lcbiAgICAgIHRoaXMuc3RpY2t5KCk7XG5cbiAgICAgIHRoaXMuYXNzZW1ibGVkKHRvcGJhcik7XG4gICAgfSxcblxuICAgIGFzc2VtYmxlZCA6IGZ1bmN0aW9uICh0b3BiYXIpIHtcbiAgICAgIHRvcGJhci5kYXRhKHRoaXMuYXR0cl9uYW1lKHRydWUpLCAkLmV4dGVuZCh7fSwgdG9wYmFyLmRhdGEodGhpcy5hdHRyX25hbWUodHJ1ZSkpLCB7YXNzZW1ibGVkIDogdHJ1ZX0pKTtcbiAgICB9LFxuXG4gICAgaGVpZ2h0IDogZnVuY3Rpb24gKHVsKSB7XG4gICAgICB2YXIgdG90YWwgPSAwLFxuICAgICAgICAgIHNlbGYgPSB0aGlzO1xuXG4gICAgICAkKCc+IGxpJywgdWwpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICB0b3RhbCArPSBzZWxmLlModGhpcykub3V0ZXJIZWlnaHQodHJ1ZSk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHRvdGFsO1xuICAgIH0sXG5cbiAgICBzdGlja3kgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIHRoaXMuUyh3aW5kb3cpLm9uKCdzY3JvbGwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYudXBkYXRlX3N0aWNreV9wb3NpdGlvbmluZygpO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHVwZGF0ZV9zdGlja3lfcG9zaXRpb25pbmcgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIga2xhc3MgPSAnLicgKyB0aGlzLnNldHRpbmdzLnN0aWNreV9jbGFzcyxcbiAgICAgICAgICAkd2luZG93ID0gdGhpcy5TKHdpbmRvdyksXG4gICAgICAgICAgc2VsZiA9IHRoaXM7XG5cbiAgICAgIGlmIChzZWxmLnNldHRpbmdzLnN0aWNreV90b3BiYXIgJiYgc2VsZi5pc19zdGlja3kodGhpcy5zZXR0aW5ncy5zdGlja3lfdG9wYmFyLCB0aGlzLnNldHRpbmdzLnN0aWNreV90b3BiYXIucGFyZW50KCksIHRoaXMuc2V0dGluZ3MpKSB7XG4gICAgICAgIHZhciBkaXN0YW5jZSA9IHRoaXMuc2V0dGluZ3Muc3RpY2t5X3RvcGJhci5kYXRhKCdzdGlja3lvZmZzZXQnKTtcbiAgICAgICAgaWYgKCFzZWxmLlMoa2xhc3MpLmhhc0NsYXNzKCdleHBhbmRlZCcpKSB7XG4gICAgICAgICAgaWYgKCR3aW5kb3cuc2Nyb2xsVG9wKCkgPiAoZGlzdGFuY2UpKSB7XG4gICAgICAgICAgICBpZiAoIXNlbGYuUyhrbGFzcykuaGFzQ2xhc3MoJ2ZpeGVkJykpIHtcbiAgICAgICAgICAgICAgc2VsZi5TKGtsYXNzKS5hZGRDbGFzcygnZml4ZWQnKTtcbiAgICAgICAgICAgICAgc2VsZi5TKCdib2R5JykuYWRkQ2xhc3MoJ2YtdG9wYmFyLWZpeGVkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmICgkd2luZG93LnNjcm9sbFRvcCgpIDw9IGRpc3RhbmNlKSB7XG4gICAgICAgICAgICBpZiAoc2VsZi5TKGtsYXNzKS5oYXNDbGFzcygnZml4ZWQnKSkge1xuICAgICAgICAgICAgICBzZWxmLlMoa2xhc3MpLnJlbW92ZUNsYXNzKCdmaXhlZCcpO1xuICAgICAgICAgICAgICBzZWxmLlMoJ2JvZHknKS5yZW1vdmVDbGFzcygnZi10b3BiYXItZml4ZWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgb2ZmIDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5TKHRoaXMuc2NvcGUpLm9mZignLmZuZHRuLnRvcGJhcicpO1xuICAgICAgdGhpcy5TKHdpbmRvdykub2ZmKCcuZm5kdG4udG9wYmFyJyk7XG4gICAgfSxcblxuICAgIHJlZmxvdyA6IGZ1bmN0aW9uICgpIHt9XG4gIH07XG59KGpRdWVyeSwgd2luZG93LCB3aW5kb3cuZG9jdW1lbnQpKTtcbiIsIjsoZnVuY3Rpb24gKCQsIHdpbmRvdywgZG9jdW1lbnQsIHVuZGVmaW5lZCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgRm91bmRhdGlvbi5saWJzLnRvcGJhciA9IHtcbiAgICBuYW1lIDogJ3RvcGJhcicsXG5cbiAgICB2ZXJzaW9uIDogJzUuNS4xJyxcblxuICAgIHNldHRpbmdzIDoge1xuICAgICAgaW5kZXggOiAwLFxuICAgICAgc3RpY2t5X2NsYXNzIDogJ3N0aWNreScsXG4gICAgICBjdXN0b21fYmFja190ZXh0IDogdHJ1ZSxcbiAgICAgIGJhY2tfdGV4dCA6ICdCYWNrJyxcbiAgICAgIG1vYmlsZV9zaG93X3BhcmVudF9saW5rIDogdHJ1ZSxcbiAgICAgIGlzX2hvdmVyIDogdHJ1ZSxcbiAgICAgIHNjcm9sbHRvcCA6IHRydWUsIC8vIGp1bXAgdG8gdG9wIHdoZW4gc3RpY2t5IG5hdiBtZW51IHRvZ2dsZSBpcyBjbGlja2VkXG4gICAgICBzdGlja3lfb24gOiAnYWxsJ1xuICAgIH0sXG5cbiAgICBpbml0IDogZnVuY3Rpb24gKHNlY3Rpb24sIG1ldGhvZCwgb3B0aW9ucykge1xuICAgICAgRm91bmRhdGlvbi5pbmhlcml0KHRoaXMsICdhZGRfY3VzdG9tX3J1bGUgcmVnaXN0ZXJfbWVkaWEgdGhyb3R0bGUnKTtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgc2VsZi5yZWdpc3Rlcl9tZWRpYSgndG9wYmFyJywgJ2ZvdW5kYXRpb24tbXEtdG9wYmFyJyk7XG5cbiAgICAgIHRoaXMuYmluZGluZ3MobWV0aG9kLCBvcHRpb25zKTtcblxuICAgICAgc2VsZi5TKCdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXScsIHRoaXMuc2NvcGUpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdG9wYmFyID0gJCh0aGlzKSxcbiAgICAgICAgICAgIHNldHRpbmdzID0gdG9wYmFyLmRhdGEoc2VsZi5hdHRyX25hbWUodHJ1ZSkgKyAnLWluaXQnKSxcbiAgICAgICAgICAgIHNlY3Rpb24gPSBzZWxmLlMoJ3NlY3Rpb24sIC50b3AtYmFyLXNlY3Rpb24nLCB0aGlzKTtcbiAgICAgICAgdG9wYmFyLmRhdGEoJ2luZGV4JywgMCk7XG4gICAgICAgIHZhciB0b3BiYXJDb250YWluZXIgPSB0b3BiYXIucGFyZW50KCk7XG4gICAgICAgIGlmICh0b3BiYXJDb250YWluZXIuaGFzQ2xhc3MoJ2ZpeGVkJykgfHwgc2VsZi5pc19zdGlja3kodG9wYmFyLCB0b3BiYXJDb250YWluZXIsIHNldHRpbmdzKSApIHtcbiAgICAgICAgICBzZWxmLnNldHRpbmdzLnN0aWNreV9jbGFzcyA9IHNldHRpbmdzLnN0aWNreV9jbGFzcztcbiAgICAgICAgICBzZWxmLnNldHRpbmdzLnN0aWNreV90b3BiYXIgPSB0b3BiYXI7XG4gICAgICAgICAgdG9wYmFyLmRhdGEoJ2hlaWdodCcsIHRvcGJhckNvbnRhaW5lci5vdXRlckhlaWdodCgpKTtcbiAgICAgICAgICB0b3BiYXIuZGF0YSgnc3RpY2t5b2Zmc2V0JywgdG9wYmFyQ29udGFpbmVyLm9mZnNldCgpLnRvcCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdG9wYmFyLmRhdGEoJ2hlaWdodCcsIHRvcGJhci5vdXRlckhlaWdodCgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc2V0dGluZ3MuYXNzZW1ibGVkKSB7XG4gICAgICAgICAgc2VsZi5hc3NlbWJsZSh0b3BiYXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNldHRpbmdzLmlzX2hvdmVyKSB7XG4gICAgICAgICAgc2VsZi5TKCcuaGFzLWRyb3Bkb3duJywgdG9wYmFyKS5hZGRDbGFzcygnbm90LWNsaWNrJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VsZi5TKCcuaGFzLWRyb3Bkb3duJywgdG9wYmFyKS5yZW1vdmVDbGFzcygnbm90LWNsaWNrJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQYWQgYm9keSB3aGVuIHN0aWNreSAoc2Nyb2xsZWQpIG9yIGZpeGVkLlxuICAgICAgICBzZWxmLmFkZF9jdXN0b21fcnVsZSgnLmYtdG9wYmFyLWZpeGVkIHsgcGFkZGluZy10b3A6ICcgKyB0b3BiYXIuZGF0YSgnaGVpZ2h0JykgKyAncHggfScpO1xuXG4gICAgICAgIGlmICh0b3BiYXJDb250YWluZXIuaGFzQ2xhc3MoJ2ZpeGVkJykpIHtcbiAgICAgICAgICBzZWxmLlMoJ2JvZHknKS5hZGRDbGFzcygnZi10b3BiYXItZml4ZWQnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB9LFxuXG4gICAgaXNfc3RpY2t5IDogZnVuY3Rpb24gKHRvcGJhciwgdG9wYmFyQ29udGFpbmVyLCBzZXR0aW5ncykge1xuICAgICAgdmFyIHN0aWNreSAgICAgPSB0b3BiYXJDb250YWluZXIuaGFzQ2xhc3Moc2V0dGluZ3Muc3RpY2t5X2NsYXNzKTtcbiAgICAgIHZhciBzbWFsbE1hdGNoID0gbWF0Y2hNZWRpYShGb3VuZGF0aW9uLm1lZGlhX3F1ZXJpZXMuc21hbGwpLm1hdGNoZXM7XG4gICAgICB2YXIgbWVkTWF0Y2ggICA9IG1hdGNoTWVkaWEoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzLm1lZGl1bSkubWF0Y2hlcztcbiAgICAgIHZhciBscmdNYXRjaCAgID0gbWF0Y2hNZWRpYShGb3VuZGF0aW9uLm1lZGlhX3F1ZXJpZXMubGFyZ2UpLm1hdGNoZXM7XG4gICAgICBcbiAgICAgICBpZiAoc3RpY2t5ICYmIHNldHRpbmdzLnN0aWNreV9vbiA9PT0gJ2FsbCcpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICB9XG4gICAgICAgaWYgKHN0aWNreSAmJiB0aGlzLnNtYWxsKCkgJiYgc2V0dGluZ3Muc3RpY2t5X29uLmluZGV4T2YoJ3NtYWxsJykgIT09IC0xKSB7XG4gICAgICAgICAgIGlmIChzbWFsbE1hdGNoICYmICFtZWRNYXRjaCAmJiAhbHJnTWF0Y2gpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICB9XG4gICAgICAgaWYgKHN0aWNreSAmJiB0aGlzLm1lZGl1bSgpICYmIHNldHRpbmdzLnN0aWNreV9vbi5pbmRleE9mKCdtZWRpdW0nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgaWYgKHNtYWxsTWF0Y2ggJiYgbWVkTWF0Y2ggJiYgIWxyZ01hdGNoKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgfVxuICAgICAgIGlmIChzdGlja3kgJiYgdGhpcy5sYXJnZSgpICYmIHNldHRpbmdzLnN0aWNreV9vbi5pbmRleE9mKCdsYXJnZScpICE9PSAtMSkge1xuICAgICAgICAgICBpZiAoc21hbGxNYXRjaCAmJiBtZWRNYXRjaCAmJiBscmdNYXRjaCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgIH1cblxuICAgICAgIC8vIGZpeCBmb3IgaU9TIGJyb3dzZXJzXG4gICAgICAgaWYgKHN0aWNreSAmJiBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC8oaVBhZHxpUGhvbmV8aVBvZCkvZykpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgfVxuICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgdG9nZ2xlIDogZnVuY3Rpb24gKHRvZ2dsZUVsKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICAgICAgdG9wYmFyO1xuXG4gICAgICBpZiAodG9nZ2xlRWwpIHtcbiAgICAgICAgdG9wYmFyID0gc2VsZi5TKHRvZ2dsZUVsKS5jbG9zZXN0KCdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdG9wYmFyID0gc2VsZi5TKCdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXScpO1xuICAgICAgfVxuXG4gICAgICB2YXIgc2V0dGluZ3MgPSB0b3BiYXIuZGF0YSh0aGlzLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpO1xuXG4gICAgICB2YXIgc2VjdGlvbiA9IHNlbGYuUygnc2VjdGlvbiwgLnRvcC1iYXItc2VjdGlvbicsIHRvcGJhcik7XG5cbiAgICAgIGlmIChzZWxmLmJyZWFrcG9pbnQoKSkge1xuICAgICAgICBpZiAoIXNlbGYucnRsKSB7XG4gICAgICAgICAgc2VjdGlvbi5jc3Moe2xlZnQgOiAnMCUnfSk7XG4gICAgICAgICAgJCgnPi5uYW1lJywgc2VjdGlvbikuY3NzKHtsZWZ0IDogJzEwMCUnfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VjdGlvbi5jc3Moe3JpZ2h0IDogJzAlJ30pO1xuICAgICAgICAgICQoJz4ubmFtZScsIHNlY3Rpb24pLmNzcyh7cmlnaHQgOiAnMTAwJSd9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuUygnbGkubW92ZWQnLCBzZWN0aW9uKS5yZW1vdmVDbGFzcygnbW92ZWQnKTtcbiAgICAgICAgdG9wYmFyLmRhdGEoJ2luZGV4JywgMCk7XG5cbiAgICAgICAgdG9wYmFyXG4gICAgICAgICAgLnRvZ2dsZUNsYXNzKCdleHBhbmRlZCcpXG4gICAgICAgICAgLmNzcygnaGVpZ2h0JywgJycpO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2V0dGluZ3Muc2Nyb2xsdG9wKSB7XG4gICAgICAgIGlmICghdG9wYmFyLmhhc0NsYXNzKCdleHBhbmRlZCcpKSB7XG4gICAgICAgICAgaWYgKHRvcGJhci5oYXNDbGFzcygnZml4ZWQnKSkge1xuICAgICAgICAgICAgdG9wYmFyLnBhcmVudCgpLmFkZENsYXNzKCdmaXhlZCcpO1xuICAgICAgICAgICAgdG9wYmFyLnJlbW92ZUNsYXNzKCdmaXhlZCcpO1xuICAgICAgICAgICAgc2VsZi5TKCdib2R5JykuYWRkQ2xhc3MoJ2YtdG9wYmFyLWZpeGVkJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRvcGJhci5wYXJlbnQoKS5oYXNDbGFzcygnZml4ZWQnKSkge1xuICAgICAgICAgIGlmIChzZXR0aW5ncy5zY3JvbGx0b3ApIHtcbiAgICAgICAgICAgIHRvcGJhci5wYXJlbnQoKS5yZW1vdmVDbGFzcygnZml4ZWQnKTtcbiAgICAgICAgICAgIHRvcGJhci5hZGRDbGFzcygnZml4ZWQnKTtcbiAgICAgICAgICAgIHNlbGYuUygnYm9keScpLnJlbW92ZUNsYXNzKCdmLXRvcGJhci1maXhlZCcpO1xuXG4gICAgICAgICAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgMCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRvcGJhci5wYXJlbnQoKS5yZW1vdmVDbGFzcygnZXhwYW5kZWQnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChzZWxmLmlzX3N0aWNreSh0b3BiYXIsIHRvcGJhci5wYXJlbnQoKSwgc2V0dGluZ3MpKSB7XG4gICAgICAgICAgdG9wYmFyLnBhcmVudCgpLmFkZENsYXNzKCdmaXhlZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRvcGJhci5wYXJlbnQoKS5oYXNDbGFzcygnZml4ZWQnKSkge1xuICAgICAgICAgIGlmICghdG9wYmFyLmhhc0NsYXNzKCdleHBhbmRlZCcpKSB7XG4gICAgICAgICAgICB0b3BiYXIucmVtb3ZlQ2xhc3MoJ2ZpeGVkJyk7XG4gICAgICAgICAgICB0b3BiYXIucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ2V4cGFuZGVkJyk7XG4gICAgICAgICAgICBzZWxmLnVwZGF0ZV9zdGlja3lfcG9zaXRpb25pbmcoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9wYmFyLmFkZENsYXNzKCdmaXhlZCcpO1xuICAgICAgICAgICAgdG9wYmFyLnBhcmVudCgpLmFkZENsYXNzKCdleHBhbmRlZCcpO1xuICAgICAgICAgICAgc2VsZi5TKCdib2R5JykuYWRkQ2xhc3MoJ2YtdG9wYmFyLWZpeGVkJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIHRpbWVyIDogbnVsbCxcblxuICAgIGV2ZW50cyA6IGZ1bmN0aW9uIChiYXIpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICBTID0gdGhpcy5TO1xuXG4gICAgICBTKHRoaXMuc2NvcGUpXG4gICAgICAgIC5vZmYoJy50b3BiYXInKVxuICAgICAgICAub24oJ2NsaWNrLmZuZHRuLnRvcGJhcicsICdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXSAudG9nZ2xlLXRvcGJhcicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHNlbGYudG9nZ2xlKHRoaXMpO1xuICAgICAgICB9KVxuICAgICAgICAub24oJ2NsaWNrLmZuZHRuLnRvcGJhcicsICcudG9wLWJhciAudG9wLWJhci1zZWN0aW9uIGxpIGFbaHJlZl49XCIjXCJdLFsnICsgdGhpcy5hdHRyX25hbWUoKSArICddIC50b3AtYmFyLXNlY3Rpb24gbGkgYVtocmVmXj1cIiNcIl0nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdmFyIGxpID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpO1xuICAgICAgICAgICAgaWYgKHNlbGYuYnJlYWtwb2ludCgpICYmICFsaS5oYXNDbGFzcygnYmFjaycpICYmICFsaS5oYXNDbGFzcygnaGFzLWRyb3Bkb3duJykpIHtcbiAgICAgICAgICAgICAgc2VsZi50b2dnbGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdjbGljay5mbmR0bi50b3BiYXInLCAnWycgKyB0aGlzLmF0dHJfbmFtZSgpICsgJ10gbGkuaGFzLWRyb3Bkb3duJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICB2YXIgbGkgPSBTKHRoaXMpLFxuICAgICAgICAgICAgICB0YXJnZXQgPSBTKGUudGFyZ2V0KSxcbiAgICAgICAgICAgICAgdG9wYmFyID0gbGkuY2xvc2VzdCgnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJ10nKSxcbiAgICAgICAgICAgICAgc2V0dGluZ3MgPSB0b3BiYXIuZGF0YShzZWxmLmF0dHJfbmFtZSh0cnVlKSArICctaW5pdCcpO1xuXG4gICAgICAgICAgaWYgKHRhcmdldC5kYXRhKCdyZXZlYWxJZCcpKSB7XG4gICAgICAgICAgICBzZWxmLnRvZ2dsZSgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChzZWxmLmJyZWFrcG9pbnQoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChzZXR0aW5ncy5pc19ob3ZlciAmJiAhTW9kZXJuaXpyLnRvdWNoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcblxuICAgICAgICAgIGlmIChsaS5oYXNDbGFzcygnaG92ZXInKSkge1xuICAgICAgICAgICAgbGlcbiAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdob3ZlcicpXG4gICAgICAgICAgICAgIC5maW5kKCdsaScpXG4gICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnaG92ZXInKTtcblxuICAgICAgICAgICAgbGkucGFyZW50cygnbGkuaG92ZXInKVxuICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2hvdmVyJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxpLmFkZENsYXNzKCdob3ZlcicpO1xuXG4gICAgICAgICAgICAkKGxpKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKCdob3ZlcicpO1xuXG4gICAgICAgICAgICBpZiAodGFyZ2V0WzBdLm5vZGVOYW1lID09PSAnQScgJiYgdGFyZ2V0LnBhcmVudCgpLmhhc0NsYXNzKCdoYXMtZHJvcGRvd24nKSkge1xuICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAub24oJ2NsaWNrLmZuZHRuLnRvcGJhcicsICdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXSAuaGFzLWRyb3Bkb3duPmEnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgIGlmIChzZWxmLmJyZWFrcG9pbnQoKSkge1xuXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIHZhciAkdGhpcyA9IFModGhpcyksXG4gICAgICAgICAgICAgICAgdG9wYmFyID0gJHRoaXMuY2xvc2VzdCgnWycgKyBzZWxmLmF0dHJfbmFtZSgpICsgJ10nKSxcbiAgICAgICAgICAgICAgICBzZWN0aW9uID0gdG9wYmFyLmZpbmQoJ3NlY3Rpb24sIC50b3AtYmFyLXNlY3Rpb24nKSxcbiAgICAgICAgICAgICAgICBkcm9wZG93bkhlaWdodCA9ICR0aGlzLm5leHQoJy5kcm9wZG93bicpLm91dGVySGVpZ2h0KCksXG4gICAgICAgICAgICAgICAgJHNlbGVjdGVkTGkgPSAkdGhpcy5jbG9zZXN0KCdsaScpO1xuXG4gICAgICAgICAgICB0b3BiYXIuZGF0YSgnaW5kZXgnLCB0b3BiYXIuZGF0YSgnaW5kZXgnKSArIDEpO1xuICAgICAgICAgICAgJHNlbGVjdGVkTGkuYWRkQ2xhc3MoJ21vdmVkJyk7XG5cbiAgICAgICAgICAgIGlmICghc2VsZi5ydGwpIHtcbiAgICAgICAgICAgICAgc2VjdGlvbi5jc3Moe2xlZnQgOiAtKDEwMCAqIHRvcGJhci5kYXRhKCdpbmRleCcpKSArICclJ30pO1xuICAgICAgICAgICAgICBzZWN0aW9uLmZpbmQoJz4ubmFtZScpLmNzcyh7bGVmdCA6IDEwMCAqIHRvcGJhci5kYXRhKCdpbmRleCcpICsgJyUnfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzZWN0aW9uLmNzcyh7cmlnaHQgOiAtKDEwMCAqIHRvcGJhci5kYXRhKCdpbmRleCcpKSArICclJ30pO1xuICAgICAgICAgICAgICBzZWN0aW9uLmZpbmQoJz4ubmFtZScpLmNzcyh7cmlnaHQgOiAxMDAgKiB0b3BiYXIuZGF0YSgnaW5kZXgnKSArICclJ30pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0b3BiYXIuY3NzKCdoZWlnaHQnLCAkdGhpcy5zaWJsaW5ncygndWwnKS5vdXRlckhlaWdodCh0cnVlKSArIHRvcGJhci5kYXRhKCdoZWlnaHQnKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgUyh3aW5kb3cpLm9mZignLnRvcGJhcicpLm9uKCdyZXNpemUuZm5kdG4udG9wYmFyJywgc2VsZi50aHJvdHRsZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgc2VsZi5yZXNpemUuY2FsbChzZWxmKTtcbiAgICAgIH0sIDUwKSkudHJpZ2dlcigncmVzaXplJykudHJpZ2dlcigncmVzaXplLmZuZHRuLnRvcGJhcicpLmxvYWQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBvZmZzZXQgaXMgY2FsY3VsYXRlZCBhZnRlciBhbGwgb2YgdGhlIHBhZ2VzIHJlc291cmNlcyBoYXZlIGxvYWRlZFxuICAgICAgICAgIFModGhpcykudHJpZ2dlcigncmVzaXplLmZuZHRuLnRvcGJhcicpO1xuICAgICAgfSk7XG5cbiAgICAgIFMoJ2JvZHknKS5vZmYoJy50b3BiYXInKS5vbignY2xpY2suZm5kdG4udG9wYmFyJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IFMoZS50YXJnZXQpLmNsb3Nlc3QoJ2xpJykuY2xvc2VzdCgnbGkuaG92ZXInKTtcblxuICAgICAgICBpZiAocGFyZW50Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBTKCdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnXSBsaS5ob3ZlcicpLnJlbW92ZUNsYXNzKCdob3ZlcicpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIEdvIHVwIGEgbGV2ZWwgb24gQ2xpY2tcbiAgICAgIFModGhpcy5zY29wZSkub24oJ2NsaWNrLmZuZHRuLnRvcGJhcicsICdbJyArIHRoaXMuYXR0cl9uYW1lKCkgKyAnXSAuaGFzLWRyb3Bkb3duIC5iYWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHZhciAkdGhpcyA9IFModGhpcyksXG4gICAgICAgICAgICB0b3BiYXIgPSAkdGhpcy5jbG9zZXN0KCdbJyArIHNlbGYuYXR0cl9uYW1lKCkgKyAnXScpLFxuICAgICAgICAgICAgc2VjdGlvbiA9IHRvcGJhci5maW5kKCdzZWN0aW9uLCAudG9wLWJhci1zZWN0aW9uJyksXG4gICAgICAgICAgICBzZXR0aW5ncyA9IHRvcGJhci5kYXRhKHNlbGYuYXR0cl9uYW1lKHRydWUpICsgJy1pbml0JyksXG4gICAgICAgICAgICAkbW92ZWRMaSA9ICR0aGlzLmNsb3Nlc3QoJ2xpLm1vdmVkJyksXG4gICAgICAgICAgICAkcHJldmlvdXNMZXZlbFVsID0gJG1vdmVkTGkucGFyZW50KCk7XG5cbiAgICAgICAgdG9wYmFyLmRhdGEoJ2luZGV4JywgdG9wYmFyLmRhdGEoJ2luZGV4JykgLSAxKTtcblxuICAgICAgICBpZiAoIXNlbGYucnRsKSB7XG4gICAgICAgICAgc2VjdGlvbi5jc3Moe2xlZnQgOiAtKDEwMCAqIHRvcGJhci5kYXRhKCdpbmRleCcpKSArICclJ30pO1xuICAgICAgICAgIHNlY3Rpb24uZmluZCgnPi5uYW1lJykuY3NzKHtsZWZ0IDogMTAwICogdG9wYmFyLmRhdGEoJ2luZGV4JykgKyAnJSd9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWN0aW9uLmNzcyh7cmlnaHQgOiAtKDEwMCAqIHRvcGJhci5kYXRhKCdpbmRleCcpKSArICclJ30pO1xuICAgICAgICAgIHNlY3Rpb24uZmluZCgnPi5uYW1lJykuY3NzKHtyaWdodCA6IDEwMCAqIHRvcGJhci5kYXRhKCdpbmRleCcpICsgJyUnfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodG9wYmFyLmRhdGEoJ2luZGV4JykgPT09IDApIHtcbiAgICAgICAgICB0b3BiYXIuY3NzKCdoZWlnaHQnLCAnJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdG9wYmFyLmNzcygnaGVpZ2h0JywgJHByZXZpb3VzTGV2ZWxVbC5vdXRlckhlaWdodCh0cnVlKSArIHRvcGJhci5kYXRhKCdoZWlnaHQnKSk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAkbW92ZWRMaS5yZW1vdmVDbGFzcygnbW92ZWQnKTtcbiAgICAgICAgfSwgMzAwKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBTaG93IGRyb3Bkb3duIG1lbnVzIHdoZW4gdGhlaXIgaXRlbXMgYXJlIGZvY3VzZWRcbiAgICAgIFModGhpcy5zY29wZSkuZmluZCgnLmRyb3Bkb3duIGEnKVxuICAgICAgICAuZm9jdXMoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICQodGhpcykucGFyZW50cygnLmhhcy1kcm9wZG93bicpLmFkZENsYXNzKCdob3ZlcicpO1xuICAgICAgICB9KVxuICAgICAgICAuYmx1cihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgJCh0aGlzKS5wYXJlbnRzKCcuaGFzLWRyb3Bkb3duJykucmVtb3ZlQ2xhc3MoJ2hvdmVyJyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICByZXNpemUgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICBzZWxmLlMoJ1snICsgdGhpcy5hdHRyX25hbWUoKSArICddJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0b3BiYXIgPSBzZWxmLlModGhpcyksXG4gICAgICAgICAgICBzZXR0aW5ncyA9IHRvcGJhci5kYXRhKHNlbGYuYXR0cl9uYW1lKHRydWUpICsgJy1pbml0Jyk7XG5cbiAgICAgICAgdmFyIHN0aWNreUNvbnRhaW5lciA9IHRvcGJhci5wYXJlbnQoJy4nICsgc2VsZi5zZXR0aW5ncy5zdGlja3lfY2xhc3MpO1xuICAgICAgICB2YXIgc3RpY2t5T2Zmc2V0O1xuXG4gICAgICAgIGlmICghc2VsZi5icmVha3BvaW50KCkpIHtcbiAgICAgICAgICB2YXIgZG9Ub2dnbGUgPSB0b3BiYXIuaGFzQ2xhc3MoJ2V4cGFuZGVkJyk7XG4gICAgICAgICAgdG9wYmFyXG4gICAgICAgICAgICAuY3NzKCdoZWlnaHQnLCAnJylcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnZXhwYW5kZWQnKVxuICAgICAgICAgICAgLmZpbmQoJ2xpJylcbiAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnaG92ZXInKTtcblxuICAgICAgICAgICAgaWYgKGRvVG9nZ2xlKSB7XG4gICAgICAgICAgICAgIHNlbGYudG9nZ2xlKHRvcGJhcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2VsZi5pc19zdGlja3kodG9wYmFyLCBzdGlja3lDb250YWluZXIsIHNldHRpbmdzKSkge1xuICAgICAgICAgIGlmIChzdGlja3lDb250YWluZXIuaGFzQ2xhc3MoJ2ZpeGVkJykpIHtcbiAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgZml4ZWQgdG8gYWxsb3cgZm9yIGNvcnJlY3QgY2FsY3VsYXRpb24gb2YgdGhlIG9mZnNldC5cbiAgICAgICAgICAgIHN0aWNreUNvbnRhaW5lci5yZW1vdmVDbGFzcygnZml4ZWQnKTtcblxuICAgICAgICAgICAgc3RpY2t5T2Zmc2V0ID0gc3RpY2t5Q29udGFpbmVyLm9mZnNldCgpLnRvcDtcbiAgICAgICAgICAgIGlmIChzZWxmLlMoZG9jdW1lbnQuYm9keSkuaGFzQ2xhc3MoJ2YtdG9wYmFyLWZpeGVkJykpIHtcbiAgICAgICAgICAgICAgc3RpY2t5T2Zmc2V0IC09IHRvcGJhci5kYXRhKCdoZWlnaHQnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdG9wYmFyLmRhdGEoJ3N0aWNreW9mZnNldCcsIHN0aWNreU9mZnNldCk7XG4gICAgICAgICAgICBzdGlja3lDb250YWluZXIuYWRkQ2xhc3MoJ2ZpeGVkJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN0aWNreU9mZnNldCA9IHN0aWNreUNvbnRhaW5lci5vZmZzZXQoKS50b3A7XG4gICAgICAgICAgICB0b3BiYXIuZGF0YSgnc3RpY2t5b2Zmc2V0Jywgc3RpY2t5T2Zmc2V0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgfSk7XG4gICAgfSxcblxuICAgIGJyZWFrcG9pbnQgOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gIW1hdGNoTWVkaWEoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzWyd0b3BiYXInXSkubWF0Y2hlcztcbiAgICB9LFxuXG4gICAgc21hbGwgOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gbWF0Y2hNZWRpYShGb3VuZGF0aW9uLm1lZGlhX3F1ZXJpZXNbJ3NtYWxsJ10pLm1hdGNoZXM7XG4gICAgfSxcblxuICAgIG1lZGl1bSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBtYXRjaE1lZGlhKEZvdW5kYXRpb24ubWVkaWFfcXVlcmllc1snbWVkaXVtJ10pLm1hdGNoZXM7XG4gICAgfSxcblxuICAgIGxhcmdlIDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIG1hdGNoTWVkaWEoRm91bmRhdGlvbi5tZWRpYV9xdWVyaWVzWydsYXJnZSddKS5tYXRjaGVzO1xuICAgIH0sXG5cbiAgICBhc3NlbWJsZSA6IGZ1bmN0aW9uICh0b3BiYXIpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgICBzZXR0aW5ncyA9IHRvcGJhci5kYXRhKHRoaXMuYXR0cl9uYW1lKHRydWUpICsgJy1pbml0JyksXG4gICAgICAgICAgc2VjdGlvbiA9IHNlbGYuUygnc2VjdGlvbiwgLnRvcC1iYXItc2VjdGlvbicsIHRvcGJhcik7XG5cbiAgICAgIC8vIFB1bGwgZWxlbWVudCBvdXQgb2YgdGhlIERPTSBmb3IgbWFuaXB1bGF0aW9uXG4gICAgICBzZWN0aW9uLmRldGFjaCgpO1xuXG4gICAgICBzZWxmLlMoJy5oYXMtZHJvcGRvd24+YScsIHNlY3Rpb24pLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgJGxpbmsgPSBzZWxmLlModGhpcyksXG4gICAgICAgICAgICAkZHJvcGRvd24gPSAkbGluay5zaWJsaW5ncygnLmRyb3Bkb3duJyksXG4gICAgICAgICAgICB1cmwgPSAkbGluay5hdHRyKCdocmVmJyksXG4gICAgICAgICAgICAkdGl0bGVMaTtcblxuICAgICAgICBpZiAoISRkcm9wZG93bi5maW5kKCcudGl0bGUuYmFjaycpLmxlbmd0aCkge1xuXG4gICAgICAgICAgaWYgKHNldHRpbmdzLm1vYmlsZV9zaG93X3BhcmVudF9saW5rID09IHRydWUgJiYgdXJsKSB7XG4gICAgICAgICAgICAkdGl0bGVMaSA9ICQoJzxsaSBjbGFzcz1cInRpdGxlIGJhY2sganMtZ2VuZXJhdGVkXCI+PGg1PjxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMClcIj48L2E+PC9oNT48L2xpPjxsaSBjbGFzcz1cInBhcmVudC1saW5rIGhpZGUtZm9yLWxhcmdlLXVwXCI+PGEgY2xhc3M9XCJwYXJlbnQtbGluayBqcy1nZW5lcmF0ZWRcIiBocmVmPVwiJyArIHVybCArICdcIj4nICsgJGxpbmsuaHRtbCgpICsnPC9hPjwvbGk+Jyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICR0aXRsZUxpID0gJCgnPGxpIGNsYXNzPVwidGl0bGUgYmFjayBqcy1nZW5lcmF0ZWRcIj48aDU+PGEgaHJlZj1cImphdmFzY3JpcHQ6dm9pZCgwKVwiPjwvYT48L2g1PicpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIENvcHkgbGluayB0byBzdWJuYXZcbiAgICAgICAgICBpZiAoc2V0dGluZ3MuY3VzdG9tX2JhY2tfdGV4dCA9PSB0cnVlKSB7XG4gICAgICAgICAgICAkKCdoNT5hJywgJHRpdGxlTGkpLmh0bWwoc2V0dGluZ3MuYmFja190ZXh0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnaDU+YScsICR0aXRsZUxpKS5odG1sKCcmbGFxdW87ICcgKyAkbGluay5odG1sKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAkZHJvcGRvd24ucHJlcGVuZCgkdGl0bGVMaSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBQdXQgZWxlbWVudCBiYWNrIGluIHRoZSBET01cbiAgICAgIHNlY3Rpb24uYXBwZW5kVG8odG9wYmFyKTtcblxuICAgICAgLy8gY2hlY2sgZm9yIHN0aWNreVxuICAgICAgdGhpcy5zdGlja3koKTtcblxuICAgICAgdGhpcy5hc3NlbWJsZWQodG9wYmFyKTtcbiAgICB9LFxuXG4gICAgYXNzZW1ibGVkIDogZnVuY3Rpb24gKHRvcGJhcikge1xuICAgICAgdG9wYmFyLmRhdGEodGhpcy5hdHRyX25hbWUodHJ1ZSksICQuZXh0ZW5kKHt9LCB0b3BiYXIuZGF0YSh0aGlzLmF0dHJfbmFtZSh0cnVlKSksIHthc3NlbWJsZWQgOiB0cnVlfSkpO1xuICAgIH0sXG5cbiAgICBoZWlnaHQgOiBmdW5jdGlvbiAodWwpIHtcbiAgICAgIHZhciB0b3RhbCA9IDAsXG4gICAgICAgICAgc2VsZiA9IHRoaXM7XG5cbiAgICAgICQoJz4gbGknLCB1bCkuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRvdGFsICs9IHNlbGYuUyh0aGlzKS5vdXRlckhlaWdodCh0cnVlKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gdG90YWw7XG4gICAgfSxcblxuICAgIHN0aWNreSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgdGhpcy5TKHdpbmRvdykub24oJ3Njcm9sbCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi51cGRhdGVfc3RpY2t5X3Bvc2l0aW9uaW5nKCk7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgdXBkYXRlX3N0aWNreV9wb3NpdGlvbmluZyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBrbGFzcyA9ICcuJyArIHRoaXMuc2V0dGluZ3Muc3RpY2t5X2NsYXNzLFxuICAgICAgICAgICR3aW5kb3cgPSB0aGlzLlMod2luZG93KSxcbiAgICAgICAgICBzZWxmID0gdGhpcztcblxuICAgICAgaWYgKHNlbGYuc2V0dGluZ3Muc3RpY2t5X3RvcGJhciAmJiBzZWxmLmlzX3N0aWNreSh0aGlzLnNldHRpbmdzLnN0aWNreV90b3BiYXIsIHRoaXMuc2V0dGluZ3Muc3RpY2t5X3RvcGJhci5wYXJlbnQoKSwgdGhpcy5zZXR0aW5ncykpIHtcbiAgICAgICAgdmFyIGRpc3RhbmNlID0gdGhpcy5zZXR0aW5ncy5zdGlja3lfdG9wYmFyLmRhdGEoJ3N0aWNreW9mZnNldCcpO1xuICAgICAgICBpZiAoIXNlbGYuUyhrbGFzcykuaGFzQ2xhc3MoJ2V4cGFuZGVkJykpIHtcbiAgICAgICAgICBpZiAoJHdpbmRvdy5zY3JvbGxUb3AoKSA+IChkaXN0YW5jZSkpIHtcbiAgICAgICAgICAgIGlmICghc2VsZi5TKGtsYXNzKS5oYXNDbGFzcygnZml4ZWQnKSkge1xuICAgICAgICAgICAgICBzZWxmLlMoa2xhc3MpLmFkZENsYXNzKCdmaXhlZCcpO1xuICAgICAgICAgICAgICBzZWxmLlMoJ2JvZHknKS5hZGRDbGFzcygnZi10b3BiYXItZml4ZWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKCR3aW5kb3cuc2Nyb2xsVG9wKCkgPD0gZGlzdGFuY2UpIHtcbiAgICAgICAgICAgIGlmIChzZWxmLlMoa2xhc3MpLmhhc0NsYXNzKCdmaXhlZCcpKSB7XG4gICAgICAgICAgICAgIHNlbGYuUyhrbGFzcykucmVtb3ZlQ2xhc3MoJ2ZpeGVkJyk7XG4gICAgICAgICAgICAgIHNlbGYuUygnYm9keScpLnJlbW92ZUNsYXNzKCdmLXRvcGJhci1maXhlZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBvZmYgOiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLlModGhpcy5zY29wZSkub2ZmKCcuZm5kdG4udG9wYmFyJyk7XG4gICAgICB0aGlzLlMod2luZG93KS5vZmYoJy5mbmR0bi50b3BiYXInKTtcbiAgICB9LFxuXG4gICAgcmVmbG93IDogZnVuY3Rpb24gKCkge31cbiAgfTtcbn0oalF1ZXJ5LCB3aW5kb3csIHdpbmRvdy5kb2N1bWVudCkpO1xuIiwiLy8gVGhpcyBpcyB3aGF0IG1ha2VzIHN1cmUgdGhhdCBmb3VuZGF0aW9uIGlzIGludm9rZWRcclxualF1ZXJ5KGRvY3VtZW50KS5mb3VuZGF0aW9uKCk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9