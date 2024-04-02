# JSON to Table (HTML)

### Install

`npm install jsontableify`

### Include

`const Jsontableify = require('jsontableify')`

### Features
* `toHTML(<json_object>)`: converts json to html code.
  * Date (Configurable formatting)
  * Links
  * JSON arrays
  * Labels get capitalized.
  * Hide few labels from table.
  * Replace text
  * Define section headers / main json keys
  * Replace field values 

* `toHTML(<json_object>,<json_schema>)`: converts json to html code using schema.
  * Use schema title fields as source for replace text
  * Use titles from oneOf sub schemas to replace json field values

## Usage

```
const { html } = new Jsontableify({
  headerList: ['Phone', 'Attachments', 'PersonCompetency'], // optional - will be shown as header to table
  dateFormat: 'DD-MM-YYYY', // optional- date format to be converted to if date found
  replaceTextMap: { YearsOfExperience: 'Years Of Experience' }, // optional - key will be replaced by its value
  excludeKeys: ['Current CTC'], // optional - these fields will not be displayed
}).toHtml(<JSON object>)
```

```
const { html } = new Jsontableify({
  headerList: ['Test Result Header', 'Samples', 'Calibration Result'], // optional - will be shown as header to table
  excludeKeys: ['Current CTC'], // optional - these fields will not be displayed
}).toHtml(<JSON object>,<JSON schmea>)
```


### Example
```
{
  "CandidateName": "Yatish Balaji",
  "YearsOfExperience": 3,
  "Current CTC": 10,
  "Expected CTC": 25.0,
  "Address": {
    "CountryCode": "India",
    "Leaving from": "12-11-2017",
    "Leaved Till": "2019-11-06T07:00:30.103Z"
  },
  "Phone": [
    {
      "Number": "8828558654",
      "Label": "personal",
      "Preferred": "primary"
    },
    {
      "Number": "8828558123",
      "Label": "official"
    }
  ],
  "PersonCompetency": [
    {
      "CompetencyName": "Java",
      "Synonyms": [
        "sr j2ee resource",
        "java stack",
        "jpa",
        "advance java"
      ]
    },
    {
      "CompetencyName": "AWS",
      "Synonyms": [
        "aws",
        "amazon webservice",
        "amazon web service"
      ]
    }
  ],
  "Attachments": {
    "type": "link",
    "value": [
      {
        "name": "Quezx Posh",
        "link": ["https://www.quezx.com/safeplace/"]
      },
      {
        "name": "Quezx Posh Attacment",
        "link": ["https://www.quezx.com/safeplace/"]
      }
    ]
  }
}
```

### Output

HTML table ![JsonTableify](examples/toHtml.png)

HTML table ![JsonTableify](examples/toHTMLusingSchema.png)

### CSS for HTML code

https://github.com/yatishbalaji/jsontableify/blob/master/examples/toHtml.css
