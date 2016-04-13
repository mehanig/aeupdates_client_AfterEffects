 /*
    json2.js
    2015-05-03

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse. This file is provides the ES5 JSON capability to ES3 systems.
    If a project might run on IE8 or earlier, then this file should be included.
    This file does nothing on ES5 systems.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10
                            ? '0' + n
                            : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date
                    ? 'Date(' + this[key] + ')'
                    : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint
    eval, for, this
*/

/*property
    JSON, apply, call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== 'object') {
    JSON = {};
}

(function () {
    'use strict';

    var rx_one = /^[\],:{}\s]*$/,
        rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
        rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
        rx_four = /(?:^|:|,)(?:\s*\[)+/g,
        rx_escapable = /[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10
            ? '0' + n
            : n;
    }

    function this_value() {
        return this.valueOf();
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function () {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear() + '-' +
                        f(this.getUTCMonth() + 1) + '-' +
                        f(this.getUTCDate()) + 'T' +
                        f(this.getUTCHours()) + ':' +
                        f(this.getUTCMinutes()) + ':' +
                        f(this.getUTCSeconds()) + 'Z'
                : null;
        };

        Boolean.prototype.toJSON = this_value;
        Number.prototype.toJSON = this_value;
        String.prototype.toJSON = this_value;
    }

    var gap,
        indent,
        meta,
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        rx_escapable.lastIndex = 0;
        return rx_escapable.test(string)
            ? '"' + string.replace(rx_escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string'
                    ? c
                    : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"'
            : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value)
                ? String(value)
                : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                        ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                        : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (
                                gap
                                    ? ': '
                                    : ':'
                            ) + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (
                                gap
                                    ? ': '
                                    : ':'
                            ) + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                    ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                    : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"': '\\"',
            '\\': '\\\\'
        };
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            rx_dangerous.lastIndex = 0;
            if (rx_dangerous.test(text)) {
                text = text.replace(rx_dangerous, function (a) {
                    return '\\u' +
                            ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (
                rx_one.test(
                    text
                        .replace(rx_two, '@')
                        .replace(rx_three, ']')
                        .replace(rx_four, '')
                )
            ) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());






var updater = this;

/* Creates checker for new version and checks for it
 *
 *  settings: {
 *   url: endpoint returning current available version
 *   current_version: current script version
 *   builder: GUI builder for window, default: Alert
 *       GUI: gui
 *   }
 * */

//dummy implementation
updater.MHNG_parseResp = function (resp) {
    resp = "{a: 1}";
    // var my_JSON_object =  JSON.parse(resp);// now evaluate the string from the file
    // alert(my_JSON_object.toSource());
    return {status: 1, version: '1.2'}
};

updater.MHNG_getCurrEpochTimeInMilSeconds = function () {
    var D = new Date();
    //alert("OK:" + parseInt(D.setUTCDate()));
    return parseInt(D.setUTCDate());
};

updater.MHNG_getPrefs = function () {
    //alert("!!!AAAAAAALALALALALA" + this.MHNG_lastChecked);
    if(app.settings.haveSetting("aeupdates", "last_checked") == false) {
        this.MHNG_lastChecked = this.MHNG_getCurrEpochTimeInMilSeconds();
        }
        else {
            this.MHNG_lastChecked = parseInt(app.settings.getSetting("aeupdates", "last_checked"));
        }
};

updater.MHNG_setPrefs = function () {
    //alert("---->" + this.MHNG_lastChecked);
     app.settings.saveSetting("aeupdates", "last_checked", this.MHNG_lastChecked);
};

//TODO: IMPORTANT SHIT! ВАЖНОЕ ГОВНО АААААААААА
updater.MHNG_WORKING_DIR = Folder.userData.fsName;


/*
 * @method : either "POST" or "GET"
 * @endpoint:  a string representing an URI endpoint for any given API
 * @query: a string to be sent with the request (i.e. 'firstName=Arie&lastName=Stavchansky').
 */

