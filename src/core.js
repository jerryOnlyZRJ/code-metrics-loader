const {
  MetricsParser,
  MetricsConfiguration
} = require('tsmetrics-core');
const path = require('path')

function getType(item) {
  const maps = {
    'Class declaration': 'class',
    'Function declaration': 'function',
    'Function expression': 'function',
    'Method declaration': 'function'
  }
  return maps[item.description]
}


function log(limit) {
  let messages = []
  return {
    error: function (complexity, filename, functionName) {
      let message = (`at ${filename}, function "${functionName}", 
      Code complexity ${complexity} is over ${limit}, you must consider refactoring code.
      `)
      messages.push({
        code: 401,
        complexity,
        functionName,
        message
      })
    },
    messages: messages
  }
}


function getCodeMetrics(filename, source, options={}) {
  options.errorLimit = options.errorLimit || 30;
  let logs = log(options.errorLimit);

  let metricsForFile = MetricsParser.getMetricsFromText(filename,
    source,
    MetricsConfiguration)
  require('fs').writeFileSync('./demo/a.json', JSON.stringify(metricsForFile.metrics.children,null,2))
  parse(metricsForFile.metrics.children)

  if(logs.messages.length > 0){
    return {
      code: 400,
      data: logs.messages
    }
  }else{
    return {
      code: 0,
      data: []
    }
  }

  function parse(children, needTotal = false) {
    let complexity = 1;

    children.forEach((item, index) => {
      if (getType(item) === 'class' || getType(item) === 'function') {
        if (item.children.length > 0) {
          let _complexity = parse(item.children, true)
          if (_complexity > options.errorLimit) {
            logs.error(_complexity, filename, children[index - 1].text)
          }
        }
      } else if (needTotal) {
        complexity += item.complexity;
      }
    })
    return complexity;
  }
}
module.exports = getCodeMetrics;