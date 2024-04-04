const moment = require('moment');

function isValidDate(date) {
  const regExp = new RegExp('^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$');

  return regExp.test(date);
}

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
      headerList = [], dateFormat = 'DD-MM-YYYY',
      replaceTextMap = {}, excludeKeys = [],
    } = config;

    this.dateFormat = dateFormat;
    this.headerList = headerList;
    this.replaceTextMap = replaceTextMap;
    this.excludeKeys = excludeKeys;
  }

  toDate(date) {
    return moment(new Date(date)).format(this.dateFormat);
  }

  jsonToHtml(obj, columns, parentsTmp) {
    const buf = [];
    const type = typeof obj;
    let cols;

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
                  isNodeEmpty = false;
                  let label = this.replaceTextMap[k] ? this.replaceTextMap[k] : k;
                  label = convert(label);

                  tmpBuf.push('<tr><th>', label, '</th>');
                  tmpBuf.push(
                    '<td>',
                    isValidDate(val) ? this.toDate(val) : this.jsonToHtml(val, cols, parents),
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
          buf.push('<tr>', '<td>', this.jsonToHtml(val, cols, parents), '</td>', '</tr>');
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
            let label = this.replaceTextMap[key] ? this.replaceTextMap[key] : key;
            label = convert(label);

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
              const x = this.jsonToHtml(obj[key], false, parents);

              if (x) {
                isNodeEmpty = false;

                if (this.headerList.includes(key)) {
                  tmpBuf.push(
                    "<tr class='allow-break'>",
                    "<tr><th class='thead' colspan=2>", label, '</th></tr></td>',
                    '<td colspan=2>', x, '</td>',
                    '</tr>',
                  );
                } else {
                  tmpBuf.push(
                    "<tr class='no-break'><th>",
                    label,
                    '</th><td>', x, '</td></tr>',
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
            buf.push('<td>', this.jsonToHtml(obj[key], false, parents), '</td>');
          } else {
            buf.push('<td>', this.jsonToHtml(obj[key], columns, parents), '</td>');
          }
        });
      }
    } else if (isValidDate(obj)) {
      buf.push(this.toDate(obj));
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

        // Replace field names with titles
        this.replaceTextMap = getFieldTitles(jsonData, jsonSchema);

        // Replace field values with titles, where defined
        replaceFieldValuesWithTitles(jsonData, jsonSchema, jsonSchema);

        // Get header list from top level objects
        this.headerList = getHeaderList(jsonData, jsonSchema);

        const html = this.jsonToHtml(jsonData);

        return {
            html,
        };
    }

}

// Function to get titles for each field from the JSON schema
function getFieldTitles(jsonData, jsonSchema) {
    const fieldTitles = {};
    for (const key in jsonData) {
        //const fullKey = parentKey ? `${parentKey}.${key}` : key;
        if (jsonSchema.properties && jsonSchema.properties[key]) {
            if (jsonSchema.properties[key].title) {
                //fieldTitles[fullKey] = jsonSchema.properties[key].title;
                fieldTitles[key] = jsonSchema.properties[key].title;
            }
            if (jsonSchema.properties[key].type === 'object') {
                //const nestedTitles = getFieldTitles(jsonData[key], jsonSchema.properties[key], fullKey);
                const nestedTitles = getFieldTitles(jsonData[key], jsonSchema.properties[key]);
                Object.assign(fieldTitles, nestedTitles);
            } else if (jsonSchema.properties[key].type === 'array' && Array.isArray(jsonData[key])) {
                //const arrayTitles = jsonData[key].map((item, index) => getFieldTitles(item, jsonSchema.properties[key].items, `${fullKey}[${index}]`));
                const arrayTitles = jsonData[key].map((item, index) => getFieldTitles(item, jsonSchema.properties[key].items));
                arrayTitles.forEach((titles) => Object.assign(fieldTitles, titles));
            }
        }
    }
    return fieldTitles;
}

// Function to resolve $ref
function resolveRef(ref, schema) {
    const parts = ref.split('/');
    let current = schema;
    for (let part of parts) {
        if (part === '#') continue;
        current = current[part];
    }
    return current;
}


// Function to replace JSON field values with titles from schema recursively
function replaceFieldValuesWithTitles(jsonData, jsonSchema, rootSchema) {
    for (const key in jsonData) {
        if (jsonSchema.properties && jsonSchema.properties[key]) {
            const propertySchema = jsonSchema.properties[key];
            if (propertySchema.allOf && propertySchema.allOf.length === 1 && propertySchema.allOf[0].$ref) {
                const resolvedSchema = resolveRef(propertySchema.allOf[0].$ref, rootSchema);
                replaceFieldValueWithRef(jsonData, key, resolvedSchema);
            } else if (propertySchema.oneOf && Array.isArray(propertySchema.oneOf)) {
                for (const option of propertySchema.oneOf) {
                    if (option.const === jsonData[key]) {
                        jsonData[key] = option.title || '';
                        break;
                    }
                }
            } else if (propertySchema.type === 'object' && typeof jsonData[key] === 'object') {
                replaceFieldValuesWithTitles(jsonData[key], propertySchema, rootSchema);
            }
        }
    }
}

// Function to replace field value with title from resolved schema
function replaceFieldValueWithRef(jsonData, key, resolvedSchema) {
    if (resolvedSchema && resolvedSchema.oneOf && Array.isArray(resolvedSchema.oneOf)) {
        for (const option of resolvedSchema.oneOf) {
            if (option.const === jsonData[key]) {
                jsonData[key] = option.title || '';
                break;
            }
        }
    }
}

// Function to get headerList from top level objects / object arrays
function getHeaderList(jsonData, jsonSchema) {
    headerList = [];
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


module.exports = Jsontableify;