updater.MHNG_webRequest = function(method, endpoint, query)
{
    var response = null,
        wincurl  = this.MHNG_WORKING_DIR + "\\aeupdater" + "\\" + "curl.vbs"; //the path to the .vbs file
        alert(wincurl);
        curlCmd = '';
    try {
        updater.createAeUpdatesFolderIfNone();
        if ( os() == "Win" ) {
            //var vbsFile = new File(this.MHNG_WORKING_DIR + "\\" + "aeupdater" + "\\" + "curl.vbs");
            //vbsFile.open("w");
            //alert("HERE:" + vbsFile.fsName);
            //vbsFile.encoding = "UTF-8";
            //var vbsSrt = 'set namedArgs = WScript.Arguments.Named\nsMethod = namedArgs.Item("Method")\nsUrl = namedArgs.Item("URL")\nsRequest = namedArgs.Item("Query")\nHTTPPost sMethod, sUrl, sRequest\nFunction HTTPPost(sMethod, sUrl, sRequest)\n          set oHTTP = CreateObject("Microsoft.XMLHTTP")\n    If sMethod = "POST" Then\n        oHTTP.open "POST", sUrl,false\n    ElseIf sMethod = "GET" Then\n        oHTTP.open "GET", sUrl,false\n    End If\n          oHTTP.setRequestHeader "Content-Type", "application/x-www-form-urlencoded"\n          oHTTP.setRequestHeader "Content-Length", Len(sRequest)\n          oHTTP.send sRequest\n          HTTPPost = oHTTP.responseText\n          WScript.Echo HTTPPost\nEnd Function';
            //vbsFile.write(vbsSrt);
            //vbsFile.close();
            query = "none";
            curlCmd = 'cscript "' + wincurl + '" /Method:' + method + ' /URL:' + endpoint + ' /Query:' + query + ' //nologo';
        } else {
            if (method === "POST") {
                curlCmd = 'curl -m 4 -s -d "' + query + '" ' + endpoint;
            } else if (method === "GET") {
                curlCmd = 'curl -m 4 -s -G -d "' + query + '" ' + endpoint;
            }
        }
        response = system.callSystem(curlCmd);
    } catch (err) {
        alert("Error\nUnable to make a `"+ method +"` request to the network endpoint.  Please try again.");
    }
    return response;
};

updater.os = function () {
    var os = system.osName;
    if (!os.length) { os = $.os;  }
    app_os =  ( os.indexOf("Win") != -1 )  ?  "Win" : "Mac";
    return app_os;
};

updater._6HOURS = 600;

updater.createAeUpdatesFolderIfNone = function () {
    if (updater.os === "Win") {
        f = Folder(this.MHNG_WORKING_DIR + "\\aeupdater");
     } else {
        f =  Folder(this.MHNG_WORKING_DIR + "/aeupdater");
     }
    if (!f.exists) {
        var createdFolder = f.create();
        if (!createdFolder) {
            alert("Some Error occured during creating tmp folder");
        }
    }
 };

updater.MHNG_ABSChecker = function (url) {
    var status = 0;
    var version = 0;
    try {
        // var conn = new Socket();
        // conn.open(url);
        // conn.write("GET / HTTP/1.0\n\n");
        // var resp = conn.read(1000);
        // alert(resp);
        this.MHNG_getPrefs();
        //this.MHNG_setPrefs();
        //alert(this.MHNG_lastChecked + " AA " + this.MHNG_getCurrEpochTimeInMilSeconds());
        if ((this.MHNG_getCurrEpochTimeInMilSeconds() - this.MHNG_lastChecked > this._6HOURS  && this.MHNG_lastChecked < this.MHNG_getCurrEpochTimeInMilSeconds())){
            var r = this.MHNG_webRequest("GET", url);
            //alert(r);
            while (r[r.length-1] === "\n" || r[r.length-1] === "\r") {
                r = r.replace(/\r$/, ""); r = r.replace(/\n$/, "");
            }
            var response_json =  JSON.parse(r);// now evaluate the string from the file
            $.writeln(r);
            this.MHNG_setPrefs();
            return {"response": response_json, "status": 1};
        } else {
            alert("No need to check!");
        }
    } catch (err) {
        alert(err);
    }
     this.MHNG_setPrefs();
     return {status: 0}
    // return {status: status, version: version};
};

updater.MHNG_buildAlertGUI = function () {
    var popUp_window = (new Window("palette", "", undefined, {resizeable: false}));
    popUp_window.alignChildren = ['left', 'top'];
    var cG = popUp_window.add("group{orientation:'column', alignChildren: ['left', 'top']}");
    var textLine = cG.add("group{orientation: 'column',margins:[10,10,10,10]}");
    textLine.add("statictext", undefined, "New version available.New version available.");
    textLine.add("statictext", undefined, "Download?");
    textLine.add("statictext", undefined, "New version available.New version available.");
    var bttnLine = cG.add("group{orientation:'row'}");
    var okBttn = bttnLine.add("button", undefined, "OK").onClick = function () {
        popUp_window.close();
        //IMPLEMENT LOGIC TO OPEN AESCRIPTS HERE
    };
    var nopeBttn = bttnLine.add("button", undefined, "NOPE").onClick = function () {
        popUp_window.close();
    };
    okBttn.size = nopeBttn.size = [40, 25];
    popUp_window.show();
};

updater.check = function (settings) {
    this.MHNG_getPrefs();
    // app.settings.saveSetting("aeupdates", "last_checked", "HI");
    if (settings.builder) {
        result = this.MHNG_ABSChecker(settings.url);
        // alert(Object.keys(result));
        // print
       // alert(settings.version + " " + result.origami.settings.current_version);
        if (result.status == 1 && result.response.version != settings.version) {
                this.MHNG_buildAlertGUI();
                // settings.builder.GUI(settings.builder.GUI_namespace);
        }
    } else {
        alert('SORRY:(');
    }
};

updater.check({version: '1.2',  builder: 'true',  url: 'https://aeupdates.com/status/origami'});
