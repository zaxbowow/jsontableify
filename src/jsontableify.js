const capitalize = (s) => {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
};

function convert(key) {
    return capitalize(key.replace(/([a-z])([A-Z])/g, '$1 $2'));
}

class Jsontableify {
    constructor(config = {}) {
        const {
            headerList = [], dateFormatMap = {},
            replaceTextMap = {}, excludeKeys = []
        } = config;

        this.headerList = headerList;
        this.dateFormatMap = dateFormatMap;
        this.replaceTextMap = replaceTextMap;
        this.excludeKeys = excludeKeys;
    }

    jsonToHtml(obj, columns, parentsTmp, path = '') {
        const buf = [];
        const type = typeof obj;
        let cols;
        var mypath = '';

        const parents = parentsTmp || [];

        if (!(type !== 'object' || obj == null || obj === undefined)) {
            // eslint-disable-next-line no-bitwise
            if (~parents.indexOf(obj)) {
                return '[Circular]';
            }

            parents.push(obj);
        }

        if (Array.isArray(obj)) {
            if (Array.isArray(obj[0]) && obj.every(Array.isArray)) { // array of array
                buf.push('<table>', '<tbody>');
                cols = [];

                obj.forEach((row, ix) => {
                    cols.push(ix);

                    row.forEach((val) => {
                        buf.push('<tr><td>', this.jsonToHtml(val, cols, parents), '</td></tr>');
                    });
                });

                buf.push('</tbody>', '</table>');
            } else if (typeof obj[0] === 'object') { // array of objects
                const tmpBuf = [];
                let isNodeEmpty = true;
                tmpBuf.push('<table>', '<tbody>');
                tmpBuf.push('<tr><td>');

                obj.forEach((o, i) => {
                    if (typeof o === 'object' && !Array.isArray(o)) {
                        if (i && !isNodeEmpty) tmpBuf.push('<hr/>');

                        tmpBuf.push('<table>');
                        Object.keys(o)
                            .filter(x => (!this.excludeKeys.includes(x)))
                            .forEach((k) => {
                                const val = o[k];

                                if (val) {
                                    mypath = path + '.' + k
                                    let pathkey = mypath.substr(1);

                                    isNodeEmpty = false;
                                    let label = this.replaceTextMap[pathkey] ? this.replaceTextMap[pathkey] : k;
                                    let format = this.dateFormatMap[pathkey] ? ' data-format="' + this.dateFormatMap[pathkey] + '"' : '';

                                    tmpBuf.push('<tr><th>', label, '</th>');
                                    tmpBuf.push(
                                        '<td data-key="' + pathkey + '"' + format + '>',
                                        this.jsonToHtml(val, cols, parents, mypath),
                                        '</td></tr>',
                                    );
                                }
                            });
                        tmpBuf.push('</table>');
                    }
                });

                tmpBuf.push('</td></tr>', '</tbody></table>');

                if (!isNodeEmpty) {
                    buf.push(...tmpBuf);
                }
            } else { // array of primitives
                buf.push('<table>', '<tbody>');
                cols = [];

                obj.forEach((val, ix) => {
                    cols.push(ix);
                    buf.push('<tr>', '<td>', this.jsonToHtml(val, cols, parents, mypath), '</td>', '</tr>');
                });

                buf.push('</tbody>', '</table>');
            }
        } else if (
            obj && typeof obj === 'object' && !Array.isArray(obj) && !(obj instanceof Date)
        ) { // object
            const tmpBuf = [];
            let isNodeEmpty = true;

            if (!columns) {
                tmpBuf.push('<table>');
                if (obj.type === 'link') {
                    isNodeEmpty = false;
                    let files = obj.value;

                    if (!Array.isArray(files)) {
                        files = [files];
                    }

                    tmpBuf.push('<td><table>');

                    // eslint-disable-next-line no-restricted-syntax
                    for (const { link, name } of files) {
                        tmpBuf.push('<tr><td>');
                        tmpBuf.push(`<a href='${link}' target='_blank'>${name}</a></td></tr>`);
                    }

                    tmpBuf.push('</table></td>');
                } else {
                    const keys = Object.keys(obj)
                        .filter(x => (!this.excludeKeys.includes(x)));

                    // eslint-disable-next-line no-restricted-syntax
                    for (const key of keys) {
                        mypath = path + '.' + key
                        let pathkey = mypath.substr(1);

                        let label = this.replaceTextMap[pathkey] ? this.replaceTextMap[pathkey] : key;
                        //label = convert(label);
                        let format = this.dateFormatMap[pathkey] ? ' data-format="' + this.dateFormatMap[pathkey] + '"' : '';


                        if (key === 'link') {
                            isNodeEmpty = false;
                            const files = obj[key];

                            tmpBuf.push(
                                "<tr class='no-break'><th>",
                                label,
                                '</th>',
                                '<td><table>',
                            );

                            // eslint-disable-next-line no-restricted-syntax
                            for (const { link, name } of files) {
                                tmpBuf.push('<tr><td>');
                                tmpBuf.push(`<a href='${link}' target=_blank'>${name}</a>`);
                                tmpBuf.push('</td></tr>');
                            }

                            tmpBuf.push('</table></td></tr>');
                        } else {
                            const x = this.jsonToHtml(obj[key], false, parents, mypath);

                            if (x) {
                                isNodeEmpty = false;

                                if (this.headerList.includes(key)) {
                                    tmpBuf.push(
                                        "<tr class='allow-break'>",
                                        "<tr><th class='thead' colspan=2 data-key='" + pathkey + "'" + format + ">", label, '</th></tr></td>',
                                        '<td colspan=2>', x, '</td>',
                                        '</tr>',
                                    );
                                } else {
                                    tmpBuf.push(
                                        "<tr class='no-break'><th>",
                                        label,
                                        '</th><td data-key="' + pathkey + '"' + format + '>', x, '</td></tr>',
                                    );
                                }
                            }
                        }
                    }
                }

                tmpBuf.push('</table>');

                if (!isNodeEmpty) {
                    buf.push(...tmpBuf);
                }
            } else {
                columns.forEach((key) => {
                    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                        buf.push('<td>', this.jsonToHtml(obj[key], false, parents, mypath), '</td>');
                    } else {
                        buf.push('<td>', this.jsonToHtml(obj[key], columns, parents, mypath), '</td>');
                    }
                });
            }
        } else {
            buf.push(obj);
        }

        if (!(type !== 'object' || obj == null || obj === undefined)) {
            parents.pop(obj);
        }

        return buf.join('');
    }

    toHtml(obj) {
        const html = this.jsonToHtml(obj);

        return {
            html,
        };
    }

    toHtml(jsonData, jsonSchema) {

        this.data = structuredClone(jsonData);
        this.schema = structuredClone(jsonSchema);

        // Replace field names with titles
        this.replaceTextMap = this.#getFieldTitles(this.data, this.schema);

        // Replace field values with titles, where defined
        this.#replaceFieldValuesWithTitles(this.data, this.schema, this.schema);

        // Replace date-time fields with localized date
        this.dateFormatMap = this.#getDateFormats(this.data, this.schema);

        // Get header list from top level objects
        this.headerList = this.#getHeaderList(this.data, this.schema);

        const html = this.jsonToHtml(this.data);

        return {
            html,
        };
    }

    // Function to get titles for each field from the JSON schema
    #getFieldTitles(jsonData, jsonSchema, path = '') {
        const fieldTitles = {};
        var mypath;
        for (const key in jsonData) {
            mypath = path + '.' + key;
            if (jsonSchema.properties && jsonSchema.properties[key]) {
                if (jsonSchema.properties[key].title) {
                    fieldTitles[mypath.substr(1)] = jsonSchema.properties[key].title;
                }
                if (jsonSchema.properties[key].type === 'object') {
                    const nestedTitles = this.#getFieldTitles(jsonData[key], jsonSchema.properties[key], mypath);
                    Object.assign(fieldTitles, nestedTitles);
                } else if (jsonSchema.properties[key].type === 'array' && Array.isArray(jsonData[key])) {
                    const arrayTitles = jsonData[key].map((item, index) => this.#getFieldTitles(item, jsonSchema.properties[key].items, mypath));
                    arrayTitles.forEach((titles) => Object.assign(fieldTitles, titles));
                }
            }
        }
        return fieldTitles;
    }

    // Function to replace JSON field values with titles from schema recursively
    #replaceFieldValuesWithTitles(jsonData, jsonSchema, rootSchema) {
        for (const key in jsonData) {
            if (jsonSchema.properties && jsonSchema.properties[key]) {
                const propertySchema = jsonSchema.properties[key];
                if (propertySchema.allOf && propertySchema.allOf.length === 1 && propertySchema.allOf[0].$ref) {
                    const resolvedSchema = this.#resolveRef(propertySchema.allOf[0].$ref, rootSchema);
                    this.#replaceFieldValueWithRef(jsonData, key, resolvedSchema);
                } else if (propertySchema.oneOf && Array.isArray(propertySchema.oneOf)) {
                    for (const option of propertySchema.oneOf) {
                        if (option.const === jsonData[key]) {
                            jsonData[key] = option.title || '';
                            break;
                        }
                    }
                } else if (propertySchema.type === 'object' && typeof jsonData[key] === 'object') {
                    this.#replaceFieldValuesWithTitles(jsonData[key], propertySchema, rootSchema);
                }
            }
        }
    }

    // Function to resolve $ref
    #resolveRef(ref, schema) {
        const parts = ref.split('/');
        let current = schema;
        for (let part of parts) {
            if (part === '#') continue;
            current = current[part];
        }
        return current;
    }

    // Function to replace field value with title from resolved schema
    #replaceFieldValueWithRef(jsonData, key, resolvedSchema) {
        if (resolvedSchema && resolvedSchema.oneOf && Array.isArray(resolvedSchema.oneOf)) {
            for (const option of resolvedSchema.oneOf) {
                if (option.const === jsonData[key]) {
                    jsonData[key] = option.title || '';
                    break;
                }
            }
        }
    }

    // Function to generate header list that replaces object (section) keys with titles from schema recursively
    #getHeaderList(jsonData, jsonSchema) {
        var headerList = [];
        for (const key in jsonData) {
            if (jsonSchema.properties && jsonSchema.properties[key]) {
                const propertySchema = jsonSchema.properties[key];
                if (propertySchema.type === 'object' && typeof jsonData[key] === 'object') {
                    headerList.push(key);
                } else if (jsonSchema.properties[key].type === 'array' && Array.isArray(jsonData[key])) {
                    headerList.push(key);
                }
            }
        }
        return headerList;
    }

    // Helper function to appropriately decorate <td>'s with json schema date or time data with a data-format attribute
    // reflecting this.  The displayed data can later be localized in the end-user browser using jquery/javascript.
    #getDateFormats(jsonData, jsonSchema, path = '') {
        const fieldDateFormats = {};
        for (const key in jsonData) {
            let mypath = path + '.' + key;
            let pathkey = mypath.substr(1);
            if (jsonSchema.properties && jsonSchema.properties[key]) {
                if (jsonSchema.properties[key].format == "date-time") {
                    fieldDateFormats[pathkey] = "date-time";
                } else if (jsonSchema.properties[key].format == "time") {
                    fieldDateFormats[pathkey] = "time";
                }
                if (jsonSchema.properties[key].type === 'object') {
                    const nestedFormats = this.#getDateFormats(jsonData[key], jsonSchema.properties[key], mypath);
                    Object.assign(fieldDateFormats, nestedFormats);
                } else if (jsonSchema.properties[key].type === 'array' && Array.isArray(jsonData[key])) {
                    const arrayFormats = jsonData[key].map((item, index) => this.#getDateFormats(item, jsonSchema.properties[key].items, mypath));
                    arrayFormats.forEach((dateFormats) => Object.assign(fieldDateFormats, dateFormats));
                }
            }
        }
        return fieldDateFormats;
    }

}

module.exports = Jsontableify;
